<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Bests the user entered by hand (e.g. lifts from before they used the app).
        // They compete with logged sets for personal_records and survive recalculation.
        Schema::create('manual_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->enum('record_type', ['max_weight', 'max_reps', 'max_volume', 'max_duration', 'max_distance']);
            $table->decimal('value', 12, 2);
            $table->timestamp('achieved_at');
            $table->timestamps();

            $table->unique(['user_id', 'exercise_id', 'record_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manual_records');
    }
};
