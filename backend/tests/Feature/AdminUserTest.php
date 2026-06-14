<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_list_users(): void
    {
        $dept = Department::factory()->create();
        User::factory()->count(3)->create(['department_id' => $dept->id]);
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->getJson('/api/admin/users')->assertOk()->assertJsonStructure(['data', 'meta']);
    }

    public function test_non_super_admin_cannot_manage_users(): void
    {
        $dept = Department::factory()->create();
        Sanctum::actingAs(User::factory()->deptAdmin()->create(['department_id' => $dept->id]));

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->postJson('/api/admin/users', [])->assertForbidden();
    }

    public function test_super_admin_can_create_a_supervisor_with_profile(): void
    {
        $dept = Department::factory()->create();
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->postJson('/api/admin/users', [
            'name' => 'New Sup',
            'email' => 'newsup@abu.edu.ng',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'supervisor',
            'department_id' => $dept->id,
        ])->assertCreated()->assertJsonPath('data.role', 'supervisor');

        $user = User::where('email', 'newsup@abu.edu.ng')->first();
        $this->assertDatabaseHas('supervisor_profiles', ['user_id' => $user->id]);
    }

    public function test_super_admin_can_reassign_role_and_department(): void
    {
        $deptA = Department::factory()->create();
        $deptB = Department::factory()->create();
        $user = User::factory()->student()->create(['department_id' => $deptA->id]);
        Sanctum::actingAs(User::factory()->superAdmin()->create());

        $this->patchJson("/api/admin/users/{$user->id}", [
            'role' => 'dept_admin',
            'department_id' => $deptB->id,
        ])->assertOk()->assertJsonPath('data.role', 'dept_admin');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'dept_admin', 'department_id' => $deptB->id]);
    }

    public function test_super_admin_cannot_delete_self(): void
    {
        $admin = User::factory()->superAdmin()->create();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_analytics_is_super_admin_only_and_returns_aggregates(): void
    {
        $dept = Department::factory()->create();
        Sanctum::actingAs(User::factory()->deptAdmin()->create(['department_id' => $dept->id]));
        $this->getJson('/api/admin/analytics')->assertForbidden();

        Sanctum::actingAs(User::factory()->superAdmin()->create());
        $this->getJson('/api/admin/analytics')
            ->assertOk()
            ->assertJsonStructure(['data' => ['projects_by_status', 'requests_by_status', 'capacity_utilisation', 'top_interest_areas']]);
    }
}
