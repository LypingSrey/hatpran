<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonalRecordResource;
use App\Models\Exercise;
use App\Models\PersonalRecord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PersonalRecordController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $records = $request->user()
            ->personalRecords()
            ->with(['exercise', 'exerciseSet.workoutExercise.workout'])
            ->when($request->integer('exercise_id'), fn ($q, $id) => $q->where('exercise_id', $id))
            ->when($request->string('record_type')->value(), fn ($q, $type) => $q->where('record_type', $type))
            ->latest('achieved_at')
            ->latest('id')
            ->paginate($this->perPage($request, 50));

        return PersonalRecordResource::collection($records);
    }

    public function show(Request $request, PersonalRecord $personalRecord): PersonalRecordResource
    {
        if ($personalRecord->user_id !== $request->user()->id) {
            abort(403);
        }

        return new PersonalRecordResource($personalRecord->load(['exercise', 'exerciseSet.workoutExercise.workout']));
    }

    public function forExercise(Request $request, Exercise $exercise): AnonymousResourceCollection
    {
        if (! $exercise->isVisibleTo($request->user())) {
            abort(404);
        }

        $records = $request->user()
            ->personalRecords()
            ->where('exercise_id', $exercise->id)
            ->with(['exercise', 'exerciseSet.workoutExercise.workout'])
            ->get();

        return PersonalRecordResource::collection($records);
    }
}
