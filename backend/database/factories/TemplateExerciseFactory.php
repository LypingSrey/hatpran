<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\TemplateExercise;
use App\Models\WorkoutTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TemplateExercise>
 */
class TemplateExerciseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'workout_template_id' => WorkoutTemplate::factory(),
            'exercise_id' => Exercise::factory(),
            'order' => fake()->numberBetween(0, 10),
            'target_sets' => fake()->numberBetween(3, 5),
            'target_reps' => fake()->numberBetween(8, 12),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
