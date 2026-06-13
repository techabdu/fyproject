<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A supervisor = a User (role: supervisor) + their SupervisorProfile, with an
 * optional match score (when a proposal was supplied) and a bookmark flag.
 *
 * @mixin \App\Models\User
 */
class SupervisorResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $profile = $this->supervisorProfile;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'bio' => $profile?->bio,
            'max_capacity' => $profile?->max_capacity ?? 0,
            'current_load' => $profile?->current_load ?? 0,
            'available_slots' => $profile?->available_slots ?? 0,
            'has_capacity' => $profile?->hasCapacity() ?? false,
            'interest_tags' => $profile
                ? $profile->interestTags->pluck('name')->all()
                : [],
            // Populated by controllers; null when not requested/applicable.
            'match' => $this->match_info ?? null,
            'is_saved' => (bool) ($this->is_saved ?? false),
        ];
    }
}
