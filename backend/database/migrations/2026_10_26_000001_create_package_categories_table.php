<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('color', 7);
            $table->timestamps();
        });

        DB::table('plans')
            ->where(function ($query) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%walk%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%daily%']);
            })
            ->update(['category' => 'walk_in', 'category_detail' => null]);

        DB::table('plans')
            ->where('category', 'other')
            ->whereNotNull('category_detail')
            ->update(['category_detail' => DB::raw('TRIM(category_detail)')]);

        $existingCategories = DB::table('plans')
            ->where('category', 'other')
            ->whereNotNull('category_detail')
            ->select('category_detail')
            ->distinct()
            ->get();

        $seenNames = [];
        foreach ($existingCategories as $category) {
            $name = trim($category->category_detail);
            $normalizedName = mb_strtolower($name);
            if ($name === '' || isset($seenNames[$normalizedName])) {
                continue;
            }
            $seenNames[$normalizedName] = true;
            $planColor = DB::table('plans')
                ->where('category', 'other')
                ->whereRaw('LOWER(TRIM(category_detail)) = ?', [$normalizedName])
                ->whereNotNull('color')
                ->value('color');

            DB::table('package_categories')->insert([
                'name' => $name,
                'color' => $planColor ?: '#3b82f6',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('plans')
                ->where('category', 'other')
                ->whereRaw('LOWER(TRIM(category_detail)) = ?', [$normalizedName])
                ->update(['category_detail' => $name]);
        }
    }

    public function down(): void
    {
        DB::table('plans')
            ->where('category', 'walk_in')
            ->update(['category' => 'normal']);

        Schema::dropIfExists('package_categories');
    }
};
