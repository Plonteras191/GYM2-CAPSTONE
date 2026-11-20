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
        $this->actingAsAdmin()->withAiEngineToken();

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('plan')->default('None');
            $table->string('status')->default('Active');
            $table->timestamp('status_updated_at')->nullable();
            $table->string('profile_pic')->nullable();
            $table->longText('enrolled_face_id')->nullable();
            $table->timestamps();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->string('member_name_snapshot')->nullable();
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->string('plan_type');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('Active');
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->integer('duration_days');
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
            $table->timestamps();
        });

        Schema::create('package_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('color', 7);
            $table->timestamps();
        });

        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->string('exercise');
            $table->date('date');
            $table->unsignedSmallInteger('sets')->nullable();
            $table->unsignedSmallInteger('reps')->nullable();
            $table->unsignedSmallInteger('counted_reps')->nullable();
            $table->string('gesture_class')->nullable();
            $table->string('verified_by', 10)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('workout_plan_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->unsignedTinyInteger('weekday');
            $table->string('exercise');
            $table->unsignedSmallInteger('sets');
            $table->unsignedSmallInteger('reps');
            $table->string('gesture_class')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
    }

    private function createCoachMembership(Member $member, array $attributes = []): void
    {
        $planId = \Illuminate\Support\Facades\DB::table('plans')->insertGetId([
            'name' => 'With Coach',
            'price' => 2500,
            'duration_days' => 30,
            'category' => 'with_coach',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
        \Illuminate\Support\Facades\DB::table('memberships')->insert(array_merge([
            'member_id' => $member->id,
            'plan_id' => $planId,
            'plan_type' => 'With Coach',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'status' => 'Active',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ], $attributes));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        Schema::dropIfExists('package_categories');
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
        $this->createCoachMembership($member);

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

        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertJsonFragment([
                'member_id' => $member->id,
                'exercise' => 'ASSIGNED: BARBELL FULL SQUAT',
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
            'verified_by' => 'ai',
        ]);

        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertExactJson([]);

        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'name' => 'Test Member',
            'event' => 'AI detected · BARBELL FULL SQUAT · 3 sets x 10 reps',
        ]);
    }

    public function test_camera_rep_progress_is_saved_and_the_target_verifies_the_task(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');
        $member = Member::create([
            'first_name' => 'Rep',
            'last_name' => 'Counter',
            'email' => 'rep-counter@example.test',
            'phone' => '0000000006',
        ]);
        $this->createCoachMembership($member);
        $this->postJson("/api/members/{$member->id}/workout-plan", [
            'tasks' => [[
                'exercise' => 'Barbell Full Squat',
                'sets' => 2,
                'reps' => 3,
                'date' => Carbon::today()->toDateString(),
                'gesture_class' => 'SQUAT',
            ]],
        ])->assertOk();

        // The camera reports progress while the member is still working.
        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SQUAT',
            'counted_reps' => 4,
            'completed' => false,
        ])->assertOk()->assertJson(['status' => 'progress', 'counted_reps' => 4]);
        // A lower count (e.g. after an engine restart) never reduces it.
        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SQUAT',
            'counted_reps' => 2,
            'completed' => false,
        ])->assertOk()->assertJson(['status' => 'progress', 'counted_reps' => 4]);
        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $member->id,
            'exercise' => 'ASSIGNED: BARBELL FULL SQUAT',
            'counted_reps' => 4,
            'verified_by' => null,
        ]);

        // The engine learns the target and the saved count on its next refresh.
        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertJsonFragment(['member_id' => $member->id, 'sets' => 2, 'reps' => 3, 'counted_reps' => 4]);
        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'event' => 'Pending AI verification · BARBELL FULL SQUAT · 2 sets x 3 reps · 4 reps counted',
        ]);

        // Target reached: the task is verified with the final count.
        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SQUAT',
            'counted_reps' => 6,
        ])->assertOk()->assertJson(['status' => 'logged']);
        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $member->id,
            'exercise' => 'BARBELL FULL SQUAT',
            'counted_reps' => 6,
            'verified_by' => 'ai',
            'verified_at' => '2026-09-26 12:00:00',
        ]);
        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'event' => 'AI detected · BARBELL FULL SQUAT · 2 sets x 3 reps · 6 reps counted',
        ]);
    }

    public function test_coach_manual_verification_is_recorded(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');
        $member = Member::create([
            'first_name' => 'Manual',
            'last_name' => 'Verify',
            'email' => 'manual-verify@example.test',
            'phone' => '0000000007',
        ]);
        $this->createCoachMembership($member);
        $this->postJson("/api/members/{$member->id}/assign-task", [
            'exercise' => 'Plank',
            'sets' => 3,
            'reps' => 1,
        ])->assertOk();
        $task = \App\Models\Tracking\WorkoutLog::where('member_id', $member->id)->firstOrFail();

        $this->putJson("/api/workouts/{$task->id}/manual-verify")->assertOk();

        $this->assertDatabaseHas('workout_logs', [
            'id' => $task->id,
            'exercise' => 'PLANK',
            'verified_by' => 'coach',
            'verified_at' => '2026-09-26 12:00:00',
            'counted_reps' => null,
        ]);
        $this->getJson('/api/workouts/live')->assertOk()->assertJsonFragment([
            'event' => 'Coach verified · PLANK · 3 sets x 1 reps',
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
        $this->createCoachMembership($member);

        $this->postJson("/api/members/{$member->id}/workout-plan", [
            'tasks' => [
                ['exercise' => 'Barbell Full Squat', 'sets' => 3, 'reps' => 10, 'date' => Carbon::today()->toDateString(), 'gesture_class' => 'SQUAT'],
                ['exercise' => 'Bodyweight Squat', 'sets' => 2, 'reps' => 12, 'date' => Carbon::today()->toDateString(), 'gesture_class' => 'SQUAT'],
            ],
        ])->assertOk();

        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertJsonCount(2);

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

    public function test_ai_only_receives_face_and_workout_targets_for_active_coach_members(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');

        $coachMember = Member::create([
            'first_name' => 'Coach',
            'last_name' => 'Member',
            'email' => 'coach-member@example.test',
            'phone' => '0000000001',
            'enrolled_face_id' => '/faces/coach-member.png',
        ]);
        $regularMember = Member::create([
            'first_name' => 'Regular',
            'last_name' => 'Member',
            'email' => 'regular-member@example.test',
            'phone' => '0000000002',
            'enrolled_face_id' => '/faces/regular-member.png',
        ]);
        $walkInMember = Member::create([
            'first_name' => 'Walk In',
            'last_name' => 'Member',
            'email' => 'walk-in-member@example.test',
            'phone' => '0000000003',
            'enrolled_face_id' => '/faces/walk-in-member.png',
        ]);
        $this->createCoachMembership($coachMember);
        $regularPlanId = \Illuminate\Support\Facades\DB::table('plans')->insertGetId([
            'name' => 'Monthly',
            'price' => 600,
            'duration_days' => 30,
            'category' => 'normal',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
        \Illuminate\Support\Facades\DB::table('memberships')->insert([
            'member_id' => $regularMember->id,
            'plan_id' => $regularPlanId,
            'plan_type' => 'Monthly',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'status' => 'Active',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        foreach ([$coachMember, $regularMember, $walkInMember] as $member) {
            \App\Models\Tracking\WorkoutLog::create([
                'member_id' => $member->id,
                'exercise' => 'ASSIGNED: SIT UP',
                'date' => Carbon::today()->toDateString(),
                'sets' => 3,
                'reps' => 10,
                'gesture_class' => 'SIT UP',
            ]);
        }

        $this->getJson('/api/ai/members-faces')
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonFragment(['id' => $coachMember->id, 'workout_eligible' => true])
            ->assertJsonFragment(['id' => $regularMember->id, 'workout_eligible' => false])
            ->assertJsonFragment(['id' => $walkInMember->id, 'workout_eligible' => false]);

        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['member_id' => $coachMember->id]);

        $this->postJson('/api/ai/log-workout', [
            'member_id' => $regularMember->id,
            'exercise' => 'SIT UP',
        ])->assertForbidden()->assertJson(['status' => 'ineligible']);
        $this->postJson('/api/ai/log-workout', [
            'member_id' => $walkInMember->id,
            'exercise' => 'SIT UP',
        ])->assertForbidden()->assertJson(['status' => 'ineligible']);

        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $regularMember->id,
            'exercise' => 'ASSIGNED: SIT UP',
        ]);
        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $walkInMember->id,
            'exercise' => 'ASSIGNED: SIT UP',
        ]);
    }

    public function test_ai_excludes_expired_coach_memberships(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');
        $member = Member::create([
            'first_name' => 'Expired',
            'last_name' => 'Coach',
            'email' => 'expired-coach@example.test',
            'phone' => '0000000003',
            'enrolled_face_id' => '/faces/expired-coach.png',
        ]);
        $this->createCoachMembership($member, [
            'end_date' => Carbon::yesterday()->toDateString(),
        ]);
        \App\Models\Tracking\WorkoutLog::create([
            'member_id' => $member->id,
            'exercise' => 'ASSIGNED: SIT UP',
            'date' => Carbon::today()->toDateString(),
            'gesture_class' => 'SIT UP',
        ]);

        $this->getJson('/api/ai/members-faces')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['id' => $member->id, 'workout_eligible' => false]);
        $this->getJson('/api/ai/workout-plans')->assertOk()->assertExactJson([]);
        $this->postJson('/api/ai/log-workout', [
            'member_id' => $member->id,
            'exercise' => 'SIT UP',
        ])->assertForbidden()->assertJson(['status' => 'ineligible']);
    }

    public function test_coach_membership_stays_eligible_after_its_plan_is_deleted(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');
        $coachMember = Member::create([
            'first_name' => 'Deleted',
            'last_name' => 'CoachPlan',
            'email' => 'deleted-coach-plan@example.test',
            'phone' => '0000000004',
            'enrolled_face_id' => '/faces/deleted-coach-plan.png',
        ]);
        $regularMember = Member::create([
            'first_name' => 'Deleted',
            'last_name' => 'RegularPlan',
            'email' => 'deleted-regular-plan@example.test',
            'phone' => '0000000005',
            'enrolled_face_id' => '/faces/deleted-regular-plan.png',
        ]);
        $this->createCoachMembership($coachMember, ['plan_type' => 'Monthly With Coach']);
        $this->createCoachMembership($regularMember, ['plan_type' => 'Monthly']);
        // The admin deletes both plans; the memberships still point at them.
        \Illuminate\Support\Facades\DB::table('plans')->delete();
        \App\Models\Tracking\WorkoutLog::create([
            'member_id' => $coachMember->id,
            'exercise' => 'ASSIGNED: SIT UP',
            'date' => Carbon::today()->toDateString(),
            'gesture_class' => 'SIT UP',
        ]);

        $this->getJson('/api/ai/members-faces')
            ->assertOk()
            ->assertJsonFragment(['id' => $coachMember->id, 'workout_eligible' => true])
            ->assertJsonFragment(['id' => $regularMember->id, 'workout_eligible' => false]);
        $this->getJson('/api/ai/workout-plans')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['member_id' => $coachMember->id]);
    }

    public function test_custom_plan_requires_and_persists_an_explicit_category(): void
    {
        $this->postJson('/api/plans', [
            'name' => 'Premium Coaching',
            'price' => 3500,
            'duration_days' => 30,
            'category' => 'with_coach',
        ])->assertOk()->assertJsonPath('plan.category', 'with_coach');

        // The retired "Other / Custom" category is refused.
        $this->postJson('/api/plans', [
            'name' => 'Student Promo',
            'price' => 400,
            'duration_days' => 30,
            'category' => 'other',
            'category_detail' => 'Student Subscription',
        ])->assertUnprocessable()->assertJsonValidationErrors('category');

        $this->postJson('/api/plans', [
            'name' => 'Unclassified Plan',
            'price' => 100,
            'duration_days' => 1,
        ])->assertUnprocessable();
    }

    public function test_today_attendance_includes_the_members_profile_picture(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');

        $member = Member::create([
            'first_name' => 'Test',
            'last_name' => 'Member',
            'email' => 'attendance-photo@example.test',
            'phone' => '0000000000',
            'profile_pic' => '/profiles/test-member.jpg',
        ]);

        \App\Models\Tracking\Attendance::create([
            'member_id' => $member->id,
            'date' => Carbon::today()->toDateString(),
            'time_in' => '12:00:00',
        ]);

        $this->assertDatabaseHas('attendances', [
            'member_id' => $member->id,
            'date' => Carbon::today()->toDateString(),
        ]);

        $this->getJson('/api/attendance/today')
            ->assertOk()
            ->assertJsonFragment(['profile_pic' => '/profiles/test-member.jpg']);
    }

    public function test_today_attendance_includes_the_enrolled_face_image_when_no_profile_picture_exists(): void
    {
        Carbon::setTestNow('2026-09-26 12:00:00');

        $member = Member::create([
            'first_name' => 'Test',
            'last_name' => 'Member',
            'email' => 'attendance-face@example.test',
            'phone' => '0000000000',
            'enrolled_face_id' => '/faces/test-member.png',
        ]);

        \App\Models\Tracking\Attendance::create([
            'member_id' => $member->id,
            'date' => Carbon::today()->toDateString(),
            'time_in' => '12:00:00',
        ]);

        $this->getJson('/api/attendance/today')
            ->assertOk()
            ->assertJsonFragment([
                'profile_pic' => null,
                'enrolled_face_id' => '/faces/test-member.png',
            ]);
    }

    public function test_a_saved_weekly_plan_repeats_the_following_week(): void
    {
        Carbon::setTestNow('2026-11-16 09:00:00'); // a Monday
        $member = Member::create([
            'first_name' => 'Weekly', 'last_name' => 'Plan',
            'email' => 'weekly-plan@example.test', 'phone' => '0000000010',
        ]);
        $this->createCoachMembership($member);

        $this->postJson("/api/members/{$member->id}/workout-plan", ['tasks' => [
            ['exercise' => 'Push Up', 'sets' => 3, 'reps' => 12, 'date' => '2026-11-16', 'gesture_class' => 'PUSH UP'], // Monday
            ['exercise' => 'Plank', 'sets' => 2, 'reps' => 1, 'date' => '2026-11-19'],                                  // Thursday
        ]])->assertOk();

        $this->assertDatabaseCount('workout_plan_items', 2);

        // One week later the coach has not saved again, yet the plan is scheduled.
        Carbon::setTestNow('2026-11-23 08:00:00'); // next Monday
        $this->getJson("/api/members/{$member->id}/workout-plan")
            ->assertOk()
            ->assertJsonFragment(['exercise' => 'ASSIGNED: PUSH UP', 'date' => '2026-11-23', 'sets' => 3, 'reps' => 12])
            ->assertJsonFragment(['exercise' => 'ASSIGNED: PLANK', 'date' => '2026-11-26']);

        // Loading again does not create duplicates.
        $this->getJson("/api/members/{$member->id}/workout-plan")->assertOk();
        $this->assertSame(1, \App\Models\Tracking\WorkoutLog::where('member_id', $member->id)
            ->where('date', '2026-11-23')->where('exercise', 'ASSIGNED: PUSH UP')->count());

        // Saving an empty plan stops it from repeating.
        $this->postJson("/api/members/{$member->id}/workout-plan", ['tasks' => []])->assertOk();
        $this->assertDatabaseCount('workout_plan_items', 0);
    }

    public function test_the_daily_job_schedules_plans_without_anyone_opening_them(): void
    {
        Carbon::setTestNow('2026-11-16 09:00:00');
        $member = Member::create([
            'first_name' => 'Daily', 'last_name' => 'Job',
            'email' => 'daily-job@example.test', 'phone' => '0000000011',
        ]);
        $this->postJson("/api/members/{$member->id}/workout-plan", ['tasks' => [
            ['exercise' => 'Squat', 'sets' => 3, 'reps' => 10, 'date' => '2026-11-18', 'gesture_class' => 'SQUAT'], // Wednesday
        ]])->assertOk();

        Carbon::setTestNow('2026-11-24 00:05:00');
        $this->artisan('workouts:schedule-week')->assertSuccessful();

        $this->assertDatabaseHas('workout_logs', [
            'member_id' => $member->id, 'exercise' => 'ASSIGNED: SQUAT', 'date' => '2026-11-25',
        ]);
    }

    public function test_manual_verification_keeps_the_planned_date(): void
    {
        Carbon::setTestNow('2026-11-20 10:00:00');
        $member = Member::create([
            'first_name' => 'Keep', 'last_name' => 'Date',
            'email' => 'keep-date@example.test', 'phone' => '0000000012',
        ]);
        $past = \App\Models\Tracking\WorkoutLog::create([
            'member_id' => $member->id, 'exercise' => 'ASSIGNED: PLANK', 'date' => '2026-11-18', 'sets' => 2, 'reps' => 1,
        ]);
        $future = \App\Models\Tracking\WorkoutLog::create([
            'member_id' => $member->id, 'exercise' => 'ASSIGNED: LUNGE', 'date' => '2026-11-22', 'sets' => 3, 'reps' => 10,
        ]);

        $this->putJson("/api/workouts/{$past->id}/manual-verify")->assertOk();
        $this->putJson("/api/workouts/{$future->id}/manual-verify")->assertOk();

        // Verified late: stays on the day it was planned for.
        $this->assertSame('2026-11-18', substr((string) $past->fresh()->date, 0, 10));
        // Done ahead of schedule: recorded on the day it was done.
        $this->assertSame('2026-11-20', substr((string) $future->fresh()->date, 0, 10));
    }
}