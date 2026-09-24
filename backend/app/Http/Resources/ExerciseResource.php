<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'instructions' => $this->instructions,
            'exercise_type' => $this->exercise_type,
            'is_custom' => $this->is_custom,
            'muscle_group' => new MuscleGroupResource($this->whenLoaded('muscleGroup')),
            'equipment' => new EquipmentResource($this->whenLoaded('equipment')),
            'created_at' => $this->created_at,
        ];
    }
}
