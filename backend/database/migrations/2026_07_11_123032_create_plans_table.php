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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->integer('duration_days');
            $table->timestamps();
        });

        // Auto-insert the default gym plans so the database isn't empty!
        \Illuminate\Support\Facades\DB::table('plans')->insert([
            ['name' => 'Daily', 'price' => 50, 'duration_days' => 1],
            ['name' => 'Monthly', 'price' => 600, 'duration_days' => 30],
            ['name' => 'Annual', 'price' => 6000, 'duration_days' => 365],
            ['name' => 'With Coach', 'price' => 2500, 'duration_days' => 30],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
