<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class WorkoutPlanFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('plan')->default('None');
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->string('exercise');
            $table->date('date');
            $table->unsignedSmallInteger('sets')->nullable();
            $table->unsignedSmallInteger('reps')->nullable();
            $table->string('gesture_class')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_gesture_detection_completes_the_members_scheduled_workout(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');

        $member = Member::create([
            'first_name' => 'Test',
            'last_name' => 'Member',
            'email' => 'workout-flow@example.test',
            'phone' => '0000000000',
        ]);

        $this->postJson("/api/members/{$member->id}/workout-plan", [
            'tasks' => [[
                'exercise' => 'Barbell Full Squat',
                'sets' => 3,
                'reps' => 10,
                'date' => Carbon::today()->toDateString(),
                'gesture_class' => 'SQUAT',
            ]],
        ])->assertOk()->assertJson(['task_count' => 1]);

        $this->getJson("/api/members/{$member->id}/workout-plan")
            ->assertOk()
            ->assertJsonFragment([
                'exercise' => 'ASSIGNED: BARBELL FULL SQUAT',
                'sets' => 3,
                'reps' => 10,
                'gesture_class' => 'SQUAT',
            ]);

        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'name' => 'Test Member',
            'event' => 'Pending AI verification · BARBELL FULL SQUAT · 3 sets x 10 reps',
        ]);

        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SQUAT',
        ])->assertOk()->assertJson(['status' => 'logged']);

        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $member->id,
            'exercise' => 'BARBELL FULL SQUAT',
            'date' => Carbon::today()->toDateString(),
            'sets' => 3,
            'reps' => 10,
            'gesture_class' => 'SQUAT',
        ]);

        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'name' => 'Test Member',
            'event' => 'AI detected · BARBELL FULL SQUAT · 3 sets x 10 reps',
        ]);
    }

    public function test_ambiguous_gesture_class_does_not_verify_an_arbitrary_exercise(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');

        $member = Member::create([
            'first_name' => 'Test',
            'last_name' => 'Member',
            'email' => 'ambiguous-workout@example.test',
            'phone' => '0000000000',
        ]);

        $this->postJson("/api/members/{$member->id}/workout-plan", [
            'tasks' => [
                ['exercise' => 'Barbell Full Squat', 'sets' => 3, 'reps' => 10, 'date' => Carbon::today()->toDateString(), 'gesture_class' => 'SQUAT'],
                ['exercise' => 'Bodyweight Squat', 'sets' => 2, 'reps' => 12, 'date' => Carbon::today()->toDateString(), 'gesture_class' => 'SQUAT'],
            ],
        ])->assertOk();

        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SQUAT',
        ])->assertStatus(409)->assertJson(['status' => 'ambiguous']);

        $this->assertDatabaseCount('workout_logs', 2);
        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $member->id,
            'exercise' => 'ASSIGNED: BARBELL FULL SQUAT',
            'gesture_class' => 'SQUAT',
        ]);
    }
}