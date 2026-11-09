<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PasswordResetPinLimitTest extends TestCase
{
    private const EMAIL = 'admin@example.com';
    private const PIN = '123456';

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('logo_path')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('password_reset_pins', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('pin_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Admin::create(['name' => 'Admin', 'email' => self::EMAIL, 'password' => 'old-password']);
        DB::table('password_reset_pins')->insert([
            'email' => self::EMAIL,
            'pin_hash' => Hash::make(self::PIN),
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_reset_pin_locks_after_five_wrong_guesses(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/password-reset/verify', ['email' => self::EMAIL, 'pin' => '000000'])
                ->assertUnprocessable()
                ->assertJson(['message' => 'That PIN is incorrect.']);
        }

        // Even the correct PIN no longer works.
        $this->postJson('/api/auth/password-reset/verify', ['email' => self::EMAIL, 'pin' => self::PIN])
            ->assertUnprocessable();
        $this->postJson('/api/auth/password-reset', [
            'email' => self::EMAIL,
            'pin' => self::PIN,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('old-password', Admin::first()->password));
    }

    public function test_correct_pin_still_resets_the_password(): void
    {
        $this->postJson('/api/auth/password-reset/verify', ['email' => self::EMAIL, 'pin' => '000000'])
            ->assertUnprocessable();
        $this->postJson('/api/auth/password-reset/verify', ['email' => self::EMAIL, 'pin' => self::PIN])
            ->assertOk();
        $this->postJson('/api/auth/password-reset', [
            'email' => self::EMAIL,
            'pin' => self::PIN,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password-123', Admin::first()->password));
    }

    public function test_auth_routes_are_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'x']);
        }

        $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'x'])
            ->assertStatus(429);
    }
}
