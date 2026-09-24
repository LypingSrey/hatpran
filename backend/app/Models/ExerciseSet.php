<?php

namespace App\Models;

use Database\Factories\ExerciseSetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExerciseSet extends Model
{
    /** @use HasFactory<ExerciseSetFactory> */
    use HasFactory;

    protected $fillable = [
        'workout_exercise_id',
        'set_number',
        'set_type',
        'weight_kg',
        'reps',
        'distance_meters',
        'duration_seconds',
        'rpe',
        'is_completed',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'decimal:2',
            'is_completed' => 'boolean',
        ];
    }

    /**
     * Validation rules for a set's measurements, bounded by the column sizes.
     *
     * @return array<string, string>
     */
    public static function measurementRules(string $prefix = ''): array
    {
        return [
            $prefix.'weight_kg' => 'nullable|numeric|min:0|max:999999.99',
            $prefix.'reps' => 'nullable|integer|min:0|max:2147483647',
            $prefix.'distance_meters' => 'nullable|integer|min:0|max:2147483647',
            $prefix.'duration_seconds' => 'nullable|integer|min:0|max:2147483647',
            $prefix.'rpe' => 'nullable|integer|min:1|max:10',
        ];
    }

    public function workoutExercise(): BelongsTo
    {
        return $this->belongsTo(WorkoutExercise::class);
    }

    public function getVolumeAttribute(): float
    {
        return ($this->weight_kg ?? 0) * ($this->reps ?? 0);
    }
}
