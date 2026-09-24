<?php

namespace App\Models;

use Database\Factories\MuscleGroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MuscleGroup extends Model
{
    /** @use HasFactory<MuscleGroupFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    public function exercises(): HasMany
    {
        return $this->hasMany(Exercise::class);
    }
}
