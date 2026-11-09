<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gym\PackageCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PackageCategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            PackageCategory::withCount('plans')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:package_categories,name',
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
        $this->ensureCaseInsensitiveUniqueName($validated['name']);

        $category = PackageCategory::create($validated);

        return response()->json($category->loadCount('plans'), 201);
    }

    public function update(Request $request, $id)
    {
        $category = PackageCategory::findOrFail($id);
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:package_categories,name,' . $category->id,
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
        $this->ensureCaseInsensitiveUniqueName($validated['name'], $category->id);

        DB::transaction(function () use ($category, $validated) {
            DB::table('plans')
                ->where('category', 'other')
                ->where('category_detail', $category->name)
                ->update([
                    'category_detail' => $validated['name'],
                    'color' => $validated['color'],
                ]);

            $category->update($validated);
        });

        return response()->json($category->fresh()->loadCount('plans'));
    }

    public function destroy($id)
    {
        $category = PackageCategory::findOrFail($id);
        if ($category->plans()->exists()) {
            return response()->json([
                'message' => 'This category is assigned to packages. Reassign or delete those packages before deleting the category.',
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Package category deleted successfully.']);
    }

    private function ensureCaseInsensitiveUniqueName(string $name, ?int $exceptId = null): void
    {
        $query = PackageCategory::whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages([
                'name' => 'A package category with this name already exists.',
            ]);
        }
    }
}
