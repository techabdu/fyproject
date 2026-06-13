<?php

namespace Database\Seeders;

use App\Models\SavedSupervisor;
use App\Models\User;
use Illuminate\Database\Seeder;

class SavedSupervisorSeeder extends Seeder
{
    public function run(): void
    {
        $bookmarks = [
            'ahmad.dalhat@student.abu.edu.ng' => ['yusuf.sani@abu.edu.ng', 'aisha.bello@abu.edu.ng'],
            'bilal.yakubu@student.abu.edu.ng' => ['aisha.bello@abu.edu.ng'],
            'esther.bawa@student.abu.edu.ng' => ['yusuf.sani@abu.edu.ng'],
        ];

        foreach ($bookmarks as $studentEmail => $supervisorEmails) {
            $student = User::where('email', $studentEmail)->first();

            foreach ($supervisorEmails as $supervisorEmail) {
                $supervisor = User::where('email', $supervisorEmail)->first();

                SavedSupervisor::firstOrCreate([
                    'student_id' => $student->id,
                    'supervisor_id' => $supervisor->id,
                ]);
            }
        }
    }
}
