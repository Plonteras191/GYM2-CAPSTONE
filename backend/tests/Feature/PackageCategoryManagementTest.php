<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PackageCategoryManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->integer('duration_days');
            $table->string('category')->default('normal');
            $table->string('category_detail')->nullable();
            $table->string('color', 7)->nullable();
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
        Schema::dropIfExists('package_categories');
        Schema::dropIfExists('plans');
        parent::tearDown();
    }

    public function test_custom_package_categories_can_be_created_renamed_and_deleted_when_unused(): void
    {
        $category = $this->postJson('/api/package-categories', [
            'name' => 'Student Promo',
            'color' => '#123456',
        ])->assertCreated()
            ->assertJsonPath('name', 'Student Promo')
            ->json();

        $plan = $this->postJson('/api/plans', [
            'name' => 'Student Month',
            'price' => 500,
            'duration_days' => 30,
            'category' => 'other',
            'category_detail' => 'Student Promo',
            'color' => '#123456',
        ])->assertOk()->json('plan');

        $this->getJson('/api/package-categories')
            ->assertOk()
            ->assertJsonPath('0.plans_count', 1);

        $this->putJson("/api/package-categories/{$category['id']}", [
            'name' => 'Student Offer',
            'color' => '#abcdef',
        ])->assertOk()
            ->assertJsonPath('name', 'Student Offer');

        $this->assertDatabaseHas('plans', [
            'id' => $plan['id'],
            'category_detail' => 'Student Offer',
            'color' => '#abcdef',
        ]);

        $this->deleteJson("/api/package-categories/{$category['id']}")
            ->assertStatus(409);

        $this->deleteJson("/api/plans/{$plan['id']}")->assertOk();
        $this->deleteJson("/api/package-categories/{$category['id']}")->assertOk();
        $this->assertDatabaseMissing('package_categories', ['id' => $category['id']]);
    }
}
