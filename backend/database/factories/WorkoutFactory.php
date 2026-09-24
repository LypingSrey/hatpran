<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workout>
 */
class WorkoutFactory extends Factory
{
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-1 month', 'now');
        $duration = fake()->numberBetween(1800, 7200);

        return [
            'user_id' => User::factory(),
            'workout_template_id' => null,
            'name' => fake()->randomElement([
                'Push Day', 'Pull Day', 'Leg Day', 'Upper Body',
                'Lower Body', 'Full Body', 'Chest & Triceps', 'Back & Biceps',
            ]),
            'notes' => fake()->optional()->sentence(),
            'started_at' => $startedAt,
            'completed_at' => (clone $startedAt)->modify("+{$duration} seconds"),
            'duration_seconds' => $duration,
        ];
    }

    public function fromTemplate(WorkoutTemplate $template): static
    {
        return $this->state(fn (array $attributes) => [
            'workout_template_id' => $template->id,
            'user_id' => $template->user_id,
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'started_at' => now(),
            'completed_at' => null,
            'duration_seconds' => null,
        ]);
    }
}
