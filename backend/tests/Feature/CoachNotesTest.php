<?php

namespace Tests\Feature;

use App\Models\Member\Member;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoachNotesTest extends TestCase
{
    use RefreshDatabase;

    private function member(): Member
    {
        return Member::create([
            'first_name' => 'Ana', 'last_name' => 'Santos', 'email' => 'ana@example.com',
            'phone' => '09170000000', 'plan' => 'None', 'status' => 'Active',
            'address' => '1 Test Street', 'dob' => '1995-01-01', 'height' => 165, 'weight' => 60, 'body_type' => 'Mesomorph',
        ]);
    }

    public function test_coach_notes_are_saved_in_the_database_and_read_back(): void
    {
        $member = $this->member();
        $this->actingAsAdmin();

        $this->getJson("/api/members/{$member->id}/notes")->assertOk()->assertExactJson(['coach_notes' => '']);

        $this->putJson("/api/members/{$member->id}/notes", ['coach_notes' => '  Bad left knee, avoid deep squats.  '])
            ->assertOk()
            ->assertJson(['coach_notes' => 'Bad left knee, avoid deep squats.']);
        $this->getJson("/api/members/{$member->id}/notes")->assertOk()
            ->assertJson(['coach_notes' => 'Bad left knee, avoid deep squats.']);

        // Clearing the notes is allowed.
        $this->putJson("/api/members/{$member->id}/notes", ['coach_notes' => ''])->assertOk();
        $this->assertDatabaseHas('members', ['id' => $member->id, 'coach_notes' => null]);
    }

    public function test_coach_notes_need_a_login_and_have_a_length_limit(): void
    {
        $member = $this->member();
        $this->getJson("/api/members/{$member->id}/notes")->assertUnauthorized();

        $this->actingAsAdmin();
        $this->putJson("/api/members/{$member->id}/notes", ['coach_notes' => str_repeat('a', 5001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('coach_notes');
    }

    public function test_editing_a_member_cannot_blank_out_required_details(): void
    {
        $member = $this->member();
        $this->actingAsAdmin();

        foreach (['address', 'dob', 'height', 'weight', 'body_type'] as $field) {
            $this->putJson("/api/members/{$member->id}", [$field => ''])
                ->assertUnprocessable()
                ->assertJsonValidationErrors($field);
        }

        // Changing only some fields still works.
        $this->putJson("/api/members/{$member->id}", ['address' => '2 New Street'])->assertOk();
        $this->assertDatabaseHas('members', ['id' => $member->id, 'address' => '2 New Street', 'body_type' => 'Mesomorph']);
    }
}
