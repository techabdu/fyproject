<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SupervisorProfile */
class SupervisorProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bio' => $this->bio,
            'max_capacity' => $this->max_capacity,
            'current_load' => $this->current_load,
            'available_slots' => $this->available_slots,
            'has_capacity' => $this->hasCapacity(),
            'interest_tags' => $this->whenLoaded(
                'interestTags',
                fn () => $this->interestTags->pluck('name')->all()
            ),
        ];
    }
}
