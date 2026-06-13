<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Enums\RequestStatus;
use App\Models\Department;
use App\Models\Project;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_student_dashboard_returns_role_scoped_shape(): void
    {
        $dept = Department::factory()->create();
        $student = User::factory()->student()->create(['department_id' => $dept->id]);
        Project::create([
            'title' => 'My Upload', 'abstract' => 'a sufficiently long abstract here',
            'department_id' => $dept->id, 'graduation_year' => 2024,
            'uploaded_by' => $student->id, 'pdf_path' => 'projects/x.pdf',
            'status' => ProjectStatus::Pending,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.role', 'student')
            ->assertJsonPath('data.stats.uploads_total', 1)
            ->assertJsonPath('data.stats.uploads_pending', 1);
    }

    public function test_supervisor_dashboard_reflects_capacity(): void
    {
        $dept = Department::factory()->create();
        $supervisor = User::factory()->supervisor()->create(['department_id' => $dept->id]);
        SupervisorProfile::create(['user_id' => $supervisor->id, 'max_capacity' => 4, 'current_load' => 1]);

        Sanctum::actingAs($supervisor);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.role', 'supervisor')
            ->assertJsonPath('data.capacity.current_load', 1)
            ->assertJsonPath('data.capacity.max_capacity', 4)
            ->assertJsonPath('data.capacity.percentage', 25);
    }

    public function test_dept_admin_dashboard_is_scoped_to_own_department(): void
    {
        $deptA = Department::factory()->create();
        $deptB = Department::factory()->create();
        $studentA = User::factory()->student()->create(['department_id' => $deptA->id]);
        $studentB = User::factory()->student()->create(['department_id' => $deptB->id]);

        foreach ([[$deptA, $studentA], [$deptB, $studentB]] as [$d, $u]) {
            Project::create([
                'title' => 'Pending', 'abstract' => 'a sufficiently long abstract here',
                'department_id' => $d->id, 'graduation_year' => 2024,
                'uploaded_by' => $u->id, 'pdf_path' => 'projects/x.pdf',
                'status' => ProjectStatus::Pending,
            ]);
        }

        $admin = User::factory()->deptAdmin()->create(['department_id' => $deptA->id]);
        Sanctum::actingAs($admin);

        // Only deptA's single pending project should be counted.
        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.role', 'dept_admin')
            ->assertJsonPath('data.stats.pending_approvals', 1)
            ->assertJsonPath('data.stats.students', 1);
    }

    public function test_super_admin_dashboard_returns_faculty_breakdown(): void
    {
        Department::factory()->count(3)->create();
        $admin = User::factory()->superAdmin()->create();

        Sanctum::actingAs($admin);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('data.role', 'super_admin')
            ->assertJsonPath('data.stats.departments', 3)
            ->assertJsonCount(3, 'data.departments');
    }
}
