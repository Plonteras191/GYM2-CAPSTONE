<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gym\PackageCategory;
use App\Models\Gym\Plan;
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
            'price' => ['required', 'numeric', 'min:0', 'max:9999999.99', 'regex:/^\d+(?:\.\d{1,2})?$/'],
            'duration_days' => 'required|integer',
            'category' => 'required|in:normal,with_coach,walk_in,other',
            'category_detail' => 'required_if:category,other|nullable|string|max:100',
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        if ($validated['category'] !== 'other') {
            $validated['category_detail'] = null;
        } else {
            $validated['category_detail'] = trim($validated['category_detail']);
            $this->rememberCustomCategory($validated);
        }

        $plan = Plan::create($validated);
        return response()->json(['message' => 'Plan added successfully!', 'plan' => $plan]);
    }

    // 3. Delete a plan
    public function destroy($id)
    {
        Plan::findOrFail($id)->delete();
        return response()->json(['message' => 'Plan deleted!']);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => ['required', 'numeric', 'min:0', 'max:9999999.99', 'regex:/^\d+(?:\.\d{1,2})?$/'],
            'duration_days' => 'required|integer|min:1',
            'category' => 'required|in:normal,with_coach,walk_in,other',
            'category_detail' => 'required_if:category,other|nullable|string|max:100',
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        if ($validated['category'] !== 'other') {
            $validated['category_detail'] = null;
        } else {
            $validated['category_detail'] = trim($validated['category_detail']);
            $this->rememberCustomCategory($validated);
        }

        $plan = Plan::findOrFail($id);
        $plan->update($validated);

        return response()->json(['message' => 'Plan updated successfully!', 'plan' => $plan]);
    }

    private function rememberCustomCategory(array $validated): void
    {
        $exists = PackageCategory::whereRaw(
            'LOWER(name) = ?',
            [mb_strtolower($validated['category_detail'])]
        )->exists();

        if (!$exists) {
            PackageCategory::create([
                'name' => $validated['category_detail'],
                'color' => $validated['color'] ?? '#3b82f6',
            ]);
        }
    }

    // 4. Bulk update all prices from the Modal
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'plans' => 'required|array',
            'plans.*.id' => 'required|exists:plans,id',
            'plans.*.price' => ['required', 'numeric', 'min:0', 'max:9999999.99', 'regex:/^\d+(?:\.\d{1,2})?$/'],
            'plans.*.color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/']
        ]);

        foreach ($request->plans as $planData) {
            Plan::where('id', $planData['id'])->update([
                'price' => $planData['price'],
                'color' => $planData['color'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Plan prices updated successfully!']);
    }
}
