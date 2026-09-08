<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    // 1. Get all plans
    public function index()
    {
        return response()->json(Plan::all());
    }

    // 2. Add a brand new plan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'duration_days' => 'required|integer'
        ]);

        $plan = Plan::create($validated);
        return response()->json(['message' => 'Plan added successfully!', 'plan' => $plan]);
    }

    // 3. Delete a plan
    public function destroy($id)
    {
        Plan::findOrFail($id)->delete();
        return response()->json(['message' => 'Plan deleted!']);
    }

    // 4. Bulk update all prices from the Modal
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'plans' => 'required|array',
            'plans.*.id' => 'required|exists:plans,id',
            'plans.*.price' => 'required|numeric'
        ]);

        foreach ($request->plans as $planData) {
            Plan::where('id', $planData['id'])->update(['price' => $planData['price']]);
        }

        return response()->json(['message' => 'Plan prices updated successfully!']);
    }
}