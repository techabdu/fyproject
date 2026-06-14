<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Project;
use App\Models\SupervisionRequest;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;

/**
 * Central place that turns domain events into in-app notifications for the
 * right recipient(s) (Module 5). Called from the relevant controllers.
 */
class NotificationService
{
    /** Dept admins of the project's department: a new submission awaits review. */
    public static function projectSubmitted(Project $project): void
    {
        $admins = User::query()
            ->where('role', Role::DeptAdmin)
            ->where('department_id', $project->department_id)
            ->get();

        Notification::send($admins, new SystemNotification(
            'project_submitted',
            "New project awaiting review: \"{$project->title}\".",
            ['project_id' => $project->id],
        ));
    }

    /** Uploader: their project's moderation status changed. */
    public static function projectModerated(Project $project): void
    {
        $approved = $project->status->value === 'approved';

        $project->uploader?->notify(new SystemNotification(
            $approved ? 'project_approved' : 'project_rejected',
            $approved
                ? "Your project \"{$project->title}\" was approved and is now in the repository."
                : "Your project \"{$project->title}\" was rejected. See the feedback to revise.",
            ['project_id' => $project->id],
        ));
    }

    /** Supervisor: a new supervision request was received. */
    public static function requestReceived(SupervisionRequest $request): void
    {
        $request->supervisor?->notify(new SystemNotification(
            'request_received',
            "New supervision request: \"{$request->proposed_title}\".",
            ['request_id' => $request->id],
        ));
    }

    /** Student: their request was accepted or declined. */
    public static function requestDecided(SupervisionRequest $request): void
    {
        $accepted = $request->status->value === 'accepted';

        $request->student?->notify(new SystemNotification(
            $accepted ? 'request_accepted' : 'request_declined',
            $accepted
                ? "Your request \"{$request->proposed_title}\" was accepted."
                : "Your request \"{$request->proposed_title}\" was declined.",
            ['request_id' => $request->id],
        ));
    }
}
