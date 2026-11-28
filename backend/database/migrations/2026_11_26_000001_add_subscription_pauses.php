<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Muscle Bros.ph does not refund. Instead an admin can pause a subscription and
 * resume it later; the days spent paused are added to its end date.
 *
 * - memberships.paused_at: the day the current pause started (null when not paused).
 *   A paused subscription has status "Paused".
 * - membership_pauses: one row per pause, kept as history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->date('paused_at')->nullable()->after('status');
        });

        Schema::create('membership_pauses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_id')->constrained('memberships')->cascadeOnDelete();
            $table->date('paused_on');
            $table->date('resumed_on')->nullable();
            $table->unsignedInteger('days')->nullable();
            $table->unsignedBigInteger('paused_by_admin_id')->nullable();
            $table->unsignedBigInteger('resumed_by_admin_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_pauses');

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropColumn('paused_at');
        });
    }
};
