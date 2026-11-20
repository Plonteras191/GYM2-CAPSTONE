<?php

namespace App\Http\Controllers\Tracking;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Tracking\WorkoutLog;
use App\Models\Tracking\WorkoutPlanItem;
use App\Services\WorkoutPlanScheduler;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Coach-facing workout routes (Supervisor Mode) used by the React dashboard.
 *
 * Assigned-but-unverified tasks are stored with an "ASSIGNED: " prefix on
 * `exercise`; verifying a task (by the AI or a coach) strips the prefix.
 */
class WorkoutController extends Controller
{
    public const ASSIGNED_PREFIX = 'ASSIGNED: ';

    /** Exercise classes the Gesture Engine model can recognise. */
    public const GESTURE_CLASSES = [
        'BURPEE', 'CRUNCH', 'CURL', 'DEADLIFT', 'HIGH KNEE', 'LUNGE',
        'MOUNTAIN CLIMBER', 'PLANK', 'PUSH UP', 'RUSSIAN TWIST', 'SIT UP', 'SQUAT',
    ];

    private static function gestureClassRule(): string
    {
        return 'nullable|string|in:' . implode(',', self::GESTURE_CLASSES);
    }

    /** Coach assigns a single task. */
    public function assignTask(Request $request, $id)
    {
        $request->validate([
            'exercise' => 'required|string',
            'sets' => 'nullable|integer|min:1|max:99',
            'reps' => 'nullable|integer|min:1|max:999',
            'date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
            'gesture_class' => self::gestureClassRule(),
        ]);
        $exerciseName = strtoupper($request->exercise);
        $taskDate = $request->input('date', Carbon::today()->toDateString());

        // Prevent assigning the exact same task twice on the same date
        $alreadyAssigned = WorkoutLog::where('member_id', $id)
            ->where('date', $taskDate)
            ->where('exercise', self::ASSIGNED_PREFIX . $exerciseName)
            ->first();

        if ($alreadyAssigned) {
            $alreadyAssigned->update($request->only('sets', 'reps'));
        } else {
            WorkoutLog::create([
                'member_id' => $id,
                'exercise' => self::ASSIGNED_PREFIX . $exerciseName,
                'date' => $taskDate,
                'sets' => $request->input('sets'),
                'reps' => $request->input('reps'),
                'gesture_class' => $request->input('gesture_class'),
            ]);
        }
        return response()->json(['message' => 'Task assigned successfully!']);
    }

    /** The member's 7-day plan: pending tasks plus completed sets/reps tasks. */
    public function showPlan($id, WorkoutPlanScheduler $scheduler)
    {
        abort_unless(Member::whereKey($id)->exists(), 404);

        // The plan repeats weekly: make sure the coming 7 days are scheduled.
        $scheduler->fillUpcomingWeek((int) $id);

        $today = Carbon::today()->toDateString();
        $lastDate = Carbon::today()->addDays(6)->toDateString();

        return WorkoutLog::where('member_id', $id)
            ->whereBetween('date', [$today, $lastDate])
            ->where(function ($query) {
                $query->where('exercise', 'like', self::ASSIGNED_PREFIX . '%')
                    ->orWhere(function ($completed) {
                        $completed->whereNotNull('sets')->whereNotNull('reps');
                    });
            })
            ->orderBy('date')
            ->orderBy('id')
            ->get();
    }

