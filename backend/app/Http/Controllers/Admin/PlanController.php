<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gym\PackageCategory;
use App\Models\Gym\Plan;
use App\Models\Member\Membership;
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
            'duration_days' => 'required|integer|min:1|max:3650',
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
    //
    // A package that members are still subscribed to cannot be deleted: their
    // subscriptions would lose their package (and, for a With Coach package,
    // the member would stop being tracked by the Gesture Monitor). Once those
    // subscriptions have ended, the package can go; ended subscriptions keep
    // the package name saved on them.
    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);

        $running = Membership::query()
            ->where(function ($query) use ($plan) {
                $query->where('plan_id', $plan->id)
                    ->orWhere(function ($legacy) use ($plan) {
                        $legacy->whereNull('plan_id')->where('plan_type', $plan->name);
                    });
            })
            ->where('status', 'Active')
            ->whereDate('end_date', '>=', today())
            ->count();

        if ($running > 0) {
            return response()->json([
                'message' => $running === 1
                    ? "“{$plan->name}” cannot be deleted: 1 member is still subscribed to it. Delete it after that subscription ends."
                    : "“{$plan->name}” cannot be deleted: {$running} members are still subscribed to it. Delete it after those subscriptions end.",
                'running_subscriptions' => $running,
            ], 422);
        }

        $plan->delete();
        return response()->json(['message' => 'Plan deleted!']);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => ['required', 'numeric', 'min:0', 'max:9999999.99', 'regex:/^\d+(?:\.\d{1,2})?$/'],
            'duration_days' => 'required|integer|min:1|max:3650',
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
