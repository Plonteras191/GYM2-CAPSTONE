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
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->string('plan_type'); // e.g., Monthly, With Coach
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('Active');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->nullable();
            $table->string('color')->default('#f59e0b'); // Matches your calendar colors
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};
