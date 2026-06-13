<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // controller authorizes via the 'moderate' policy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Feedback is mandatory on rejection so the uploader sees a reason.
            'rejection_feedback' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
