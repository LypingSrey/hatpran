<?php

namespace App\Models;

use Database\Factories\ManualRecordFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A best the user entered by hand rather than logged as a set.
 *
 * It competes with logged sets for the matching PersonalRecord; see PersonalRecord::recalculate().
 */
class ManualRecord extends Model
{
    /** @use HasFactory<ManualRecordFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'exercise_id',
        'record_type',
        'value',
        'achieved_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'achieved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
