<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('exercise_id')->unique(); // Matches the "0001" ID
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('body_part')->nullable();
            $table->string('equipment')->nullable();
            $table->string('gif_path'); // This maps to your frontend videos!
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exercises');
    }
};