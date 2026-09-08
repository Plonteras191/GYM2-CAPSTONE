<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        // 4. Generate a secure Sanctum token
        $token = $admin->createToken('admin-token')->plainTextToken;

        // 5. Send the token back to React
        return response()->json([
            'admin' => $admin,
            'token' => $token,
            'message' => 'Authentication successful'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}