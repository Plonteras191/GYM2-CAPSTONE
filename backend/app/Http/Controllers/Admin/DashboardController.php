<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Member\Transaction;
use App\Models\Tracking\WorkoutLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Top Stats Cards
        $totalIncome = Transaction::where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $totalRefunds = Transaction::where('type', 'Refund')->sum('amount');
        $netRevenue = $totalIncome - abs($totalRefunds);

        $totalMembers = Member::count();
        $activeSubs = Membership::where('status', 'Active')->count();

        // 2. Recent Activity (Middle Grid)
        $recentMembers = Member::orderBy('created_at', 'desc')->take(5)->get();
        $recentTxns = Transaction::with('member:id,first_name,last_name')->orderBy('created_at', 'desc')->take(5)->get();

        // 3. Expiring Soon Alerts
        $expiringSoon = Membership::with('member:id,first_name,last_name')
            ->where('status', 'Active')
            ->whereBetween('end_date', [Carbon::now(), Carbon::now()->addDays(7)])
            ->orderBy('end_date', 'asc')
            ->get();

        // 4. Calendar Events (Pulling directly from Subscriptions)
        $calendarEvents = Membership::with('member:id,first_name,last_name')->get();

        // 5. Dynamic Sales Chart (Last 6 Months of Revenue)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $txnsForChart = Transaction::where('status', 'Complete')
            ->where('type', '!=', 'Refund')
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

        return response()->json([
            'stats' => [
                'revenue' => $netRevenue,
                'members' => $totalMembers,
                'activeSubs' => $activeSubs,
                'reports' => Transaction::count() // Example: showing total lifetime transactions as "reports"
            ],
            'salesData' => $salesData,
            'recentMembers' => $recentMembers,
            'recentTxns' => $recentTxns,
            'expiringSoon' => $expiringSoon,
            'calendarEvents' => $calendarEvents
        ]);
    }

    public function notifications()
    {
        $alerts = collect();
        $today = Carbon::today();

        // ── ALERT TYPE 1: Subscriptions Expiring Within 7 Days ──────────────
        $expiringSoon = Membership::with('member:id,first_name,last_name')
            ->where('status', 'Active')
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
        $activeMembers = Member::where('status', 'Active')->get();
        $activeSubMemberIds = Membership::where('status', 'Active')
            ->where('end_date', '>=', $today->toDateString())
            ->pluck('member_id')
            ->toArray();

        $oneMonthAgo = Carbon::now()->subDays(30);
        foreach ($activeMembers as $member) {
            if (!in_array($member->id, $activeSubMemberIds)) {
                if ($member->created_at < $oneMonthAgo) {
                    $alerts->push([
                        'id'          => 'nosub_' . $member->id,
                        'type'        => 'no_sub',
                        'member_name' => $member->first_name . ' ' . $member->last_name,
                        'message'     => 'No active subscription. Registered over 30 days ago.',
                        'days_left'   => null,
                    ]);
                }
            }
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
