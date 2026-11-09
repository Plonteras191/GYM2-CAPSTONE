<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use App\Support\MemberMediaStorage;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MemberMediaSecurityTest extends TestCase
{
    /** A 1x1 transparent PNG. */
    private const PNG_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

    private string $sentinel;
    private array $createdFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsAdmin();

        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('plan')->default('None');
            $table->string('status')->default('Active');
            $table->string('profile_pic')->nullable();
            $table->longText('enrolled_face_id')->nullable();
            $table->timestamps();
        });
        foreach (['transactions', 'memberships'] as $tableName) {
            Schema::create($tableName, function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('member_id')->nullable();
                $table->string('status')->default('Active');
                $table->string('member_name_snapshot')->nullable();
                $table->string('member_profile_pic_snapshot')->nullable();
                $table->string('member_email_snapshot')->nullable();
                $table->timestamps();
            });
        }

        // A file outside public/faces that must never be deletable.
        $this->sentinel = public_path('sentinel_' . uniqid() . '.txt');
        File::put($this->sentinel, 'do not delete');
    }

    protected function tearDown(): void
    {
        File::delete(array_merge([$this->sentinel], $this->createdFiles));
        parent::tearDown();
    }

    private function memberWithFacePath(string $path): Member
    {
        return Member::create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada' . uniqid() . '@example.com',
            'phone' => '09170000000',
            'plan' => 'Monthly',
            'status' => 'Active',
            'enrolled_face_id' => $path,
        ]);
    }

    private function memberPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'phone' => '09170000000',
            'plan' => 'Monthly',
            'status' => 'Active',
        ], $overrides);
    }

    public function test_face_must_be_an_image_data_uri(): void
    {
        foreach (['/../.env', '../.env', '/faces/../../.env', 'data:text/plain;base64,aGk=', 'C:\\Windows\\win.ini'] as $value) {
            $this->postJson('/api/members', $this->memberPayload(['enrolled_face_id' => $value]))
                ->assertUnprocessable()
                ->assertJsonValidationErrors('enrolled_face_id');
        }

        $this->assertSame(0, Member::count());
    }

    public function test_face_data_uri_that_is_not_really_an_image_is_rejected(): void
    {
        $fake = 'data:image/png;base64,' . base64_encode('<?php echo "not an image"; ?>');

        $this->postJson('/api/members', $this->memberPayload(['enrolled_face_id' => $fake]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('enrolled_face_id');
    }

    public function test_valid_face_is_saved_under_a_generated_name_in_faces(): void
    {
        $response = $this->postJson('/api/members', $this->memberPayload(['enrolled_face_id' => self::PNG_DATA_URI]))
            ->assertCreated();

        $path = $response->json('member.enrolled_face_id');
        $this->createdFiles[] = public_path(ltrim($path, '/'));

        $this->assertMatchesRegularExpression('#^/faces/\d+_face_[A-Za-z0-9]{16}\.png$#', $path);
        $this->assertFileExists(public_path(ltrim($path, '/')));
    }

    public function test_replacing_a_face_never_deletes_files_outside_faces(): void
    {
        $member = $this->memberWithFacePath('/' . basename($this->sentinel));

        $response = $this->putJson("/api/members/{$member->id}", ['enrolled_face_id' => self::PNG_DATA_URI])
            ->assertOk();
        $this->createdFiles[] = public_path(ltrim($response->json('member.enrolled_face_id'), '/'));

        $this->assertFileExists($this->sentinel);
    }

    public function test_deleting_a_member_never_deletes_files_outside_faces(): void
    {
        $member = $this->memberWithFacePath('/faces/../' . basename($this->sentinel));

        $this->deleteJson("/api/members/{$member->id}")->assertOk();

        $this->assertFileExists($this->sentinel);
        $this->assertSame(0, Member::count());
    }

    public function test_media_storage_only_deletes_files_directly_inside_faces(): void
    {
        $media = new MemberMediaStorage();
        $sentinelName = basename($this->sentinel);

        foreach (["/{$sentinelName}", "/faces/../{$sentinelName}", "faces/..\\{$sentinelName}", '/../.env', '', null] as $path) {
            $this->assertFalse($media->deleteFace($path));
        }
        $this->assertFileExists($this->sentinel);
        $this->assertFileExists(base_path('composer.json'));

        $facePath = $media->storeFace(self::PNG_DATA_URI);
        $this->assertTrue($media->deleteFace($facePath));
        $this->assertFileDoesNotExist(public_path(ltrim($facePath, '/')));
    }
}
