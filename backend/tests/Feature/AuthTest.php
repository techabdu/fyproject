<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_self_register(): void
    {
        $dept = Department::factory()->create();

        $response = $this->postJson('/api/register', [
            'name' => 'New Student',
            'email' => 'new.student@abu.edu.ng',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'student',
            'department_id' => $dept->id,
        ]);

        $response->assertCreated()->assertJsonPath('data.role', 'student');
        $this->assertDatabaseHas('users', ['email' => 'new.student@abu.edu.ng', 'role' => 'student']);
    }

    public function test_supervisor_registration_creates_a_profile(): void
    {
        $dept = Department::factory()->create();

        $this->postJson('/api/register', [
            'name' => 'New Supervisor',
            'email' => 'new.sup@abu.edu.ng',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'supervisor',
            'department_id' => $dept->id,
        ])->assertCreated();

        $user = User::where('email', 'new.sup@abu.edu.ng')->first();
        $this->assertDatabaseHas('supervisor_profiles', ['user_id' => $user->id]);
    }

    public function test_cannot_self_register_as_admin(): void
    {
        $dept = Department::factory()->create();

        $this->postJson('/api/register', [
            'name' => 'Sneaky',
            'email' => 'sneaky@abu.edu.ng',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'super_admin',
            'department_id' => $dept->id,
        ])->assertStatus(422)->assertJsonValidationErrorFor('role');
    }

    public function test_login_rejects_bad_credentials(): void
    {
        User::factory()->create(['email' => 'a@abu.edu.ng']);

        $this->postJson('/api/login', [
            'email' => 'a@abu.edu.ng',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }
}
