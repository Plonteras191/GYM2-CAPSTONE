<?php

namespace Tests\Feature;

use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Services\AttendanceService;
use App\Services\MemberStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/** Muscle Bros.ph does not refund: a subscription is paused and later resumed with its days kept. */
class MembershipPauseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-12-01 10:00:00');
        $this->actingAsAdmin();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function plan(): Plan
    {
        return Plan::create(['name' => 'Monthly', 'price' => 1200, 'duration_days' => 30, 'category' => 'normal']);
    }

    private function member(): Member
    {
        return Member::create([
            'first_name' => 'Ana', 'last_name' => 'Santos', 'email' => 'ana@example.com',
            'phone' => '09170000000', 'plan' => 'Monthly', 'status' => 'Active',
        ]);
    }

    private function subscription(Member $member, Plan $plan, string $start = '2026-11-20', string $end = '2026-12-20', string $status = 'Active'): Membership
    {
        return Membership::create([
            'member_id' => $member->id, 'plan_id' => $plan->id, 'plan_type' => $plan->name,
            'start_date' => $start, 'end_date' => $end, 'status' => $status, 'color' => '#0891B2',
        ]);
    }

    public function test_pausing_keeps_the_days_left_and_resuming_moves_the_end_date(): void
    {
        $sub = $this->subscription($this->member(), $this->plan());

        $this->postJson("/api/memberships/{$sub->id}/pause")
            ->assertOk()
            ->assertJson(['days_left' => 19]);
        $sub->refresh();
        $this->assertSame([Membership::PAUSED, '2026-12-01'], [$sub->status, substr($sub->paused_at, 0, 10)]);
        $this->assertDatabaseHas('membership_pauses', ['membership_id' => $sub->id, 'paused_on' => '2026-12-01', 'resumed_on' => null]);

        // While paused, the days left stay frozen.
        Carbon::setTestNow('2026-12-11 09:00:00');
        $listed = collect($this->getJson('/api/memberships')->assertOk()->json())->firstWhere('id', $sub->id);
        $this->assertSame(['Paused', 19], [$listed['status'], $listed['paused_days_left']]);

        $this->postJson("/api/memberships/{$sub->id}/resume")
            ->assertOk()
            ->assertJson(['days_paused' => 10, 'end_date' => '2026-12-30']);
        $sub->refresh();
        $this->assertSame(['Active', null, '2026-12-30'], [$sub->status, $sub->paused_at, substr($sub->end_date, 0, 10)]);
        $this->assertDatabaseHas('membership_pauses', ['membership_id' => $sub->id, 'resumed_on' => '2026-12-11', 'days' => 10]);
    }

    public function test_a_subscription_can_be_paused_again_after_resuming(): void
    {
        $sub = $this->subscription($this->member(), $this->plan());

        $this->postJson("/api/memberships/{$sub->id}/pause")->assertOk();
        Carbon::setTestNow('2026-12-04 09:00:00');
        $this->postJson("/api/memberships/{$sub->id}/resume")->assertOk()->assertJson(['end_date' => '2026-12-23']);
        $this->postJson("/api/memberships/{$sub->id}/pause")->assertOk();
        Carbon::setTestNow('2026-12-06 09:00:00');
        $this->postJson("/api/memberships/{$sub->id}/resume")->assertOk()->assertJson(['end_date' => '2026-12-25']);

        $this->assertSame(2, $sub->pauses()->count());
    }

    public function test_only_a_running_subscription_can_be_paused_and_only_a_paused_one_resumed(): void
    {
        $member = $this->member();
        $plan = $this->plan();
        $expired = $this->subscription($member, $plan, '2026-10-01', '2026-10-31', 'Expired');
        $future = $this->subscription($member, $plan, '2026-12-10', '2027-01-09');
        $running = $this->subscription($member, $plan);

        $this->postJson("/api/memberships/{$expired->id}/pause")->assertUnprocessable()->assertJsonValidationErrors('membership');
        $this->postJson("/api/memberships/{$future->id}/pause")->assertUnprocessable()->assertJsonValidationErrors('membership');
        $this->postJson("/api/memberships/{$running->id}/resume")->assertUnprocessable()->assertJsonValidationErrors('membership');

        $this->postJson("/api/memberships/{$running->id}/pause")->assertOk();
        $this->postJson("/api/memberships/{$running->id}/pause")->assertUnprocessable()->assertJsonValidationErrors('membership');
        $this->assertSame(1, $running->pauses()->count());
    }

    public function test_a_new_sale_or_renewal_is_blocked_while_paused(): void
    {
        $member = $this->member();
        $plan = $this->plan();
        $sub = $this->subscription($member, $plan);
        $this->postJson("/api/memberships/{$sub->id}/pause")->assertOk();

        $this->postJson('/api/memberships', [
            'member_id' => $member->id, 'plan_id' => $plan->id, 'start_date' => '2026-12-01',
            'status' => 'Active', 'payment_method' => 'Cash', 'color' => '#0891B2',
        ])->assertUnprocessable()->assertJsonValidationErrors('member_id');

        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash'])
            ->assertUnprocessable()->assertJsonValidationErrors('member_id');

        $this->assertSame(1, Membership::count());
    }

    public function test_a_paused_member_is_not_marked_inactive_and_check_ins_say_paused(): void
    {
        $member = $this->member();
        $sub = $this->subscription($member, $this->plan());
        $this->postJson("/api/memberships/{$sub->id}/pause")->assertOk();

        // Two months away while paused: the inactivity rule leaves them alone.
        $member->forceFill(['created_at' => '2026-09-01', 'status_updated_at' => '2026-09-01'])->save();
        Carbon::setTestNow('2027-02-01 10:00:00');
        app(MemberStatusService::class)->demoteInactiveMembers();
        $this->assertSame('Active', $member->fresh()->status);

        [$status] = app(AttendanceService::class)->subscriptionOn($member, '2027-02-01');
        $this->assertSame('paused', $status);
    }

    public function test_resuming_makes_an_inactive_member_active_again(): void
    {
        $member = $this->member();
        $sub = $this->subscription($member, $this->plan());
        $this->postJson("/api/memberships/{$sub->id}/pause")->assertOk();
        $member->forceFill(['status' => 'Inactive'])->save();

        $this->postJson("/api/memberships/{$sub->id}/resume")->assertOk();

        $member->refresh();
        $this->assertSame('Active', $member->status);
        $this->assertNotNull($member->status_updated_at);
    }
}
