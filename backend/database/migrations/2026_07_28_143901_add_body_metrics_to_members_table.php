<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Adding the missing anthropometric columns
            $table->date('dob')->nullable();
            $table->decimal('height', 5, 2)->nullable(); // e.g., 170.50 cm
            $table->decimal('weight', 5, 2)->nullable(); // e.g., 65.50 kg
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Drop them if we ever need to rollback
            $table->dropColumn(['dob', 'height', 'weight']);
        });
    }
};
