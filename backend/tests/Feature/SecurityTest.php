<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use App\Models\Member\Member;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Security checks not covered by ApiAccessControlTest / MemberMediaSecurityTest.
 */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    private function pngBytes(): string
    {
        $img = imagecreatetruecolor(10, 10);
        ob_start();
        imagepng($img);
        return ob_get_clean();
    }

    private function memberPayload(array $extra = []): array
    {
        return array_merge([
            'first_name' => 'Juan', 'last_name' => 'Dela Cruz', 'email' => uniqid() . '@test.local',
            'phone' => '09170000000', 'plan' => 'Monthly', 'status' => 'Active',
        ], $extra);
    }

    public function test_login_is_rate_limited(): void
    {
        $limited = false;
        for ($i = 0; $i < 15; $i++) {
            $status = $this->postJson('/api/auth/login', ['email' => 'x@test.local', 'password' => 'wrong'])->status();
            if ($status === 429) {
                $limited = true;
                break;
            }
        }
        $this->assertTrue($limited, 'Login should be throttled after repeated failures.');
    }

    public function test_profile_picture_named_php_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/api/members', $this->memberPayload([
            'profile_pic' => UploadedFile::fake()->createWithContent('shell.php', $this->pngBytes()),
        ]), ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_profile_picture_is_saved_under_random_server_name(): void
    {
        $this->actingAsAdmin();

        $path = $this->post('/api/members', $this->memberPayload([
            'profile_pic' => UploadedFile::fake()->createWithContent('../../evil name.png', $this->pngBytes()),
        ]), ['Accept' => 'application/json'])->assertCreated()->json('member.profile_pic');

        $this->assertMatchesRegularExpression('#^/profiles/\d+_profile_[A-Za-z0-9]{16}\.png$#', $path);
        File::delete(public_path(ltrim($path, '/')));
    }

    public function test_oversized_profile_picture_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/api/members', $this->memberPayload([
            'profile_pic' => UploadedFile::fake()->create('huge.png', 6000, 'image/png'),
        ]), ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_negative_subscription_payment_is_rejected(): void
    {
        $this->actingAsAdmin();
        $member = Member::create($this->memberPayload());

        $this->postJson('/api/memberships', [
            'member_id' => $member->id, 'plan_type' => 'Monthly', 'start_date' => '2026-11-09',
            'status' => 'Active', 'payment_method' => 'Cash', 'color' => '#000000', 'amount' => -500,
        ])->assertStatus(422);

        $this->assertDatabaseCount('memberships', 0);
    }

    public function test_login_tokens_expire(): void
    {
        $this->assertNotNull(config('sanctum.expiration'));
        $this->assertGreaterThan(0, (int) config('sanctum.expiration'));
    }

    public function test_seeder_never_creates_a_known_default_password(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = Admin::first();
        $this->assertNotNull($admin);
        foreach (['admin123', 'password', 'admin'] as $weak) {
            $this->assertFalse(Hash::check($weak, $admin->password), "Seeded admin must not use '{$weak}'.");
        }
    }
}
