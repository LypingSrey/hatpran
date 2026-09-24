<?php

namespace Tests\Feature\Api;

use App\Models\Exercise;
use App\Models\TemplateExercise;
use App\Models\User;
use App\Models\WorkoutTemplate;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkoutTemplateControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_index_lists_own_templates_recently_used_first_and_never_used_last(): void
    {
        $user = User::factory()->create();
        $neverUsed = WorkoutTemplate::factory()->for($user)->create(['last_used_at' => null]);
        $old = WorkoutTemplate::factory()->for($user)->create(['last_used_at' => now()->subWeek()]);
        $recent = WorkoutTemplate::factory()->for($user)->create(['last_used_at' => now()->subDay()]);
        WorkoutTemplate::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/workout-templates')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.id', $recent->id)
            ->assertJsonPath('data.1.id', $old->id)
            ->assertJsonPath('data.2.id', $neverUsed->id);
    }

    public function test_store_creates_template_with_ordered_exercises_and_returns_201(): void
    {
        $user = User::factory()->create();
        $squat = Exercise::factory()->create(['name' => 'Squat']);
        $bench = Exercise::factory()->create(['name' => 'Bench Press']);

        Sanctum::actingAs($user);

        $this->postJson('/api/workout-templates', [
            'name' => 'Full Body',
            'exercises' => [
                ['exercise_id' => $squat->id, 'target_sets' => 5, 'target_reps' => 5],
                ['exercise_id' => $bench->id],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Full Body')
            ->assertJsonPath('data.exercises.0.exercise.id', $squat->id)
            ->assertJsonPath('data.exercises.0.order', 0)
            ->assertJsonPath('data.exercises.1.exercise.id', $bench->id)
            ->assertJsonPath('data.exercises.1.order', 1);

        $this->assertSame($user->id, WorkoutTemplate::sole()->user_id);
    }

    public function test_store_requires_at_least_one_exercise(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/workout-templates', ['name' => 'Empty', 'exercises' => []])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['exercises']);
    }

    public function test_store_rejects_another_users_custom_exercise_with_422(): void
    {
        $exercise = Exercise::factory()->custom()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/workout-templates', ['name' => 'Sneaky', 'exercises' => [['exercise_id' => $exercise->id]]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['exercises.0.exercise_id']);
    }

    public function test_store_rejects_unbounded_target_sets_with_422(): void
    {
        $exercise = Exercise::factory()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/workout-templates', [
            'name' => 'Too many',
            'exercises' => [['exercise_id' => $exercise->id, 'target_sets' => 1000000]],
        ])->assertUnprocessable()->assertJsonValidationErrors(['exercises.0.target_sets']);
    }

    public function test_show_forbids_another_users_template_with_403(): void
    {
        $template = WorkoutTemplate::factory()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/workout-templates/{$template->id}")->assertForbidden();
    }

    public function test_update_replaces_exercises_and_can_clear_notes(): void
    {
        $user = User::factory()->create();
        $template = WorkoutTemplate::factory()->for($user)->create(['notes' => 'Old notes']);
        TemplateExercise::factory()->for($template, 'template')->create();
        $replacement = Exercise::factory()->create(['name' => 'Deadlift']);

        Sanctum::actingAs($user);

        $this->putJson("/api/workout-templates/{$template->id}", [
            'notes' => null,
            'exercises' => [['exercise_id' => $replacement->id, 'target_sets' => 1]],
        ])->assertOk()
            ->assertJsonPath('data.notes', null)
            ->assertJsonCount(1, 'data.exercises')
            ->assertJsonPath('data.exercises.0.exercise.id', $replacement->id);

        $this->assertSame(1, $template->exercises()->count());
    }

    public function test_update_without_notes_keeps_existing_notes(): void
    {
        $user = User::factory()->create();
        $template = WorkoutTemplate::factory()->for($user)->create(['notes' => 'Keep me']);

        Sanctum::actingAs($user);

        $this->putJson("/api/workout-templates/{$template->id}", ['name' => 'Renamed'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed')
            ->assertJsonPath('data.notes', 'Keep me');
    }

    public function test_update_forbids_another_users_template_with_403(): void
    {
        $template = WorkoutTemplate::factory()->create(['name' => 'Original']);

        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/workout-templates/{$template->id}", ['name' => 'Hacked'])->assertForbidden();

        $this->assertSame('Original', $template->fresh()->name);
    }

    public function test_destroy_deletes_template_but_keeps_workouts_started_from_it(): void
    {
        $user = User::factory()->create();
        $template = WorkoutTemplate::factory()->for($user)->create();
        TemplateExercise::factory()->for($template, 'template')->create();

        Sanctum::actingAs($user);

        $workoutId = $this->postJson("/api/workout-templates/{$template->id}/start")->json('data.id');

        $this->deleteJson("/api/workout-templates/{$template->id}")->assertNoContent();

        $this->assertModelMissing($template);
        $this->assertDatabaseHas('workouts', ['id' => $workoutId, 'workout_template_id' => null]);
    }

    public function test_start_creates_workout_from_template_and_returns_it_with_201(): void
    {
        $this->freezeSecond();
        $user = User::factory()->create();
        $template = WorkoutTemplate::factory()->for($user)->create(['name' => 'Leg Day A', 'times_used' => 0]);
        $squat = TemplateExercise::factory()->for($template, 'template')->create(['order' => 0, 'target_sets' => 4, 'target_reps' => 6]);
        TemplateExercise::factory()->for($template, 'template')->create(['order' => 1, 'target_sets' => null]);

        Sanctum::actingAs($user);

        $this->postJson("/api/workout-templates/{$template->id}/start")
            ->assertCreated()
            ->assertJsonPath('data.name', 'Leg Day A')
            ->assertJsonPath('data.is_completed', false)
            ->assertJsonPath('data.template.id', $template->id)
            ->assertJsonPath('data.exercises.0.exercise.id', $squat->exercise_id)
            ->assertJsonCount(4, 'data.exercises.0.sets')
            ->assertJsonPath('data.exercises.0.sets.0.reps', 6)
            ->assertJsonPath('data.exercises.0.sets.0.is_completed', false)
            ->assertJsonCount(3, 'data.exercises.1.sets');

        $template->refresh();
        $this->assertSame(1, $template->times_used);
        $this->assertTrue($template->last_used_at->equalTo(now()));
    }

    public function test_start_forbids_another_users_template_with_403(): void
    {
        $template = WorkoutTemplate::factory()->create();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/workout-templates/{$template->id}/start")->assertForbidden();

        $this->assertDatabaseCount('workouts', 0);
    }
}
