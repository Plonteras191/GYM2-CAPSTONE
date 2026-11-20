<?php

namespace Tests\Feature;

use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardCountsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-20 15:00:00');
        $this->actingAsAdmin();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function subscription(string $email, string $start, string $end, string $status = 'Active'): Membership
    {
        $plan = Plan::firstOrCreate(['name' => 'Monthly'], ['price' => 1200, 'duration_days' => 30, 'category' => 'normal']);
        $member = Member::create([
            'first_name' => 'Ana', 'last_name' => $email, 'email' => "{$email}@example.com",
            'phone' => '09170000000', 'plan' => 'Monthly', 'status' => 'Active',
        ]);

        return Membership::create([
            'member_id' => $member->id, 'plan_id' => $plan->id, 'plan_type' => 'Monthly',
            'start_date' => $start, 'end_date' => $end, 'status' => $status, 'color' => '#10b981',
            'member_name_snapshot' => "Ana {$email}",
        ]);
    }

    public function test_active_subscriptions_count_only_ones_running_today(): void
    {
        $this->subscription('running', '2026-11-01', '2026-12-01');
        $this->subscription('endstoday', '2026-10-21', '2026-11-20');
        $this->subscription('lapsed', '2026-10-01', '2026-11-19');            // saved Active, but past its end date
        $this->subscription('notstarted', '2026-11-25', '2026-12-25');        // starts later
        $this->subscription('expired', '2026-09-01', '2026-10-01', 'Expired');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.activeSubs', 2);
    }

    public function test_ending_this_week_includes_a_membership_that_ends_today(): void
    {
        $today = $this->subscription('endstoday', '2026-10-21', '2026-11-20');
        $inSix = $this->subscription('insix', '2026-10-27', '2026-11-26');
        $this->subscription('later', '2026-11-10', '2026-12-10');

        $ids = collect($this->getJson('/api/dashboard')->assertOk()->json('expiringSoon'))->pluck('id')->all();

        $this->assertSame([$today->id, $inSix->id], $ids);
    }
}
