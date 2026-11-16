<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Program Monitoring: the camera now counts repetitions for the selected
 * exercises, and each verified task records who verified it and when.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workout_logs', function (Blueprint $table) {
            // Repetitions counted by the camera (null = not counted).
            $table->unsignedSmallInteger('counted_reps')->nullable()->after('reps');
            // 'ai' (camera) or 'coach' (manual verification).
            $table->string('verified_by', 10)->nullable()->after('gesture_class');
            $table->timestamp('verified_at')->nullable()->after('verified_by');
        });
    }

    public function down(): void
    {
        Schema::table('workout_logs', function (Blueprint $table) {
            $table->dropColumn(['counted_reps', 'verified_by', 'verified_at']);
        });
    }
};
