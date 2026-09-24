<?php

namespace Database\Factories;

use App\Models\ExerciseSet;
use App\Models\WorkoutExercise;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExerciseSet>
 */
class ExerciseSetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workout_exercise_id' => WorkoutExercise::factory(),
            'set_number' => fake()->numberBetween(1, 5),
            'set_type' => 'normal',
            'weight_kg' => fake()->randomFloat(2, 20, 150),
            'reps' => fake()->numberBetween(5, 15),
            'distance_meters' => null,
            'duration_seconds' => null,
            'rpe' => fake()->optional()->numberBetween(6, 10),
            'is_completed' => true,
        ];
    }

    public function warmup(): static
    {
        return $this->state(fn (array $attributes) => [
            'set_type' => 'warmup',
            'weight_kg' => ($attributes['weight_kg'] ?? 60) * 0.5,
        ]);
    }

    public function dropSet(): static
    {
        return $this->state(fn (array $attributes) => [
            'set_type' => 'drop',
        ]);
    }

    public function incomplete(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_completed' => false,
        ]);
    }
}
