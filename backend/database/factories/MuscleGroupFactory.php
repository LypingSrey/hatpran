<?php

namespace Database\Factories;

use App\Models\MuscleGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MuscleGroup>
 */
class MuscleGroupFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
            'Forearms', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
            'Abs', 'Obliques', 'Lower Back', 'Traps', 'Lats',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
        ];
    }
}
