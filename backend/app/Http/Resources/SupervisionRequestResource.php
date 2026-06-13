<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SupervisionRequest */
class SupervisionRequestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'proposed_title' => $this->proposed_title,
            'proposal_summary' => $this->proposal_summary,
            'proposal_keywords' => $this->proposal_keywords,
            'decision_reason' => $this->decision_reason,
            'student_id' => $this->student_id,
            'supervisor_id' => $this->supervisor_id,
            'student' => new UserResource($this->whenLoaded('student')),
            'supervisor' => new UserResource($this->whenLoaded('supervisor')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
