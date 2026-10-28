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
                'id', 'transaction_id', 'transaction_date', 'member_id', 'membership_id',
                'type', 'description', 'payment_method', 'amount', 'status',
                'reference_number', 'created_at'
            )
            ->with([
                'member:id,first_name,last_name',
                'membership:id,plan_type,start_date,end_date'
            ])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();
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
            'amount' => 'required|numeric',
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
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

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
                'membership_id' => $transaction->membership_id,
                'type' => 'Refund',
                'description' => 'Refund for ' . $transaction->transaction_id,
                'payment_method' => $transaction->payment_method,
                'amount' => -abs((float) $transaction->amount),
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
