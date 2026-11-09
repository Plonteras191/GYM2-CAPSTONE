<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use App\Models\Member\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    private const AI_KEY = 'test-ai-service-key';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ai_engine.key' => self::AI_KEY]);
    }

    private function actingAsAdmin(): void
    {
        Sanctum::actingAs(Admin::create([
            'name' => 'Admin',
            'email' => 'admin@test.local',
            'password' => 'secret-password',
        ]));
    }

    private function makeMember(array $overrides = []): Member
    {
        return Member::create(array_merge([
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'email' => uniqid() . '@test.local',
            'phone' => '09170000000',
            'plan' => 'Monthly',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_admin_routes_reject_unauthenticated_requests(): void
    {
        $this->makeMember();

        foreach ([
            ['GET', '/api/members'],
            ['POST', '/api/members'],
            ['DELETE', '/api/members/1'],
            ['GET', '/api/transactions'],
            ['POST', '/api/plans/bulk-update'],
            ['GET', '/api/reports'],
            ['GET', '/api/dashboard'],
            ['PUT', '/api/workouts/1/manual-verify'],
        ] as [$method, $uri]) {
            $this->json($method, $uri)->assertStatus(401);
        }

        $this->assertDatabaseCount('members', 1);
    }

    public function test_admin_routes_work_with_valid_token(): void
    {
        $this->actingAsAdmin();
        $this->getJson('/api/members')->assertOk();
        $this->getJson('/api/transactions')->assertOk();
    }

    public function test_ai_routes_require_the_service_key(): void
    {
        $member = $this->makeMember();

        $this->getJson('/api/ai/members-faces')->assertStatus(401);
        $this->getJson('/api/ai/members-faces', ['X-AI-Key' => 'wrong'])->assertStatus(401);
        $this->postJson('/api/ai/log-workout', ['member_id' => $member->id, 'exercise' => 'SQUAT'])->assertStatus(401);

        $this->getJson('/api/ai/members-faces', ['X-AI-Key' => self::AI_KEY])->assertOk();
        $this->postJson('/api/ai/log-workout', ['member_id' => $member->id, 'exercise' => 'SQUAT'], ['X-AI-Key' => self::AI_KEY])
            ->assertOk();
    }

    public function test_ai_routes_fail_closed_when_no_key_is_configured(): void
    {
        config(['services.ai_engine.key' => null]);
        $this->getJson('/api/ai/members-faces', ['X-AI-Key' => ''])->assertStatus(401);
    }

    public function test_log_attendance_validates_member_id(): void
    {
        $this->postJson('/api/ai/log-attendance', ['member_id' => 99999], ['X-AI-Key' => self::AI_KEY])
            ->assertStatus(422);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'x@test.local', 'password' => 'wrong'])->assertStatus(422);
        }
        $this->postJson('/api/auth/login', ['email' => 'x@test.local', 'password' => 'wrong'])->assertStatus(429);
    }

    private function pngBytes(): string
    {
        $img = imagecreatetruecolor(10, 10);
        ob_start();
        imagepng($img);
        return ob_get_clean();
    }

    private function memberPayload(array $extra): array
    {
        return array_merge([
            'first_name' => 'A', 'last_name' => 'B', 'email' => uniqid() . '@test.local',
            'phone' => '0917', 'plan' => 'Monthly', 'status' => 'Active',
        ], $extra);
    }

    public function test_real_image_named_php_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/api/members', $this->memberPayload([
            'profile_pic' => UploadedFile::fake()->createWithContent('shell.php', $this->pngBytes()),
        ]), ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_profile_picture_is_saved_under_random_server_name(): void
    {
        $this->actingAsAdmin();

        $response = $this->post('/api/members', $this->memberPayload([
            'profile_pic' => UploadedFile::fake()->createWithContent('../../evil name.png', $this->pngBytes()),
        ]), ['Accept' => 'application/json'])->assertCreated();

        $path = $response->json('member.profile_pic');
        $this->assertMatchesRegularExpression('#^/profiles/[A-Za-z0-9]{40}\.png$#', $path);

        File::delete(public_path(ltrim($path, '/')));
    }

    public function test_non_image_upload_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->post('/api/members', [
            'first_name' => 'A', 'last_name' => 'B', 'email' => 'bad@test.local',
            'phone' => '0917', 'plan' => 'Monthly', 'status' => 'Active',
            'profile_pic' => UploadedFile::fake()->createWithContent('shell.php', '<?php system($_GET["c"]); ?>'),
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_fake_face_image_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/members', [
            'first_name' => 'A', 'last_name' => 'B', 'email' => 'face@test.local',
            'phone' => '0917', 'plan' => 'Monthly', 'status' => 'Active',
            'enrolled_face_id' => 'data:image/png;base64,' . base64_encode('<?php echo "pwned"; ?>'),
        ])->assertStatus(422);
    }

    public function test_real_webcam_face_capture_still_enrolls(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/members', $this->memberPayload([
            'enrolled_face_id' => 'data:image/png;base64,' . base64_encode($this->pngBytes()),
        ]))->assertCreated();

        $path = $response->json('member.enrolled_face_id');
        $this->assertMatchesRegularExpression('#^/faces/[A-Za-z0-9]{40}\.png$#', $path);
        $this->assertFileExists(public_path(ltrim($path, '/')));

        File::delete(public_path(ltrim($path, '/')));
    }

    public function test_client_cannot_set_face_path_to_delete_arbitrary_files(): void
    {
        $this->actingAsAdmin();

        $victim = public_path('security-test-victim.txt');
        file_put_contents($victim, 'do not delete');

        $member = $this->makeMember();
        $this->postJson("/api/members/{$member->id}", [
            '_method' => 'PUT',
            'enrolled_face_id' => '/security-test-victim.txt',
        ])->assertStatus(422);
        $this->assertNull($member->fresh()->enrolled_face_id);

        // Even if a bad path were already stored, deletion must stay inside public/faces.
        $member->forceFill(['enrolled_face_id' => '/security-test-victim.txt'])->save();
        $this->deleteJson("/api/members/{$member->id}")->assertOk();

        $this->assertFileExists($victim);
        File::delete($victim);
    }

    public function test_negative_transaction_amount_is_rejected(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/transactions', [
            'transaction_date' => '2026-11-09', 'type' => 'Refund', 'payment_method' => 'Cash',
            'amount' => -500, 'status' => 'Complete',
        ])->assertStatus(422);
    }
}
