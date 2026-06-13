<?php

namespace App\Policies;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /** Any authenticated user may browse the (approved) repository. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /** Approved projects are visible to all; otherwise only owner/admin. */
    public function view(User $user, Project $project): bool
    {
        if ($project->status === ProjectStatus::Approved) {
            return true;
        }

        return $user->id === $project->uploaded_by
            || $user->canActOnDepartment($project->department_id);
    }

    /** Only students upload completed FYPs. */
    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    /** Controlled PDF download mirrors view permission. */
    public function download(User $user, Project $project): bool
    {
        return $this->view($user, $project);
    }

    /** Approve/reject is limited to admins scoped to the project's department. */
    public function moderate(User $user, Project $project): bool
    {
        return $user->canActOnDepartment($project->department_id);
    }
}
