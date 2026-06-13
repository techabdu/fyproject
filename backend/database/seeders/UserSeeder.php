<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Department;
use App\Models\InterestTag;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $cs = Department::where('name', 'Computer Science')->first();
        $maths = Department::where('name', 'Mathematics')->first();
        $stats = Department::where('name', 'Statistics')->first();
        $physics = Department::where('name', 'Physics')->first();

        // ----- Super Admin (faculty-wide, no department) -----------------
        $this->user('Prof. Ibrahim Adekunle (Dean)', 'superadmin@abu.edu.ng', Role::SuperAdmin, null);

        // ----- Department Admins (seeded; one per department) ------------
        $this->user('CS Department Admin', 'cs.admin@abu.edu.ng', Role::DeptAdmin, $cs->id);
        $this->user('Maths Department Admin', 'maths.admin@abu.edu.ng', Role::DeptAdmin, $maths->id);
        $this->user('Stats Department Admin', 'stats.admin@abu.edu.ng', Role::DeptAdmin, $stats->id);
        $this->user('Physics Department Admin', 'physics.admin@abu.edu.ng', Role::DeptAdmin, $physics->id);

        // ----- Supervisors (profile + interests + varied capacity) -------
        $this->supervisor('Dr. Aisha Bello', 'aisha.bello@abu.edu.ng', $cs->id, 5,
            ['machine learning', 'deep learning', 'computer vision'],
            'Researches deep learning for medical imaging and computer vision.');
        $this->supervisor('Dr. Musa Ibrahim', 'musa.ibrahim@abu.edu.ng', $cs->id, 4,
            ['cybersecurity', 'cryptography', 'computer networks'],
            'Network security, applied cryptography and intrusion detection.');
        $this->supervisor('Dr. Grace Okoro', 'grace.okoro@abu.edu.ng', $cs->id, 3,
            ['web development', 'software engineering', 'databases'],
            'Full-stack systems, software architecture and database design.');
        $this->supervisor('Dr. Yusuf Sani', 'yusuf.sani@abu.edu.ng', $cs->id, 2,
            ['natural language processing', 'data science', 'machine learning'],
            'NLP for low-resource languages and applied data science.');
        $this->supervisor('Dr. Hauwa Lawal', 'hauwa.lawal@abu.edu.ng', $maths->id, 4,
            ['numerical analysis', 'optimization'],
            'Numerical methods and large-scale optimization.');
        $this->supervisor('Dr. John Eze', 'john.eze@abu.edu.ng', $maths->id, 3,
            ['graph theory', 'algorithms'],
            'Combinatorics, graph algorithms and complexity.');
        $this->supervisor('Dr. Fatima Garba', 'fatima.garba@abu.edu.ng', $stats->id, 4,
            ['statistical modelling', 'time series', 'regression analysis'],
            'Applied statistics, forecasting and econometric modelling.');
        $this->supervisor('Dr. Sadiq Umar', 'sadiq.umar@abu.edu.ng', $physics->id, 3,
            ['computational physics', 'quantum computing'],
            'Computational and quantum physics simulations.');

        // ----- Students ---------------------------------------------------
        // The project author.
        $this->user('Ahmad Dalhat', 'ahmad.dalhat@student.abu.edu.ng', Role::Student, $cs->id);
        $this->user('Bilal Yakubu', 'bilal.yakubu@student.abu.edu.ng', Role::Student, $cs->id);
        $this->user('Chioma Nwosu', 'chioma.nwosu@student.abu.edu.ng', Role::Student, $cs->id);
        $this->user('Daniel Achi', 'daniel.achi@student.abu.edu.ng', Role::Student, $cs->id);
        $this->user('Esther Bawa', 'esther.bawa@student.abu.edu.ng', Role::Student, $cs->id);
        $this->user('Halima Sule', 'halima.sule@student.abu.edu.ng', Role::Student, $maths->id);
        $this->user('Tunde Bello', 'tunde.bello@student.abu.edu.ng', Role::Student, $stats->id);
        $this->user('Ngozi Eze', 'ngozi.eze@student.abu.edu.ng', Role::Student, $physics->id);
    }

    private function user(string $name, string $email, Role $role, ?int $departmentId): User
    {
        return User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => 'password', // hashed by the model cast
                'role' => $role,
                'department_id' => $departmentId,
            ]
        );
    }

    /** @param  list<string>  $interests */
    private function supervisor(string $name, string $email, int $departmentId, int $maxCapacity, array $interests, string $bio): void
    {
        $user = $this->user($name, $email, Role::Supervisor, $departmentId);

        $profile = SupervisorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['bio' => $bio, 'max_capacity' => $maxCapacity, 'current_load' => 0]
        );

        $tagIds = collect($interests)
            ->map(fn ($t) => InterestTag::firstOrCreate(['name' => InterestTag::normalise($t)])->id);

        $profile->interestTags()->syncWithoutDetaching($tagIds);
    }
}
