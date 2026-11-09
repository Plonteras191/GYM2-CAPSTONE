<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('member_name_snapshot')->nullable()->after('member_id');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->string('member_name_snapshot')->nullable()->after('member_id');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
            $table->foreignId('member_id')->nullable()->change();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });
        Schema::table('memberships', function (Blueprint $table) {
            $table->foreignId('member_id')->nullable(false)->change();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->dropColumn('member_name_snapshot');
        });
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('member_name_snapshot');
        });
    }
};
