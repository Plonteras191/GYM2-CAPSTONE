<?php

namespace Tests\Feature;

use App\Http\Controllers\Tracking\WorkoutController;
use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Tracking\Attendance;
use App\Models\Tracking\WorkoutLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** The Attendance page: every subscriber's visits and training plan at a glance. */
class AttendanceTrackerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Wednesday: the week runs Mon Nov 23 to Sun Nov 29.
        Carbon::setTestNow('2026-11-25 15:00:00');
        $this->actingAsAdmin();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function plan(string $name, string $category = 'normal'): Plan
    {
        return Plan::create(['name' => $name, 'price' => 1200, 'duration_days' => 30, 'category' => $category]);
    }

    private function member(string $first, string $email): Member
    {
        return Member::create([
            'first_name' => $first, 'last_name' => 'Cruz', 'email' => $email,
            'phone' => '09170000000', 'plan' => 'Monthly', 'status' => 'Active',
            'created_at' => '2026-11-20 08:00:00', 'status_updated_at' => '2026-11-20 08:00:00',
        ]);
    }

    private function subscribe(Member $member, Plan $plan, string $start = '2026-11-10', string $end = '2026-12-10', string $status = 'Active'): Membership
    {
        return Membership::create([
            'member_id' => $member->id, 'plan_id' => $plan->id, 'plan_type' => $plan->name,
            'start_date' => $start, 'end_date' => $end, 'status' => $status, 'color' => '#0891B2',
        ]);
    }

    private function visit(Member $member, string $date, string $time = '07:30:00'): void
    {
        Attendance::create(['member_id' => $member->id, 'date' => $date, 'time_in' => $time, 'source' => 'face']);
    }

    private function rowFor($response, Member $member): ?array
    {
        return collect($response->json('rows'))->firstWhere('member.id', $member->id);
    }

    public function test_it_counts_visits_this_week_this_month_and_today(): void
    {
        $ana = $this->member('Ana', 'ana@example.com');
        $this->subscribe($ana, $this->plan('Monthly'));
        $this->visit($ana, '2026-11-02');               // this month, before this week
        $this->visit($ana, '2026-11-23');               // Monday
        $this->visit($ana, '2026-11-25', '08:15:00');   // today
        $this->visit($ana, '2026-10-30');               // last month

        $response = $this->getJson('/api/attendance/subscribers')->assertOk();
        $row = $this->rowFor($response, $ana);

        $this->assertSame([
            'last_visit_date' => '2026-11-25',
            'last_visit_time' => '08:15:00',
            'days_since_last_visit' => 0,
            'today' => true,
            'week_visits' => 2,
            'month_visits' => 3,
            'week_days' => ['2026-11-23', '2026-11-25'],
        ], $row['attendance']);
        $this->assertSame(['Active', 15], [$row['subscription']['status'], $row['subscription']['days_left']]);
        $response->assertJsonPath('summary.checked_in_today', 1)
            ->assertJsonPath('summary.visits_this_week', 2)
            ->assertJsonPath('summary.absent', 0);
    }

    public function test_absent_and_never_visited_subscribers_are_flagged(): void
    {
        $monthly = $this->plan('Monthly');
        $away = $this->member('Ben', 'ben@example.com');
        $this->subscribe($away, $monthly);
        $this->visit($away, '2026-11-12');
        $never = $this->member('Carl', 'carl@example.com');
        $this->subscribe($never, $monthly);

        $response = $this->getJson('/api/attendance/subscribers')->assertOk();

        $this->assertSame(13, $this->rowFor($response, $away)['attendance']['days_since_last_visit']);
        $this->assertNull($this->rowFor($response, $never)['attendance']['last_visit_date']);
        $response->assertJsonPath('summary.absent', 2);
    }

    public function test_walk_ins_are_left_out_and_each_member_shows_their_latest_subscription(): void
    {
        $guest = $this->member('Dana', 'dana@example.com');
        $this->subscribe($guest, $this->plan('Walk-In', 'walk_in'), '2026-11-25', '2026-11-25');

        $eve = $this->member('Eve', 'eve@example.com');
        $monthly = $this->plan('Monthly');
        $this->subscribe($eve, $monthly, '2026-09-01', '2026-10-01', 'Expired');
        $latest = $this->subscribe($eve, $monthly, '2026-11-01', '2026-11-20'); // ended, still saved as Active

        $response = $this->getJson('/api/attendance/subscribers')->assertOk();

        $this->assertNull($this->rowFor($response, $guest));
        $row = $this->rowFor($response, $eve);
        $this->assertSame([$latest->id, 'Expired', null], [
            $row['subscription']['id'], $row['subscription']['status'], $row['subscription']['days_left'],
        ]);
        $this->assertCount(1, $response->json('rows'));
    }

    public function test_paused_subscriptions_show_the_days_kept(): void
    {
        $finn = $this->member('Finn', 'finn@example.com');
        $sub = $this->subscribe($finn, $this->plan('Monthly'), '2026-11-10', '2026-12-10', 'Paused');
        $sub->update(['paused_at' => '2026-11-20']);

        $response = $this->getJson('/api/attendance/subscribers')->assertOk();
        $row = $this->rowFor($response, $finn);

        $this->assertSame(['Paused', '2026-11-20', 20], [
            $row['subscription']['status'], $row['subscription']['paused_at'], $row['subscription']['paused_days_left'],
        ]);
        $response->assertJsonPath('summary.paused', 1)->assertJsonPath('summary.absent', 0);
    }

    public function test_with_coach_members_get_this_weeks_training_progress(): void
    {
        $gia = $this->member('Gia', 'gia@example.com');
        $this->subscribe($gia, $this->plan('With Coach', 'with_coach'));
        $task = fn (string $exercise, string $date) => WorkoutLog::create([
            'member_id' => $gia->id, 'exercise' => $exercise, 'date' => $date, 'sets' => 3, 'reps' => 10,
        ]);
        $pending = WorkoutController::ASSIGNED_PREFIX;
        $task('SQUAT', '2026-11-23');               // done Monday
        $task($pending . 'PUSH UP', '2026-11-24');  // missed Tuesday
        $task('CURL', '2026-11-25');                // done today
        $task($pending . 'SIT UP', '2026-11-25');   // still due today
        $task($pending . 'SQUAT', '2026-11-27');    // later this week
        $task('SQUAT', '2026-11-16');               // last week: not counted
        WorkoutLog::create(['member_id' => $gia->id, 'exercise' => 'SQUAT', 'date' => '2026-11-25']); // a detection, not a task

        $plain = $this->member('Hal', 'hal@example.com');
        $this->subscribe($plain, $this->plan('Monthly'));

        $response = $this->getJson('/api/attendance/subscribers')->assertOk();

        $this->assertSame([
            'week_assigned' => 5, 'week_done' => 2, 'week_missed' => 1, 'today_assigned' => 2, 'today_done' => 1,
        ], $this->rowFor($response, $gia)['plan']);
        $this->assertTrue($this->rowFor($response, $gia)['subscription']['with_coach']);
        $this->assertNull($this->rowFor($response, $plain)['plan']);
    }
}
