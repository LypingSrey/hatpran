<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExerciseSetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'set_number' => $this->set_number,
            'set_type' => $this->set_type,
            'weight_kg' => $this->weight_kg ? (float) $this->weight_kg : null,
            'reps' => $this->reps,
            'distance_meters' => $this->distance_meters,
            'duration_seconds' => $this->duration_seconds,
            'rpe' => $this->rpe,
            'is_completed' => $this->is_completed,
            'volume' => $this->volume,
        ];
    }
}
