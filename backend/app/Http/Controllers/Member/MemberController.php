<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Support\MemberMediaStorage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    public function __construct(private MemberMediaStorage $media)
    {
    }

    public function index()
    {
        $this->demoteInactiveMembers();

        $members = Member::with('memberships.plan')->orderBy('created_at', 'desc')->get();
        $today = Carbon::today()->toDateString();

        foreach ($members as $member) {
            $activeMembership = $member->memberships
                ->filter(function ($membership) use ($today) {
                    $startDate = $membership->start_date ? Carbon::parse($membership->start_date)->toDateString() : null;
                    $endDate = $membership->end_date ? Carbon::parse($membership->end_date)->toDateString() : null;

                    return strcasecmp((string) $membership->status, 'Active') === 0
                        && (!$startDate || $startDate <= $today)
                        && (!$endDate || $endDate >= $today);
                })
                ->sortByDesc('id')
                ->first();

            $member->setRelation('activeMembership', $activeMembership);
            $member->unsetRelation('memberships');
        }

        return response()->json($members);
    }

    /**
     * THE AI INACTIVITY AUDITOR, as one UPDATE instead of a query per member.
     *
     * An Active member becomes Inactive when the camera has not seen them for
     * over a month: their latest attendance is a month old or more, or they
     * have no attendance and joined over a month ago.
     */
    private function demoteInactiveMembers(): void
    {
        $oneMonthAgo = Carbon::now()->subMonth();
        $cutoffDate = $oneMonthAgo->toDateString();

        Member::where('status', 'Active')
            ->whereNotExists(function ($query) use ($cutoffDate) {
                $query->select(DB::raw(1))
                    ->from('attendances')
                    ->whereColumn('attendances.member_id', 'members.id')
                    ->where('attendances.date', '>', $cutoffDate);
            })
            ->where(function ($query) use ($oneMonthAgo) {
                $query->whereExists(function ($attendance) {
                    $attendance->select(DB::raw(1))
                        ->from('attendances')
                        ->whereColumn('attendances.member_id', 'members.id');
                })->orWhere('created_at', '<', $oneMonthAgo);
            })
            ->update(['status' => 'Inactive']);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:members,email',
            'phone' => 'required|string|max:15',
            'plan' => 'required|string',
            'status' => 'required|string',
            'profile_pic' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'enrolled_face_id' => ['nullable', 'string', 'regex:' . MemberMediaStorage::FACE_DATA_URI_REGEX],
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        // Only server-generated paths are ever saved for photos.
        unset($validatedData['profile_pic'], $validatedData['enrolled_face_id']);

        if ($request->hasFile('profile_pic')) {
            $validatedData['profile_pic'] = $this->media->storeProfilePicture($request->file('profile_pic'));
        }

        if ($request->filled('enrolled_face_id')) {
            $validatedData['enrolled_face_id'] = $this->media->storeFace($request->input('enrolled_face_id'));
        }

        $member = Member::create($validatedData);

        return response()->json(['message' => 'Member created successfully', 'member' => $member], 201);
    }

    public function update(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:members,email,' . $member->id,
            'phone' => 'sometimes|required|string|max:15',
            'plan' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'profile_pic' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'enrolled_face_id' => ['nullable', 'string', 'regex:' . MemberMediaStorage::FACE_DATA_URI_REGEX],
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        // Only server-generated paths are ever saved for photos.
        unset($validatedData['profile_pic'], $validatedData['enrolled_face_id']);

        if ($request->hasFile('profile_pic')) {
            if ($member->profile_pic) {
                $profilePicIsInHistory = DB::table('transactions')
                    ->where('member_profile_pic_snapshot', $member->profile_pic)
                    ->exists()
                    || DB::table('memberships')
                        ->where('member_profile_pic_snapshot', $member->profile_pic)
                        ->exists();
                if (!$profilePicIsInHistory) {
                    $this->media->deleteProfilePicture($member->profile_pic);
                }
            }
            $validatedData['profile_pic'] = $this->media->storeProfilePicture($request->file('profile_pic'));
        }

        if ($request->filled('enrolled_face_id')) {
            $newFacePath = $this->media->storeFace($request->input('enrolled_face_id'));
            $this->media->deleteFace($member->enrolled_face_id);
            $validatedData['enrolled_face_id'] = $newFacePath;
        }

        $member->update($validatedData);

        return response()->json(['message' => 'Member updated successfully', 'member' => $member]);
    }

    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $member = Member::findOrFail($id);

                $memberName = trim($member->first_name . ' ' . $member->last_name);
                DB::table('memberships')
                    ->where('member_id', $member->id)
                    ->where('status', 'Active')
                    ->update(['status' => 'Cancelled']);
                DB::table('transactions')
                    ->where('member_id', $member->id)
                    ->update([
                        'member_name_snapshot' => $memberName,
                        'member_profile_pic_snapshot' => $member->profile_pic,
                        'member_email_snapshot' => $member->email,
                        'member_id' => null,
                    ]);
                DB::table('memberships')
                    ->where('member_id', $member->id)
                    ->update([
                        'member_name_snapshot' => $memberName,
                        'member_profile_pic_snapshot' => $member->profile_pic,
                        'member_email_snapshot' => $member->email,
                        'member_id' => null,
                    ]);

                foreach ([
                    'attendances',
                    'workout_logs',
                    'gesture_logs',
                    'exercise_sessions',
                    'face_encodings',
                    'payments',
                ] as $table) {
                    if (DB::getSchemaBuilder()->hasTable($table)) {
                        DB::table($table)->where('member_id', $member->id)->delete();
                    }
                }

                $this->media->deleteFace($member->enrolled_face_id);

                $member->delete();
            });

            return response()->json(['message' => 'Member deleted. Financial and subscription history was preserved.']);

        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'A database error occurred while trying to delete.'], 500);
        }
    }
}
