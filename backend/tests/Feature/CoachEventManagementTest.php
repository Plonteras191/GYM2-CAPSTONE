<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CoachEventManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('coach_event_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('color', 7)->default('#3b82f6');
            $table->timestamps();
        });

        Schema::create('coach_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('coach_event_categories')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->integer('duration_days');
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
            $table->timestamps();
        });

        Schema::create('package_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('color', 7);
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('coach_events');
        Schema::dropIfExists('coach_event_categories');
        Schema::dropIfExists('package_categories');
        Schema::dropIfExists('plans');
        parent::tearDown();
    }

    public function test_coach_events_can_be_created_updated_deleted_and_share_category_colors(): void
    {
        $eventData = [
            'title' => 'Strength Session',
            'description' => 'Bring a towel.',
            'category' => 'Training',
            'color' => '#123456',
            'start_date' => '2026-10-25',
            'end_date' => '2026-10-25',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'location' => 'Main Floor',
        ];

        $this->postJson('/api/coach-events', $eventData)
            ->assertCreated()
            ->assertJsonPath('category.name', 'Training')
            ->assertJsonPath('description', 'Bring a towel.');

        $secondEventData = [...$eventData, 'title' => 'Mobility Session', 'category' => 'training', 'color' => '#abcdef'];
        $secondEvent = $this->postJson('/api/coach-events', $secondEventData)
            ->assertCreated()
            ->assertJsonPath('category.color', '#abcdef')
            ->json();

        $this->getJson('/api/coach-events')
            ->assertOk()
            ->assertJsonPath('0.category.color', '#abcdef')
            ->assertJsonPath('1.category.color', '#abcdef');

        $this->putJson("/api/coach-events/{$secondEvent['id']}", [
            ...$secondEventData,
            'title' => 'Updated Mobility Session',
            'description' => 'Updated description.',
        ])->assertOk()
            ->assertJsonPath('title', 'Updated Mobility Session')
            ->assertJsonPath('description', 'Updated description.');

        $this->deleteJson("/api/coach-events/{$secondEvent['id']}")->assertOk();
        $this->assertDatabaseMissing('coach_events', ['id' => $secondEvent['id']]);
    }

    public function test_coach_event_validation_rejects_invalid_dates_and_colors(): void
    {
        $this->postJson('/api/coach-events', [
            'title' => 'Invalid Event',
            'category' => 'Training',
            'color' => 'blue',
            'start_date' => '2026-10-26',
            'end_date' => '2026-10-25',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'location' => 'Main Floor',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['color', 'end_date']);
    }

    public function test_coach_event_categories_can_be_edited_and_unused_categories_deleted(): void
    {
        $categoryId = \Illuminate\Support\Facades\DB::table('coach_event_categories')->insertGetId([
            'name' => 'Training',
            'color' => '#123456',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->putJson("/api/coach-event-categories/{$categoryId}", [
            'name' => 'Strength',
            'color' => '#abcdef',
        ])->assertOk()
            ->assertJsonPath('name', 'Strength')
            ->assertJsonPath('color', '#abcdef')
            ->assertJsonPath('events_count', 0);

        $this->deleteJson("/api/coach-event-categories/{$categoryId}")->assertOk();
        $this->assertDatabaseMissing('coach_event_categories', ['id' => $categoryId]);
    }

    public function test_coach_event_category_cannot_be_deleted_while_events_use_it(): void
    {
        $eventData = [
            'title' => 'Strength Session',
            'category' => 'Training',
            'color' => '#123456',
            'start_date' => '2026-10-25',
            'end_date' => '2026-10-25',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'location' => 'Main Floor',
        ];
        $event = $this->postJson('/api/coach-events', $eventData)->assertCreated()->json();

        $this->deleteJson("/api/coach-event-categories/{$event['category']['id']}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'This category is assigned to coach events. Reassign or delete those events before deleting the category.');
        $this->assertDatabaseHas('coach_events', ['id' => $event['id']]);
    }

    public function test_package_details_can_be_updated(): void
    {
        $planId = \Illuminate\Support\Facades\DB::table('plans')->insertGetId([
            'name' => 'Monthly',
            'price' => 1000,
            'duration_days' => 30,
            'category' => 'normal',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->putJson("/api/plans/{$planId}", [
            'name' => 'Student Monthly',
            'price' => 850,
            'duration_days' => 30,
            'category' => 'other',
            'category_detail' => 'Student Promo',
        ])->assertOk()
            ->assertJsonPath('plan.name', 'Student Monthly')
            ->assertJsonPath('plan.category_detail', 'Student Promo');

        $this->assertDatabaseHas('plans', [
            'id' => $planId,
            'name' => 'Student Monthly',
            'price' => '850.00',
            'category' => 'other',
            'category_detail' => 'Student Promo',
        ]);
    }
}
