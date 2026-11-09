<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['transactions', 'memberships'] as $tableName) {
            if (!Schema::hasColumn($tableName, 'member_email_snapshot')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->string('member_email_snapshot')->nullable()->after('member_name_snapshot');
                });
            }
        }

        foreach (['transactions', 'memberships'] as $tableName) {
            DB::table($tableName)
                ->join('members', "{$tableName}.member_id", '=', 'members.id')
                ->select(
                    "{$tableName}.id as row_id",
                    "{$tableName}.member_email_snapshot",
                    'members.email'
                )
                ->orderBy("{$tableName}.id")
                ->chunk(200, function ($rows) use ($tableName) {
                    foreach ($rows as $row) {
                        if ($row->member_email_snapshot === null && $row->email !== null) {
                            DB::table($tableName)
                                ->where('id', $row->row_id)
                                ->update(['member_email_snapshot' => $row->email]);
                        }
                    }
                });
        }
    }

    public function down(): void
    {
        foreach (['transactions', 'memberships'] as $tableName) {
            if (Schema::hasColumn($tableName, 'member_email_snapshot')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('member_email_snapshot');
                });
            }
        }
    }
};
