<?php

namespace Tests\Feature;

use App\Enums\RequestStatus;
use App\Models\Department;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupervisionRequestTest extends TestCase
{
    use RefreshDatabase;

    private Department $dept;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dept = Department::factory()->create();
    }

    private function student(): User
    {
        return User::factory()->student()->create(['department_id' => $this->dept->id]);
    }

    private function supervisor(int $maxCapacity = 2, int $currentLoad = 0): User
    {
        $user = User::factory()->supervisor()->create(['department_id' => $this->dept->id]);
        SupervisorProfile::create([
            'user_id' => $user->id,
            'max_capacity' => $maxCapacity,
            'current_load' => $currentLoad,
        ]);

        return $user;
    }

    private function payload(User $supervisor): array
    {
        return [
            'supervisor_id' => $supervisor->id,
            'proposed_title' => 'A Proposed FYP Topic',
            'proposal_summary' => 'A summary that is comfortably longer than twenty characters.',
            'proposal_keywords' => ['machine learning', 'data science'],
        ];
    }

    public function test_student_can_submit_a_request(): void
    {
        $student = $this->student();
        $supervisor = $this->supervisor();
        Sanctum::actingAs($student);

        $this->postJson('/api/requests', $this->payload($supervisor))
            ->assertCreated()->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('supervision_requests', [
            'student_id' => $student->id,
            'supervisor_id' => $supervisor->id,
            'status' => 'pending',
        ]);
    }

    public function test_one_active_request_rule_blocks_a_second_submission(): void
    {
        $student = $this->student();
        $supervisor = $this->supervisor();
        Sanctum::actingAs($student);

        $this->postJson('/api/requests', $this->payload($supervisor))->assertCreated();

        // Second active submission is rejected.
        $this->postJson('/api/requests', $this->payload($this->supervisor()))
            ->assertStatus(422);

        $this->assertSame(1, SupervisionRequest::where('student_id', $student->id)->count());
    }

    public function test_database_enforces_one_active_lock(): void
    {
        // Direct DB-level proof of the generated-column unique index backstop.
        $student = $this->student();
        $supervisor = $this->supervisor();

        SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'A', 'proposal_summary' => 'aaaaaaaaaaaaaaaaaaaaaa',
            'status' => RequestStatus::Pending,
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'B', 'proposal_summary' => 'bbbbbbbbbbbbbbbbbbbbbb',
            'status' => RequestStatus::Pending,
        ]);
    }

    public function test_accept_increments_load_transactionally(): void
    {
        $student = $this->student();
        $supervisor = $this->supervisor(maxCapacity: 2, currentLoad: 0);
        $request = SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'T', 'proposal_summary' => 'a summary long enough to pass',
            'status' => RequestStatus::Pending,
        ]);

        Sanctum::actingAs($supervisor);
        $this->patchJson("/api/requests/{$request->id}/accept")
            ->assertOk()->assertJsonPath('data.status', 'accepted');

        $this->assertDatabaseHas('supervisor_profiles', [
            'user_id' => $supervisor->id,
            'current_load' => 1,
        ]);
    }

    public function test_accept_blocked_when_supervisor_full(): void
    {
        $student = $this->student();
        $supervisor = $this->supervisor(maxCapacity: 1, currentLoad: 1); // already full
        $request = SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'T', 'proposal_summary' => 'a summary long enough to pass',
            'status' => RequestStatus::Pending,
        ]);

        Sanctum::actingAs($supervisor);
        $this->patchJson("/api/requests/{$request->id}/accept")->assertStatus(422);

        $this->assertDatabaseHas('supervision_requests', ['id' => $request->id, 'status' => 'pending']);
        $this->assertDatabaseHas('supervisor_profiles', ['user_id' => $supervisor->id, 'current_load' => 1]);
    }

    public function test_decline_requires_reason_and_frees_student(): void
    {
        $student = $this->student();
        $supervisor = $this->supervisor();
        $request = SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisor->id,
            'proposed_title' => 'T', 'proposal_summary' => 'a summary long enough to pass',
            'status' => RequestStatus::Pending,
        ]);

        Sanctum::actingAs($supervisor);

        // Reason is mandatory.
        $this->patchJson("/api/requests/{$request->id}/decline", [])
            ->assertStatus(422)->assertJsonValidationErrorFor('decision_reason');

        $this->patchJson("/api/requests/{$request->id}/decline", [
            'decision_reason' => 'Not available this session.',
        ])->assertOk()->assertJsonPath('data.status', 'declined');

        // The student is now free to submit a new request.
        Sanctum::actingAs($student);
        $this->postJson('/api/requests', $this->payload($this->supervisor()))->assertCreated();
    }

    public function test_only_receiving_supervisor_can_decide(): void
    {
        $student = $this->student();
        $supervisorA = $this->supervisor();
        $supervisorB = $this->supervisor();
        $request = SupervisionRequest::create([
            'student_id' => $student->id, 'supervisor_id' => $supervisorA->id,
            'proposed_title' => 'T', 'proposal_summary' => 'a summary long enough to pass',
            'status' => RequestStatus::Pending,
        ]);

        Sanctum::actingAs($supervisorB);
        $this->patchJson("/api/requests/{$request->id}/accept")->assertForbidden();
    }
}
