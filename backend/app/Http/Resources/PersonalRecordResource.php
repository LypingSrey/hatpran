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
            'manual_record_id' => $this->manual_record_id,
            'source' => $this->manual_record_id ? 'manual' : 'workout',
            'exercise' => new ExerciseResource($this->whenLoaded('exercise')),
            // The workout the record was set in, so the client can link to it for editing.
            'workout' => $this->whenLoaded('exerciseSet', function () {
                $workout = $this->exerciseSet?->workoutExercise?->workout;

                return $workout ? ['id' => $workout->id, 'name' => $workout->name] : null;
            }),
        ];
    }
}
