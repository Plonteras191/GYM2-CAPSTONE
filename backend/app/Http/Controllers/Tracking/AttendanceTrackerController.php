<?php

namespace App\Http\Controllers\Tracking;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Tracking\WorkoutLog;
use App\Services\MemberStatusService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * The Attendance page: every subscriber with their subscription, their
 * attendance this week and month, and (With Coach) this week's training plan,
 * so staff do not have to open each member's profile.
 */
class AttendanceTrackerController extends Controller
{
    /** A member counts as absent after this many days without a visit. */
    public const ABSENT_AFTER_DAYS = 7;

    public function __construct(private MemberStatusService $memberStatus)
    {
    }

    public function index()
    {
        // Keeps member statuses current even when the scheduler is not running.
        $this->memberStatus->demoteOncePerDay();

        $today = Carbon::today();
        $todayKey = $today->toDateString();
        $weekStart = $today->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = $today->copy()->endOfWeek(Carbon::SUNDAY)->toDateString();
        $monthStart = $today->copy()->startOfMonth()->toDateString();

        // Each member's latest subscription, leaving out walk-in / daily passes.
        $subscriptions = Membership::with('plan:id,name,category')
            ->whereNotNull('member_id')
            ->orderByDesc('id')
            ->get()
            ->reject(fn (Membership $membership) => $this->isWalkIn($membership))
            ->unique('member_id')
            ->keyBy('member_id');

        $memberIds = $subscriptions->keys()->all();
        if (empty($memberIds)) {
            return response()->json(['summary' => $this->summary(collect()), 'rows' => []]);
        }

        $members = Member::whereIn('id', $memberIds)
            ->get(['id', 'first_name', 'last_name', 'email', 'profile_pic', 'status'])
            ->keyBy('id');

        // Visits this week, this month and today: one grouped query.
        $counts = DB::table('attendances')
            ->whereIn('member_id', $memberIds)
            ->where('date', '>=', min($weekStart, $monthStart))
            ->groupBy('member_id')
            ->selectRaw(
                'member_id,'
                . ' SUM(CASE WHEN date >= ? AND date <= ? THEN 1 ELSE 0 END) as week_visits,'
                . ' SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) as month_visits,'
                . ' SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) as today_visits',
                [$weekStart, $weekEnd, $monthStart, $todayKey]
            )
            ->get()
            ->keyBy('member_id');

        // Which days of this week each member came in (for the Mon–Sun strip).
        $weekDays = DB::table('attendances')
            ->whereIn('member_id', $memberIds)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->orderBy('date')
            ->get(['member_id', 'date'])
            ->groupBy('member_id')
            ->map(fn ($days) => $days->map(fn ($day) => Carbon::parse($day->date)->toDateString())->unique()->values()->all());

        // Last visit (date and time): a member has at most one check-in per day.
        $lastVisits = DB::table('attendances as a')
            ->joinSub(
                DB::table('attendances')->select('member_id', DB::raw('MAX(date) as last_date'))->groupBy('member_id'),
                'latest',
                fn ($join) => $join->on('a.member_id', '=', 'latest.member_id')->on('a.date', '=', 'latest.last_date')
            )
            ->whereIn('a.member_id', $memberIds)
            ->get(['a.member_id', 'a.date', 'a.time_in'])
            ->keyBy('member_id');

        // This week's training tasks of With Coach members (same rules as the reports).
        $coachIds = $subscriptions
            ->filter(fn (Membership $membership) => $this->isWithCoach($membership))
            ->keys()
            ->all();
        $tasks = empty($coachIds) ? collect() : WorkoutLog::whereIn('member_id', $coachIds)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->whereNotNull('sets')
            ->whereNotNull('reps')
            ->get(['member_id', 'exercise', 'date'])
            ->groupBy('member_id');

        $rows = $subscriptions->map(function (Membership $membership, $memberId) use ($members, $counts, $lastVisits, $weekDays, $tasks, $today, $todayKey) {
            $member = $members->get($memberId);
            if (!$member) {
                return null;
            }

            $status = $membership->status === 'Active' && $membership->end_date && Carbon::parse($membership->end_date)->lt($today)
                ? 'Expired'
                : $membership->status;
            $last = $lastVisits->get($memberId);
            $count = $counts->get($memberId);
            $lastDate = $last ? Carbon::parse($last->date) : null;

            return [
                'member' => [
                    'id' => $member->id,
                    'name' => trim($member->first_name . ' ' . $member->last_name),
                    'email' => $member->email,
                    'profile_pic' => $member->profile_pic,
                    'status' => $member->status,
                ],
                'subscription' => [
                    'id' => $membership->id,
                    'plan_type' => $membership->plan_type,
                    'category' => $membership->plan?->category,
                    'with_coach' => $this->isWithCoach($membership),
                    'status' => $status,
                    'start_date' => $this->day($membership->start_date),
                    'end_date' => $this->day($membership->end_date),
                    'paused_at' => $this->day($membership->paused_at),
                    'days_left' => $status === 'Active' && $membership->end_date
                        ? max(0, (int) $today->diffInDays(Carbon::parse($membership->end_date), false))
                        : null,
                    'paused_days_left' => $status === Membership::PAUSED && $membership->paused_at
                        ? max(0, (int) Carbon::parse($membership->paused_at)->diffInDays(Carbon::parse($membership->end_date)))
                        : null,
                ],
                'attendance' => [
                    'last_visit_date' => $lastDate?->toDateString(),
                    'last_visit_time' => $last?->time_in,
                    'days_since_last_visit' => $lastDate ? (int) $lastDate->diffInDays($today) : null,
                    'today' => (int) ($count->today_visits ?? 0) > 0,
                    'week_visits' => (int) ($count->week_visits ?? 0),
                    'month_visits' => (int) ($count->month_visits ?? 0),
                    'week_days' => $weekDays->get($memberId, []),
                ],
                'plan' => $this->isWithCoach($membership) && in_array($status, ['Active', Membership::PAUSED], true)
                    ? $this->planProgress($tasks->get($memberId, collect()), $todayKey)
                    : null,
            ];
        })->filter()->values();

        return response()->json([
            'summary' => $this->summary($rows),
            'rows' => $rows,
            'week_start' => $weekStart,
            'week_end' => $weekEnd,
        ]);
    }

