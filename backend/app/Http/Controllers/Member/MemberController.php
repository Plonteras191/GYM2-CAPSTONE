<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MemberController extends Controller
{
    private const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    private const MAX_FACE_BYTES = 5 * 1024 * 1024; // 5 MB

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
            'profile_pic' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'enrolled_face_id' => 'nullable|string',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string|max:500'
        ]);

        if ($request->hasFile('profile_pic')) {
            $validatedData['profile_pic'] = $this->storeProfilePicture($request->file('profile_pic'));
        }

        // Never trust a client-supplied path: only a freshly captured image is accepted.
        unset($validatedData['enrolled_face_id']);
        if ($request->filled('enrolled_face_id')) {
            $validatedData['enrolled_face_id'] = $this->storeFaceImage($request->enrolled_face_id);
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
            'enrolled_face_id' => 'nullable|string',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string|max:500'
        ]);

        if ($request->hasFile('profile_pic')) {
            $this->deletePublicFile($member->profile_pic, 'profiles');
            $validatedData['profile_pic'] = $this->storeProfilePicture($request->file('profile_pic'));
        }

        // Never trust a client-supplied path: only a freshly captured image is accepted.
        unset($validatedData['enrolled_face_id']);
        if ($request->filled('enrolled_face_id')) {
            $newFace = $this->storeFaceImage($request->enrolled_face_id);
            $this->deletePublicFile($member->enrolled_face_id, 'faces');
            $validatedData['enrolled_face_id'] = $newFace;
        }

        $member->update($validatedData);

        return response()->json(['message' => 'Member updated successfully', 'member' => $member]);
    }
    
    public function destroy($id)
    {
        try {
            $member = Member::findOrFail($id);

            $member->delete();

            // Remove files only after the database row is really gone.
            $this->deletePublicFile($member->profile_pic, 'profiles');
            $this->deletePublicFile($member->enrolled_face_id, 'faces');

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

    /**
     * Save an uploaded profile picture under a random server-generated name.
     * The client's original filename (which could be "shell.php") is never used.
     */
    private function storeProfilePicture(UploadedFile $file): string
    {
        $extension = $file->guessExtension();
        if (!in_array($extension, self::ALLOWED_IMAGE_EXTENSIONS, true)) {
            throw ValidationException::withMessages(['profile_pic' => ['Profile picture must be a JPG, PNG or WEBP image.']]);
        }

        $filename = Str::random(40) . '.' . $extension;
        $file->move(public_path('profiles'), $filename);

        return '/profiles/' . $filename;
    }

    /**
     * Decode a base64 data-URI face capture, verify it is a real JPEG/PNG
     * image of a sane size, and store it under a random name.
     */
    private function storeFaceImage(string $dataUri): string
    {
        $fail = fn () => throw ValidationException::withMessages(['enrolled_face_id' => ['Invalid face image.']]);

        if (!preg_match('/^data:image\/(png|jpe?g);base64,/', $dataUri)) {
            $fail();
        }

        $binary = base64_decode(substr($dataUri, strpos($dataUri, ',') + 1), true);
        if ($binary === false || strlen($binary) === 0 || strlen($binary) > self::MAX_FACE_BYTES) {
            $fail();
        }

        $info = @getimagesizefromstring($binary);
        $extensions = [IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg'];
        if ($info === false || !isset($extensions[$info[2]])) {
            $fail();
        }

        if (!File::exists(public_path('faces'))) {
            File::makeDirectory(public_path('faces'), 0755, true);
        }

        $filename = Str::random(40) . '.' . $extensions[$info[2]];
        file_put_contents(public_path('faces/' . $filename), $binary);

        return '/faces/' . $filename;
    }

    /**
     * Delete a stored member file, but only if it really lives inside the
     * expected public sub-folder (prevents "../../.env" style path traversal).
     */
    private function deletePublicFile(?string $relativePath, string $folder): void
    {
        if (!$relativePath) {
            return;
        }

        $baseDir = realpath(public_path($folder));
        $target = realpath(public_path(ltrim($relativePath, '/')));

        if ($baseDir && $target && str_starts_with($target, $baseDir . DIRECTORY_SEPARATOR) && is_file($target)) {
            File::delete($target);
        }
    }
}
