<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MuscleGroupResource;
use App\Models\MuscleGroup;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MuscleGroupController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return MuscleGroupResource::collection(
            MuscleGroup::orderBy('name')->get()
        );
    }

    public function show(MuscleGroup $muscleGroup): MuscleGroupResource
    {
        return new MuscleGroupResource($muscleGroup);
    }
}
