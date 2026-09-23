<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add membership_id to transactions so each receipt can be linked
     * to its exact subscription period, preventing date confusion when
     * a member renews and old receipts show the newest subscription dates.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('membership_id')->nullable()->after('member_id');
            $table->foreign('membership_id')->references('id')->on('memberships')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['membership_id']);
            $table->dropColumn('membership_id');
        });
    }
};
