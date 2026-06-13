<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Project::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'abstract' => ['required', 'string', 'min:20'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'graduation_year' => ['required', 'integer', 'min:1980', 'max:'.(date('Y') + 1)],
            'keywords' => ['required', 'array', 'min:1', 'max:20'],
            'keywords.*' => ['required', 'string', 'max:50'],
            // PDF only, capped at 20 MB (20480 KB).
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ];
    }
}
