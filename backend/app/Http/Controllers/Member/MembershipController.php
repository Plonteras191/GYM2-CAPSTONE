<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Membership;
use App\Models\Member\Member;
use App\Models\Member\Transaction;
use App\Models\Gym\Plan;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MembershipController extends Controller
{
    public function index()
    {
        $memberships = Membership::with(['member:id,first_name,last_name', 'plan'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($memberships);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'member_id' => 'required|exists:members,id',
            'plan_id' => 'nullable|exists:plans,id',
            'plan_type' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'status' => 'required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'required|string',
            'color' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        // If plan_id is provided, resolve Plan catalog entity & auto-calculate end_date if missing
        $plan = null;
        if (!empty($request->plan_id)) {
            $plan = Plan::find($request->plan_id);
        } elseif (!empty($request->plan_type)) {
            $plan = Plan::where('name', $request->plan_type)->first();
        }

        if ($plan) {
            $validatedData['plan_id'] = $plan->id;
            $validatedData['plan_type'] = $plan->name;
            if (empty($validatedData['end_date']) && $plan->duration_days) {
                $validatedData['end_date'] = Carbon::parse($request->start_date)->addDays($plan->duration_days)->toDateString();
            }
        }

        // Fallback for end_date if still missing
        if (empty($validatedData['end_date'])) {
            $validatedData['end_date'] = Carbon::parse($request->start_date)->addDays(30)->toDateString();
        }

        // Fallback for plan_type if missing
        if (empty($validatedData['plan_type'])) {
            $validatedData['plan_type'] = 'General Pass';
        }

        $membership = Membership::create($validatedData);

        // 🚨 CAPSTONE RULE: Auto-Update the Member's Profile Plan & Status!
        $member = Member::find($request->member_id);
        if ($member) {
            $member->update([
                'plan' => $validatedData['plan_type'],
                'status' => 'Active'
            ]);
        }

        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        
        Transaction::create([
            'transaction_id' => 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT),
            'transaction_date' => now()->toDateString(),
            'member_id' => $request->member_id,
            'type' => 'Subscription Payment',
            'description' => $validatedData['plan_type'] . ' Auto-Billed',
            'payment_method' => $request->payment_method,
            'amount' => $request->amount ?? ($plan ? $plan->price : 0),
            'status' => 'Complete',
            'reference_number' => $request->reference_number
        ]);

        return response()->json(['message' => 'Subscription and Transaction created', 'membership' => $membership], 201);
    }

    public function update(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);

        $validatedData = $request->validate([
            'plan_id' => 'nullable|exists:plans,id',
            'plan_type' => 'sometimes|required|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'sometimes|required|string',
            'color' => 'sometimes|required|string',
            'notes' => 'nullable|string'
        ]);

        if (!empty($request->plan_id)) {
            $plan = Plan::find($request->plan_id);
            if ($plan) {
                $validatedData['plan_type'] = $plan->name;
            }
        }

        $membership->update($validatedData);
        return response()->json(['message' => 'Subscription updated successfully', 'membership' => $membership]);
    }

    public function destroy($id)
    {
        $membership = Membership::findOrFail($id);
        $membership->delete();
        return response()->json(['message' => 'Subscription deleted successfully']);
    }
}
