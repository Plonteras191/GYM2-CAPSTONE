<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protects the machine-to-machine routes used by the Python AI engine.
 *
 * The engine does not log in like an admin, so it proves its identity with a
 * shared secret sent in the "X-AI-Key" header. The secret lives in the
 * AI_SERVICE_KEY entry of backend/.env and must match the AI_SERVICE_KEY
 * environment variable of the Gesture Engine.
 */
class VerifyAiServiceKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.ai_engine.key');
        $provided = (string) $request->header('X-AI-Key', '');

        // Fail closed: if no key is configured, nobody gets in.
        if ($expected === '' || !hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Unauthorized AI service request.'], 401);
        }

        return $next($request);
    }
}