    /** Totals for the cards at the top of the page. */
    private function summary($rows): array
    {
        return [
            'checked_in_today' => $rows->where('attendance.today', true)->count(),
            'visits_this_week' => $rows->sum('attendance.week_visits'),
            'absent' => $rows->filter(fn ($row) => $row['subscription']['status'] === 'Active' && $this->isAbsent($row))->count(),
            'paused' => $rows->where('subscription.status', Membership::PAUSED)->count(),
            'subscribers' => $rows->count(),
        ];
    }

    private function isAbsent(array $row): bool
    {
        $days = $row['attendance']['days_since_last_visit'];

        return $days === null || $days >= self::ABSENT_AFTER_DAYS;
    }

    /** Done / pending / missed tasks this week (a task is pending until it is verified). */
    private function planProgress($tasks, string $todayKey): array
    {
        $isPending = fn ($task) => str_starts_with((string) $task->exercise, WorkoutController::ASSIGNED_PREFIX);
        $dayOf = fn ($task) => Carbon::parse($task->date)->toDateString();
        $todays = $tasks->filter(fn ($task) => $dayOf($task) === $todayKey);

        return [
            'week_assigned' => $tasks->count(),
            'week_done' => $tasks->reject($isPending)->count(),
            'week_missed' => $tasks->filter(fn ($task) => $isPending($task) && $dayOf($task) < $todayKey)->count(),
            'today_assigned' => $todays->count(),
            'today_done' => $todays->reject($isPending)->count(),
        ];
    }

    /** Walk-in and daily passes are not subscriptions (same rule as the Packages calendar). */
    private function isWalkIn(Membership $membership): bool
    {
        $name = strtolower((string) ($membership->plan?->name ?: $membership->plan_type));

        return $membership->plan?->category === 'walk_in'
            || str_contains($name, 'walk')
            || str_contains($name, 'daily');
    }

    /** Same rule as Membership::scopeActiveWithCoach (plan category, or the saved plan name). */
    private function isWithCoach(Membership $membership): bool
    {
        if ($membership->plan) {
            return $membership->plan->category === 'with_coach';
        }

        return str_contains(strtolower((string) $membership->plan_type), 'with coach');
    }

    private function day($value): ?string
    {
        return $value ? Carbon::parse($value)->toDateString() : null;
    }
}
