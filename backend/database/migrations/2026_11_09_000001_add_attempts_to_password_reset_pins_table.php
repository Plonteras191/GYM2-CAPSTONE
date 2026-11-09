<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('password_reset_pins', 'attempts')) {
            Schema::table('password_reset_pins', function (Blueprint $table) {
                $table->unsignedTinyInteger('attempts')->default(0)->after('pin_hash');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('password_reset_pins', 'attempts')) {
            Schema::table('password_reset_pins', function (Blueprint $table) {
                $table->dropColumn('attempts');
            });
        }
    }
};
