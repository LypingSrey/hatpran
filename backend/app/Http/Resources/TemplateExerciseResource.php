<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order' => $this->order,
            'target_sets' => $this->target_sets,
            'target_reps' => $this->target_reps,
            'notes' => $this->notes,
            'exercise' => new ExerciseResource($this->whenLoaded('exercise')),
        ];
    }
}
