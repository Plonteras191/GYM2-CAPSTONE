<?php

namespace Tests\Feature;

use App\Models\Member\Transaction;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TransactionRefundTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique();
            $table->date('transaction_date');
            $table->unsignedBigInteger('member_id')->nullable();
            $table->unsignedBigInteger('membership_id')->nullable();
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('payment_method');
            $table->decimal('amount', 10, 2);
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

    public function test_refund_creates_a_separate_record_and_cannot_be_applied_twice(): void
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

        $this->postJson("/api/transactions/{$transaction->id}/refund")
            ->assertCreated()
            ->assertJsonPath('refund.type', 'Refund')
            ->assertJsonPath('refund.amount', -1250);

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'Refunded',
        ]);
        $this->assertDatabaseHas('transactions', [
            'transaction_id' => 'TXN-002',
            'type' => 'Refund',
            'description' => 'Refund for TXN-001',
            'amount' => '-1250.00',
            'status' => 'Complete',
        ]);
        $this->assertDatabaseCount('transactions', 2);

        $this->postJson("/api/transactions/{$transaction->id}/refund")
            ->assertUnprocessable();

        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_package_category_determines_transaction_type_and_status(): void
    {
        $plans = [
            ['name' => 'Day Pass', 'category' => 'walk_in', 'expected_type' => 'Walk-In'],
            ['name' => 'Monthly', 'category' => 'normal', 'expected_type' => 'Subscription'],
            ['name' => 'Student Offer', 'category' => 'other', 'expected_type' => 'Packages'],
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
}
