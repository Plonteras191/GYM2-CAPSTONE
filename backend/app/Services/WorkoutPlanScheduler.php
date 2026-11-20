<?php

namespace App\Services;

use App\Http\Controllers\Tracking\WorkoutController;
use App\Models\Tracking\WorkoutLog;
use App\Models\Tracking\WorkoutPlanItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Keeps every member's weekly plan scheduled for the coming 7 days.
 *
 * The coach saves the plan once (as weekday templates in workout_plan_items);
 * each day the tasks for the next 7 days are created from it, so the plan
 * repeats every week without the coach saving it again.
 */
class WorkoutPlanScheduler
{
    /**
     * Create the missing tasks for today and the next 6 days. A task is not
     * created again when that exercise already has a task (pending or done)
     * on that date, so running this more than once is harmless.
     *
     * @return int number of tasks created
     */
    public function fillUpcomingWeek(?int $memberId = null): int
    {
        $prefix = WorkoutController::ASSIGNED_PREFIX;
        $today = Carbon::today();
        $dates = collect(range(0, 6))->map(fn ($offset) => $today->copy()->addDays($offset));

        $items = WorkoutPlanItem::query()
            ->when($memberId, fn ($query) => $query->where('member_id', $memberId))
            ->orderBy('member_id')->orderBy('weekday')->orderBy('position')->orderBy('id')
            ->get();
        if ($items->isEmpty()) {
            return 0;
        }

        $existing = WorkoutLog::query()
            ->whereIn('member_id', $items->pluck('member_id')->unique())
            ->whereBetween('date', [$today->toDateString(), $today->copy()->addDays(6)->toDateString()])
            ->get(['member_id', 'date', 'exercise'])
            ->map(fn ($log) => $this->key($log->member_id, $log->date, str_replace($prefix, '', $log->exercise)))
            ->flip();

        $created = 0;
        foreach ($dates as $date) {
            foreach ($items->where('weekday', $date->dayOfWeekIso) as $item) {
                $key = $this->key($item->member_id, $date->toDateString(), $item->exercise);
                if ($existing->has($key)) {
                    continue;
                }
                WorkoutLog::create([
                    'member_id' => $item->member_id,
                    'exercise' => $prefix . $item->exercise,
                    'date' => $date->toDateString(),
                    'sets' => $item->sets,
                    'reps' => $item->reps,
                    'gesture_class' => $item->gesture_class,
                ]);
                $existing->put($key, true);
                $created++;
            }
        }

        return $created;
    }

    /** Runs fillUpcomingWeek() at most once a day, for pages that load plans. */
    public function fillOncePerDay(): void
    {
        $key = 'workout-plans:filled:' . Carbon::today()->toDateString();

        try {
            if (!Cache::add($key, true, Carbon::now()->endOfDay())) {
                return;
            }
        } catch (Throwable) {
            // Cache unavailable: filling again creates nothing new.
        }

        $this->fillUpcomingWeek();
    }

    private function key($memberId, $date, string $exercise): string
    {
        return $memberId . '|' . substr((string) $date, 0, 10) . '|' . strtoupper(trim($exercise));
    }
}
