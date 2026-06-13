<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => Role::Student,
            'department_id' => null,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }

    public function student(): static
    {
        return $this->state(fn () => ['role' => Role::Student]);
    }

    public function supervisor(): static
    {
        return $this->state(fn () => ['role' => Role::Supervisor]);
    }

    public function deptAdmin(): static
    {
        return $this->state(fn () => ['role' => Role::DeptAdmin]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => ['role' => Role::SuperAdmin]);
    }
}
