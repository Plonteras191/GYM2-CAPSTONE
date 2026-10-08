<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Auth\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AdminProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($this->adminData($request->user()));
    }

    public function branding()
    {
        $admin = Admin::query()->first();

        return response()->json([
            'logo_url' => $admin ? $this->logoUrl($admin) : null,
        ]);
    }

    public function logo()
    {
        $admin = Admin::query()->whereNotNull('logo_path')->first();

        abort_unless(
            $admin && Storage::disk('public')->exists($admin->logo_path),
            404
        );

        return response()->file(Storage::disk('public')->path($admin->logo_path));
    }

    public function update(Request $request)
    {
        /** @var Admin $admin */
        $admin = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('admins', 'email')->ignore($admin->id)],
            'logo' => ['sometimes', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $oldLogoPath = $admin->logo_path;
        if ($request->hasFile('logo')) {
            $newLogoPath = $request->file('logo')->store('admin-logos', 'public');
            abort_unless($newLogoPath, 500, 'Unable to save the system logo.');
            $validated['logo_path'] = $newLogoPath;
            unset($validated['logo']);
        }

        $admin->update($validated);

        if ($oldLogoPath && $oldLogoPath !== $admin->logo_path) {
            Storage::disk('public')->delete($oldLogoPath);
        }

        return response()->json([
            'message' => 'Admin profile updated successfully.',
            'admin' => $this->adminData($admin->fresh()),
        ]);
    }

    public function updateLogo(Request $request)
    {
        /** @var Admin $admin */
        $admin = $request->user();
        $validated = $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ]);

        $oldLogoPath = $admin->logo_path;
        $newLogoPath = $validated['logo']->store('admin-logos', 'public');
        abort_unless($newLogoPath, 500, 'Unable to save the system logo.');

        $admin->logo_path = $newLogoPath;
        $admin->save();

        if ($oldLogoPath && $oldLogoPath !== $newLogoPath) {
            Storage::disk('public')->delete($oldLogoPath);
        }

        return response()->json([
            'message' => 'System logo updated successfully.',
            'logo_url' => $this->logoUrl($admin->fresh()),
        ]);
    }

    public function updatePassword(Request $request)
    {
        /** @var Admin $admin */
        $admin = $request->user();
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        if (! Hash::check($validated['current_password'], $admin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $admin->password = $validated['new_password'];
        $admin->save();

        $currentToken = $admin->currentAccessToken();
        if ($currentToken instanceof PersonalAccessToken) {
            $admin->tokens()
                ->where('id', '!=', $currentToken->getKey())
                ->delete();
        }

        return response()->json(['message' => 'Password updated successfully.']);
    }

    private function adminData(Admin $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'logo_url' => $this->logoUrl($admin),
        ];
    }

    private function logoUrl(Admin $admin): ?string
    {
        if (! $admin->logo_path || ! Storage::disk('public')->exists($admin->logo_path)) {
            return null;
        }

        return '/api/branding/logo?v='.rawurlencode($admin->logo_path);
    }
}
