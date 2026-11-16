<?php

namespace Tests\Feature;

use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Member\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MembershipRenewalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-17 10:00:00');
        $this->actingAsAdmin();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function plan(string $name, float $price, int $days = 30, string $category = 'normal'): Plan
    {
        return Plan::create(['name' => $name, 'price' => $price, 'duration_days' => $days, 'category' => $category]);
    }

    private function member(string $status = 'Active'): Member
    {
        return Member::create([
            'first_name' => 'Ana', 'last_name' => 'Santos', 'email' => 'ana@example.com',
            'phone' => '09170000000', 'plan' => 'Monthly', 'status' => $status,
        ]);
    }

    private function subscription(Member $member, Plan $plan, string $start, string $end, string $status = 'Active'): Membership
    {
        return Membership::create([
            'member_id' => $member->id, 'plan_id' => $plan->id, 'plan_type' => $plan->name,
            'start_date' => $start, 'end_date' => $end, 'status' => $status, 'color' => '#10b981',
            'member_name_snapshot' => 'Ana Santos',
        ]);
    }

    public function test_renewing_an_active_subscription_extends_it_from_its_end_date(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $member = $this->member();
        $sub = $this->subscription($member, $monthly, '2026-10-24', '2026-11-23');

        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash', 'amount' => 1200])
            ->assertOk()
            ->assertJson(['period_start' => '2026-11-23', 'period_end' => '2026-12-23', 'amount_charged' => 1200]);

        $this->assertSame('2026-12-23', substr($sub->fresh()->end_date, 0, 10));
        $this->assertSame(1, Membership::count(), 'the same subscription is extended, not duplicated');
        $this->assertDatabaseHas('transactions', [
            'membership_id' => $sub->id, 'type' => 'Subscription Renewal', 'amount' => 1200,
            'payment_method' => 'Cash', 'package_name_snapshot' => 'Monthly', 'status' => 'Complete',
        ]);
    }

    public function test_renewing_an_expired_subscription_starts_a_new_one_today(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $member = $this->member('Inactive');
        $old = $this->subscription($member, $monthly, '2026-09-01', '2026-10-01', 'Expired');

        $this->postJson("/api/memberships/{$old->id}/renew", ['payment_method' => 'Gcash', 'reference_number' => 'R-77'])
            ->assertOk()
            ->assertJson(['period_start' => '2026-11-17', 'period_end' => '2026-12-17', 'amount_charged' => 1200]);

        $new = Membership::where('id', '!=', $old->id)->firstOrFail();
        $this->assertSame(['2026-11-17', '2026-12-17', 'Active', 'Monthly'], [
            substr($new->start_date, 0, 10), substr($new->end_date, 0, 10), $new->status, $new->plan_type,
        ]);
        $this->assertSame('Expired', $old->fresh()->status);
        $this->assertDatabaseHas('transactions', [
            'membership_id' => $new->id, 'type' => 'Subscription Payment', 'reference_number' => 'R-77',
        ]);
        $member->refresh();
        $this->assertSame('Active', $member->status);
        $this->assertSame('Monthly', $member->plan);
        $this->assertNotNull($member->status_updated_at, 'a returning member gets a fresh month before the inactivity rule');
    }

    public function test_an_expired_subscription_can_be_renewed_with_a_different_package(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $coach = $this->plan('Monthly With Coach', 2500, 30, 'with_coach');
        $member = $this->member();
        $old = $this->subscription($member, $monthly, '2026-09-01', '2026-10-01', 'Expired');

        $this->postJson("/api/memberships/{$old->id}/renew", ['payment_method' => 'Cash', 'plan_id' => $coach->id])
            ->assertOk()->assertJson(['amount_charged' => 2500]);

        $this->assertDatabaseHas('memberships', ['member_id' => $member->id, 'plan_type' => 'Monthly With Coach', 'status' => 'Active']);
    }

    public function test_an_active_subscription_can_only_be_renewed_with_the_same_package(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $coach = $this->plan('Monthly With Coach', 2500, 30, 'with_coach');
        $sub = $this->subscription($this->member(), $monthly, '2026-11-01', '2026-12-01');

        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash', 'plan_id' => $coach->id])
            ->assertUnprocessable()->assertJsonValidationErrors('plan_id');
        $this->assertSame('2026-12-01', substr($sub->fresh()->end_date, 0, 10));
        $this->assertSame(0, Transaction::count());
    }

    public function test_a_deleted_package_must_be_replaced_when_renewing(): void
    {
        $gone = $this->plan('Old Promo', 900);
        $sub = $this->subscription($this->member(), $gone, '2026-09-01', '2026-10-01', 'Expired');
        $gone->delete();

        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash'])
            ->assertUnprocessable()->assertJsonValidationErrors('plan_id');

        $monthly = $this->plan('Monthly', 1200);
        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash', 'plan_id' => $monthly->id])->assertOk();
    }

    public function test_a_subscription_of_a_deleted_member_cannot_be_renewed(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $member = $this->member();
        $sub = $this->subscription($member, $monthly, '2026-09-01', '2026-10-01', 'Expired');
        $this->deleteJson("/api/members/{$member->id}")->assertOk();

        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash'])
            ->assertUnprocessable()->assertJsonValidationErrors('member_id');
    }

    public function test_a_payment_method_is_required(): void
    {
        $sub = $this->subscription($this->member(), $this->plan('Monthly', 1200), '2026-11-01', '2026-12-01');

        $this->postJson("/api/memberships/{$sub->id}/renew", [])
            ->assertUnprocessable()->assertJsonValidationErrors('payment_method');
    }

    public function test_early_renewal_payments_are_not_upgrade_credit(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $coach = $this->plan('Monthly With Coach', 2500, 30, 'with_coach');
        $member = $this->member();
        $sub = $this->subscription($member, $monthly, '2026-11-01', '2026-12-01');
        Transaction::create([
            'transaction_id' => 'TXN-001', 'transaction_date' => '2026-11-01', 'member_id' => $member->id,
            'membership_id' => $sub->id, 'type' => 'Subscription Payment', 'payment_method' => 'Cash',
            'amount' => 1200, 'status' => 'Complete',
        ]);
        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash'])->assertOk();

        // 1,200 for the current period plus 1,200 paid in advance: only the first counts as credit.
        $listed = collect($this->getJson('/api/memberships')->json())->firstWhere('id', $sub->id);
        $this->assertEquals(1200, $listed['amount_paid']);
        $this->putJson("/api/memberships/{$sub->id}", [
            'plan_id' => $coach->id, 'plan_type' => 'Monthly With Coach', 'payment_method' => 'Cash',
        ])->assertOk()->assertJson(['amount_charged' => 1300]);
    }

    public function test_renewal_shows_in_the_payments_list_and_report(): void
    {
        $monthly = $this->plan('Monthly', 1200);
        $sub = $this->subscription($this->member(), $monthly, '2026-11-01', '2026-12-01');
        $this->postJson("/api/memberships/{$sub->id}/renew", ['payment_method' => 'Cash'])->assertOk();

        $this->getJson('/api/transactions')->assertOk()
            ->assertJsonPath('0.package_details.title', 'Monthly Package Payment + Renewed');
        $this->getJson('/api/reports?start=2026-11-01&end=2026-11-30')->assertOk()
            ->assertJsonFragment(['title' => 'Monthly Package Payment + Renewed']);
    }
}
