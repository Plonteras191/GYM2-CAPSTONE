<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The member's weekly training plan as a template (which exercises on which
 * weekday). Daily tasks for the coming 7 days are created from it, so the plan
 * repeats every week instead of running out after one week.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workout_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('weekday'); // 1 = Monday … 7 = Sunday (ISO)
            $table->string('exercise');
            $table->unsignedSmallInteger('sets');
            $table->unsignedSmallInteger('reps');
            $table->string('gesture_class')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['member_id', 'weekday']);
        });

        // Plans saved before this change only exist as dated tasks. Turn the
        // upcoming week's tasks into a template so those plans keep repeating.
        $today = Carbon::today();
        $prefix = 'ASSIGNED: ';
        DB::table('workout_logs')
            ->whereNotNull('member_id')
            ->whereBetween('date', [$today->toDateString(), $today->copy()->addDays(6)->toDateString()])
            ->where('exercise', 'like', $prefix . '%')
            ->orderBy('id')
            ->get()
            ->groupBy('member_id')
            ->each(function ($tasks, $memberId) use ($prefix) {
                $position = 0;
                foreach ($tasks as $task) {
                    DB::table('workout_plan_items')->insert([
                        'member_id' => $memberId,
                        'weekday' => Carbon::parse($task->date)->dayOfWeekIso,
                        'exercise' => substr($task->exercise, strlen($prefix)),
                        'sets' => $task->sets ?: 3,
                        'reps' => $task->reps ?: 10,
                        'gesture_class' => $task->gesture_class,
                        'position' => $position++,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('workout_plan_items');
    }
};
