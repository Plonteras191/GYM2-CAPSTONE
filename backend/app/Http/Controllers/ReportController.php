<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Membership;
use App\Models\Member;
use App\Models\Attendance; // <-- IMPORT ADDED HERE
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get dates from React, or default to this month
        $start = $request->query('start', Carbon::now()->startOfMonth()->toDateString());
        $end = $request->query('end', Carbon::now()->toDateString());

        // --- 1. PAYMENTS DATA ---
        $txns = Transaction::with('member')
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        $totalRevenue = $txns->where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $totalTxns = $txns->count();
        $refunds = $txns->where('type', 'Refund')->count();

        $paymentRows = $txns->map(function($t) {
            $name = $t->member ? $t->member->first_name . ' ' . $t->member->last_name : 'Walk-in Guest';
            return [
                $t->transaction_id, 
                $t->transaction_date,
                $name,
                $t->payment_method,
                $t->type,
                '₱ ' . number_format($t->amount, 2) // <-- Fixed Here
            ];
        });

        // --- 2. MEMBERSHIPS DATA ---
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

        // --- 3. ATTENDANCE (CCTV) DATA ---
        // This queries the database for exactly what the Python AI just saved
        $attendances = Attendance::with('member')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();

        $totalCheckIns = $attendances->count();

        $attendanceRows = $attendances->map(function($a) {
            $name = $a->member ? $a->member->first_name . ' ' . $a->member->last_name : 'Unknown Face';
            return [
                $a->date . ' / ' . $a->time_in,
                $name,
                'AI CCTV Camera',
                'Verified'
            ];
        });

        // Return exact format expected by React Reports.jsx
        return response()->json([
            'Payments' => [
                'kpis' => [
                    ['label' => 'Total Revenue', 'value' => '₱ ' . number_format($totalRevenue, 2), 'trend' => 'Live'],
                    ['label' => 'Total Transactions', 'value' => (string)$totalTxns, 'trend' => 'Live'],
                    ['label' => 'Refunds Processed', 'value' => (string)$refunds, 'trend' => 'Live']
                ],
                // 2. ADDED 'Txn ID' TO COLUMNS ARRAY BELOW:
                'columns' => ['Txn ID', 'Date', 'Member', 'Method', 'Type', 'Amount'], 
                'rows' => $paymentRows
            ],
            'Memberships' => [
                'kpis' => [
                    ['label' => 'New Signups (Period)', 'value' => (string)$newSignups, 'trend' => 'Live'],
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
                    ['label' => 'Most Active Time', 'value' => 'Calculating...', 'trend' => 'Live']
                ],
                'columns' => ['Date / Time', 'Member', 'Entry Method', 'Status'],
                'rows' => $attendanceRows // <-- Replaced the empty array with the live data!
            ]
        ]);
    }
}