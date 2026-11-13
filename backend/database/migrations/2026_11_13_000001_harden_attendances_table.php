<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Makes attendance records reliable and auditable:
 * - one check-in per member per day is enforced by the database,
 * - each record says how it was made and what the member's subscription
 *   was at that moment,
 * - records survive the deletion of the member (name snapshot).
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Merge existing duplicates: keep the earliest check-in per member per day.
        $duplicates = DB::table('attendances')
            ->select('member_id', 'date')
            ->groupBy('member_id', 'date')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            $keepId = DB::table('attendances')
                ->where('member_id', $duplicate->member_id)
                ->where('date', $duplicate->date)
                ->orderBy('time_in')
                ->orderBy('id')
                ->value('id');

            DB::table('attendances')
                ->where('member_id', $duplicate->member_id)
                ->where('date', $duplicate->date)
                ->where('id', '!=', $keepId)
                ->delete();
        }

        // 2. Audit columns.
        Schema::table('attendances', function (Blueprint $table) {
            $table->string('member_name_snapshot')->nullable()->after('member_id');
            $table->string('source', 20)->default('face')->after('time_in');
            $table->string('camera_source', 30)->nullable()->after('source');
            $table->decimal('match_distance', 5, 4)->nullable()->after('camera_source');
            $table->string('subscription_status', 20)->nullable()->after('match_distance');
            $table->string('plan_snapshot')->nullable()->after('subscription_status');
            $table->boolean('reactivated')->default(false)->after('plan_snapshot');
            $table->unsignedBigInteger('recorded_by_admin_id')->nullable()->after('reactivated');
            $table->string('reason')->nullable()->after('recorded_by_admin_id');
        });

        // 3. Name snapshot for existing rows, so history survives member deletion.
        DB::table('attendances')
            ->join('members', 'attendances.member_id', '=', 'members.id')
            ->select('attendances.id as attendance_id', 'members.first_name', 'members.last_name')
            ->orderBy('attendances.id')
            ->chunk(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('attendances')
                        ->where('id', $row->attendance_id)
                        ->update(['member_name_snapshot' => trim($row->first_name . ' ' . $row->last_name)]);
                }
            });

        // 4. Keep attendance when a member is deleted (was: cascade delete).
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
            $table->foreignId('member_id')->nullable()->change();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
        });

        // 5. One check-in per member per day, enforced by the database.
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['member_id', 'date'], 'attendances_member_date_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_member_date_unique');
        });

        DB::table('attendances')->whereNull('member_id')->delete();

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('member_id')->nullable(false)->change();
            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->dropColumn([
                'member_name_snapshot', 'source', 'camera_source', 'match_distance',
                'subscription_status', 'plan_snapshot', 'reactivated',
                'recorded_by_admin_id', 'reason',
            ]);
        });
    }
};
