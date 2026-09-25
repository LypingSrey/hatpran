<?php

namespace Tests\Feature\Api;

use App\Models\ExerciseSet;
use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExerciseSetControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function workoutExerciseFor(User $user): WorkoutExercise
    {
        return WorkoutExercise::factory()->for(Workout::factory()->for($user)->inProgress())->create();
    }

    public function test_index_lists_sets_in_set_number_order(): void
    {
        $user = User::factory()->create();
        $workoutExercise = $this->workoutExerciseFor($user);
        $second = ExerciseSet::factory()->for($workoutExercise)->create(['set_number' => 2]);
        $first = ExerciseSet::factory()->for($workoutExercise)->create(['set_number' => 1]);

        Sanctum::actingAs($user);

        $this->getJson("/api/workout-exercises/{$workoutExercise->id}/sets")
            ->assertOk()
            ->assertJsonPath('data.0.id', $first->id)
            ->assertJsonPath('data.1.id', $second->id);
    }

    public function test_index_forbids_another_users_workout_exercise_with_403(): void
    {
        $workoutExercise = $this->workoutExerciseFor(User::factory()->create());

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/workout-exercises/{$workoutExercise->id}/sets")->assertForbidden();
    }

    public function test_store_appends_set_with_next_set_number_and_returns_201(): void
    {
        $user = User::factory()->create();
        $workoutExercise = $this->workoutExerciseFor($user);
        ExerciseSet::factory()->for($workoutExercise)->create(['set_number' => 4]);

        Sanctum::actingAs($user);

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", ['weight_kg' => 62.5, 'reps' => 8])
            ->assertCreated()
            ->assertJsonPath('data.set_number', 5)
            ->assertJsonPath('data.set_type', 'normal')
            ->assertJsonPath('data.weight_kg', 62.5)
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonPath('data.volume', 500);
    }

    public function test_store_keeps_zero_weight_as_zero_not_null(): void
    {
        $user = User::factory()->create();
        $workoutExercise = $this->workoutExerciseFor($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", ['weight_kg' => 0, 'reps' => 12])
            ->assertCreated()
            ->assertJsonPath('data.weight_kg', 0);
    }

    public function test_store_rejects_out_of_range_values_with_422(): void
    {
        $user = User::factory()->create();
        $workoutExercise = $this->workoutExerciseFor($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", [
            'weight_kg' => 99999999999,
            'reps' => 99999999999,
            'distance_meters' => -1,
            'duration_seconds' => 1.5,
            'rpe' => 0,
            'set_type' => 'superset',
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'weight_kg', 'reps', 'distance_meters', 'duration_seconds', 'rpe', 'set_type',
        ]);

        $this->assertDatabaseCount('exercise_sets', 0);
    }

    public function test_store_rejects_more_than_10000_reps_with_422(): void
    {
        $user = User::factory()->create();
        $workoutExercise = $this->workoutExerciseFor($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", ['weight_kg' => 100, 'reps' => 10001])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['reps']);

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", ['weight_kg' => 100, 'reps' => 10000])
            ->assertCreated();
    }

    public function test_store_forbids_adding_to_another_users_workout_with_403(): void
    {
        $workoutExercise = $this->workoutExerciseFor(User::factory()->create());

        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/workout-exercises/{$workoutExercise->id}/sets", ['reps' => 5])->assertForbidden();

        $this->assertDatabaseCount('exercise_sets', 0);
    }

    public function test_show_returns_own_set_and_forbids_others_with_403(): void
    {
        $owner = User::factory()->create();
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor($owner))->create();

        Sanctum::actingAs($owner);
        $this->getJson("/api/sets/{$set->id}")->assertOk()->assertJsonPath('data.id', $set->id);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/sets/{$set->id}")->assertForbidden();
    }

    public function test_update_changes_set_values(): void
    {
        $user = User::factory()->create();
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor($user))->incomplete()->create();

        Sanctum::actingAs($user);

        $this->putJson("/api/sets/{$set->id}", ['weight_kg' => 102.5, 'reps' => 3, 'set_type' => 'failure'])
            ->assertOk()
            ->assertJsonPath('data.weight_kg', 102.5)
            ->assertJsonPath('data.reps', 3)
            ->assertJsonPath('data.set_type', 'failure');
    }

    public function test_update_rejects_null_set_type_with_422(): void
    {
        $user = User::factory()->create();
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor($user))->create();

        Sanctum::actingAs($user);

        $this->putJson("/api/sets/{$set->id}", ['set_type' => null])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['set_type']);
    }

    public function test_update_forbids_another_users_set_with_403(): void
    {
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor(User::factory()->create()))->create(['reps' => 5]);

        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/sets/{$set->id}", ['reps' => 50])->assertForbidden();

        $this->assertSame(5, $set->fresh()->reps);
    }

    public function test_complete_marks_set_completed_with_final_values(): void
    {
        $user = User::factory()->create();
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor($user))->incomplete()->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/sets/{$set->id}/complete", ['weight_kg' => 90, 'reps' => 6, 'rpe' => 9])
            ->assertOk()
            ->assertJsonPath('data.is_completed', true)
            ->assertJsonPath('data.volume', 540);

        $this->assertDatabaseHas('exercise_sets', ['id' => $set->id, 'is_completed' => true, 'reps' => 6, 'rpe' => 9]);
    }

    public function test_destroy_deletes_own_set_and_forbids_others(): void
    {
        $owner = User::factory()->create();
        $set = ExerciseSet::factory()->for($this->workoutExerciseFor($owner))->create();

        Sanctum::actingAs(User::factory()->create());
        $this->deleteJson("/api/sets/{$set->id}")->assertForbidden();
        $this->assertModelExists($set);

        Sanctum::actingAs($owner);
        $this->deleteJson("/api/sets/{$set->id}")->assertNoContent();
        $this->assertModelMissing($set);
    }

    public function test_returns_404_for_non_numeric_set_id(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/sets/abc')->assertNotFound();
        $this->getJson('/api/workout-exercises/abc/sets')->assertNotFound();
    }
}
