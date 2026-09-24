<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\PersonalRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PersonalRecord>
 */
class PersonalRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'exercise_id' => Exercise::factory(),
            'exercise_set_id' => null,
            'record_type' => fake()->randomElement(['max_weight', 'max_reps', 'max_volume']),
            'value' => fake()->randomFloat(2, 50, 200),
            'achieved_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }

    public function maxWeight(): static
    {
        return $this->state(fn (array $attributes) => [
            'record_type' => 'max_weight',
            'value' => fake()->randomFloat(2, 60, 200),
        ]);
    }

    public function maxReps(): static
    {
        return $this->state(fn (array $attributes) => [
            'record_type' => 'max_reps',
            'value' => fake()->numberBetween(10, 30),
        ]);
    }
}
