<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gym\CoachEvent;
use App\Models\Gym\CoachEventCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CoachEventController extends Controller
{
    public function index()
    {
        return response()->json(
            CoachEvent::with('category')->orderBy('start_date')->orderBy('start_time')->get()
        );
    }

    public function categories()
    {
        return response()->json(
            CoachEventCategory::withCount('events')->orderBy('name')->get()
        );
    }

    public function updateCategory(Request $request, $id)
    {
        $category = CoachEventCategory::findOrFail($id);
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $validated = $request->validate([
            'name' => 'required|string|max:80|unique:coach_event_categories,name,' . $category->id,
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $validated['name'] = trim($validated['name']);
        $category->update($validated);

        return response()->json($category->loadCount('events'));
    }

    public function destroyCategory($id)
    {
        $category = CoachEventCategory::findOrFail($id);
        if ($category->events()->exists()) {
            return response()->json([
                'message' => 'This category is assigned to coach events. Reassign or delete those events before deleting the category.',
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Coach event category deleted successfully.']);
    }

    public function store(Request $request)
    {
        $validated = $this->validateEvent($request);

        $event = DB::transaction(function () use ($validated) {
            $category = $this->saveCategory($validated['category'], $validated['color']);
            $event = CoachEvent::create($this->eventAttributes($validated, $category));

            return $event->load('category');
        });

        return response()->json($event, 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $this->validateEvent($request);

        $event = DB::transaction(function () use ($validated, $id) {
            $category = $this->saveCategory($validated['category'], $validated['color']);
            $event = CoachEvent::findOrFail($id);
            $event->update($this->eventAttributes($validated, $category));

            return $event->load('category');
        });

        return response()->json($event);
    }

    public function destroy($id)
    {
        CoachEvent::findOrFail($id)->delete();

        return response()->json(['message' => 'Coach event deleted successfully.']);
    }

    private function validateEvent(Request $request): array
    {
        $request->merge(['category' => trim((string) $request->input('category'))]);

        return $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'category' => 'required|string|max:80',
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'location' => 'required|string|max:255',
        ]);
    }

    private function saveCategory(string $name, string $color): CoachEventCategory
    {
        $normalizedName = trim($name);
        $category = CoachEventCategory::whereRaw('LOWER(name) = ?', [mb_strtolower($normalizedName)])->first();

        if ($category) {
            $category->update(['color' => $color]);
            return $category;
        }

        return CoachEventCategory::create(['name' => $normalizedName, 'color' => $color]);
    }

    private function eventAttributes(array $validated, CoachEventCategory $category): array
    {
        return [
            'category_id' => $category->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'location' => $validated['location'],
        ];
    }
}
