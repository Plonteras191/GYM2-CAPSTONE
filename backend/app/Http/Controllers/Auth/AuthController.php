<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Auth\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Throwable;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Wrong guesses allowed per login or password-reset PIN. */
    private const MAX_PIN_ATTEMPTS = 5;

    public function login(Request $request)
    {
        // 1. Validate the incoming data from React
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Find the admin in the database
        $admin = Admin::where('email', $request->email)->first();

        // 3. Check if the admin exists and the password is correct
        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password. Please try again.'],
            ]);
        }

        if (!$this->usesLocalPin() && config('mail.default') === 'log') {
            return response()->json([
                'message' => 'Login verification email is not configured. Set MAIL_MAILER=smtp and the SMTP settings in backend/.env.',
            ], 503);
        }
        if (!$this->usesLocalPin() && !config('mail.mailers.smtp.password')) {
            return response()->json([
                'message' => 'SMTP is missing MAIL_PASSWORD. Configure an SMTP password in backend/.env, then restart Laravel.',
            ], 503);
        }

        $challenge = $this->sendVerificationCode($admin, 'login');

        $response = [
            'challenge_id' => $challenge->id,
            'email' => $this->maskEmail($admin->email),
            'message' => $this->usesLocalPin()
                ? 'A local verification PIN was generated.'
                : 'A verification PIN was sent to the administrator email in Admin Profile.',
        ];
        if ($this->usesLocalPin()) {
            $response['verification_pin'] = $challenge->verification_pin;
        }

        return response()->json($response, 202);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();

        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function requestPasswordReset(Request $request)
    {
        $validated = $request->validate(['email' => 'required|email']);
        $admin = Admin::whereRaw('LOWER(email) = ?', [strtolower($validated['email'])])->first();
        if (!$admin) {
            return response()->json(['message' => 'This email does not match the administrator email saved in Admin Profile.'], 422);
        }
        if (!$this->usesLocalPin() && config('mail.default') === 'log') {
            return response()->json([
                'message' => 'Email delivery is disabled because MAIL_MAILER=log. Configure SMTP in backend/.env or enable local PIN verification.',
            ], 503);
        }
        if (!$this->usesLocalPin() && !config('mail.mailers.smtp.password')) {
            return response()->json([
                'message' => 'SMTP is missing MAIL_PASSWORD. Configure an SMTP password in backend/.env, then restart Laravel.',
            ], 503);
        }

        $pin = (string) random_int(100000, 999999);
        DB::table('password_reset_pins')->where('email', $admin->email)->delete();
        DB::table('password_reset_pins')->insert([
            'email' => $admin->email,
            'pin_hash' => Hash::make($pin),
            'expires_at' => Carbon::now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (!$this->usesLocalPin()) {
            try {
                Mail::raw("Your Double Alpha Fitness password reset PIN is {$pin}. It expires in 10 minutes.", function ($message) use ($admin) {
                    $message->to($admin->email)
                        ->subject('Double Alpha Fitness password reset PIN');
                });
            } catch (Throwable $exception) {
                report($exception);
                return response()->json([
                    'message' => 'The PIN was generated, but the email could not be sent. Check the SMTP settings in backend/.env.',
                ], 503);
            }
        }

        $response = [
            'message' => $this->usesLocalPin()
                ? 'A local recovery PIN was generated.'
                : 'A recovery PIN was sent to the administrator email saved in Admin Profile.',
        ];
        if ($this->usesLocalPin()) {
            $response['verification_pin'] = $pin;
        }

        return response()->json($response);
    }

    public function verifyPasswordResetPin(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'pin' => 'required|digits:6',
        ]);
        $reset = $this->usableResetPin($validated['email']);
        if (!$reset) {
            return response()->json(['message' => 'That PIN has expired or had too many wrong attempts. Request a new PIN.'], 422);
        }
        if (!Hash::check($validated['pin'], $reset->pin_hash)) {
            DB::table('password_reset_pins')->where('id', $reset->id)->increment('attempts');
            return response()->json(['message' => 'That PIN is incorrect.'], 422);
        }
        DB::table('password_reset_pins')->where('id', $reset->id)->update(['verified_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'PIN verified.']);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'pin' => 'required|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $reset = $this->usableResetPin($validated['email']);
        if (!$reset || !$reset->verified_at || !Hash::check($validated['pin'], $reset->pin_hash)) {
            if ($reset) {
                DB::table('password_reset_pins')->where('id', $reset->id)->increment('attempts');
            }
            return response()->json(['message' => 'Verify a valid PIN before changing the password.'], 422);
        }
        $admin = Admin::whereRaw('LOWER(email) = ?', [strtolower($validated['email'])])->firstOrFail();
        $admin->update(['password' => $validated['password']]);
        DB::table('password_reset_pins')->where('id', $reset->id)->delete();
        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function verifyLogin(Request $request)
    {
        $validated = $request->validate([
            'challenge_id' => 'required|integer',
            'pin' => 'required|digits:6',
        ]);

        $challenge = DB::table('auth_verification_codes')
            ->where('id', $validated['challenge_id'])
            ->where('purpose', 'login')
            ->first();

        if (!$challenge || $challenge->attempts >= self::MAX_PIN_ATTEMPTS || Carbon::parse($challenge->expires_at)->isPast()) {
            return response()->json(['message' => 'That login PIN has expired. Please sign in again.'], 422);
        }

        if (!Hash::check($validated['pin'], $challenge->code_hash)) {
            DB::table('auth_verification_codes')->where('id', $challenge->id)->increment('attempts');
            return response()->json(['message' => 'That login PIN is incorrect.'], 422);
        }

        $admin = Admin::findOrFail($challenge->admin_id);
        DB::table('auth_verification_codes')->where('id', $challenge->id)->delete();
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'admin' => $admin,
            'token' => $token,
            'message' => 'Authentication successful',
        ]);
    }

    private function sendVerificationCode(Admin $admin, string $purpose): object
    {
        $pin = (string) random_int(100000, 999999);
        $challengeId = DB::table('auth_verification_codes')->insertGetId([
            'admin_id' => $admin->id,
            'email' => $admin->email,
            'purpose' => $purpose,
            'code_hash' => Hash::make($pin),
            'expires_at' => Carbon::now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (!$this->usesLocalPin()) {
            try {
                Mail::raw("Someone is trying to sign in to Double Alpha Fitness. If this was you, enter this verification PIN: {$pin}. It expires in 10 minutes.", function ($message) use ($admin) {
                    $message->to($admin->email)
                        ->subject('Double Alpha Fitness login verification PIN');
                });
            } catch (Throwable $exception) {
                DB::table('auth_verification_codes')->where('id', $challengeId)->delete();
                report($exception);
                abort(503, 'The verification email could not be sent. Check the SMTP settings in backend/.env.');
            }
        }

        $challenge = DB::table('auth_verification_codes')->where('id', $challengeId)->first();
        if ($this->usesLocalPin()) {
            $challenge->verification_pin = $pin;
        }

        return $challenge;
    }

    /**
     * Latest reset PIN for this email that has not expired and has had fewer
     * than MAX_PIN_ATTEMPTS wrong guesses; null otherwise.
     */
    private function usableResetPin(string $email): ?object
    {
        $reset = DB::table('password_reset_pins')
            ->whereRaw('LOWER(email) = ?', [strtolower($email)])
            ->latest('id')
            ->first();

        if (!$reset || $reset->attempts >= self::MAX_PIN_ATTEMPTS || Carbon::parse($reset->expires_at)->isPast()) {
            return null;
        }

        return $reset;
    }

    private function usesLocalPin(): bool
    {
        return app()->environment('local') && config('auth.verification_mode') === 'display_pin';
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = explode('@', $email, 2);
        return substr($name, 0, 2) . str_repeat('*', max(1, strlen($name) - 2)) . '@' . $domain;
    }
}
