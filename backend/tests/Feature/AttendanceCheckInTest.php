<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Tracking\Attendance;
use App\Services\AttendanceService;
use App\Services\MemberStatusService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AttendanceCheckInTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function member(string $name = 'Juan', string $status = 'Active'): Member
    {
        return Member::create([
            'first_name' => $name,
            'last_name' => 'Dela Cruz',
            'email' => strtolower($name) . uniqid() . '@example.com',
            'phone' => '09170000000',
            'plan' => 'None',
            'status' => $status,
        ]);
    }

    private function subscription(Member $member, string $start, string $end, string $plan = 'Monthly'): Membership
    {
        return Membership::create([
            'member_id' => $member->id,
            'plan_type' => $plan,
            'start_date' => $start,
            'end_date' => $end,
            'status' => 'Active',
        ]);
    }

    private function checkIn(Member $member, array $extra = [])
    {
        return $this->withAiEngineToken()
            ->postJson('/api/ai/log-attendance', ['member_id' => $member->id] + $extra);
    }

    public function test_check_in_is_recorded_with_audit_details(): void
    {
        Carbon::setTestNow('2026-11-13 10:15:00');
        $member = $this->member();
        $this->subscription($member, '2026-11-01', '2026-11-30', 'Monthly With Coach');

        $this->checkIn($member, ['camera_source' => 'cctv', 'match_distance' => 0.3712])
            ->assertOk()
            ->assertJson(['status' => 'logged', 'reactivated' => false]);

        $attendance = Attendance::sole();
        $this->assertSame($member->id, $attendance->member_id);
        $this->assertSame('2026-11-13', (string) $attendance->date);
        $this->assertSame('10:15:00', (string) $attendance->time_in);
        $this->assertSame('face', $attendance->source);
        $this->assertSame('cctv', $attendance->camera_source);
        $this->assertEqualsWithDelta(0.3712, $attendance->match_distance, 0.0001);
        $this->assertSame('active', $attendance->subscription_status);
        $this->assertSame('Monthly With Coach', $attendance->plan_snapshot);
        $this->assertSame('Juan Dela Cruz', $attendance->member_name_snapshot);
    }

    public function test_only_one_check_in_per_member_per_day(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $member = $this->member();

        $this->checkIn($member)->assertJson(['status' => 'logged']);
        Carbon::setTestNow('2026-11-13 15:00:00');
        $this->checkIn($member)->assertJson(['status' => 'already_logged']);
        $this->assertSame(1, Attendance::count());

        Carbon::setTestNow('2026-11-14 10:00:00');
        $this->checkIn($member)->assertJson(['status' => 'logged']);
        $this->assertSame(2, Attendance::count());
    }

    public function test_database_rejects_a_second_row_for_the_same_member_and_day(): void
    {
        $member = $this->member();
        $row = ['member_id' => $member->id, 'date' => '2026-11-13', 'time_in' => '10:00:00'];
        Attendance::create($row);

        $this->expectException(UniqueConstraintViolationException::class);
        Attendance::create($row);
    }

    public function test_simultaneous_check_in_that_hits_the_unique_rule_is_reported_as_already_logged(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $member = $this->member();

        // Simulate another request inserting between the "already logged?"
        // check and the insert.
        Attendance::creating(function () use ($member) {
            static $raced = false;
            if (!$raced) {
                $raced = true;
                DB::table('attendances')->insert([
                    'member_id' => $member->id, 'date' => '2026-11-13', 'time_in' => '09:59:59',
                ]);
            }
        });

        $result = app(AttendanceService::class)->checkIn($member);

        Attendance::flushEventListeners();

        // The unique rule refused the second row, and the service reported
        // it as a normal "already logged" instead of crashing. (The simulated
        // row is rolled back with the refused insert, so no rows remain here.)
        $this->assertSame(AttendanceService::ALREADY_LOGGED, $result['status']);
        $this->assertFalse($result['reactivated']);
        $this->assertSame(0, Attendance::where('time_in', '!=', '09:59:59')->count());
    }

    public function test_operating_hours_boundaries(): void
    {
        $cases = [
            '08:59:59' => 'outside_hours',
            '09:00:00' => 'logged',
            '21:30:00' => 'logged',
            '21:30:01' => 'outside_hours',
        ];

        foreach ($cases as $time => $expected) {
            Carbon::setTestNow("2026-11-13 {$time}");
            $this->checkIn($this->member('M' . str_replace(':', '', $time)))
                ->assertJson(['status' => $expected]);
        }

        $this->assertSame(2, Attendance::count());
    }

    public function test_operating_hours_come_from_config(): void
    {
        config(['gym.open_time' => '06:00', 'gym.close_time' => '22:00']);
        Carbon::setTestNow('2026-11-13 06:30:00');

        $this->checkIn($this->member())->assertJson(['status' => 'logged']);
    }

    public function test_returning_inactive_member_becomes_active(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $member = $this->member('Maria', 'Inactive');

        $this->checkIn($member)->assertJson(['status' => 'logged', 'reactivated' => true]);

        $this->assertSame('Active', $member->fresh()->status);
        $this->assertTrue(Attendance::sole()->reactivated);

        // The inactivity rule must not undo it.
        app(MemberStatusService::class)->demoteInactiveMembers();
        $this->assertSame('Active', $member->fresh()->status);
    }

    public function test_subscription_status_is_recorded_at_check_in(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $expired = $this->member('Expired');
        $this->subscription($expired, '2026-09-01', '2026-09-30', 'Old Monthly');
        $none = $this->member('None');

        $this->checkIn($expired)->assertJson(['status' => 'logged']);
        $this->checkIn($none)->assertJson(['status' => 'logged']);

        $rows = Attendance::pluck('subscription_status', 'member_id');
        $this->assertSame('expired', $rows[$expired->id]);
        $this->assertSame('none', $rows[$none->id]);
        $this->assertSame('Old Monthly', Attendance::where('member_id', $expired->id)->value('plan_snapshot'));
    }

    public function test_checked_in_at_keeps_the_real_arrival_time(): void
    {
        Carbon::setTestNow('2026-11-13 10:30:00');
        $member = $this->member();

        $this->checkIn($member, ['checked_in_at' => '2026-11-13 10:05:42'])
            ->assertJson(['status' => 'logged']);

        $this->assertSame('10:05:42', (string) Attendance::sole()->time_in);
    }

    public function test_checked_in_at_must_be_today_and_not_in_the_future(): void
    {
        Carbon::setTestNow('2026-11-13 10:30:00');
        $member = $this->member();

        $this->checkIn($member, ['checked_in_at' => '2026-11-12 10:00:00'])->assertStatus(422);
        $this->checkIn($member, ['checked_in_at' => '2026-11-13 11:00:00'])->assertStatus(422);
        $this->checkIn($member, ['checked_in_at' => 'not a date'])->assertStatus(422);

        $this->assertSame(0, Attendance::count());
    }

    public function test_unknown_member_is_rejected(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');

        $this->withAiEngineToken()
            ->postJson('/api/ai/log-attendance', ['member_id' => 999])
            ->assertStatus(422);
    }

    public function test_deleting_a_member_keeps_their_attendance_history(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $member = $this->member('Pedro');
        $this->checkIn($member)->assertJson(['status' => 'logged']);

        $this->actingAsAdmin()->deleteJson("/api/members/{$member->id}")->assertOk();

        $attendance = Attendance::sole();
        $this->assertNull($attendance->member_id);
        $this->assertSame('Pedro Dela Cruz', $attendance->member_name_snapshot);
    }

    public function test_admin_can_set_member_status_and_only_valid_values_are_accepted(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $member = $this->member('Ana', 'Inactive');
        $member->forceFill(['created_at' => Carbon::parse('2026-01-01')])->saveQuietly();

        $this->actingAsAdmin()
            ->putJson("/api/members/{$member->id}", ['status' => 'Banned'])
            ->assertStatus(422);

        $this->putJson("/api/members/{$member->id}", ['status' => 'Active'])->assertOk();
        $this->assertSame('Active', $member->fresh()->status);

        // A manual "Active" gets a fresh month: listing members must not undo it.
        $this->getJson('/api/members')->assertOk();
        $this->assertSame('Active', $member->fresh()->status);

        // ...but the rule applies again after a month without visits.
        Carbon::setTestNow('2026-12-14 10:00:00');
        $this->getJson('/api/members')->assertOk();
        $this->assertSame('Inactive', $member->fresh()->status);
    }

    public function test_daily_command_demotes_members_unseen_for_a_month(): void
    {
        Carbon::setTestNow('2026-11-13 10:00:00');
        $old = $this->member('Old');
        $old->forceFill(['created_at' => Carbon::parse('2026-08-01')])->saveQuietly();
        $new = $this->member('New');

        Artisan::call('members:demote-inactive');

        $this->assertSame('Inactive', $old->fresh()->status);
        $this->assertSame('Active', $new->fresh()->status);
    }

    public function test_migration_merges_existing_duplicates_keeping_the_earliest(): void
    {
        $member = $this->member('Dup');

        Artisan::call('migrate:rollback', ['--path' => 'database/migrations/2026_11_13_000001_harden_attendances_table.php']);
        DB::table('attendances')->insert([
            ['member_id' => $member->id, 'date' => '2026-11-10', 'time_in' => '11:00:00'],
            ['member_id' => $member->id, 'date' => '2026-11-10', 'time_in' => '09:30:00'],
            ['member_id' => $member->id, 'date' => '2026-11-11', 'time_in' => '10:00:00'],
        ]);
        Artisan::call('migrate', ['--path' => 'database/migrations/2026_11_13_000001_harden_attendances_table.php']);

        $rows = DB::table('attendances')->orderBy('date')->get();
        $this->assertCount(2, $rows);
        $this->assertSame('09:30:00', $rows[0]->time_in);
        $this->assertSame('Dup Dela Cruz', $rows[0]->member_name_snapshot);
    }
}
