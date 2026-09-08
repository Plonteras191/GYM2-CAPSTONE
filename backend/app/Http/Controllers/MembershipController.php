<?php

namespace App\Http\Controllers;

use App\Models\Membership; 
use App\Models\Transaction;
use Illuminate\Http\Request;

class MembershipController extends Controller
{
    public function index()
    {
        $memberships = Membership::with('member:id,first_name,last_name')->orderBy('created_at', 'desc')->get();
        return response()->json($memberships);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'member_id' => 'required|exists:members,id',
            'plan_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'status' => 'required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'required|string',
            'color' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        $membership = Membership::create($validatedData);

        // 🚨 CAPSTONE RULE: Auto-Update the Member's Profile Plan & Status!
        $member = \App\Models\Member::find($request->member_id);
        if ($member) {
            $member->update([
                'plan' => $request->plan_type,
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
            'description' => $request->plan_type . ' Auto-Billed',
            'payment_method' => $request->payment_method,
            'amount' => $request->amount,
            'status' => 'Complete',
            'reference_number' => $request->reference_number
        ]);

        return response()->json(['message' => 'Subscription and Transaction created', 'membership' => $membership], 201);
    }

    public function update(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);

        $validatedData = $request->validate([
            'plan_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'status' => 'required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'required|string',
            'color' => 'required|string',
            'notes' => 'nullable|string'
        ]);

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