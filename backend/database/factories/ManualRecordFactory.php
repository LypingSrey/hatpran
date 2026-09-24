<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\ManualRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ManualRecord>
 */
class ManualRecordFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'exercise_id' => Exercise::factory()->state(['exercise_type' => 'weight_reps']),
            'record_type' => 'max_weight',
            'value' => fake()->randomFloat(2, 60, 200),
            'achieved_at' => fake()->dateTimeBetween('-1 year', '-1 month'),
        ];
    }
}
