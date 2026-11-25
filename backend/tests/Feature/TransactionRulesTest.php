<?php

namespace Tests\Feature;

use App\Models\Member\Transaction;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TransactionRulesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsAdmin();

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->date('transaction_date');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->string('member_name_snapshot')->nullable();
            $table->string('member_email_snapshot')->nullable();
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

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->integer('duration_days');
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('plans');
        parent::tearDown();
    }

    public function test_payments_cannot_be_refunded(): void
    {
        // Muscle Bros does not refund; a subscription is paused instead.
        $transaction = Transaction::create([
            'transaction_id' => 'TXN-001',
            'transaction_date' => '2026-10-21',
            'type' => 'Subscription Payment',
            'description' => 'Monthly Plan Payment',
            'payment_method' => 'Cash',
            'amount' => 1250,
            'status' => 'Complete',
        ]);

        $this->postJson("/api/transactions/{$transaction->id}/refund")->assertNotFound();

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'amount' => 1250, 'status' => 'Complete']);
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_money_records_cannot_be_edited_or_deleted(): void
    {
        $transaction = Transaction::create([
            'transaction_id' => 'TXN-001',
            'transaction_date' => '2026-10-21',
            'type' => 'Subscription Payment',
            'description' => 'Monthly Plan Payment',
            'payment_method' => 'Cash',
            'amount' => 1250,
            'status' => 'Complete',
        ]);

        $this->putJson("/api/transactions/{$transaction->id}", [
            'transaction_date' => '2026-10-21', 'type' => 'Subscription Payment',
            'payment_method' => 'Cash', 'amount' => 1, 'status' => 'Complete',
        ])->assertNotFound();  // there is no edit route
        $this->deleteJson("/api/transactions/{$transaction->id}")->assertNotFound();  // and no delete route

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'amount' => 1250, 'status' => 'Complete']);
    }

    public function test_package_category_determines_transaction_type_and_status(): void
    {
        $plans = [
            ['name' => 'Day Pass', 'category' => 'walk_in', 'expected_type' => 'Walk-In'],
            ['name' => 'Monthly', 'category' => 'normal', 'expected_type' => 'Subscription'],
            ['name' => 'Daily Pass', 'category' => 'normal', 'expected_type' => 'Walk-In'],
        ];

        foreach ($plans as $index => $plan) {
            $planId = \Illuminate\Support\Facades\DB::table('plans')->insertGetId([
                'name' => $plan['name'],
                'price' => 150,
                'duration_days' => 30,
                'category' => $plan['category'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $transactionData = [
                'plan_id' => $planId,
                'description' => $plan['name'],
                'payment_method' => 'Cash',
                'amount' => 150,
                'status' => $index === 0 ? 'Pending' : 'Failed',
            ];
            if ($index > 0) {
                $transactionData['transaction_date'] = '2026-10-26';
            }

            $response = $this->postJson('/api/transactions', $transactionData)
                ->assertCreated()
                ->assertJsonPath('transaction.status', 'Complete')
                ->assertJsonPath('transaction.type', $plan['expected_type']);
            if ($index === 0) {
                $response->assertJsonPath('transaction.transaction_date', now()->toDateString());
            }
        }

        $this->assertDatabaseCount('transactions', 3);
        $this->assertDatabaseMissing('transactions', ['status' => 'Pending']);
        $this->assertDatabaseMissing('transactions', ['status' => 'Failed']);
    }

    public function test_transaction_amount_must_be_within_the_package_price_limit(): void
    {
        $planId = \Illuminate\Support\Facades\DB::table('plans')->insertGetId([
            'name' => 'Monthly',
            'price' => 150,
            'duration_days' => 30,
            'category' => 'normal',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $transactionData = [
            'plan_id' => $planId,
            'payment_method' => 'Cash',
        ];

        $this->postJson('/api/transactions', [...$transactionData, 'amount' => -1])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');
        $this->postJson('/api/transactions', [...$transactionData, 'amount' => 10000000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('amount');

        $response = $this->postJson('/api/transactions', [...$transactionData, 'amount' => 9999999.99])
            ->assertCreated();
        $this->assertSame(9999999.99, (float) $response->json('transaction.amount'));
    }
}
