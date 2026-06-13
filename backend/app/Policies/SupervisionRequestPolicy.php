<?php

namespace App\Policies;

use App\Models\SupervisionRequest;
use App\Models\User;

class SupervisionRequestPolicy
{
    /** Only students submit supervision requests. */
    public function create(User $user): bool
    {
        return $user->isStudent();
    }

    /** Visible to the student who sent it or the supervisor who received it. */
    public function view(User $user, SupervisionRequest $request): bool
    {
        return $user->id === $request->student_id
            || $user->id === $request->supervisor_id;
    }

    /** Only the receiving supervisor may accept/decline. */
    public function decide(User $user, SupervisionRequest $request): bool
    {
        return $user->isSupervisor() && $user->id === $request->supervisor_id;
    }
}
