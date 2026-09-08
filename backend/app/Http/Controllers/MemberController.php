<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::orderBy('created_at', 'desc')->get();
        $oneMonthAgo = Carbon::now()->subDays(30);

        // --- THE AI INACTIVITY AUDITOR ---
        foreach ($members as $member) {
            // Only audit members that are currently active
            if ($member->status === 'Active') {
                // Find the absolute last time the AI saw them
                $lastAttendance = Attendance::where('member_id', $member->id)->orderBy('date', 'desc')->first();
                
                // If they have no logs yet, use the day their account was created
                $lastActiveDate = $lastAttendance ? Carbon::parse($lastAttendance->date) : $member->created_at;

                // If it has been more than 30 days, silently demote them
                if ($lastActiveDate->lt($oneMonthAgo)) {
                    $member->status = 'Inactive';
                    $member->save();
                }
            }
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
            'status' => 'required|string',
            'profile_pic' => 'nullable|image|max:51200',
            'enrolled_face_id' => 'nullable',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        if ($request->hasFile('profile_pic')) {
            $file = $request->file('profile_pic');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('profiles'), $filename);
            $validatedData['profile_pic'] = '/profiles/' . $filename;
        }

        if ($request->filled('enrolled_face_id') && strpos($request->enrolled_face_id, 'data:image') === 0) {
            if (!File::exists(public_path('faces'))) {
                File::makeDirectory(public_path('faces'), 0755, true);
            }
            $imageParts = explode(";base64,", $request->enrolled_face_id);
            $imageBase64 = base64_decode($imageParts[1]);
            $faceFilename = time() . '_face_' . uniqid() . '.png';
            file_put_contents(public_path('faces/' . $faceFilename), $imageBase64);
            $validatedData['enrolled_face_id'] = '/faces/' . $faceFilename;
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
            'profile_pic' => 'nullable|image|max:51200',
            'enrolled_face_id' => 'nullable',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        if ($request->hasFile('profile_pic')) {
            if ($member->profile_pic) {
                $oldPath = public_path($member->profile_pic);
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }
            $file = $request->file('profile_pic');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('profiles'), $filename);
            $validatedData['profile_pic'] = '/profiles/' . $filename;
        }

        if ($request->filled('enrolled_face_id') && strpos($request->enrolled_face_id, 'data:image') === 0) {
            if ($member->enrolled_face_id) {
                $oldFacePath = public_path($member->enrolled_face_id);
                if (File::exists($oldFacePath)) {
                    File::delete($oldFacePath);
                }
            }
            if (!File::exists(public_path('faces'))) {
                File::makeDirectory(public_path('faces'), 0755, true);
            }
            $imageParts = explode(";base64,", $request->enrolled_face_id);
            $imageBase64 = base64_decode($imageParts[1]);
            $faceFilename = time() . '_face_' . uniqid() . '.png';
            file_put_contents(public_path('faces/' . $faceFilename), $imageBase64);
            $validatedData['enrolled_face_id'] = '/faces/' . $faceFilename;
        }

        $member->update($validatedData);

        return response()->json(['message' => 'Member updated successfully', 'member' => $member]);
    }
    
    public function destroy($id)
    {
        try {
            $member = Member::findOrFail($id);

            if ($member->profile_pic) {
                $picPath = public_path($member->profile_pic);
                if (File::exists($picPath)) {
                    File::delete($picPath);
                }
            }

            if ($member->enrolled_face_id) {
                $facePath = public_path($member->enrolled_face_id);
                if (File::exists($facePath)) {
                    File::delete($facePath);
                }
            }

            $member->delete();

            return response()->json(['message' => 'Member and associated files deleted successfully.']);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == "23000") {
                return response()->json([
                    'message' => 'Cannot delete this member because they have existing subscriptions or transactions tied to them. Please delete their records in the Subscriptions/Transactions tab first.'
                ], 400);
            }
            
            return response()->json(['message' => 'A database error occurred while trying to delete.'], 500);
        }
    }
}