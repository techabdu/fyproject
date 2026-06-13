<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Computer Science', 'faculty' => 'Physical Sciences'],
            ['name' => 'Mathematics', 'faculty' => 'Physical Sciences'],
            ['name' => 'Statistics', 'faculty' => 'Physical Sciences'],
            ['name' => 'Physics', 'faculty' => 'Physical Sciences'],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate($department);
        }
    }
}
