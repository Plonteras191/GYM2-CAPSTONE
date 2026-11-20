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
        // Add this line to drop the stubborn existing table first!
        Schema::dropIfExists('memberships');

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade'); 
            // The link to plans is added by the next migration (create_plans_table):
            // plans does not exist yet at this point on a fresh database.
            $table->foreignId('plan_id')->nullable();
            $table->string('plan_type'); 
            $table->date('start_date');
            $table->date('end_date'); 
            $table->string('status')->default('Active');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->default('Cash');
            $table->string('color')->default('#f59e0b');
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
