<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeclineSupervisionRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // controller authorizes via the 'decide' policy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // A reason is mandatory on decline (brief §7.3).
            'decision_reason' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
