<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Project */
class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'department_id' => $this->department_id,
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'graduation_year' => $this->graduation_year,
            'status' => $this->status->value,
            'rejection_feedback' => $this->rejection_feedback,
            'uploaded_by' => $this->uploaded_by,
            'uploader' => new UserResource($this->whenLoaded('uploader')),
            'keywords' => $this->whenLoaded(
                'keywords',
                fn () => $this->keywords->pluck('keyword')->all()
            ),
            'created_at' => $this->created_at,
            // Download is always via the controlled endpoint, never a raw path.
            'download_url' => route('projects.download', $this->id),
        ];
    }
}
