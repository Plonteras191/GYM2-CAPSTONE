<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a member's status was last set (by a check-in or by an admin).
 * The one-month inactivity rule gives a member a fresh month from this
 * moment, so a manual "Active" is not undone straight away.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->timestamp('status_updated_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('status_updated_at');
        });
    }
};
