<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Department;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function supervisor(Department $d, int $cap = 2): User
    {
        $u = User::factory()->supervisor()->create(['department_id' => $d->id]);
        SupervisorProfile::create(['user_id' => $u->id, 'max_capacity' => $cap, 'current_load' => 0]);

        return $u;
    }

    public function test_new_request_notifies_the_supervisor(): void
    {
        $dept = Department::factory()->create();
        $student = User::factory()->student()->create(['department_id' => $dept->id]);
        $supervisor = $this->supervisor($dept);

        Sanctum::actingAs($student);
        $this->postJson('/api/requests', [
            'supervisor_id' => $supervisor->id,
            'proposed_title' => 'A Topic',
            'proposal_summary' => 'A summary comfortably longer than twenty characters.',
            'proposal_keywords' => ['machine learning'],
        ])->assertCreated();

        $this->assertSame(1, $supervisor->unreadNotifications()->count());
        $this->assertSame('request_received', $supervisor->notifications()->first()->data['type']);
    }

    public function test_accept_notifies_the_student(): void
    {
        $dept = Department::factory()->create();
        $student = User::factory()->student()->create(['department_id' => $dept->id]);
        $supervisor = $this->supervisor($dept);
        $req = SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'T', 'proposal_summary' => 'a summary long enough to pass',
            'status' => RequestStatus::Pending,
        ]);

        Sanctum::actingAs($supervisor);
        $this->patchJson("/api/requests/{$req->id}/accept")->assertOk();

        $this->assertSame('request_accepted', $student->notifications()->first()?->data['type']);
    }

    public function test_project_submission_notifies_department_admin(): void
    {
        Storage::fake('local');
        $dept = Department::factory()->create();
        $student = User::factory()->student()->create(['department_id' => $dept->id]);
        $admin = User::factory()->deptAdmin()->create(['department_id' => $dept->id]);

        Sanctum::actingAs($student);
        $this->postJson('/api/projects', [
            'title' => 'My FYP',
            'abstract' => 'A sufficiently long abstract for the upload.',
            'department_id' => $dept->id,
            'graduation_year' => 2024,
            'keywords' => ['ai'],
            'pdf' => UploadedFile::fake()->create('p.pdf', 100, 'application/pdf'),
        ])->assertCreated();

        $this->assertSame(1, $admin->unreadNotifications()->count());
        $this->assertSame('project_submitted', $admin->notifications()->first()->data['type']);
    }

    public function test_unread_count_and_mark_read(): void
    {
        $user = User::factory()->student()->create();
        $user->notify(new SystemNotification('test', 'Hello'));
        Sanctum::actingAs($user);

        $this->getJson('/api/notifications/unread-count')->assertOk()->assertJsonPath('count', 1);

        $id = $user->notifications()->first()->id;
        $this->postJson("/api/notifications/{$id}/read")->assertOk();

        $this->getJson('/api/notifications/unread-count')->assertJsonPath('count', 0);
    }

    public function test_users_only_see_their_own_notifications(): void
    {
        $a = User::factory()->student()->create();
        $b = User::factory()->student()->create();
        $a->notify(new SystemNotification('test', 'For A'));
        $b->notify(new SystemNotification('test', 'For B'));

        Sanctum::actingAs($a);
        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.message', 'For A');
    }
}
