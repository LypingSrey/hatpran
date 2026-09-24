<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'notes' => $this->notes,
            'times_used' => $this->times_used,
            'last_used_at' => $this->last_used_at,
            'exercises' => TemplateExerciseResource::collection($this->whenLoaded('exercises')),
            'created_at' => $this->created_at,
        ];
    }
}
