<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member\Transaction;
use App\Models\Member\Membership;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
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

        // 1. Transactions in date range (only needed columns)
        $txns = Transaction::select(
                'id', 'transaction_id', 'transaction_date', 'member_id', 'member_name_snapshot', 'member_profile_pic_snapshot', 'member_email_snapshot', 'membership_id',
                'type', 'description', 'payment_method', 'amount', 'status', 'package_name_snapshot',
                'package_category_snapshot'
            )
            ->with([
                'member:id,first_name,last_name,email,profile_pic',
                'membership:id,plan_type,plan_id',
                'membership.plan:id,name,category,category_detail',
            ])
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        // 2. Memberships created in date range
        $memberships = Membership::select(
                'id', 'member_id', 'member_name_snapshot', 'member_profile_pic_snapshot', 'member_email_snapshot', 'plan_id', 'plan_type', 'start_date', 'end_date',
                'status', 'created_at'
            )
            ->with(['member:id,first_name,last_name,email,profile_pic', 'plan:id,name,category,category_detail'])
            ->withExists(['transactions as has_upgraded' => function ($query) {
                $query->where('type', 'Subscription Upgrade')->where('status', 'Complete');
            }])
            ->where(function ($query) use ($startDateTime, $endDateTime, $start, $end) {
                $query->whereBetween('created_at', [$startDateTime, $endDateTime])
                    ->orWhereHas('transactions', function ($transactionQuery) use ($start, $end) {
                        $transactionQuery->where('type', 'Subscription Upgrade')
                            ->where('status', 'Complete')
                            ->whereBetween('transaction_date', [$start, $end]);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // 3. New member signups count
        $newSignups = Member::whereBetween('created_at', [$startDateTime, $endDateTime])->count();

        // 4. Active / Expired membership counts
        $statusCounts = Membership::select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('status', ['Active', 'Expired'])
            ->groupBy('status')
            ->pluck('total', 'status');
        $activeCount  = $statusCounts['Active']  ?? 0;
        $expiredCount = $statusCounts['Expired'] ?? 0;

        // 5. Attendance records in date range
        $attendances = Attendance::select(
                'id', 'member_id', 'member_name_snapshot', 'date', 'time_in', 'source',
                'camera_source', 'subscription_status', 'plan_snapshot'
            )
            ->with('member:id,first_name,last_name,email,profile_pic')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();

        // Build KPIs
        $totalIncome   = $txns->where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $refunds       = $txns->where('type', 'Refund')->sum('amount');
        $netRevenue    = $totalIncome - abs($refunds);
        $totalCheckIns = $attendances->count();

        // Map rows
        $memberDetails = fn($member, $fallback, $snapshot = null, $profilePicSnapshot = null, $emailSnapshot = null) => [
            'id' => $member?->id,
            'name' => $member ? "{$member->first_name} {$member->last_name}" : ($snapshot ?: $fallback),
            'email' => $member?->email ?: $emailSnapshot,
            'profile_pic' => $member?->profile_pic ?: $profilePicSnapshot,
        ];

        $plans = \App\Models\Gym\Plan::select('id', 'name', 'category', 'category_detail')->get();
        $paymentDetails = function ($transaction) use ($plans) {
            if ($transaction->type === 'Refund') {
                return [
                    'title' => 'Refund Payment',
                    'category' => trim((string) $transaction->description) ?: 'Refund',
                ];
            }

            $package = $transaction->membership?->plan;
            $planName = trim((string) ($transaction->package_name_snapshot ?: $package?->name ?: $transaction->membership?->plan_type));
            if (!$package && $planName === '') {
                $description = trim((string) $transaction->description);
                $package = $plans->first(fn($plan) => str_contains(strtolower($description), strtolower($plan->name)));
                $planName = trim((string) ($package?->name ?: $description));
            }

            $category = match ($transaction->package_category_snapshot ?: $package?->category) {
                'with_coach' => 'With Coach Subscription',
                'walk_in' => 'Walk-In Package',
                'other' => $package?->category_detail ?: 'Other / Custom',
                default => 'Normal Subscription',
            };

            return [
                'title' => ($planName ?: 'Unknown') . ' Package Payment'
                    . ($transaction->type === 'Subscription Upgrade' ? ' + Upgraded' : ''),
                'category' => $category,
            ];
        };

        $paymentRows = $txns->map(fn($t) => [
            $t->transaction_id,
            $t->transaction_date,
            $memberDetails($t->member, 'Walk-in Guest', $t->member_name_snapshot, $t->member_profile_pic_snapshot, $t->member_email_snapshot),
            $paymentDetails($t),
            $t->payment_method,
            (float) $t->amount,
            $t->status,
        ]);

        $membershipRows = $memberships->map(fn($m) => [
            $memberDetails($m->member, 'Unknown Member', $m->member_name_snapshot, $m->member_profile_pic_snapshot, $m->member_email_snapshot),
            [
                'title' => $m->plan_type,
                'category' => match ($m->plan?->category) {
                    'with_coach' => 'With Coach Subscription',
                    'walk_in' => 'Walk-In Package',
                    'other' => $m->plan?->category_detail ?: 'Other / Custom',
                    default => 'Normal Subscription',
                } . ($m->has_upgraded ? ' + Upgraded' : ''),
            ],
            $m->start_date,
            $m->end_date,
            $m->status,
        ]);

        // Each row shows what was true at check-in (plan, subscription), not
        // the member's current data, so past reports do not change over time.
        $attendanceRows = $attendances->map(fn ($a) => [
            $a->date . ' / ' . Carbon::parse($a->time_in)->format('g:i A'),
            $memberDetails($a->member, 'Deleted Member', $a->member_name_snapshot),
            $a->plan_snapshot ?: 'No plan',
            match ($a->subscription_status) {
                'active' => 'Active',
                'expired' => 'Expired',
                'none' => 'No Subscription',
                default => 'Not Recorded',
            },
            $a->source === 'manual' ? 'Manual' : 'Face',
            $this->cameraLabel($a->camera_source),
        ]);

        $uniqueMembers = $attendances->map(fn ($a) => $a->member_id ?? 'deleted:' . $a->member_name_snapshot)
            ->unique()
            ->count();

        // Average over the days in the range that have already happened.
        $rangeEnd = Carbon::parse($end)->min(Carbon::today());
        $daysInRange = max(1, Carbon::parse($start)->diffInDays($rangeEnd) + 1);
        $avgDailyVisits = round($totalCheckIns / $daysInRange, 1);

        $busiestHour = $attendances
            ->groupBy(fn ($a) => (int) substr((string) $a->time_in, 0, 2))
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();
        $busiestHourLabel = $busiestHour === null
            ? 'No check-ins'
            : Carbon::createFromTime($busiestHour)->format('g A') . ' - '
                . Carbon::createFromTime($busiestHour)->addHour()->format('g A');

        return response()->json([
            'Payments' => [
                'kpis' => [
                    ['label' => 'Total Income',  'value' => '₱ ' . $this->formatAmount($totalIncome),   'trend' => 'Live'],
                    ['label' => 'Refunds',        'value' => '₱ ' . $this->formatAmount(abs($refunds)),  'trend' => 'Live'],
                    ['label' => 'Net Revenue',    'value' => '₱ ' . $this->formatAmount($netRevenue),    'trend' => 'Live'],
                ],
                'columns' => ['Txn ID', 'Date', 'Member Details', 'Details', 'Method', 'Amount', 'Payment Status'],
                'rows'    => $paymentRows,
            ],
            'Memberships' => [
                'kpis' => [
                    ['label' => 'New Signups',   'value' => (string) $newSignups,   'trend' => 'Live'],
                    ['label' => 'Total Active',  'value' => (string) $activeCount,  'trend' => 'Live'],
                    ['label' => 'Total Expired', 'value' => (string) $expiredCount, 'trend' => 'Live'],
                    ['label' => 'Total Check-ins', 'value' => (string) $totalCheckIns, 'trend' => 'Live'],
                ],
                'columns' => ['Member Details', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
                'rows'    => $membershipRows,
            ],
            'Attendance' => [
                'kpis' => [
                    ['label' => 'Total Check-ins',   'value' => (string) $totalCheckIns,   'trend' => 'Live'],
                    ['label' => 'Unique Members',    'value' => (string) $uniqueMembers,   'trend' => 'Live'],
                    ['label' => 'Avg. Daily Visits', 'value' => (string) $avgDailyVisits,  'trend' => 'Live'],
                    ['label' => 'Busiest Hour',      'value' => $busiestHourLabel,         'trend' => 'Live'],
                ],
                'columns' => ['Date / Time', 'Member Details', 'Plan', 'Subscription Status', 'Method', 'Camera'],
                'rows'    => $attendanceRows,
            ],
        ]);
    }

    private function cameraLabel(?string $source): string
    {
        return match ($source) {
            'cctv' => 'CCTV 1',
            'cctv_2' => 'CCTV 2',
            'cctv_3' => 'CCTV 3',
            'webcam' => 'Webcam',
            'phone' => 'Phone Camera',
            null, '' => '-',
            default => $source,
        };
    }

    private function formatAmount(float|int|string $amount): string
    {
        return rtrim(rtrim(number_format((float) $amount, 2, '.', ','), '0'), '.');
    }
}
