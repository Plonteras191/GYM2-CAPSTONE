<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When the member consented to face enrollment. Face photos are biometric
 * data (sensitive personal information under the Data Privacy Act,
 * RA 10173), so the system records that consent was given before saving one.
 * Empty for members enrolled before this was recorded.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->timestamp('biometric_consent_at')->nullable()->after('enrolled_face_id');
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('biometric_consent_at');
        });
    }
};
