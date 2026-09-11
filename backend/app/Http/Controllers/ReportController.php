<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Membership;
use App\Models\Member;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get dates from React, or default to this month
        $start = $request->query('start', Carbon::now()->startOfMonth()->toDateString());
        $end   = $request->query('end',   Carbon::now()->toDateString());

        $startDateTime = $start . ' 00:00:00';
        $endDateTime   = $end   . ' 23:59:59';

        // ══════════════════════════════════════════════════════════════════
        // Run all queries — each selects ONLY the columns it needs.
        // The member join uses :id,first_name,last_name to prevent loading
        // enrolled_face_id (a base64 longText field — very expensive).
        // DB-level COUNT aggregation replaces PHP-level collection filtering.
        // ══════════════════════════════════════════════════════════════════

        // 1. Transactions in date range (only needed columns)
        $txns = Transaction::select(
                'id', 'transaction_id', 'transaction_date', 'member_id',
                'type', 'description', 'payment_method', 'amount', 'status'
            )
            ->with('member:id,first_name,last_name')
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        // 2. Memberships created in date range
        $memberships = Membership::select(
                'id', 'member_id', 'plan_type', 'start_date', 'end_date',
                'status', 'created_at'
            )
            ->with('member:id,first_name,last_name')
            ->whereBetween('created_at', [$startDateTime, $endDateTime])
            ->orderBy('created_at', 'desc')
            ->get();

        // 3. New member signups count (DB aggregate — no row loading)
        $newSignups = Member::whereBetween('created_at', [$startDateTime, $endDateTime])->count();

        // 4. Active / Expired membership counts — single GROUP BY query
        //    instead of loading all rows and counting in PHP
        $statusCounts = Membership::select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('status', ['Active', 'Expired'])
            ->groupBy('status')
            ->pluck('total', 'status');
        $activeCount  = $statusCounts['Active']  ?? 0;
        $expiredCount = $statusCounts['Expired'] ?? 0;

        // 5. Attendance records in date range (only needed columns)
        $attendances = Attendance::select('id', 'member_id', 'date', 'time_in')
            ->with('member:id,first_name,last_name,plan')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();

        // ── Build KPIs from in-memory collections (no extra DB hits) ─────────
        $totalIncome   = $txns->where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $refunds       = $txns->where('type', 'Refund')->sum('amount');
        $netRevenue    = $totalIncome - abs($refunds);
        $pendingAmount = $txns->where('status', 'Pending')->sum('amount');
        $totalCheckIns = $attendances->count();

        // ── Map rows ─────────────────────────────────────────────────────────
        $paymentRows = $txns->map(fn($t) => [
            $t->transaction_id,
            $t->transaction_date,
            $t->member ? "{$t->member->first_name} {$t->member->last_name}" : 'Walk-in Guest',
            $t->type . ($t->description ? " ({$t->description})" : ''),
            $t->payment_method,
            '₱ ' . number_format($t->amount, 2),
            $t->status,
        ]);

        $membershipRows = $memberships->map(fn($m) => [
            $m->member ? "{$m->member->first_name} {$m->member->last_name}" : 'Unknown Member',
            $m->plan_type,
            $m->start_date,
            $m->end_date,
            $m->status,
        ]);

        $attendanceRows = $attendances->map(function ($a) {
            $name       = $a->member ? "{$a->member->first_name} {$a->member->last_name}" : 'Unknown Face';
            $memberType = ($a->member && $a->member->plan && $a->member->plan !== 'None')
                ? $a->member->plan
                : 'Walk-in Guest';
            return [$a->date . ' / ' . $a->time_in, $name, $memberType, 'Verified'];
        });

        return response()->json([
            'Payments' => [
                'kpis' => [
                    ['label' => 'Total Income',  'value' => '₱ ' . number_format($totalIncome, 2),   'trend' => 'Live'],
                    ['label' => 'Refunds',        'value' => '₱ ' . number_format(abs($refunds), 2),  'trend' => 'Live'],
                    ['label' => 'Net Revenue',    'value' => '₱ ' . number_format($netRevenue, 2),    'trend' => 'Live'],
                    ['label' => 'Pending',        'value' => '₱ ' . number_format($pendingAmount, 2), 'trend' => 'Live'],
                ],
                'columns' => ['Txn ID', 'Date', 'Member', 'Details', 'Method', 'Amount', 'Status'],
                'rows'    => $paymentRows,
            ],
            'Memberships' => [
                'kpis' => [
                    ['label' => 'New Signups',   'value' => (string) $newSignups,   'trend' => 'Live'],
                    ['label' => 'Total Active',  'value' => (string) $activeCount,  'trend' => 'Live'],
                    ['label' => 'Total Expired', 'value' => (string) $expiredCount, 'trend' => 'Live'],
                ],
                'columns' => ['Member', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
                'rows'    => $membershipRows,
            ],
            'Attendance' => [
                'kpis' => [
                    ['label' => 'Total Check-ins',   'value' => (string) $totalCheckIns, 'trend' => 'Live'],
                    ['label' => 'Avg. Daily Visits',  'value' => 'Tracking Active',       'trend' => 'Live'],
                    ['label' => 'System Status',      'value' => 'Online',                'trend' => 'Live'],
                ],
                'columns' => ['Date / Time', 'Member', 'Member Type', 'Status'],
                'rows'    => $attendanceRows,
            ],
        ]);
    }
}