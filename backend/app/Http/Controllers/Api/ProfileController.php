<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\ExerciseSet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->normalizeEmail($request);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            // Changing the sign-in email needs the password, so a borrowed unlocked phone can't take over the account.
            'current_password' => [
                Rule::requiredIf(fn () => $request->has('email') && $request->input('email') !== $user->email),
                'nullable',
                'current_password:sanctum',
            ],
        ]);

        $user->update(collect($validated)->only(['name', 'email'])->all());

        return response()->json($user);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            // JPEG, PNG or WebP only, so every client (including browsers) can display it.
            'avatar' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $user = $request->user();
        $previous = $user->avatar_path;

        // Stored under a random name, so each upload gets a new URL and clients never show a cached old picture.
        $user->forceFill(['avatar_path' => $request->file('avatar')->store('avatars', 'public')])->save();

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        return response()->json($user);
    }

    public function destroyAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->forceFill(['avatar_path' => null])->save();
        }

        return response()->json($user);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|current_password:sanctum',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update(['password' => $validated['password']]);

        // Sign out every other device; this one stays signed in.
        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn ($q) => $q->whereKeyNot($current->getKey()))
            ->delete();

        return response()->json(['message' => 'Password updated']);
    }

    /**
     * Lifetime totals across the user's finished workouts. Only ticked sets count, as in workout totals.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $workouts = $user->workouts()
            ->whereNotNull('completed_at')
            ->toBase()
            ->selectRaw('count(*) as workouts_count, coalesce(sum(duration_seconds), 0) as total_duration_seconds')
            ->first();

        $assistedTypes = implode(', ', array_fill(0, count(Exercise::ASSISTED_TYPES), '?'));

        $sets = ExerciseSet::query()
            ->join('workout_exercises', 'workout_exercises.id', '=', 'exercise_sets.workout_exercise_id')
            ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
            ->join('exercises', 'exercises.id', '=', 'workout_exercises.exercise_id')
            ->where('workouts.user_id', $user->id)
            ->whereNotNull('workouts.completed_at')
            ->where('exercise_sets.is_completed', true)
            ->toBase()
            ->selectRaw('count(*) as total_sets')
            ->selectRaw(
                "coalesce(sum(case when exercises.exercise_type in ({$assistedTypes}) then 0
                    else coalesce(exercise_sets.weight_kg, 0) * coalesce(exercise_sets.reps, 0) end), 0) as total_volume",
                Exercise::ASSISTED_TYPES,
            )
            ->first();

        return response()->json([
            'data' => [
                'workouts_count' => (int) $workouts->workouts_count,
                'total_duration_seconds' => (int) $workouts->total_duration_seconds,
                'total_sets' => (int) $sets->total_sets,
                'total_volume' => (float) $sets->total_volume,
                'records_count' => $user->personalRecords()->count(),
            ],
        ]);
    }
}
