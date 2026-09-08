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
        Schema::create('gesture_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('exercise_sessions')->onDelete('cascade');
            $table->string('exercise_type'); // e.g., Bicep Curl
            $table->decimal('confidence_score', 5, 2); // e.g., 98.50
            $table->integer('rep_count');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gesture_logs');
    }
};
