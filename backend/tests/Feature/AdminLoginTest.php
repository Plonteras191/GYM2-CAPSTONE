<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminLoginTest extends TestCase
{
    use RefreshDatabase;

    private const EMAIL = 'admin@example.com';
    private const PASSWORD = 'correct-horse-battery';

    protected function setUp(): void
    {
        parent::setUp();
        Admin::create(['name' => 'Gym Owner', 'email' => self::EMAIL, 'password' => self::PASSWORD]);
    }

    public function test_email_and_password_sign_the_admin_in_without_a_verification_code(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/login', ['email' => self::EMAIL, 'password' => self::PASSWORD])
            ->assertOk()
            ->assertJsonPath('admin.email', self::EMAIL)
            ->assertJsonPath('message', 'Authentication successful');

        $this->assertNotEmpty($response->json('token'));
        $this->assertArrayNotHasKey('challenge_id', $response->json());
        $this->assertArrayNotHasKey('verification_pin', $response->json());
        $this->assertArrayNotHasKey('password', $response->json('admin'));
        Mail::assertNothingSent();
        $this->assertSame(0, DB::table('auth_verification_codes')->count());
    }

    public function test_the_returned_token_opens_the_admin_area(): void
    {
        $token = $this->postJson('/api/auth/login', ['email' => self::EMAIL, 'password' => self::PASSWORD])->json('token');

        $this->withToken($token)->getJson('/api/admin/me')
            ->assertOk()
            ->assertJsonPath('email', self::EMAIL);
    }

    public function test_a_wrong_password_is_refused_and_no_token_is_issued(): void
    {
        $this->postJson('/api/auth/login', ['email' => self::EMAIL, 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertSame(0, DB::table('personal_access_tokens')->count());
    }

    public function test_an_unknown_email_gets_the_same_refusal(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => self::PASSWORD])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Invalid email or password. Please try again.');
    }

    public function test_the_old_login_verification_step_no_longer_exists(): void
    {
        $this->postJson('/api/auth/login/verify', ['challenge_id' => 1, 'pin' => '123456'])->assertNotFound();
    }

    public function test_the_password_reset_pin_is_still_available(): void
    {
        Mail::fake();
        config(['mail.default' => 'array', 'auth.verification_mode' => 'display_pin']);
        $this->app['env'] = 'local';

        $this->postJson('/api/auth/password-reset/request', ['email' => self::EMAIL])
            ->assertOk()
            ->assertJsonStructure(['message', 'verification_pin']);
        $this->assertSame(1, DB::table('password_reset_pins')->count());
    }
}
