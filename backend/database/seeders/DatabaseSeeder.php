<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            InterestTagSeeder::class,
            UserSeeder::class,
            ProjectSeeder::class,
            SupervisionRequestSeeder::class,
            SavedSupervisorSeeder::class,
            NotificationSeeder::class,
        ]);
    }
}
