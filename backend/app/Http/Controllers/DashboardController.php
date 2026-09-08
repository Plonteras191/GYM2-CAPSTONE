<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\Membership;
use App\Models\Transaction;
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
        $activeMembers = Member::where('status', 'Active')->get();
        $activeSubsMemberIds = Membership::where('status', 'Active')
            ->where('end_date', '>=', Carbon::now()->toDateString())
            ->pluck('member_id')
            ->toArray();

        $alerts = collect();

        // Alert 1: Missing Subscriptions
        foreach ($activeMembers as $member) {
            if (!in_array($member->id, $activeSubsMemberIds)) {
                $alerts->push([
                    'id' => 'sub_' . $member->id,
                    'member_name' => $member->first_name . ' ' . $member->last_name,
                    'message' => 'Status is Active, but has no valid subscription plan.'
                ]);
            }
        }

        // Alert 2: Unverified CCTV Tasks (The Snitch!)
        $uncompletedTasks = \App\Models\WorkoutLog::with('member:id,first_name,last_name')
            ->where('date', Carbon::today())
            ->where('exercise', 'LIKE', 'ASSIGNED: %')
            ->get();

        foreach ($uncompletedTasks as $task) {
            if ($task->member) {
                $exerciseName = str_replace('ASSIGNED: ', '', $task->exercise);
                $alerts->push([
                    'id' => 'task_' . $task->id,
                    'member_name' => $task->member->first_name . ' ' . $task->member->last_name,
                    'message' => "Assigned to do {$exerciseName} today, but the CCTV AI has not verified it yet."
                ]);
            }
        }

        return response()->json($alerts);
    }
}