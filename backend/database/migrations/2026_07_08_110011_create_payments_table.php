<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('txn_id')->unique(); // e.g., TXN-001
            $table->foreignId('member_id')->nullable()->constrained('members')->onDelete('set null');
            $table->string('guest_name')->nullable(); // For walk-ins
            $table->string('type'); // Subscription Payment, Fee, Refund
            $table->string('description')->nullable();
            $table->string('method'); // Cash, Gcash, Card
            $table->decimal('amount', 10, 2); 
            $table->string('status')->default('Complete');
            $table->string('reference_no')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
