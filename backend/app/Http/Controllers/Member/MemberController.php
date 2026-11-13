<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Services\MemberStatusService;
use App\Support\MemberMediaStorage;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    public function __construct(
        private MemberMediaStorage $media,
        private MemberStatusService $memberStatus,
    ) {
    }

    public function index()
    {
        $this->memberStatus->demoteInactiveMembers();

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

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:members,email',
            'phone' => 'required|string|max:15',
            'plan' => 'required|string',
            'status' => ['required', Rule::in(MemberStatusService::STATUSES)],
            'profile_pic' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'enrolled_face_id' => ['nullable', 'string', 'regex:' . MemberMediaStorage::FACE_DATA_URI_REGEX],
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        // Face photos are biometric data: they are only stored with the
        // member's recorded consent (Data Privacy Act, RA 10173).
        if ($request->filled('enrolled_face_id') && !$request->boolean('biometric_consent')) {
            throw ValidationException::withMessages([
                'biometric_consent' => ['The member must consent to face enrollment before their face is saved.'],
            ]);
        }

        // Only server-generated paths are ever saved for photos.
        unset($validatedData['profile_pic'], $validatedData['enrolled_face_id']);

        if ($request->hasFile('profile_pic')) {
            $validatedData['profile_pic'] = $this->media->storeProfilePicture($request->file('profile_pic'));
        }

        if ($request->filled('enrolled_face_id')) {
            $validatedData['enrolled_face_id'] = $this->media->storeFace($request->input('enrolled_face_id'));
        }

        $member = new Member($validatedData);
        if ($request->filled('enrolled_face_id')) {
            $member->biometric_consent_at = Carbon::now();
        }
        $member->save();

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
            'status' => ['sometimes', 'required', Rule::in(MemberStatusService::STATUSES)],
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
            if (!$request->boolean('biometric_consent')) {
                throw ValidationException::withMessages([
                    'biometric_consent' => ['The member must consent to face enrollment before their face is saved.'],
                ]);
            }
            $newFacePath = $this->media->storeFace($request->input('enrolled_face_id'));
            $this->media->deleteFace($member->enrolled_face_id);
            $validatedData['enrolled_face_id'] = $newFacePath;
            $member->biometric_consent_at = Carbon::now();
        }

        $statusChanged = isset($validatedData['status']) && $validatedData['status'] !== $member->status;

        $member->fill($validatedData);
        if ($statusChanged) {
            // Gives the member a fresh month before the inactivity rule applies again.
            $member->status_updated_at = Carbon::now();
        }
        $member->save();

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

                // Attendance is history too: keep it with the member's name.
                if (DB::getSchemaBuilder()->hasTable('attendances')) {
                    DB::table('attendances')
                        ->where('member_id', $member->id)
                        ->update([
                            'member_name_snapshot' => $memberName,
                            'member_id' => null,
                        ]);
                }

                foreach ([
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

            return response()->json(['message' => 'Member deleted. Financial, subscription and attendance history was preserved.']);

        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'A database error occurred while trying to delete.'], 500);
        }
    }
}
