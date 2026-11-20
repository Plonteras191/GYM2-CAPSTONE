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
            'address' => '1 Test Street',
            'dob' => '1995-01-01',
            'height' => 165,
            'weight' => 60,
        ];
    }

    public function test_body_type_is_saved_and_updated_but_not_cleared(): void
    {
        $id = $this->actingAsAdmin()
            ->postJson('/api/members', $this->payload(['body_type' => 'Mesomorph']))
            ->assertCreated()
            ->json('member.id');
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => 'Mesomorph']);
        $this->getJson('/api/members')->assertOk()->assertJsonFragment(['id' => $id, 'body_type' => 'Mesomorph']);

        $this->putJson("/api/members/{$id}", ['body_type' => 'Endomorph'])->assertOk();
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => 'Endomorph']);

        // Body type is required, so a blank value on edit is refused.
        $this->putJson("/api/members/{$id}", ['body_type' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body_type');
        $this->assertDatabaseHas('members', ['id' => $id, 'body_type' => 'Endomorph']);
    }

    public function test_registration_requires_every_field_and_a_known_body_type(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/members', $this->payload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body_type');

        foreach (['address', 'dob', 'height', 'weight'] as $field) {
            $payload = $this->payload(['body_type' => 'Mesomorph']);
            unset($payload[$field]);
            $this->postJson('/api/members', $payload)
                ->assertUnprocessable()
                ->assertJsonValidationErrors($field);
        }

        $this->postJson('/api/members', $this->payload(['email' => 'ben@example.com', 'body_type' => 'Athletic']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body_type');
    }
}
