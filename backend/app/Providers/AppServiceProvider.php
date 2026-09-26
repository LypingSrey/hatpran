<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

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

        // Keyed by account and address, so one shared network doesn't lock everyone out
        // and one account can't be locked out from everywhere.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(6)->by(
            Str::transliterate(Str::lower(trim($request->string('email'))).'|'.$request->ip())
        ));
    }
}
