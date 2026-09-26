<?php

namespace Tests\Feature\Api;

use App\Models\Exercise;
use App\Models\PersonalRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PersonalRecordControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_index_lists_only_own_records_most_recent_first(): void
    {
        $user = User::factory()->create();
        $older = PersonalRecord::factory()->for($user)->maxWeight()->create(['achieved_at' => now()->subWeek()]);
        $newer = PersonalRecord::factory()->for($user)->maxReps()->create(['achieved_at' => now()->subDay()]);
        PersonalRecord::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/personal-records')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.1.id', $older->id);
    }

    public function test_index_includes_each_records_exercise_muscle_group(): void
    {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->create();
        PersonalRecord::factory()->for($user)->for($exercise)->maxWeight()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/personal-records')
            ->assertOk()
            ->assertJsonPath('data.0.exercise.muscle_group.id', $exercise->muscle_group_id)
            ->assertJsonPath('data.0.exercise.muscle_group.name', $exercise->muscleGroup->name);
    }

    public function test_index_filters_by_exercise_and_record_type(): void
    {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->create();
        $match = PersonalRecord::factory()->for($user)->for($exercise)->maxWeight()->create();
        PersonalRecord::factory()->for($user)->for($exercise)->maxReps()->create();
        PersonalRecord::factory()->for($user)->maxWeight()->create();

        Sanctum::actingAs($user);

        $this->getJson("/api/personal-records?exercise_id={$exercise->id}&record_type=max_weight")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $match->id);
    }

    public function test_index_ignores_unknown_record_type_values_without_error(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/personal-records?record_type=not_a_type&exercise_id=abc')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_show_returns_own_record_and_forbids_others_with_403(): void
    {
        $owner = User::factory()->create();
        $record = PersonalRecord::factory()->for($owner)->maxWeight()->create(['value' => 142.5]);

        Sanctum::actingAs($owner);
        $this->getJson("/api/personal-records/{$record->id}")
            ->assertOk()
            ->assertJsonPath('data.value', 142.5)
            ->assertJsonPath('data.exercise.id', $record->exercise_id);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/personal-records/{$record->id}")->assertForbidden();
    }

    public function test_for_exercise_returns_only_own_records_for_that_exercise(): void
    {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->create();
        PersonalRecord::factory()->for($user)->for($exercise)->maxWeight()->create();
        PersonalRecord::factory()->for($exercise)->maxWeight()->create();

        Sanctum::actingAs($user);

        $this->getJson("/api/exercises/{$exercise->id}/personal-records")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_for_exercise_returns_404_for_another_users_custom_exercise(): void
    {
        $exercise = Exercise::factory()->custom()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/exercises/{$exercise->id}/personal-records")->assertNotFound();
    }
}
