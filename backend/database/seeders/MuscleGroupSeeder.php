<?php

namespace Database\Seeders;

use App\Models\MuscleGroup;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MuscleGroupSeeder extends Seeder
{
    public function run(): void
    {
        $muscleGroups = [
            'Chest',
            'Back',
            'Shoulders',
            'Biceps',
            'Triceps',
            'Forearms',
            'Quadriceps',
            'Hamstrings',
            'Glutes',
            'Calves',
            'Abs',
            'Obliques',
            'Lower Back',
            'Traps',
            'Lats',
            'Full Body',
            'Cardio',
        ];

        foreach ($muscleGroups as $name) {
            MuscleGroup::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}
