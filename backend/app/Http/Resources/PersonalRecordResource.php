<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonalRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'record_type' => $this->record_type,
            'value' => (float) $this->value,
            'achieved_at' => $this->achieved_at,
            'exercise_set_id' => $this->exercise_set_id,
            'exercise' => new ExerciseResource($this->whenLoaded('exercise')),
        ];
    }
}
