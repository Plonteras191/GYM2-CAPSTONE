<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Membership;
use App\Models\Member;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get dates from React, or default to this month
        $start = $request->query('start', Carbon::now()->startOfMonth()->toDateString());
        $end = $request->query('end', Carbon::now()->toDateString());

        // ==========================================
        // 1. PAYMENTS DATA (UPDATED TO MATCH IMAGE 3)
        // ==========================================
        $txns = Transaction::with('member')
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        // Calculate the exact KPIs needed for the new UI format
        $totalIncome = $txns->where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $refunds = $txns->where('type', 'Refund')->sum('amount');
        $netRevenue = $totalIncome - abs($refunds);
        $pendingAmount = $txns->where('status', 'Pending')->sum('amount');

        $paymentRows = $txns->map(function($t) {
            $name = $t->member ? $t->member->first_name . ' ' . $t->member->last_name : 'Walk-in Guest';
            return [
                $t->transaction_id, 
                $t->transaction_date,
                $name,
                $t->type . ($t->description ? ' (' . $t->description . ')' : ''), // Details Column
                $t->payment_method,
                '₱ ' . number_format($t->amount, 2),
                $t->status
            ];
        });

        // ==========================================
        // 2. MEMBERSHIPS DATA
        // ==========================================
        $memberships = Membership::with('member')
            ->whereBetween('created_at', [$start . ' 00:00:00', $end . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->get();

        $newSignups = Member::whereBetween('created_at', [$start . ' 00:00:00', $end . ' 23:59:59'])->count();
        $activeCount = Membership::where('status', 'Active')->count(); 
        $expiredCount = Membership::where('status', 'Expired')->count();

        $membershipRows = $memberships->map(function($m) {
            $name = $m->member ? $m->member->first_name . ' ' . $m->member->last_name : 'Unknown Member';
            return [
                $name,
                $m->plan_type,
                $m->start_date,
                $m->end_date,
                $m->status
            ];
        });

        // ==========================================
        // 3. ATTENDANCE (CCTV) DATA
        // ==========================================
        $attendances = Attendance::with('member')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();

        $totalCheckIns = $attendances->count();

        // UPDATED: Now identifies "Walk-in Guest" vs "Subscription Type" for tracking purposes
        $attendanceRows = $attendances->map(function($a) {
            $name = $a->member ? $a->member->first_name . ' ' . $a->member->last_name : 'Unknown Face';
            
            $memberType = 'Walk-in Guest';
            if ($a->member && $a->member->plan && $a->member->plan !== 'None') {
                $memberType = $a->member->plan;
            }

            return [
                $a->date . ' / ' . $a->time_in,
                $name,
                $memberType, 
                'Verified'
            ];
        });

        // Return exact format expected by React Reports.jsx
        return response()->json([
            'Payments' => [
                'kpis' => [
                    ['label' => 'Total Income', 'value' => '₱ ' . number_format($totalIncome, 2), 'trend' => 'Live'],
                    ['label' => 'Refunds', 'value' => '₱ ' . number_format(abs($refunds), 2), 'trend' => 'Live'],
                    ['label' => 'Net Revenue', 'value' => '₱ ' . number_format($netRevenue, 2), 'trend' => 'Live'],
                    ['label' => 'Pending', 'value' => '₱ ' . number_format($pendingAmount, 2), 'trend' => 'Live']
                ],
                'columns' => ['Txn ID', 'Date', 'Member', 'Details', 'Method', 'Amount', 'Status'], 
                'rows' => $paymentRows
            ],
            'Memberships' => [
                'kpis' => [
                    ['label' => 'New Signups', 'value' => (string)$newSignups, 'trend' => 'Live'],
                    ['label' => 'Total Active', 'value' => (string)$activeCount, 'trend' => 'Live'],
                    ['label' => 'Total Expired', 'value' => (string)$expiredCount, 'trend' => 'Live']
                ],
                'columns' => ['Member', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
                'rows' => $membershipRows
            ],
            'Attendance' => [
                'kpis' => [
                    ['label' => 'Total Check-ins', 'value' => (string)$totalCheckIns, 'trend' => 'Live'],
                    ['label' => 'Avg. Daily Visits', 'value' => 'Tracking Active', 'trend' => 'Live'],
                    ['label' => 'System Status', 'value' => 'Online', 'trend' => 'Live']
                ],
                // UPDATED COLUMNS 
                'columns' => ['Date / Time', 'Member', 'Member Type', 'Status'],
                'rows' => $attendanceRows 
            ]
        ]);
    }
}