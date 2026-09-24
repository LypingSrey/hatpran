<?php

namespace App\Models;

use Database\Factories\WorkoutTemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkoutTemplate extends Model
{
    /** @use HasFactory<WorkoutTemplateFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'notes',
        'times_used',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(TemplateExercise::class)->orderBy('order');
    }

    public function workouts(): HasMany
    {
        return $this->hasMany(Workout::class);
    }

    public function incrementUsage(): void
    {
        $this->increment('times_used');
        $this->update(['last_used_at' => now()]);
    }
}
