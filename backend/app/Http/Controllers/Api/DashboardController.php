<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Enums\RequestStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\SupervisionRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * One tailored, permission-scoped dashboard payload per role (Module 4).
 * Each role only ever receives data it is allowed to see.
 */
class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $payload = match ($user->role) {
            Role::Student => $this->student($user),
            Role::Supervisor => $this->supervisor($user),
            Role::DeptAdmin => $this->deptAdmin($user),
            Role::SuperAdmin => $this->superAdmin(),
        };

        return response()->json(['data' => ['role' => $user->role->value] + $payload]);
    }

    // ---------------------------------------------------------------- student

    private function student(User $user): array
    {
        $uploads = Project::query()->where('uploaded_by', $user->id);

        $activeRequest = $user->sentRequests()
            ->whereIn('status', RequestStatus::ACTIVE)
            ->with('supervisor:id,name')
            ->latest()
            ->first();

        $latestDecision = $user->sentRequests()
            ->where('status', RequestStatus::Declined)
            ->with('supervisor:id,name')
            ->latest()
            ->first();

        return [
            'stats' => [
                'uploads_total' => (clone $uploads)->count(),
                'uploads_approved' => (clone $uploads)->where('status', ProjectStatus::Approved)->count(),
                'uploads_pending' => (clone $uploads)->where('status', ProjectStatus::Pending)->count(),
                'uploads_rejected' => (clone $uploads)->where('status', ProjectStatus::Rejected)->count(),
                'saved_count' => $user->savedSupervisors()->count(),
                'has_active_request' => (bool) $activeRequest,
            ],
            'active_request' => $activeRequest ? [
                'id' => $activeRequest->id,
                'status' => $activeRequest->status->value,
                'proposed_title' => $activeRequest->proposed_title,
                'supervisor' => $activeRequest->supervisor?->name,
                'decision_reason' => $activeRequest->decision_reason,
            ] : null,
            'recent_decline' => $latestDecision ? [
                'proposed_title' => $latestDecision->proposed_title,
                'supervisor' => $latestDecision->supervisor?->name,
                'decision_reason' => $latestDecision->decision_reason,
            ] : null,
            'my_projects' => Project::query()
                ->where('uploaded_by', $user->id)
                ->latest()
                ->limit(10)
                ->get(['id', 'title', 'status', 'graduation_year', 'rejection_feedback', 'created_at'])
                ->map(fn (Project $p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status->value,
                    'graduation_year' => $p->graduation_year,
                    'rejection_feedback' => $p->rejection_feedback,
                ]),
            'saved_supervisors' => User::query()
                ->whereIn('id', $user->savedSupervisors()->pluck('supervisor_id'))
                ->with('supervisorProfile')
                ->orderBy('name')
                ->get()
                ->map(fn (User $s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'available_slots' => $s->supervisorProfile?->available_slots ?? 0,
                    'max_capacity' => $s->supervisorProfile?->max_capacity ?? 0,
                ]),
        ];
    }

    // ------------------------------------------------------------- supervisor

    private function supervisor(User $user): array
    {
        $profile = $user->supervisorProfile;
        $received = $user->receivedRequests();

        return [
            'capacity' => [
                'current_load' => $profile?->current_load ?? 0,
                'max_capacity' => $profile?->max_capacity ?? 0,
                'available_slots' => $profile?->available_slots ?? 0,
                'percentage' => $profile && $profile->max_capacity > 0
                    ? (int) round($profile->current_load / $profile->max_capacity * 100)
                    : 0,
            ],
            'stats' => [
                'pending_count' => (clone $received)->where('status', RequestStatus::Pending)->count(),
                'accepted_count' => (clone $received)->where('status', RequestStatus::Accepted)->count(),
                'declined_count' => (clone $received)->where('status', RequestStatus::Declined)->count(),
            ],
            'pending_requests' => (clone $received)
                ->where('status', RequestStatus::Pending)
                ->with('student:id,name,email')
                ->latest()
                ->get()
                ->map(fn (SupervisionRequest $r) => [
                    'id' => $r->id,
                    'proposed_title' => $r->proposed_title,
                    'proposal_keywords' => $r->proposal_keywords,
                    'student' => $r->student?->name,
                    'created_at' => $r->created_at,
                ]),
            'accepted_students' => (clone $received)
                ->where('status', RequestStatus::Accepted)
                ->with('student:id,name,email')
                ->latest()
                ->get()
                ->map(fn (SupervisionRequest $r) => [
                    'id' => $r->id,
                    'proposed_title' => $r->proposed_title,
                    'student' => $r->student?->name,
                    'student_email' => $r->student?->email,
                ]),
        ];
    }

    // -------------------------------------------------------------- dept admin

    private function deptAdmin(User $user): array
    {
        $deptId = $user->department_id;
        $projects = Project::query()->where('department_id', $deptId);

        return [
            'department' => $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->name,
                'faculty' => $user->department->faculty,
            ] : null,
            'stats' => [
                'pending_approvals' => (clone $projects)->where('status', ProjectStatus::Pending)->count(),
                'approved_projects' => (clone $projects)->where('status', ProjectStatus::Approved)->count(),
                'rejected_projects' => (clone $projects)->where('status', ProjectStatus::Rejected)->count(),
                'supervisors' => User::where('role', Role::Supervisor)->where('department_id', $deptId)->count(),
                'students' => User::where('role', Role::Student)->where('department_id', $deptId)->count(),
                'total_requests' => $this->departmentRequestCount($deptId),
            ],
            'pending_projects' => (clone $projects)
                ->where('status', ProjectStatus::Pending)
                ->with('uploader:id,name')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (Project $p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'uploader' => $p->uploader?->name,
                    'graduation_year' => $p->graduation_year,
                ]),
            'supervisor_roster' => User::query()
                ->where('role', Role::Supervisor)
                ->where('department_id', $deptId)
                ->with('supervisorProfile.interestTags')
                ->orderBy('name')
                ->get()
                ->map(fn (User $s) => $this->rosterRow($s)),
        ];
    }

    // ------------------------------------------------------------- super admin

    private function superAdmin(): array
    {
        return [
            'stats' => [
                'departments' => \App\Models\Department::count(),
                'users' => User::count(),
                'students' => User::where('role', Role::Student)->count(),
                'supervisors' => User::where('role', Role::Supervisor)->count(),
                'admins' => User::whereIn('role', [Role::DeptAdmin, Role::SuperAdmin])->count(),
                'projects' => Project::count(),
                'approved_projects' => Project::where('status', ProjectStatus::Approved)->count(),
                'pending_projects' => Project::where('status', ProjectStatus::Pending)->count(),
                'total_requests' => SupervisionRequest::count(),
                'accepted_requests' => SupervisionRequest::where('status', RequestStatus::Accepted)->count(),
            ],
            'departments' => \App\Models\Department::query()
                ->orderBy('faculty')->orderBy('name')
                ->get()
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'name' => $d->name,
                    'faculty' => $d->faculty,
                    'students' => User::where('role', Role::Student)->where('department_id', $d->id)->count(),
                    'supervisors' => User::where('role', Role::Supervisor)->where('department_id', $d->id)->count(),
                    'approved_projects' => Project::where('department_id', $d->id)->where('status', ProjectStatus::Approved)->count(),
                    'pending_projects' => Project::where('department_id', $d->id)->where('status', ProjectStatus::Pending)->count(),
                ]),
        ];
    }

    // ----------------------------------------------------------------- helpers

    private function rosterRow(User $s): array
    {
        $p = $s->supervisorProfile;

        return [
            'id' => $s->id,
            'name' => $s->name,
            'current_load' => $p?->current_load ?? 0,
            'max_capacity' => $p?->max_capacity ?? 0,
            'available_slots' => $p?->available_slots ?? 0,
            'interest_tags' => $p ? $p->interestTags->pluck('name')->all() : [],
        ];
    }

    private function departmentRequestCount(?int $deptId): int
    {
        return SupervisionRequest::query()
            ->whereIn('supervisor_id', User::where('role', Role::Supervisor)->where('department_id', $deptId)->pluck('id'))
            ->count();
    }
}
