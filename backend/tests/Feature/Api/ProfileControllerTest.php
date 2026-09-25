<?php

namespace Tests\Feature\Api;

use App\Models\Exercise;
use App\Models\ExerciseSet;
use App\Models\PersonalRecord;
use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_update_returns_401_without_token(): void
    {
        $this->putJson('/api/user', ['name' => 'New'])->assertUnauthorized();
    }

    public function test_update_changes_name_without_a_password(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['name' => 'New Name'])
            ->assertOk()
            ->assertJsonPath('name', 'New Name');

        $this->assertSame('New Name', $user->fresh()->name);
    }

    public function test_update_changes_email_with_the_current_password(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com', 'password' => 'secret-pass']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'new@example.com', 'current_password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonPath('email', 'new@example.com');

        $this->assertSame('new@example.com', $user->fresh()->email);
    }

    public function test_update_rejects_email_change_without_password_with_422(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'new@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);

        $this->assertSame('old@example.com', $user->fresh()->email);
    }

    public function test_update_rejects_email_change_with_wrong_password_with_422(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com', 'password' => 'secret-pass']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'new@example.com', 'current_password' => 'wrong-pass'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password' => 'The password is incorrect.']);
    }

    public function test_update_accepts_unchanged_email_without_password(): void
    {
        $user = User::factory()->create(['email' => 'same@example.com']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['name' => 'Renamed', 'email' => 'same@example.com'])->assertOk();
    }

    public function test_update_stores_the_new_email_in_lowercase(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'New@Example.com', 'current_password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonPath('email', 'new@example.com');

        $this->assertSame('new@example.com', $user->fresh()->email);
    }

    public function test_update_accepts_own_email_in_different_case_without_password(): void
    {
        $user = User::factory()->create(['email' => 'sam@example.com']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'Sam@Example.com'])
            ->assertOk()
            ->assertJsonPath('email', 'sam@example.com');
    }

    public function test_update_rejects_another_users_email_in_different_case_with_422(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['password' => 'secret-pass']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'Taken@Example.com', 'current_password' => 'secret-pass'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'The email has already been taken.']);
    }

    public function test_update_rejects_an_email_another_user_has_with_422(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['password' => 'secret-pass']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user', ['email' => 'taken@example.com', 'current_password' => 'secret-pass'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email' => 'The email has already been taken.']);
    }

    public function test_update_password_changes_it_and_signs_out_other_devices_only(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);
        $current = $user->createToken('phone')->plainTextToken;
        $user->createToken('laptop');

        $this->withToken($current)->putJson('/api/user/password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
        $this->assertSame(['phone'], PersonalAccessToken::pluck('name')->all());
    }

    public function test_update_password_rejects_wrong_current_password_with_422(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user/password', [
            'current_password' => 'not-it',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password' => 'The password is incorrect.']);

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_update_password_rejects_unconfirmed_new_password_with_422(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        Sanctum::actingAs($user);

        $this->putJson('/api/user/password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()->assertJsonValidationErrors(['password']);
    }

    public function test_update_avatar_returns_401_without_token(): void
    {
        $this->postJson('/api/user/avatar')->assertUnauthorized();
    }

    public function test_update_avatar_stores_the_picture_and_returns_its_url(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('me.jpg', 400, 400)])
            ->assertOk()
            ->assertJsonMissingPath('avatar_path');

        $path = $user->fresh()->avatar_path;
        $this->assertStringStartsWith('avatars/', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertSame(url('storage/'.$path), $response->json('avatar_url'));
    }

    public function test_update_avatar_replaces_and_deletes_the_previous_picture(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('first.png')])->assertOk();
        $first = $user->fresh()->avatar_path;

        $this->postJson('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('second.webp')])->assertOk();

        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($user->fresh()->avatar_path);
    }

    public function test_update_avatar_rejects_a_non_image_with_422(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/user/avatar', ['avatar' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf')])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['avatar' => 'The avatar field must be a file of type: jpg, jpeg, png, webp.']);

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_update_avatar_rejects_files_over_5_mb_with_422(): void
    {
        Storage::fake('public');

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('huge.jpg')->size(5121)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['avatar' => 'The avatar field must not be greater than 5120 kilobytes.']);
    }

    public function test_destroy_avatar_deletes_the_file_and_clears_the_url(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/old.jpg', 'image');
        $user = User::factory()->create(['avatar_path' => 'avatars/old.jpg']);

        Sanctum::actingAs($user);

        $this->deleteJson('/api/user/avatar')
            ->assertOk()
            ->assertJsonPath('avatar_url', null);

        Storage::disk('public')->assertMissing('avatars/old.jpg');
        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_stats_count_only_finished_workouts_and_ticked_sets_of_the_user(): void
    {
        $user = User::factory()->create();

        $finished = Workout::factory()->for($user)->create(['duration_seconds' => 3600]);
        $finishedExercise = WorkoutExercise::factory()->for($finished)->create();
        ExerciseSet::factory()->for($finishedExercise)->create(['weight_kg' => 100, 'reps' => 5]);
        ExerciseSet::factory()->for($finishedExercise)->create(['weight_kg' => null, 'reps' => 12]);
        ExerciseSet::factory()->for($finishedExercise)->incomplete()->create(['weight_kg' => 500, 'reps' => 5]);

        $inProgress = Workout::factory()->for($user)->inProgress()->create();
        ExerciseSet::factory()->for(WorkoutExercise::factory()->for($inProgress))->create();

        ExerciseSet::factory()->create();
        PersonalRecord::factory()->for($user)->maxWeight()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/user/stats')
            ->assertOk()
            ->assertExactJson([
                'data' => [
                    'workouts_count' => 1,
                    'total_duration_seconds' => 3600,
                    'total_sets' => 2,
                    'total_volume' => 500,
                    'records_count' => 1,
                ],
            ]);
    }

    public function test_stats_leave_assisted_weight_out_of_total_volume(): void
    {
        $user = User::factory()->create();
        $workout = Workout::factory()->for($user)->create();

        $bench = Exercise::factory()->create(['exercise_type' => 'weight_reps']);
        ExerciseSet::factory()->for(WorkoutExercise::factory()->for($workout)->for($bench))
            ->create(['weight_kg' => 100, 'reps' => 5]);

        // The weight on an assisted exercise is help, not load, so it adds no volume.
        $assistedPullUp = Exercise::factory()->create(['exercise_type' => 'assisted_bodyweight']);
        ExerciseSet::factory()->for(WorkoutExercise::factory()->for($workout)->for($assistedPullUp))
            ->create(['weight_kg' => 40, 'reps' => 10]);

        Sanctum::actingAs($user);

        $this->getJson('/api/user/stats')
            ->assertOk()
            ->assertJsonPath('data.total_sets', 2)
            ->assertJsonPath('data.total_volume', 500);
    }
}
