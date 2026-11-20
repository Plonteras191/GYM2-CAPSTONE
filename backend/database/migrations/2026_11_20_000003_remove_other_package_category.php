<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The "Other / Custom" package category is retired: the gym sells Normal,
 * With Coach and Walk-In packages only. Any package still in "Other" becomes a
 * Normal package (or Walk-In when its name says walk-in/daily), and the custom
 * category list that only "Other" used is removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('plans')
            ->where('category', 'other')
            ->where(function ($query) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%walk%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%daily%']);
            })
            ->update(['category' => 'walk_in', 'category_detail' => null]);

        DB::table('plans')
            ->where('category', 'other')
            ->update(['category' => 'normal', 'category_detail' => null]);

        // Past sales keep their amounts; only the retired labels are updated.
        DB::table('transactions')->where('type', 'Packages')->update(['type' => 'Walk-In']);
        DB::table('transactions')->where('package_category_snapshot', 'other')->update(['package_category_snapshot' => 'normal']);

        Schema::dropIfExists('package_categories');
    }

    public function down(): void
    {
        // Packages moved out of "Other" are not moved back (the original
        // category is not kept); only the empty category table is restored.
        if (!Schema::hasTable('package_categories')) {
            Schema::create('package_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100)->unique();
                $table->string('color', 7);
                $table->timestamps();
            });
        }
    }
};
