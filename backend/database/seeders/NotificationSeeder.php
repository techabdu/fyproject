<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\SupervisionRequest;
use App\Services\NotificationService;
use Illuminate\Database\Seeder;

/**
 * Generates a realistic notification history for the demo by replaying the
 * seeded domain state through the real NotificationService.
 */
class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Supervision request outcomes.
        SupervisionRequest::with(['supervisor', 'student'])->get()->each(function (SupervisionRequest $r) {
            match ($r->status->value) {
                'pending' => NotificationService::requestReceived($r),
                'accepted', 'declined' => NotificationService::requestDecided($r),
                default => null,
            };
        });

        // Pending submissions awaiting the relevant department admins.
        Project::where('status', ProjectStatus::Pending)->get()
            ->each(fn (Project $p) => NotificationService::projectSubmitted($p));

        // A couple of moderation outcomes for uploaders.
        Project::where('status', ProjectStatus::Approved)->latest()->take(2)->get()
            ->each(fn (Project $p) => NotificationService::projectModerated($p));
    }
}
