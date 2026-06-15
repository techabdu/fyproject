<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'current_password' => ['required_with:password', 'string', function (string $attr, mixed $value, \Closure $fail) {
                if (! Hash::check($value, $this->user()->password)) {
                    $fail('The current password is incorrect.');
                }
            }],
            'password' => ['sometimes', 'nullable', 'confirmed', Password::defaults()],
        ];
    }
}
