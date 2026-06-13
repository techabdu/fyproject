<?php

namespace App\Http\Requests\Auth;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            // Self-registration is limited to students and supervisors;
            // privileged accounts are seeded or created by a Super Admin.
            'role' => ['required', 'in:student,supervisor'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
        ];
    }

    public function role(): Role
    {
        return Role::from($this->input('role'));
    }
}
