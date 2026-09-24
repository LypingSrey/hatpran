<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $equipment = [
            'Barbell',
            'Dumbbell',
            'Cable',
            'Machine',
            'Bodyweight',
            'Kettlebell',
            'Resistance Band',
            'Smith Machine',
            'EZ Bar',
            'Pull-up Bar',
            'Bench',
            'Medicine Ball',
            'Swiss Ball',
            'Trap Bar',
            'Landmine',
            'Suspension Trainer',
            'Battle Ropes',
            'Rowing Machine',
            'Treadmill',
            'Stationary Bike',
        ];

        foreach ($equipment as $name) {
            Equipment::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            );
        }
    }
}
