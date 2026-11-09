<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the /api/ai/* bridge routes used by the Python Gesture Engine.
 *
 * The engine sends the shared secret from AI_ENGINE_TOKEN in the
 * X-AI-Engine-Token header. If no token is configured, every request is
 * rejected so the bridge never runs unprotected by accident.
 */
class EnsureAiEngineToken
{
    public const HEADER = 'X-AI-Engine-Token';

    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.ai_engine.token');

        if ($expected === '') {
            return response()->json([
                'message' => 'AI engine access is not configured. Set AI_ENGINE_TOKEN in backend/.env.',
            ], 503);
        }

        $provided = (string) $request->header(self::HEADER, '');

        if ($provided === '' || !hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Invalid AI engine token.'], 401);
        }

        return $next($request);
    }
}
