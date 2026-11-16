<?php

namespace Tests\Feature;

use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PlanDeletionTest extends TestCase
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

    private function plan(string $name = 'Monthly'): Plan
    {
        return Plan::create(['name' => $name, 'price' => 1200, 'duration_days' => 30, 'category' => 'normal']);
    }

    private function subscribe(Plan $plan, string $status, string $end, ?int $planId = null, string $email = 'ana@example.com'): Membership
    {
        $member = Member::create(['first_name' => 'Ana', 'last_name' => 'Santos', 'email' => $email, 'phone' => '0917', 'plan' => $plan->name]);

        return Membership::create([
            'member_id' => $member->id, 'plan_id' => $planId ?? $plan->id, 'plan_type' => $plan->name,
            'start_date' => '2026-10-01', 'end_date' => $end, 'status' => $status, 'color' => '#10b981',
        ]);
    }

    public function test_a_package_with_running_subscriptions_cannot_be_deleted(): void
    {
        $plan = $this->plan();
        $this->subscribe($plan, 'Active', '2026-12-01');
        $this->subscribe($plan, 'Active', '2026-11-17', null, 'ben@example.com'); // ends today: still running

        $this->deleteJson("/api/plans/{$plan->id}")
            ->assertUnprocessable()
            ->assertJson(['running_subscriptions' => 2])
            ->assertJsonPath('message', '“Monthly” cannot be deleted: 2 members are still subscribed to it. Delete it after those subscriptions end.');
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
    }

    public function test_the_message_is_singular_for_one_member(): void
    {
        $plan = $this->plan();
        $this->subscribe($plan, 'Active', '2026-12-01');

        $this->deleteJson("/api/plans/{$plan->id}")
            ->assertUnprocessable()
            ->assertJsonPath('message', '“Monthly” cannot be deleted: 1 member is still subscribed to it. Delete it after that subscription ends.');
    }

    public function test_a_package_can_be_deleted_once_its_subscriptions_have_ended(): void
    {
        $plan = $this->plan();
        $ended = $this->subscribe($plan, 'Expired', '2026-10-31');
        $lapsed = $this->subscribe($plan, 'Active', '2026-11-16', null, 'ben@example.com'); // status not updated yet, but ended yesterday

        $this->deleteJson("/api/plans/{$plan->id}")->assertOk();

        $this->assertDatabaseMissing('plans', ['id' => $plan->id]);
        $this->assertSame('Monthly', $ended->fresh()->plan_type, 'ended subscriptions keep the package name');
        $this->assertSame(2, Membership::count());
    }

    public function test_an_unused_package_can_be_deleted(): void
    {
        $plan = $this->plan('Student Promo');

        $this->deleteJson("/api/plans/{$plan->id}")->assertOk();
        $this->assertDatabaseMissing('plans', ['id' => $plan->id]);
    }

    public function test_older_subscriptions_without_a_package_id_are_matched_by_name(): void
    {
        $plan = $this->plan();
        $legacy = $this->subscribe($plan, 'Active', '2026-12-01');
        $legacy->update(['plan_id' => null]);

        $this->deleteJson("/api/plans/{$plan->id}")->assertUnprocessable()->assertJson(['running_subscriptions' => 1]);
    }

    public function test_another_packages_running_subscriptions_do_not_block_deleting(): void
    {
        $monthly = $this->plan('Monthly');
        $annual = $this->plan('Annual');
        $this->subscribe($annual, 'Active', '2026-12-01');

        $this->deleteJson("/api/plans/{$monthly->id}")->assertOk();
        $this->assertDatabaseHas('plans', ['id' => $annual->id]);
    }
}
