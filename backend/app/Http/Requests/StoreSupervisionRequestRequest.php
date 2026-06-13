<?php

namespace App\Http\Requests;

use App\Models\SupervisionRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupervisionRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', SupervisionRequest::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'supervisor_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('role', 'supervisor'),
            ],
            'proposed_title' => ['required', 'string', 'max:255'],
            'proposal_summary' => ['required', 'string', 'min:20', 'max:5000'],
            'proposal_keywords' => ['required', 'array', 'min:1', 'max:20'],
            'proposal_keywords.*' => ['required', 'string', 'max:50'],
        ];
    }
}
