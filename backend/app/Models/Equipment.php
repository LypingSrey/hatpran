<?php

namespace App\Models;

use Database\Factories\EquipmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    /** @use HasFactory<EquipmentFactory> */
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
