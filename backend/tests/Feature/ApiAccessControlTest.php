<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureAiEngineToken;
use Tests\TestCase;

class ApiAccessControlTest extends TestCase
{
    /** Admin data routes must reject callers without a Sanctum token. */
    public function test_admin_routes_require_authentication(): void
    {
        $requests = [
            ['GET', '/api/members'],
            ['POST', '/api/members'],
            ['PUT', '/api/members/1'],
            ['DELETE', '/api/members/1'],
            ['GET', '/api/memberships'],
            ['GET', '/api/plans'],
            ['GET', '/api/transactions'],
            ['POST', '/api/transactions/1/refund'],
            ['GET', '/api/reports'],
            ['GET', '/api/dashboard'],
            ['GET', '/api/attendance/today'],
            ['GET', '/api/coach-events'],
            ['POST', '/api/members/1/assign-task'],
            ['PUT', '/api/workouts/1/manual-verify'],
            ['GET', '/api/workouts/live'],
        ];

        foreach ($requests as [$method, $uri]) {
            $this->json($method, $uri)->assertUnauthorized();
        }
    }

    /** A browser-style (non-JSON) request still gets a 401, not a redirect error. */
    public function test_unauthenticated_non_json_request_gets_401(): void
    {
        $this->get('/api/members')->assertUnauthorized();
    }

    public function test_ai_routes_reject_missing_or_wrong_engine_token(): void
    {
        $requests = [
            ['GET', '/api/ai/members-faces'],
            ['GET', '/api/ai/workout-plans'],
            ['POST', '/api/ai/log-attendance'],
            ['POST', '/api/ai/log-workout'],
        ];

        foreach ($requests as [$method, $uri]) {
            $this->json($method, $uri)->assertUnauthorized();
            $this->json($method, $uri, [], [EnsureAiEngineToken::HEADER => 'wrong-token'])->assertUnauthorized();
        }
    }

    /** Logging in to the dashboard does not grant access to the engine bridge. */
    public function test_admin_session_alone_cannot_use_ai_routes(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/ai/log-attendance', ['member_id' => 1])->assertUnauthorized();
    }

    public function test_ai_routes_are_closed_when_no_engine_token_is_configured(): void
    {
        config(['services.ai_engine.token' => null]);

        $this->withHeader(EnsureAiEngineToken::HEADER, '')
            ->getJson('/api/ai/members-faces')
            ->assertStatus(503);
    }
}
