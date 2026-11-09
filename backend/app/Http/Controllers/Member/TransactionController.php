<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Gym\Plan;
use App\Models\Member\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::select(
                'id', 'transaction_id', 'transaction_date', 'member_id', 'member_name_snapshot', 'member_profile_pic_snapshot', 'member_email_snapshot', 'membership_id',
                    'type', 'description', 'payment_method', 'amount', 'status', 'package_name_snapshot',
                    'package_category_snapshot',
                    'reference_number', 'created_at'
            )
            ->with([
                'member:id,first_name,last_name,email,profile_pic',
                'membership:id,plan_type,start_date,end_date'
                ,'membership.plan:id,name,category,category_detail'
            ])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();
        $plans = Plan::select('name', 'category', 'category_detail')->get();
        $transactions->each(function ($transaction) use ($plans) {
            if ($transaction->type === 'Refund') {
                $transaction->package_details = [
                    'title' => 'Refund Payment',
                    'category' => $transaction->description ?: 'Refund',
                ];
                return;
            }

            $plan = $transaction->membership?->plan;
            $planName = trim((string) ($transaction->package_name_snapshot ?: $plan?->name ?: $transaction->membership?->plan_type));
            if (!$plan && $planName === '') {
                $description = trim((string) $transaction->description);
                $plan = $plans->first(fn($item) => str_contains(strtolower($description), strtolower($item->name)));
                $planName = trim((string) ($plan?->name ?: $description));
            }

            $category = match ($transaction->package_category_snapshot ?: $plan?->category) {
                'with_coach' => 'With Coach Subscription',
                'walk_in' => 'Walk-In Package',
                'other' => $plan?->category_detail ?: 'Other / Custom',
                default => 'Normal Subscription',
            };
            $transaction->package_details = [
                'title' => ($planName ?: 'Unknown') . ' Package Payment'
                    . ($transaction->type === 'Subscription Upgrade' ? ' + Upgraded' : ''),
                'category' => $category,
            ];
        });
        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'transaction_date' => 'sometimes|date',
            'member_id' => 'nullable|exists:members,id',
            'membership_id' => 'nullable|exists:memberships,id',
            'plan_id' => 'required|exists:plans,id',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric|min:0|max:9999999.99',
            'reference_number' => 'nullable|string'
        ]);
        $validatedData['transaction_date'] = $validatedData['transaction_date'] ?? now()->toDateString();
        $plan = Plan::findOrFail($validatedData['plan_id']);
        $normalizedPlanName = mb_strtolower($plan->name);
        $validatedData['type'] = $plan->category === 'walk_in'
            ? 'Walk-In'
            : ($plan->category === 'other'
                ? 'Packages'
                : (str_contains($normalizedPlanName, 'walk') || str_contains($normalizedPlanName, 'daily')
                    ? 'Walk-In'
                    : 'Subscription'));
        unset($validatedData['plan_id']);
        $validatedData['status'] = 'Complete';
        $memberId = $validatedData['member_id'] ?? null;
        $member = $memberId ? \App\Models\Member\Member::find($memberId) : null;
        $validatedData['member_id'] = $memberId;
        $validatedData['member_name_snapshot'] = $member ? trim($member->first_name . ' ' . $member->last_name) : null;
        $validatedData['member_profile_pic_snapshot'] = $member?->profile_pic;
        $validatedData['member_email_snapshot'] = $member?->email;
        $validatedData['package_name_snapshot'] = $plan->name;
        $validatedData['package_category_snapshot'] = $plan->category;

        // Auto-generate the TXN-001 format
        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $validatedData['transaction_id'] = 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        $transaction = Transaction::create($validatedData);
        return response()->json(['message' => 'Transaction saved', 'transaction' => $transaction], 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);
        $validatedData = $request->validate([
            'transaction_date' => 'required|date',
            'member_id' => 'nullable|exists:members,id',
            'membership_id' => 'nullable|exists:memberships,id',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric|min:0|max:9999999.99',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        if (array_key_exists('member_id', $validatedData) && $validatedData['member_id']) {
            $member = \App\Models\Member\Member::findOrFail($validatedData['member_id']);
            $validatedData['member_name_snapshot'] = trim($member->first_name . ' ' . $member->last_name);
            $validatedData['member_profile_pic_snapshot'] = $member->profile_pic;
            $validatedData['member_email_snapshot'] = $member->email;
        }
        $transaction->update($validatedData);
        return response()->json(['message' => 'Transaction updated', 'transaction' => $transaction]);
    }

    public function destroy($id)
    {
        Transaction::findOrFail($id)->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }

    public function refund($id)
    {
        return DB::transaction(function () use ($id) {
            $transaction = Transaction::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($transaction->status !== 'Complete' || $transaction->type === 'Refund' || (float) $transaction->amount <= 0) {
                throw ValidationException::withMessages([
                    'transaction' => 'Only positive, completed transactions can be refunded.',
                ]);
            }

            $latest = Transaction::latest('id')->first();
            $nextId = $latest ? $latest->id + 1 : 1;

            $refund = Transaction::create([
                'transaction_id' => 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT),
                'transaction_date' => now()->toDateString(),
                'member_id' => $transaction->member_id,
                'member_name_snapshot' => $transaction->member_name_snapshot
                    ?: ($transaction->member ? trim($transaction->member->first_name . ' ' . $transaction->member->last_name) : null),
                'member_profile_pic_snapshot' => $transaction->member_profile_pic_snapshot ?: $transaction->member?->profile_pic,
                'member_email_snapshot' => $transaction->member_email_snapshot ?: $transaction->member?->email,
                'membership_id' => $transaction->membership_id,
                'type' => 'Refund',
                'description' => 'Refund for ' . $transaction->transaction_id,
                'payment_method' => $transaction->payment_method,
                'amount' => -abs((float) $transaction->amount),
                'package_name_snapshot' => $transaction->package_name_snapshot,
                'package_category_snapshot' => $transaction->package_category_snapshot,
                'status' => 'Complete',
                'reference_number' => null,
            ]);

            $transaction->update(['status' => 'Refunded']);

            return response()->json([
                'message' => 'Transaction refunded successfully.',
                'refund' => $refund,
            ], 201);
        });
    }
}
