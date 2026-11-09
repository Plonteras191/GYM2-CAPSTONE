<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Membership;
use App\Models\Member\Member;
use App\Models\Member\Transaction;
use App\Models\Gym\Plan;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MembershipController extends Controller
{
    public function index()
    {
        $memberships = Membership::with(['member:id,first_name,last_name,email,profile_pic', 'plan'])
            ->withSum(['transactions as amount_paid' => function ($query) {
                $query->where('status', 'Complete')
                    ->where('type', '!=', 'Refund')
                    ->where('amount', '>', 0);
            }], 'amount')
            ->withExists(['transactions as has_upgraded' => function ($query) {
                $query->where('type', 'Subscription Upgrade')
                    ->where('status', 'Complete');
            }])
            ->whereNotNull('member_id')
            ->orderBy('created_at', 'desc')
            ->get();

        $memberships->each(function (Membership $membership) {
            if ($membership->status === 'Active' && $membership->end_date < today()->toDateString()) {
                $membership->status = 'Expired';
            }
        });

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

        $activeMembership = Membership::query()
            ->where('member_id', $validatedData['member_id'])
            ->where('status', 'Active')
            ->whereDate('end_date', '>=', today())
            ->first();
        if ($activeMembership) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'member_id' => ['This member already has an active subscription. Upgrade the existing subscription instead.'],
            ]);
        }

        $membership = Membership::create($validatedData);
        Membership::where('member_id', $validatedData['member_id'])
            ->where('id', '!=', $membership->id)
            ->where('status', 'Active')
            ->update(['status' => 'Expired']);

        // 🚨 CAPSTONE RULE: Auto-Update the Member's Profile Plan & Status!
        $member = Member::find($request->member_id);
        $memberNameSnapshot = $member ? trim($member->first_name . ' ' . $member->last_name) : null;
        $membership->update([
            'member_name_snapshot' => $memberNameSnapshot,
            'member_profile_pic_snapshot' => $member?->profile_pic,
            'member_email_snapshot' => $member?->email,
        ]);
        if ($member) {
            $member->update([
                'plan' => $validatedData['plan_type'],
                'status' => 'Active'
            ]);
        }

        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $isDailyPlan = str_contains(strtolower($validatedData['plan_type']), 'daily');
        
        Transaction::create([
            'transaction_id' => 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT),
            'transaction_date' => $validatedData['start_date'],
            'member_id' => $request->member_id,
            'member_name_snapshot' => $memberNameSnapshot,
            'member_profile_pic_snapshot' => $member?->profile_pic,
            'member_email_snapshot' => $member?->email,
            'membership_id' => $membership->id,  // Link to exact subscription period
            'type' => $isDailyPlan ? 'Walk-in Guest' : 'Subscription Payment',
            'description' => $isDailyPlan ? 'Walk-in Guest' : $validatedData['plan_type'] . ' Plan Payment',
            'payment_method' => $request->payment_method,
            'amount' => $request->amount ?? ($plan ? $plan->price : 0),
            'package_name_snapshot' => $plan?->name ?: $validatedData['plan_type'],
            'package_category_snapshot' => $plan?->category,
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
            ,'reference_number' => 'nullable|string'
        ]);

        $oldPlan = $membership->plan;
        $newPlan = null;
        if (!empty($request->plan_id)) {
            $newPlan = Plan::find($request->plan_id);
            if ($newPlan) {
                $validatedData['plan_id'] = $newPlan->id;
                $validatedData['plan_type'] = $newPlan->name;
            }
        } elseif (!empty($request->plan_type)) {
            $newPlan = Plan::where('name', $request->plan_type)->first();
            if ($newPlan) {
                $validatedData['plan_id'] = $newPlan->id;
                $validatedData['plan_type'] = $newPlan->name;
            }
        }

        if ($newPlan && $membership->plan_id !== $newPlan->id && $membership->status === 'Active') {
            return DB::transaction(function () use ($membership, $newPlan, $validatedData, $request, $oldPlan) {
                $membership = Membership::whereKey($membership->id)->lockForUpdate()->firstOrFail();
                $oldPlan = $membership->plan;
                $oldPlanName = $oldPlan?->name ?: $membership->plan_type;
                if ($oldPlan && (float) $newPlan->price <= (float) $oldPlan->price) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'plan_id' => ['Choose a higher-priced package to upgrade this subscription.'],
                    ]);
                }

                $paid = (float) Transaction::where('membership_id', $membership->id)
                    ->where('type', '!=', 'Refund')
                    ->where('status', 'Complete')
                    ->where('amount', '>', 0)
                    ->sum('amount');
                $difference = max(0, (float) $newPlan->price - $paid);
                $upgradeStartDate = today();
                $membership->update([
                    'plan_id' => $newPlan->id,
                    'plan_type' => $newPlan->name,
                    'start_date' => $upgradeStartDate->toDateString(),
                    'end_date' => $upgradeStartDate->copy()->addDays($newPlan->duration_days ?: 30)->toDateString(),
                    'status' => 'Active',
                    'payment_method' => $request->payment_method ?? $membership->payment_method,
                    'color' => $validatedData['color'] ?? $membership->color,
                    'notes' => $validatedData['notes'] ?? $membership->notes,
                ]);
                if ($membership->member_id) {
                    Member::whereKey($membership->member_id)->update([
                        'plan' => $newPlan->name,
                        'status' => 'Active',
                    ]);
                    Membership::where('member_id', $membership->member_id)
                        ->where('id', '!=', $membership->id)
                        ->where('status', 'Active')
                        ->update(['status' => 'Expired']);
                }

                $latest = Transaction::latest('id')->first();
                Transaction::create([
                    'transaction_id' => 'TXN-' . str_pad(($latest?->id ?? 0) + 1, 3, '0', STR_PAD_LEFT),
                    'transaction_date' => today()->toDateString(),
                    'member_id' => $membership->member_id,
                    'member_name_snapshot' => $membership->member_name_snapshot,
                    'member_email_snapshot' => $membership->member_email_snapshot,
                    'membership_id' => $membership->id,
                    'type' => 'Subscription Upgrade',
                    'description' => 'Upgrade from ' . $oldPlanName . ' to ' . $newPlan->name,
                    'payment_method' => $request->payment_method ?? $membership->payment_method,
                    'amount' => $difference,
                    'package_name_snapshot' => $newPlan->name,
                    'package_category_snapshot' => $newPlan->category,
                    'status' => 'Complete',
                    'reference_number' => $request->reference_number,
                ]);
                return response()->json([
                    'message' => 'Subscription upgraded. Only the remaining balance was charged.',
                    'amount_charged' => $difference,
                    'membership' => $membership->fresh()->load('plan'),
                ]);
            });
        }

        $membership->update($validatedData);
        if ($membership->member_id && $membership->status === 'Active') {
            Membership::where('member_id', $membership->member_id)
                ->where('id', '!=', $membership->id)
                ->where('status', 'Active')
                ->update(['status' => 'Expired']);
        }
        return response()->json(['message' => 'Subscription updated successfully', 'membership' => $membership->load('plan')]);
    }

    public function destroy($id)
    {
        $membership = Membership::findOrFail($id);
        $membership->delete();
        return response()->json(['message' => 'Subscription deleted successfully']);
    }
}
