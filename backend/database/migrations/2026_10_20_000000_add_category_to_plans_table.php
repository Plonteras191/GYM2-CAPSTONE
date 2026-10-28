<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
        });

        DB::table('plans')
            ->whereRaw('LOWER(TRIM(name)) = ?', ['with coach'])
            ->update(['category' => 'with_coach']);
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['category', 'category_detail']);
        });
    }
};
