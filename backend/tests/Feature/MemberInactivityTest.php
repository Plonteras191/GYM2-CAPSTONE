<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MemberInactivityTest extends TestCase
{
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
            $table->timestamp('status_updated_at')->nullable();
            $table->string('profile_pic')->nullable();
            $table->longText('enrolled_face_id')->nullable();
            $table->timestamps();
        });
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->string('member_name_snapshot')->nullable();
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->timestamps();
        });
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->nullable();
            $table->unsignedBigInteger('plan_id')->nullable();
            $table->string('status')->default('Active');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    private function member(string $name, string $joined, string $status = 'Active'): Member
    {
        $member = Member::create([
            'first_name' => $name,
            'last_name' => 'Test',
            'email' => strtolower($name) . '@example.com',
            'phone' => '09170000000',
            'status' => $status,
        ]);
        $member->forceFill(['created_at' => Carbon::parse($joined)])->saveQuietly();

        return $member;
    }

    private function attended(Member $member, string $date): void
    {
        Attendance::create(['member_id' => $member->id, 'date' => $date, 'time_in' => '10:00:00']);
    }

    public function test_listing_members_demotes_only_members_unseen_for_over_a_month(): void
    {
        Carbon::setTestNow('2026-11-09 12:00:00');

        $newJoiner = $this->member('NewJoiner', '2026-11-01');           // joined recently, no visits
        $oldNoVisits = $this->member('OldNoVisits', '2026-08-01');       // joined long ago, no visits
        $recentVisitor = $this->member('RecentVisitor', '2026-01-01');   // old account, visited recently
        $lapsed = $this->member('Lapsed', '2026-11-05');                 // new account, but last visit is old
        $edge = $this->member('Edge', '2026-01-01');                     // last visit exactly a month ago
        $alreadyInactive = $this->member('AlreadyInactive', '2026-11-08', 'Inactive');

        $this->attended($recentVisitor, '2026-09-01');
        $this->attended($recentVisitor, '2026-11-01');
        $this->attended($lapsed, '2026-09-15');
        $this->attended($edge, '2026-10-09');

        $this->getJson('/api/members')->assertOk();

        $statuses = Member::pluck('status', 'first_name');
        $this->assertSame('Active', $statuses['NewJoiner']);
        $this->assertSame('Inactive', $statuses['OldNoVisits']);
        $this->assertSame('Active', $statuses['RecentVisitor']);
        $this->assertSame('Inactive', $statuses['Lapsed']);
        $this->assertSame('Inactive', $statuses['Edge']);
        $this->assertSame('Inactive', $statuses['AlreadyInactive']);

        Carbon::setTestNow();
    }
}
