<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\WorkoutTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkoutTemplate>
 */
class WorkoutTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement([
                'Push Day A', 'Pull Day A', 'Leg Day A',
                'Upper Body', 'Lower Body', 'PPL Day 1',
                'Full Body Workout', 'Chest Focus',
            ]),
            'notes' => fake()->optional()->sentence(),
            'times_used' => fake()->numberBetween(0, 50),
            'last_used_at' => fake()->optional()->dateTimeBetween('-1 month', 'now'),
        ];
    }
}
