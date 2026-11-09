<?php

namespace Database\Seeders;

use App\Models\Auth\Admin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // The admin password comes from ADMIN_PASSWORD in .env. If it is not
        // set, a strong random password is generated and printed once.
        $email = env('ADMIN_EMAIL', 'admin@example.com');
        $password = env('ADMIN_PASSWORD');

        if (empty($password)) {
            $password = Str::password(16);
            $this->command?->warn("ADMIN_PASSWORD not set. Generated admin password for {$email}: {$password}");
        }

        Admin::firstOrCreate(
            ['email' => $email],
            [
                'name' => 'System Admin',
                'password' => Hash::make($password),
            ]
        );
    }
}
