<?php

namespace Tests;

use App\Http\Middleware\EnsureAiEngineToken;
use App\Models\Auth\Admin;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected const AI_ENGINE_TEST_TOKEN = 'test-ai-engine-token';

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.ai_engine.token' => self::AI_ENGINE_TEST_TOKEN]);
    }

    /** Authenticate requests as an admin of the React dashboard. */
    protected function actingAsAdmin(): static
    {
        Sanctum::actingAs(new Admin([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
        ]));

        return $this;
    }

    /** Send the shared secret the Python Gesture Engine uses for /api/ai/*. */
    protected function withAiEngineToken(): static
    {
        return $this->withHeader(EnsureAiEngineToken::HEADER, self::AI_ENGINE_TEST_TOKEN);
    }
}
