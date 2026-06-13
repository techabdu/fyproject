<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\Department;
use App\Models\Project;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    private Department $cs;
    private Department $maths;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cs = Department::factory()->create(['name' => 'Computer Science']);
        $this->maths = Department::factory()->create(['name' => 'Mathematics']);
    }

    private function student(): User
    {
        return User::factory()->student()->create(['department_id' => $this->cs->id]);
    }

    private function csAdmin(): User
    {
        return User::factory()->deptAdmin()->create(['department_id' => $this->cs->id]);
    }

    private function pendingProject(): Project
    {
        $project = Project::create([
            'title' => 'Pending Work',
            'abstract' => 'An abstract long enough to pass validation rules.',
            'department_id' => $this->cs->id,
            'graduation_year' => 2024,
            'uploaded_by' => $this->student()->id,
            'pdf_path' => 'projects/test.pdf',
            'status' => ProjectStatus::Pending,
        ]);
        $project->keywords()->create(['keyword' => 'machine learning']);

        return $project;
    }

    public function test_student_upload_enters_pending_queue(): void
    {
        Storage::fake('local');
        Sanctum::actingAs($this->student());

        $response = $this->postJson('/api/projects', [
            'title' => 'My FYP',
            'abstract' => 'This is a sufficiently long abstract for the project upload.',
            'department_id' => $this->cs->id,
            'graduation_year' => 2024,
            'keywords' => ['Machine Learning', 'AI'],
            'pdf' => UploadedFile::fake()->create('thesis.pdf', 200, 'application/pdf'),
        ]);

        $response->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('projects', ['title' => 'My FYP', 'status' => 'pending']);
        $this->assertDatabaseHas('project_keywords', ['keyword' => 'machine learning']);
    }

    public function test_supervisor_cannot_upload(): void
    {
        Sanctum::actingAs(User::factory()->supervisor()->create(['department_id' => $this->cs->id]));

        $this->postJson('/api/projects', [])->assertForbidden();
    }

    public function test_dept_admin_can_approve_then_project_is_searchable(): void
    {
        $project = $this->pendingProject();
        Sanctum::actingAs($this->csAdmin());

        $this->patchJson("/api/projects/{$project->id}/approve")
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'status' => 'approved']);

        // Now visible in the public (approved) listing.
        Sanctum::actingAs($this->student());
        $this->getJson('/api/projects')->assertOk()->assertJsonFragment(['id' => $project->id]);
    }

    public function test_reject_requires_feedback_and_records_it(): void
    {
        $project = $this->pendingProject();
        Sanctum::actingAs($this->csAdmin());

        // Missing reason -> validation error.
        $this->patchJson("/api/projects/{$project->id}/reject", [])
            ->assertStatus(422)->assertJsonValidationErrorFor('rejection_feedback');

        // With reason -> rejected + feedback stored.
        $this->patchJson("/api/projects/{$project->id}/reject", [
            'rejection_feedback' => 'Please expand the methodology section.',
        ])->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'status' => 'rejected',
            'rejection_feedback' => 'Please expand the methodology section.',
        ]);
    }

    public function test_admin_cannot_moderate_another_department(): void
    {
        $project = $this->pendingProject(); // CS project
        $mathsAdmin = User::factory()->deptAdmin()->create(['department_id' => $this->maths->id]);
        Sanctum::actingAs($mathsAdmin);

        $this->patchJson("/api/projects/{$project->id}/approve")->assertForbidden();
    }

    public function test_student_cannot_view_moderation_queue(): void
    {
        Sanctum::actingAs($this->student());
        $this->getJson('/api/moderation/projects')->assertForbidden();
    }
}
