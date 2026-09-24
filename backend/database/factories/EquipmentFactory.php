<?php

namespace Database\Factories;

use App\Models\Equipment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Equipment>
 */
class EquipmentFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight',
            'Kettlebell', 'Resistance Band', 'Smith Machine', 'EZ Bar',
            'Pull-up Bar', 'Bench', 'Leg Press', 'Lat Pulldown',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
        ];
    }
}
