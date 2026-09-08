<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercise;
use Illuminate\Support\Facades\File;

class ExerciseSeeder extends Seeder
{
    public function run()
    {
        // Points directly to your frontend dataset!
        $jsonPath = base_path('../frontend/public/dataset/data/exercises.json');

        if (!File::exists($jsonPath)) {
            $this->command->error("JSON file not found at: " . $jsonPath);
            return;
        }

        $json = File::get($jsonPath);
        $exercises = json_decode($json, true);

        // Handle variations in JSON structure
        if (isset($exercises['data'])) {
            $exercises = $exercises['data'];
        }

        $this->command->info('Importing ' . count($exercises) . ' exercises into MySQL...');

        foreach ($exercises as $ex) {
            // Pad the ID to ensure it matches the 4-digit GIF filenames (e.g., "1" becomes "0001")
            $exId = str_pad($ex['id'], 4, '0', STR_PAD_LEFT);
            
            Exercise::updateOrCreate(
                ['exercise_id' => $exId], // Prevents duplicates if you run it twice
                [
                    'name' => $ex['name'] ?? 'Unknown',
                    'category' => $ex['category'] ?? null,
                    'body_part' => $ex['body_part'] ?? null,
                    'equipment' => $ex['equipment'] ?? null,
                    'gif_path' => '/dataset/videos/' . $exId . '.gif', // The magic link!
                ]
            );
        }

        $this->command->info('Success! All 1,300+ exercises are now live in the database.');
    }
}