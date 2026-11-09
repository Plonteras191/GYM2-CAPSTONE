<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_event_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('color', 7)->default('#3b82f6');
            $table->timestamps();
        });

        Schema::create('coach_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('coach_event_categories')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_events');
        Schema::dropIfExists('coach_event_categories');
    }
};
