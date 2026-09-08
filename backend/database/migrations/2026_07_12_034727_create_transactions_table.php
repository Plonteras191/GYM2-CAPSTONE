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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique(); // To store "TXN-001" format
            $table->date('transaction_date');
            
            // Nullable foreign key for walk-in guests!
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete(); 
            
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('payment_method');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('Complete');
            $table->string('reference_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
