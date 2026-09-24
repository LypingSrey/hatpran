<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExerciseSet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

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

        $sets = ExerciseSet::query()
            ->join('workout_exercises', 'workout_exercises.id', '=', 'exercise_sets.workout_exercise_id')
            ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
            ->where('workouts.user_id', $user->id)
            ->whereNotNull('workouts.completed_at')
            ->where('exercise_sets.is_completed', true)
            ->toBase()
            ->selectRaw('count(*) as total_sets')
            ->selectRaw('coalesce(sum(coalesce(exercise_sets.weight_kg, 0) * coalesce(exercise_sets.reps, 0)), 0) as total_volume')
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
