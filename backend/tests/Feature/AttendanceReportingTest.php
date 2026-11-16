<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Tracking\Attendance;
use App\Models\Tracking\WorkoutLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AttendanceReportingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-13 12:00:00');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function member(string $name, array $extra = []): Member
    {
        return Member::create($extra + [
            'first_name' => $name,
            'last_name' => 'Santos',
            'email' => strtolower($name) . '@example.com',
            'phone' => '09170000000',
            'plan' => 'None',
            'status' => 'Active',
        ]);
    }

    private function attended(Member $member, string $date, string $time, array $extra = []): Attendance
    {
        return Attendance::create($extra + [
            'member_id' => $member->id,
            'member_name_snapshot' => "{$member->first_name} {$member->last_name}",
            'date' => $date,
            'time_in' => $time,
        ]);
    }

    public function test_attendance_report_has_real_numbers_and_check_in_details(): void
    {
        $ana = $this->member('Ana');
        $ben = $this->member('Ben');
        $this->attended($ana, '2026-11-11', '17:05:00', [
            'source' => 'face', 'camera_source' => 'cctv', 'subscription_status' => 'active', 'plan_snapshot' => 'Monthly',
        ]);
        $this->attended($ana, '2026-11-12', '17:40:00', ['subscription_status' => 'expired', 'plan_snapshot' => 'Monthly']);
        $this->attended($ben, '2026-11-12', '09:10:00', ['source' => 'manual', 'subscription_status' => 'none']);
        $this->attended($ben, '2026-10-30', '10:00:00'); // outside the range

        $report = $this->actingAsAdmin()
            ->getJson('/api/reports?start=2026-11-10&end=2026-11-13')
            ->assertOk()
            ->json('Attendance');

        $kpis = collect($report['kpis'])->pluck('value', 'label');
        $this->assertSame('3', $kpis['Total Check-ins']);
        $this->assertSame('2', $kpis['Unique Members']);
        $this->assertSame('0.8', $kpis['Avg. Daily Visits']); // 3 check-ins over 4 days
        $this->assertSame('5 PM - 6 PM', $kpis['Busiest Hour']);

        $this->assertSame(
            ['Date / Time', 'Member Details', 'Plan', 'Subscription Status', 'Method', 'Camera'],
            $report['columns']
        );
        $rows = collect($report['rows']);
        $this->assertCount(3, $rows);

        $first = $rows->firstWhere(0, '2026-11-11 / 5:05 PM');
        $this->assertSame('Ana Santos', $first[1]['name']);
        $this->assertSame(['Monthly', 'Active', 'Face', 'CCTV 1'], array_slice($first, 2));

        $manual = $rows->firstWhere(0, '2026-11-12 / 9:10 AM');
        $this->assertSame(['No plan', 'No Subscription', 'Manual', '-'], array_slice($manual, 2));
    }

    public function test_attendance_report_average_ignores_future_days_and_handles_no_check_ins(): void
    {
        $report = $this->actingAsAdmin()
            ->getJson('/api/reports?start=2026-11-01&end=2026-11-30')
            ->assertOk()
            ->json('Attendance');

        $kpis = collect($report['kpis'])->pluck('value', 'label');
        $this->assertSame('0', $kpis['Total Check-ins']);
        $this->assertSame('0', $kpis['Avg. Daily Visits']);
        $this->assertSame('No check-ins', $kpis['Busiest Hour']);
    }

    public function test_attendance_report_keeps_rows_of_deleted_members(): void
    {
        $gone = $this->member('Gone');
        $this->attended($gone, '2026-11-12', '10:00:00');
        $this->actingAsAdmin()->deleteJson("/api/members/{$gone->id}")->assertOk();

        $rows = $this->getJson('/api/reports?start=2026-11-10&end=2026-11-13')->json('Attendance.rows');

        $this->assertCount(1, $rows);
        $this->assertSame('Gone Santos', $rows[0][1]['name']);
        $this->assertNull($rows[0][1]['id']);
    }

    public function test_dashboard_shows_todays_check_ins_by_hour(): void
    {
        $ana = $this->member('Ana');
        $ben = $this->member('Ben');
        $this->attended($ana, '2026-11-13', '09:15:00');
        $this->attended($ben, '2026-11-13', '09:50:00');
        $this->attended($ana, '2026-11-12', '18:00:00'); // yesterday

        $dashboard = $this->actingAsAdmin()->getJson('/api/dashboard')->assertOk()->json();

        $this->assertSame(2, $dashboard['todayCheckIns']);
        $byHour = collect($dashboard['checkInsByHour'])->pluck('checkIns', 'hour');
        $this->assertSame(2, $byHour['9 AM']);
        $this->assertSame(0, $byHour['6 PM']);
        $this->assertSame(['9 AM', '9 PM'], [$byHour->keys()->first(), $byHour->keys()->last()]);
    }

    public function test_member_attendance_returns_full_history_not_only_ten_visits(): void
    {
        $ana = $this->member('Ana');
        for ($day = 1; $day <= 15; $day++) {
            $this->attended($ana, sprintf('2026-10-%02d', $day), '10:00:00');
        }
        $this->attended($ana, '2023-01-05', '10:00:00'); // older than two years

        $history = $this->actingAsAdmin()->getJson("/api/members/{$ana->id}/attendance")->assertOk()->json();

        $this->assertCount(15, $history);
        $this->assertSame('2026-10-15', $history[0]['date']);
    }

    public function test_engine_receives_each_members_subscription_status(): void
    {
        $active = $this->member('Active', ['enrolled_face_id' => '/faces/a.png']);
        $expired = $this->member('Expired', ['enrolled_face_id' => '/faces/b.png']);
        $none = $this->member('None', ['enrolled_face_id' => '/faces/c.png']);
        Membership::create(['member_id' => $active->id, 'plan_type' => 'Monthly', 'start_date' => '2026-11-01', 'end_date' => '2026-11-30', 'status' => 'Active']);
        Membership::create(['member_id' => $expired->id, 'plan_type' => 'Monthly', 'start_date' => '2026-09-01', 'end_date' => '2026-09-30', 'status' => 'Active']);

        $statuses = collect($this->withAiEngineToken()->getJson('/api/ai/members-faces')->assertOk()->json())
            ->pluck('subscription_status', 'id');

        $this->assertSame('active', $statuses[$active->id]);
        $this->assertSame('expired', $statuses[$expired->id]);
        $this->assertSame('none', $statuses[$none->id]);
    }

    public function test_program_monitoring_report_lists_tasks_with_counted_reps(): void
    {
        $ana = $this->member('Ana');
        $ben = $this->member('Ben');
        $task = fn (Member $m, array $extra) => WorkoutLog::create($extra + ['member_id' => $m->id]);
        // Verified by the camera, with the repetitions it counted.
        $task($ana, ['exercise' => 'BARBELL FULL SQUAT', 'date' => '2026-11-12', 'sets' => 3, 'reps' => 10,
            'gesture_class' => 'SQUAT', 'counted_reps' => 30, 'verified_by' => 'ai', 'verified_at' => '2026-11-12 17:30:00']);
        // Assigned for a past day and never done.
        $task($ana, ['exercise' => 'ASSIGNED: PLANK', 'date' => '2026-11-11', 'sets' => 1, 'reps' => 1]);
        // Still pending today, partly counted.
        $task($ben, ['exercise' => 'ASSIGNED: PUSH UP', 'date' => '2026-11-13', 'sets' => 2, 'reps' => 8,
            'gesture_class' => 'PUSH UP', 'counted_reps' => 5]);
        // Verified by the coach by hand.
        $task($ben, ['exercise' => 'CURL', 'date' => '2026-11-12', 'sets' => 2, 'reps' => 12,
            'verified_by' => 'coach', 'verified_at' => '2026-11-12 18:05:00']);
        $task($ben, ['exercise' => 'ASSIGNED: SIT UP', 'date' => '2026-10-30', 'sets' => 1, 'reps' => 5]); // outside the range

        $report = $this->actingAsAdmin()
            ->getJson('/api/reports?start=2026-11-10&end=2026-11-13')
            ->assertOk()
            ->json('Workouts');

        $kpis = collect($report['kpis'])->pluck('value', 'label');
        $this->assertSame('4', $kpis['Assigned Tasks']);
        $this->assertSame('1', $kpis['Verified by Camera']);
        $this->assertSame('1', $kpis['Verified by Coach']);
        $this->assertSame('50%', $kpis['Completion Rate']); // 2 verified of 4 due

        $this->assertSame(
            ['Date', 'Member Details', 'Exercise', 'Target', 'Reps Counted', 'Status', 'Verified By'],
            $report['columns']
        );
        $rows = collect($report['rows']);
        $this->assertCount(4, $rows);

        $squat = $rows->first(fn ($row) => $row[2]['title'] === 'Barbell Full Squat');
        $this->assertSame('2026-11-12', $squat[0]);
        $this->assertSame('Ana Santos', $squat[1]['name']);
        $this->assertSame('Camera checks: SQUAT', $squat[2]['category']);
        $this->assertSame(['3 sets x 10 reps', '30', 'Verified'], array_slice($squat, 3, 3));
        $this->assertSame(['title' => 'Camera (AI)', 'category' => 'Nov 12, 5:30 PM'], $squat[6]);

        $plank = $rows->first(fn ($row) => $row[2]['title'] === 'Plank');
        $this->assertSame(['1 sets x 1 reps', '-', 'Missed', '-'], array_slice($plank, 3));
        $this->assertSame('Coach verification only', $plank[2]['category']);

        $pushUp = $rows->first(fn ($row) => $row[2]['title'] === 'Push Up');
        $this->assertSame(['2 sets x 8 reps', '5', 'Pending', '-'], array_slice($pushUp, 3));

        $curl = $rows->first(fn ($row) => $row[2]['title'] === 'Curl');
        $this->assertSame('Verified', $curl[5]);
        $this->assertSame('Coach', $curl[6]['title']);
    }
}
