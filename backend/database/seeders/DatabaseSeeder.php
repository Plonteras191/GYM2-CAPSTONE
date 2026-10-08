<?php

namespace Database\Seeders;

use App\Models\Auth\Admin;
use App\Models\Auth\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! Admin::query()->exists()) {
            Admin::create([
                'email' => 'admin@example.com',
                'name' => 'System Admin',
                'password' => Hash::make('admin123'),
            ]);
        }

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );
    }
}
