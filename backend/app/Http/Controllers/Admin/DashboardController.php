<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Member\Transaction;
use App\Models\Tracking\Attendance;
use App\Models\Tracking\WorkoutLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Keeps member statuses current even when the scheduler is not running.
        app(\App\Services\MemberStatusService::class)->demoteOncePerDay();

        // 1. Top Stats Cards
        $totalIncome = Transaction::where('status', 'Complete')->where('amount', '>', 0)->sum('amount');

        $totalMembers = Member::count();
        // "Running right now": saved as Active, already started and not yet past its
        // end date. Same rule the Packages page uses, so both show the same number.
        $today = Carbon::today()->toDateString();
        $activeSubs = Membership::where('status', 'Active')
            ->whereNotNull('member_id')
            ->where(fn ($query) => $query->whereNull('start_date')->orWhere('start_date', '<=', $today))
            ->where(fn ($query) => $query->whereNull('end_date')->orWhere('end_date', '>=', $today))
            ->count();

        // 2. Recent Activity (Middle Grid)
        $recentMembers = Member::orderBy('created_at', 'desc')->take(8)->get();
        $recentTxns = Transaction::with([
            'member:id,first_name,last_name',
            'membership:id,plan_type,plan_id',
            'membership.plan:id,name,category,category_detail',
        ])->orderBy('created_at', 'desc')->take(5)->get();

        // 3. Expiring Soon Alerts
        // Compared as dates, so a membership ending today is included.
        $expiringSoon = Membership::with('member:id,first_name,last_name')
            ->where('status', 'Active')
            ->whereNotNull('member_id')
            ->whereBetween('end_date', [$today, Carbon::today()->addDays(7)->toDateString()])
            ->orderBy('end_date', 'asc')
            ->get();

        // 4. Dynamic Sales Chart (Last 6 Months of Revenue)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $txnsForChart = Transaction::where('status', 'Complete')
            ->where('created_at', '>=', $sixMonthsAgo)
            ->get();

        $salesData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M');
            
            $monthlyTotal = $txnsForChart->filter(function($txn) use ($month) {
                return Carbon::parse($txn->created_at)->format('Y-m') === $month->format('Y-m');
            })->sum('amount');

            $salesData[] = [
                'name' => $monthName,
                'revenue' => $monthlyTotal
            ];
        }

        // 5. Today's attendance: total, and check-ins per hour of the gym day.
        $todayTimes = Attendance::where('date', Carbon::today()->toDateString())->pluck('time_in');
        $perHour = $todayTimes->countBy(fn ($time) => (int) substr((string) $time, 0, 2));
        $openHour = (int) substr((string) config('gym.open_time', '09:00'), 0, 2);
        $closeHour = (int) substr((string) config('gym.close_time', '21:30'), 0, 2);
        $checkInsByHour = [];
        for ($hour = $openHour; $hour <= $closeHour; $hour++) {
            $checkInsByHour[] = [
                'hour' => Carbon::createFromTime($hour)->format('g A'),
                'checkIns' => $perHour[$hour] ?? 0,
            ];
        }

        return response()->json([
            'todayCheckIns' => $todayTimes->count(),
            'checkInsByHour' => $checkInsByHour,
            'stats' => [
                'revenue' => $totalIncome,
                'members' => $totalMembers,
                'activeSubs' => $activeSubs,
                'reports' => Transaction::count() // Example: showing total lifetime transactions as "reports"
            ],
            'salesData' => $salesData,
            'recentMembers' => $recentMembers,
            'recentTxns' => $recentTxns,
            'expiringSoon' => $expiringSoon,
        ]);
    }

    public function notifications()
    {
        $alerts = collect();
        $today = Carbon::today();

        // ── ALERT TYPE 1: Subscriptions Expiring Within 7 Days ──────────────
        $expiringSoon = Membership::with('member:id,first_name,last_name')
            ->where('status', 'Active')
            ->whereNotNull('member_id')
            ->whereBetween('end_date', [$today->toDateString(), $today->copy()->addDays(7)->toDateString()])
            ->orderBy('end_date', 'asc')
            ->get();

        foreach ($expiringSoon as $sub) {
            if (!$sub->member) continue;
            $daysLeft = $today->diffInDays(Carbon::parse($sub->end_date), false);
            $alerts->push([
                'id'          => 'exp_' . $sub->id,
                'type'        => 'expiring',
                'member_name' => $sub->member->first_name . ' ' . $sub->member->last_name,
                'message'     => $daysLeft === 0
                    ? "Subscription expires TODAY — {$sub->plan_type} plan."
                    : "Subscription expires in {$daysLeft} day(s) — {$sub->plan_type} plan.",
                'days_left'   => $daysLeft,
            ]);
        }

        // ── ALERT TYPE 2: Active Members With No Valid Subscription ──────────
        // A paused subscription counts as valid: the member is expected to come back.
        // The database picks out only the members to flag, instead of
        // loading every active member and checking each one here.
        $oneMonthAgo = Carbon::now()->subMonth();
        $membersWithoutSub = Member::where('status', 'Active')
            ->where('created_at', '<', $oneMonthAgo)
            ->whereNotIn('id', Membership::select('member_id')
                ->whereNotNull('member_id')
                ->where(fn ($query) => $query
                    ->where('status', Membership::PAUSED)
                    ->orWhere(fn ($active) => $active
                        ->where('status', 'Active')
                        ->where('end_date', '>=', $today->toDateString()))))
            ->get(['id', 'first_name', 'last_name']);

        foreach ($membersWithoutSub as $member) {
            $alerts->push([
                'id'          => 'nosub_' . $member->id,
                'type'        => 'no_sub',
                'member_name' => $member->first_name . ' ' . $member->last_name,
                'message'     => 'No active subscription. Registered over 30 days ago.',
                'days_left'   => null,
            ]);
        }

        // ── ALERT TYPE 3: Unverified CCTV Workout Tasks (Today) ─────────────
        $uncompletedTasks = WorkoutLog::with('member:id,first_name,last_name')
            ->where('date', Carbon::today())
            ->where('exercise', 'LIKE', 'ASSIGNED: %')
            ->get();

        foreach ($uncompletedTasks as $task) {
            if (!$task->member) continue;
            $exerciseName = str_replace('ASSIGNED: ', '', $task->exercise);
            $alerts->push([
                'id'          => 'task_' . $task->id,
                'type'        => 'task',
                'member_name' => $task->member->first_name . ' ' . $task->member->last_name,
                'message'     => "Assigned: {$exerciseName} — not yet verified by CCTV AI.",
                'days_left'   => null,
            ]);
        }

        return response()->json($alerts);
    }
}
