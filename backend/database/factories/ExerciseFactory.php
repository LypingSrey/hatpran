<?php

namespace Database\Factories;

use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\MuscleGroup;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exercise>
 */
class ExerciseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => null,
            'muscle_group_id' => MuscleGroup::factory(),
            'equipment_id' => Equipment::factory(),
            'name' => fake()->unique()->randomElement([
                'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
                'Barbell Row', 'Pull-up', 'Dip', 'Lat Pulldown',
                'Leg Press', 'Leg Curl', 'Leg Extension', 'Calf Raise',
                'Bicep Curl', 'Tricep Pushdown', 'Face Pull', 'Lateral Raise',
            ]),
            'description' => fake()->optional()->sentence(),
            'instructions' => fake()->optional()->paragraph(),
            'exercise_type' => fake()->randomElement(['weight_reps', 'bodyweight_reps', 'weighted_bodyweight']),
            'is_custom' => false,
        ];
    }

    public function custom(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $attributes['user_id'] ?? User::factory(),
            'is_custom' => true,
        ]);
    }
}
