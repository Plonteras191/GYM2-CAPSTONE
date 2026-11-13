<?php

namespace Tests\Feature;

use App\Models\Auth\Admin;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use App\Support\MemberMediaStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceSafeguardsTest extends TestCase
{
    use RefreshDatabase;

    private const PNG_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    private array $createdFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-13 10:00:00');
    }

    protected function tearDown(): void
    {
        File::delete($this->createdFiles);
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function member(string $name = 'Juan', string $status = 'Active'): Member
    {
        return Member::create([
            'first_name' => $name,
            'last_name' => 'Reyes',
            'email' => strtolower($name) . '@example.com',
            'phone' => '09170000000',
            'plan' => 'None',
            'status' => $status,
        ]);
    }

    private function actingAsSavedAdmin(): Admin
    {
        $admin = Admin::create(['name' => 'Front Desk', 'email' => 'desk@example.com', 'password' => bcrypt('secret-password')]);
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function memberPayload(array $overrides = []): array
    {
        return $overrides + [
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'phone' => '09170000000',
            'plan' => 'Monthly',
            'status' => 'Active',
        ];
    }

    // ---- Manual check-in ---------------------------------------------------

    public function test_manual_check_in_records_who_did_it_and_why(): void
    {
        $admin = $this->actingAsSavedAdmin();
        $member = $this->member('Maria', 'Inactive');

        $this->postJson('/api/attendance/manual', ['member_id' => $member->id, 'reason' => ' Wearing a face mask '])
            ->assertCreated()
            ->assertJson(['status' => 'logged', 'reactivated' => true]);

        $attendance = Attendance::sole();
        $this->assertSame('manual', $attendance->source);
        $this->assertSame('Wearing a face mask', $attendance->reason);
        $this->assertSame($admin->id, $attendance->recorded_by_admin_id);
        $this->assertNull($attendance->camera_source);
        $this->assertSame('Active', $member->fresh()->status);
    }

    public function test_manual_check_in_requires_login_and_a_reason(): void
    {
        $member = $this->member();

        $this->postJson('/api/attendance/manual', ['member_id' => $member->id, 'reason' => 'Camera offline'])
            ->assertUnauthorized();

        $this->actingAsSavedAdmin();
        $this->postJson('/api/attendance/manual', ['member_id' => $member->id])->assertStatus(422);
        $this->postJson('/api/attendance/manual', ['member_id' => $member->id, 'reason' => ' '])->assertStatus(422);
        $this->postJson('/api/attendance/manual', ['member_id' => 999, 'reason' => 'Camera offline'])->assertStatus(422);

        $this->assertSame(0, Attendance::count());
    }

    public function test_manual_check_in_follows_the_same_rules_as_the_camera(): void
    {
        $this->actingAsSavedAdmin();
        $member = $this->member();

        // Already checked in by the camera today.
        $this->withAiEngineToken()->postJson('/api/ai/log-attendance', ['member_id' => $member->id])
            ->assertJson(['status' => 'logged']);
        $this->postJson('/api/attendance/manual', ['member_id' => $member->id, 'reason' => 'Camera offline'])
            ->assertStatus(409)
            ->assertJson(['status' => 'already_logged']);

        // Outside operating hours.
        Carbon::setTestNow('2026-11-13 23:00:00');
        $this->postJson('/api/attendance/manual', ['member_id' => $this->member('Late')->id, 'reason' => 'Camera offline'])
            ->assertStatus(422)
            ->assertJson(['status' => 'outside_hours']);

        $this->assertSame(1, Attendance::count());
    }

    // ---- Biometric consent -------------------------------------------------

    public function test_face_is_not_saved_without_the_members_consent(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/members', $this->memberPayload(['enrolled_face_id' => self::PNG_DATA_URI]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('biometric_consent');

        $this->assertSame(0, Member::count());
    }

    public function test_consent_time_is_recorded_when_a_face_is_enrolled(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/members', $this->memberPayload([
            'enrolled_face_id' => self::PNG_DATA_URI,
            'biometric_consent' => true,
        ]))->assertCreated();
        $this->createdFiles[] = storage_path('app/private/' . ltrim($response->json('member.enrolled_face_id'), '/'));

        $this->assertSame('2026-11-13 10:00:00', (string) Member::sole()->biometric_consent_at);
    }

    public function test_member_without_a_face_needs_no_consent(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/members', $this->memberPayload())->assertCreated();

        $this->assertNull(Member::sole()->biometric_consent_at);
    }

    public function test_replacing_a_face_needs_consent_again(): void
    {
        $this->actingAsAdmin();
        $member = $this->member();

        $this->putJson("/api/members/{$member->id}", ['enrolled_face_id' => self::PNG_DATA_URI])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('biometric_consent');
        $this->assertNull($member->fresh()->enrolled_face_id);

        $response = $this->putJson("/api/members/{$member->id}", [
            'enrolled_face_id' => self::PNG_DATA_URI,
            'biometric_consent' => true,
        ])->assertOk();
        $this->createdFiles[] = storage_path('app/private/' . ltrim($response->json('member.enrolled_face_id'), '/'));

        $this->assertNotNull($member->fresh()->biometric_consent_at);
    }

    // ---- Face photo privacy --------------------------------------------------

    public function test_new_face_photos_are_stored_outside_the_public_web_folder(): void
    {
        $media = new MemberMediaStorage();

        $path = $media->storeFace(self::PNG_DATA_URI);
        $this->createdFiles[] = storage_path('app/private/' . ltrim($path, '/'));

        $this->assertFileExists(storage_path('app/private/' . ltrim($path, '/')));
        $this->assertFileDoesNotExist(public_path(ltrim($path, '/')));
    }

    public function test_faces_secure_command_moves_old_public_photos_to_private_storage(): void
    {
        // Temporary folders, so the real face photos on this machine are not touched.
        $sandbox = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'faces_secure_' . uniqid();
        File::ensureDirectoryExists($sandbox . '/public/faces');
        File::ensureDirectoryExists($sandbox . '/storage');
        $this->app->usePublicPath($sandbox . '/public');
        $this->app->useStoragePath($sandbox . '/storage');
        File::put($sandbox . '/public/faces/old_face.png', 'old photo');

        try {
            Artisan::call('faces:secure');

            $this->assertFileDoesNotExist($sandbox . '/public/faces/old_face.png');
            $this->assertSame('old photo', File::get($sandbox . '/storage/app/private/faces/old_face.png'));

            // A photo still in the old folder can be deleted too.
            File::put($sandbox . '/public/faces/legacy.png', 'legacy');
            $this->assertTrue((new MemberMediaStorage())->deleteFace('/faces/legacy.png'));
            $this->assertTrue((new MemberMediaStorage())->deleteFace('/faces/old_face.png'));
            $this->assertFalse((new MemberMediaStorage())->deleteFace('/faces/../../outside.txt'));
        } finally {
            File::deleteDirectory($sandbox);
        }
    }
}
