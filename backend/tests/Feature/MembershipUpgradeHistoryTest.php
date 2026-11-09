<?php

namespace Tests\Feature;

use App\Models\Gym\Plan;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Member\Transaction;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MembershipUpgradeHistoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsAdmin();

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('plan')->default('None');
            $table->string('status')->default('Active');
            $table->longText('enrolled_face_id')->nullable();
            $table->string('profile_pic')->nullable();
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->integer('duration_days');
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
            $table->string('color')->nullable();
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('member_name_snapshot')->nullable();
            $table->string('member_profile_pic_snapshot')->nullable();
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->string('plan_type');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('Active');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->nullable();
            $table->string('color')->default('#f59e0b');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->date('transaction_date');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('member_name_snapshot')->nullable();
            $table->string('member_profile_pic_snapshot')->nullable();
            $table->unsignedBigInteger('membership_id')->nullable();
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('payment_method');
            $table->decimal('amount', 10, 2);
            $table->string('package_name_snapshot')->nullable();
            $table->string('package_category_snapshot')->nullable();
            $table->string('status')->default('Complete');
            $table->string('reference_number')->nullable();
            $table->timestamps();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->nullable();
            $table->date('date');
            $table->time('time_in')->nullable();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('members');
        parent::tearDown();
    }

    public function test_upgrade_reuses_membership_and_charges_only_the_remaining_balance(): void
    {
        $member = $this->createMember();
        $monthly = $this->createPlan('Monthly', 500, 30);
        $annual = $this->createPlan('Annual', 6000, 365);
        $membership = $this->createMembership($member, $monthly);

        Transaction::create([
            'transaction_id' => 'TXN-001',
            'transaction_date' => today()->toDateString(),
            'member_id' => $member->id,
            'member_name_snapshot' => 'Ada Lovelace',
            'membership_id' => $membership->id,
            'type' => 'Subscription Payment',
            'description' => 'Monthly Plan Payment',
            'payment_method' => 'Cash',
            'amount' => 500,
            'package_name_snapshot' => 'Monthly',
            'package_category_snapshot' => 'with_coach',
            'status' => 'Complete',
        ]);

        $this->putJson("/api/memberships/{$membership->id}", [
            'plan_id' => $annual->id,
            'payment_method' => 'Gcash',
            'reference_number' => 'UPGRADE-001',
        ])
            ->assertOk()
            ->assertJsonPath('amount_charged', 5500)
            ->assertJsonPath('membership.id', $membership->id)
            ->assertJsonPath('membership.plan_type', 'Annual');

        $this->assertDatabaseCount('memberships', 1);
        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'plan_id' => $annual->id,
            'plan_type' => 'Annual',
            'start_date' => today()->toDateString(),
            'end_date' => today()->addDays(365)->toDateString(),
        ]);
        $this->assertDatabaseHas('transactions', [
            'transaction_id' => 'TXN-002',
            'membership_id' => $membership->id,
            'type' => 'Subscription Upgrade',
            'amount' => '5500.00',
            'package_name_snapshot' => 'Annual',
            'package_category_snapshot' => 'normal',
        ]);

        $membershipResponse = $this->getJson('/api/memberships')->assertOk();
        $this->assertEquals(6000, (float) $membershipResponse->json('0.amount_paid'));
        $this->assertTrue($membershipResponse->json('0.has_upgraded'));

        $this->getJson('/api/transactions')
            ->assertOk()
            ->assertJsonPath('0.package_details.title', 'Annual Package Payment + Upgraded');
        $this->getJson('/api/reports?start=' . today()->toDateString() . '&end=' . today()->toDateString())
            ->assertOk()
            ->assertJsonFragment(['title' => 'Annual Package Payment + Upgraded', 'category' => 'Normal Subscription'])
            ->assertJsonFragment(['title' => 'Annual', 'category' => 'Normal Subscription + Upgraded']);
    }

    public function test_deleting_a_member_preserves_their_name_in_transactions_and_reports(): void
    {
        $member = $this->createMember();
        $plan = $this->createPlan('Monthly', 500, 30);
        $membership = $this->createMembership($member, $plan);
        Transaction::create([
            'transaction_id' => 'TXN-001',
            'transaction_date' => today()->toDateString(),
            'member_id' => $member->id,
            'membership_id' => $membership->id,
            'type' => 'Subscription Payment',
            'description' => 'Monthly Plan Payment',
            'payment_method' => 'Cash',
            'amount' => 500,
            'package_name_snapshot' => 'Monthly',
            'package_category_snapshot' => 'with_coach',
            'status' => 'Complete',
        ]);

        $this->deleteJson("/api/members/{$member->id}")->assertOk();
        $this->assertDatabaseHas('transactions', [
            'transaction_id' => 'TXN-001',
            'member_id' => null,
            'member_name_snapshot' => 'Ada Lovelace',
            'member_profile_pic_snapshot' => '/profiles/ada.jpg',
        ]);
        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'member_id' => null,
            'member_name_snapshot' => 'Ada Lovelace',
            'member_profile_pic_snapshot' => '/profiles/ada.jpg',
            'status' => 'Cancelled',
        ]);
        $this->getJson('/api/memberships')
            ->assertOk()
            ->assertExactJson([]);

        $transactionsResponse = $this->getJson('/api/transactions')->assertOk();
        $this->assertSame('Ada Lovelace', $transactionsResponse->json()[0]['member_name_snapshot']);

        $this->getJson('/api/reports?start=' . today()->toDateString() . '&end=' . today()->toDateString())
            ->assertOk()
            ->assertJsonPath('Payments.rows.0.2.name', 'Ada Lovelace')
            ->assertJsonPath('Payments.rows.0.2.profile_pic', '/profiles/ada.jpg')
            ->assertJsonPath('Memberships.rows.0.0.name', 'Ada Lovelace')
            ->assertJsonPath('Memberships.rows.0.0.profile_pic', '/profiles/ada.jpg');
    }

    public function test_expired_memberships_remain_available_in_packages_for_renewal(): void
    {
        $member = $this->createMember();
        $plan = $this->createPlan('Monthly', 500, 30);
        $membership = $this->createMembership($member, $plan);
        $membership->update([
            'start_date' => today()->subDays(60)->toDateString(),
            'end_date' => today()->subDays(30)->toDateString(),
        ]);

        $this->getJson('/api/memberships')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $membership->id)
            ->assertJsonPath('0.status', 'Expired');

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'member_id' => $member->id,
            'end_date' => today()->subDays(30)->toDateString(),
        ]);
    }

    private function createMember(): Member
    {
        return Member::create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.test',
            'phone' => '0000000000',
            'profile_pic' => '/profiles/ada.jpg',
            'plan' => 'Monthly',
            'status' => 'Active',
        ]);
    }

    private function createPlan(string $name, int $price, int $durationDays): Plan
    {
        return Plan::create([
            'name' => $name,
            'price' => $price,
            'duration_days' => $durationDays,
            'category' => $name === 'Monthly' ? 'with_coach' : 'normal',
        ]);
    }

    private function createMembership(Member $member, Plan $plan): Membership
    {
        return Membership::create([
            'member_id' => $member->id,
            'member_name_snapshot' => 'Ada Lovelace',
            'plan_id' => $plan->id,
            'plan_type' => $plan->name,
            'start_date' => today()->toDateString(),
            'end_date' => today()->addDays(30)->toDateString(),
            'status' => 'Active',
            'payment_method' => 'Cash',
            'color' => '#f59e0b',
        ]);
    }
}
