<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('transactions', 'member_profile_pic_snapshot')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->string('member_profile_pic_snapshot')->nullable()->after('member_name_snapshot');
            });
        }

        if (!Schema::hasColumn('memberships', 'member_profile_pic_snapshot')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->string('member_profile_pic_snapshot')->nullable()->after('member_name_snapshot');
            });
        }

        DB::table('transactions')
            ->join('members', 'transactions.member_id', '=', 'members.id')
            ->select(
                'transactions.id as transaction_row_id',
                'transactions.member_profile_pic_snapshot',
                'members.profile_pic'
            )
            ->orderBy('transactions.id')
            ->chunk(100, function ($rows) {
                foreach ($rows as $row) {
                    if ($row->member_profile_pic_snapshot === null && $row->profile_pic) {
                        DB::table('transactions')
                            ->where('id', $row->transaction_row_id)
                            ->update(['member_profile_pic_snapshot' => $row->profile_pic]);
                    }
                }
            });

        DB::table('memberships')
            ->join('members', 'memberships.member_id', '=', 'members.id')
            ->select(
                'memberships.id as membership_row_id',
                'memberships.member_profile_pic_snapshot',
                'members.profile_pic'
            )
            ->orderBy('memberships.id')
            ->chunk(100, function ($rows) {
                foreach ($rows as $row) {
                    if ($row->member_profile_pic_snapshot === null && $row->profile_pic) {
                        DB::table('memberships')
                            ->where('id', $row->membership_row_id)
                            ->update(['member_profile_pic_snapshot' => $row->profile_pic]);
                    }
                }
            });
    }

    public function down(): void
    {
        if (Schema::hasColumn('transactions', 'member_profile_pic_snapshot')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropColumn('member_profile_pic_snapshot');
            });
        }

        if (Schema::hasColumn('memberships', 'member_profile_pic_snapshot')) {
            Schema::table('memberships', function (Blueprint $table) {
                $table->dropColumn('member_profile_pic_snapshot');
            });
        }
    }
};
