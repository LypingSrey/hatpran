<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::patterns(array_fill_keys([
            'equipment',
            'exercise',
            'exerciseSet',
            'manual_record',
            'muscleGroup',
            'personalRecord',
            'workout',
            'workoutExercise',
            'workoutTemplate',
            'workout_template',
        ], '[0-9]+'));
    }
}
