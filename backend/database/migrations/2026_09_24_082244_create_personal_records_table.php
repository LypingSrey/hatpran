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
        Schema::create('personal_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_set_id')->nullable()->constrained()->nullOnDelete();
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
        Schema::dropIfExists('personal_records');
    }
};
