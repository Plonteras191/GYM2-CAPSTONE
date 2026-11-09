<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // The memberships table may already have plan_id (created by the
        // 2026_07_10 migration), so only add it when missing.
        if (!Schema::hasColumn('memberships', 'plan_id')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->unsignedBigInteger('plan_id')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            //
        });
    }
};