    /**
     * Save the member's weekly plan. The submitted tasks (one per exercise and
     * date in the next 7 days) become the weekly template, so the same plan is
     * scheduled again every week; the pending tasks in the next 7 days are
     * replaced with the submitted ones.
     */
    public function syncPlan(Request $request, $id)
    {
        abort_unless(Member::whereKey($id)->exists(), 404);

        $today = Carbon::today();
        $lastDate = $today->copy()->addDays(6);
        $validated = $request->validate([
            'tasks' => 'present|array',
            'tasks.*.exercise' => 'required|string|max:255',
            'tasks.*.sets' => 'required|integer|min:1|max:99',
            'tasks.*.reps' => 'required|integer|min:1|max:999',
            'tasks.*.date' => 'required|date_format:Y-m-d|after_or_equal:' . $today->toDateString() . '|before_or_equal:' . $lastDate->toDateString(),
            'tasks.*.gesture_class' => self::gestureClassRule(),
        ]);

        $startDate = $today->toDateString();
        $endDate = $lastDate->toDateString();
        DB::transaction(function () use ($id, $validated, $startDate, $endDate) {
            WorkoutLog::where('member_id', $id)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('exercise', 'like', self::ASSIGNED_PREFIX . '%')
                ->delete();

            // The weekly template: which exercises repeat on which weekday.
            WorkoutPlanItem::where('member_id', $id)->delete();
            foreach (array_values($validated['tasks']) as $position => $task) {
                WorkoutPlanItem::create([
                    'member_id' => $id,
                    'weekday' => Carbon::parse($task['date'])->dayOfWeekIso,
                    'exercise' => strtoupper($task['exercise']),
                    'sets' => $task['sets'],
                    'reps' => $task['reps'],
                    'gesture_class' => $task['gesture_class'] ?? null,
                    'position' => $position,
                ]);
            }

            foreach ($validated['tasks'] as $task) {
                WorkoutLog::create([
                    'member_id' => $id,
                    'exercise' => self::ASSIGNED_PREFIX . strtoupper($task['exercise']),
                    'date' => $task['date'],
                    'sets' => $task['sets'],
                    'reps' => $task['reps'],
                    'gesture_class' => $task['gesture_class'] ?? null,
                ]);
            }
        });

        return response()->json(['message' => 'Workout plan synchronized.', 'task_count' => count($validated['tasks'])]);
    }

    /** A member's 50 most recent workout logs. */
    public function history($id)
    {
        return WorkoutLog::where('member_id', $id)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();
    }

    /** Coach manually verifies a task the camera cannot detect. */
    public function manualVerify($id)
    {
        $log = WorkoutLog::findOrFail($id);

        // Strip the "ASSIGNED: " tag to officially mark it as complete
        $cleanExerciseName = str_replace(self::ASSIGNED_PREFIX, '', $log->exercise);

        // The task keeps the day it was planned for. Only a task done ahead of
        // schedule (planned for a later day) is moved to today, the day it was done.
        $plannedDate = Carbon::parse($log->date)->startOfDay();
        $log->update([
            'exercise' => $cleanExerciseName,
            'date' => $plannedDate->isFuture() ? Carbon::today() : $plannedDate,
            'verified_by' => WorkoutLog::VERIFIED_BY_COACH,
            'verified_at' => Carbon::now(),
            'created_at' => Carbon::now() // Log the exact time the coach verified it
        ]);

        return response()->json(['message' => 'Task manually verified!']);
    }

    /** Live gesture feed: pending tasks plus detections from the last day. */
    public function live()
    {
        return WorkoutLog::with('member:id,first_name,last_name')
            ->where(function ($query) {
                $query->where(function ($pending) {
                    $pending->where('exercise', 'like', self::ASSIGNED_PREFIX . '%')
                        ->whereDate('date', '>=', Carbon::today());
                })->orWhere('created_at', '>=', Carbon::now()->subDay());
            })
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($log) {
                $isPending = str_starts_with($log->exercise, self::ASSIGNED_PREFIX);
                $exerciseName = $isPending ? substr($log->exercise, strlen(self::ASSIGNED_PREFIX)) : $log->exercise;
                $status = $isPending
                    ? ($log->gesture_class ? 'Pending AI verification' : 'Pending manual verification')
                    : ($log->verified_by === WorkoutLog::VERIFIED_BY_COACH ? 'Coach verified' : 'AI detected');
                $target = $log->sets && $log->reps ? " · {$log->sets} sets x {$log->reps} reps" : '';
                $counted = $log->counted_reps !== null ? " · {$log->counted_reps} reps counted" : '';

                return [
                    'id' => $log->id,
                    'member_id' => $log->member_id,
                    'time' => $isPending ? Carbon::parse($log->date)->format('M j') : Carbon::parse($log->created_at)->format('h:i:s A'),
                    'name' => $log->member ? $log->member->first_name . ' ' . $log->member->last_name : 'Unknown Athlete',
                    'event' => "{$status} · {$exerciseName}{$target}{$counted}",
                ];
            });
    }
}
