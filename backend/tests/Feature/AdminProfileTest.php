<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
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

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function test_admin_can_update_account_details_and_system_logo(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/profile', [
            'name' => 'Updated Admin',
            'email' => 'updated@example.test',
            'logo' => UploadedFile::fake()->createWithContent(
                'logo.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=')
            ),
        ]);

        $response->assertOk()
            ->assertJsonPath('admin.name', 'Updated Admin')
            ->assertJsonPath('admin.email', 'updated@example.test');
        $this->assertStringStartsWith('/api/branding/logo?v=', $response->json('admin.logo_url'));

        $admin->refresh();
        $this->assertSame('Updated Admin', $admin->name);
        $this->assertSame('updated@example.test', $admin->email);
        Storage::disk('public')->assertExists($admin->logo_path);

        $this->get('/api/branding')->assertOk()->assertJsonPath('logo_url', $response->json('admin.logo_url'));
        $this->get('/api/branding/logo')->assertOk();
        $this->postJson('/api/auth/login', [
            'email' => 'updated@example.test',
            'password' => 'initial-password',
        ])->assertOk()->assertJsonPath('admin.email', 'updated@example.test');
    }

    public function test_admin_must_supply_the_current_password_and_a_confirmed_new_password_of_at_least_eight_characters(): void
    {
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/password', [
            'current_password' => 'wrong-password',
            'new_password' => 'a-new-password-that-is-long',
            'new_password_confirmation' => 'a-new-password-that-is-long',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->postJson('/api/admin/password', [
            'current_password' => 'initial-password',
            'new_password' => 'seven77',
            'new_password_confirmation' => 'seven77',
        ])->assertUnprocessable()->assertJsonValidationErrors('new_password');

        $this->postJson('/api/admin/password', [
            'current_password' => 'initial-password',
            'new_password' => 'eight888',
            'new_password_confirmation' => 'eight888',
        ])->assertOk();

        $this->assertTrue(Hash::check('eight888', $admin->fresh()->password));

        $this->postJson('/api/admin/password', [
            'current_password' => 'eight888',
            'new_password' => 'a-new-password-that-is-long',
            'new_password_confirmation' => 'a-new-password-that-is-long',
        ])->assertOk();

        $this->assertTrue(Hash::check('a-new-password-that-is-long', $admin->fresh()->password));
    }

    public function test_applying_a_new_logo_persists_it_as_the_system_branding(): void
    {
        Storage::fake('public');
        $admin = $this->createAdmin();
        Sanctum::actingAs($admin);
        $oldLogo = UploadedFile::fake()->createWithContent(
            'old-logo.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=')
        );
        $oldLogoPath = $oldLogo->store('admin-logos', 'public');
        $admin->logo_path = $oldLogoPath;
        $admin->save();

        $response = $this->postJson('/api/admin/logo', [
            'logo' => UploadedFile::fake()->createWithContent(
                'new-logo.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=')
            ),
        ]);

        $response->assertOk();
        $admin->refresh();
        Storage::disk('public')->assertExists($admin->logo_path);
        Storage::disk('public')->assertMissing($oldLogoPath);
        $this->getJson('/api/branding')->assertOk()->assertJsonPath('logo_url', $response->json('logo_url'));
    }

    private function createAdmin(): Admin
    {
        return Admin::create([
            'name' => 'Initial Admin',
            'email' => 'admin@example.test',
            'password' => 'initial-password',
        ]);
    }
}
