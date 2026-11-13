<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Tracking\WorkoutController;
use App\Models\Member\Member;
use App\Models\Tracking\WorkoutLog;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Routes called by the Python Gesture Engine (guarded by the ai.engine
 * middleware). Attendance logging lives in AttendanceController.
 */
class AiBridgeController extends Controller
{
    private const ASSIGNED_PREFIX = WorkoutController::ASSIGNED_PREFIX;

    /** Tells Python which face image belongs to which member. */
    public function memberFaces()
    {
        return Member::whereNotNull('enrolled_face_id')
            ->select('id', 'first_name', 'last_name', 'enrolled_face_id')
            ->withExists(['memberships as has_active_coach_membership' => function ($query) {
                $query->activeWithCoach();
            }])
            ->withExists(['memberships as has_active_membership' => function ($query) {
                $query->activeOn(Carbon::today()->toDateString());
            }])
            ->withExists('memberships as has_any_membership')
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->id,
                    'name' => $member->first_name . ' ' . $member->last_name,
                    'image_file' => $member->enrolled_face_id,
                    'workout_eligible' => (bool) $member->has_active_coach_membership,
                    // Lets the Security Monitor flag members who need to renew.
                    'subscription_status' => $member->has_active_membership
                        ? 'active'
                        : ($member->has_any_membership ? 'expired' : 'none'),
                ];
            });
    }

    /** Today's pending tasks for active members with a coach membership. */
    public function workoutPlans()
    {
        return WorkoutLog::whereDate('date', Carbon::today())
            ->where('exercise', 'like', self::ASSIGNED_PREFIX . '%')
            ->whereHas('member', function ($query) {
                $query->where('status', 'Active')
                    ->whereHas('memberships', function ($membershipQuery) {
                        $membershipQuery->activeWithCoach();
                    });
            })
            ->get(['member_id', 'exercise', 'gesture_class']);
    }

    /** The AI saw a member perform an exercise: verify a task or log it. */
    public function logWorkout(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:members,id',
            'exercise' => 'required|string'
        ]);

        $isEligibleForAi = Member::whereKey($request->member_id)
            ->where('status', 'Active')
            ->whereHas('memberships', function ($query) {
                $query->activeWithCoach();
            })
            ->exists();

        if (!$isEligibleForAi) {
            return response()->json([
                'status' => 'ineligible',
                'message' => 'AI workout verification requires an active With Coach membership.',
            ], 403);
        }

        $exerciseName = strtoupper($request->exercise);
        $today = Carbon::today()->toDateString();

        // Check if there is a PENDING task assigned for this exercise today
        $assignedTasks = WorkoutLog::where('member_id', $request->member_id)
            ->where('date', $today)
            ->where('exercise', 'like', self::ASSIGNED_PREFIX . '%')
            ->where(function ($query) use ($exerciseName) {
                $query->where('gesture_class', $exerciseName)
                    ->orWhere(function ($legacyQuery) use ($exerciseName) {
                        $legacyQuery->whereNull('gesture_class')
                            ->where('exercise', self::ASSIGNED_PREFIX . $exerciseName);
                    });
            })
            ->get();

        if ($assignedTasks->count() > 1) {
            return response()->json([
                'status' => 'ambiguous',
                'message' => 'More than one assigned exercise matches this Gesture Engine class. Coach verification is required.',
            ], 409);
        }

        if ($assignedTasks->count() === 1) {
            $assignedTask = $assignedTasks->first();
            // Task Verified! Strip the "ASSIGNED: " tag to mark it completed
            $assignedTask->update([
                'exercise' => substr($assignedTask->exercise, strlen(self::ASSIGNED_PREFIX)),
                'date' => $today,
                'created_at' => Carbon::now() // Log the exact time it was verified
            ]);
            return response()->json(['status' => 'logged', 'message' => 'Task verified!']);
        }

        // Anti-Spam: Normal unassigned logging
        $recentlyLogged = WorkoutLog::where('member_id', $request->member_id)
            ->where('exercise', $exerciseName)
            ->where('created_at', '>=', Carbon::now()->subMinutes(2))
            ->exists();

        if (!$recentlyLogged) {
            WorkoutLog::create([
                'member_id' => $request->member_id,
                'exercise' => $exerciseName,
                'date' => Carbon::today(),
            ]);
            return response()->json(['status' => 'logged']);
        }

        return response()->json(['status' => 'ignored']);
    }
}
