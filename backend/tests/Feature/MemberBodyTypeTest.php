<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberBodyTypeTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'first_name' => 'Ana',
            'last_name' => 'Santos',
            'email' => 'ana@example.com',
            'phone' => '09170000000',
            'plan' => 'None',
            'status' => 'Active',
        ];
    }

    public function test_body_type_is_saved_updated_and_cleared(): void
    {
        $id = $this->actingAsAdmin()
            ->postJson('/api/members', $this->payload(['body_type' => 'Mesomorph']))
            ->assertCreated()
            ->json('member.id');
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => 'Mesomorph']);
        $this->getJson('/api/members')->assertOk()->assertJsonFragment(['id' => $id, 'body_type' => 'Mesomorph']);

        $this->putJson("/api/members/{$id}", ['body_type' => 'Endomorph'])->assertOk();
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => 'Endomorph']);

        // An empty value clears it.
        $this->putJson("/api/members/{$id}", ['body_type' => ''])->assertOk();
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => null]);
    }

    public function test_body_type_is_optional_and_unknown_values_are_rejected(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/members', $this->payload())
            ->assertCreated();

        $this->postJson('/api/members', $this->payload(['email' => 'ben@example.com', 'body_type' => 'Athletic']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body_type');
    }
}
