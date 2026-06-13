<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupervisorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSupervisor() ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'bio' => ['nullable', 'string', 'max:2000'],
            'max_capacity' => [
                'required', 'integer', 'min:0', 'max:100',
                function (string $attr, mixed $value, \Closure $fail) {
                    $load = $this->user()?->supervisorProfile?->current_load ?? 0;
                    if ((int) $value < $load) {
                        $fail("Max capacity cannot be below your current load ({$load}).");
                    }
                },
            ],
            'interest_tags' => ['present', 'array', 'max:30'],
            'interest_tags.*' => ['string', 'max:50'],
        ];
    }
}
