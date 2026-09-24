<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'notes' => $this->notes,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'duration_seconds' => $this->duration_seconds,
            'is_completed' => $this->completed_at !== null,
            'total_volume' => $this->when($this->relationLoaded('workoutExercises'), fn () => $this->total_volume),
            'total_sets' => $this->when($this->relationLoaded('workoutExercises'), fn () => $this->total_sets),
            'template' => new WorkoutTemplateResource($this->whenLoaded('template')),
            'exercises' => WorkoutExerciseResource::collection($this->whenLoaded('workoutExercises')),
            'created_at' => $this->created_at,
        ];
    }
}
