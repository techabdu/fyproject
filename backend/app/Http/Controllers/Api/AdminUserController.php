<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * Faculty-wide user account management (Super Admin only). Lets the Super Admin
 * create and assign other admins, supervisors and students across departments.
 */
class AdminUserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->with('department')->latest();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }
        if ($departmentId = $request->query('department_id')) {
            $query->where('department_id', (int) $departmentId);
        }
        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(fn ($w) => $w->where('name', 'like', "%{$q}%")->orWhere('email', 'like', "%{$q}%"));
        }

        return UserResource::collection($query->paginate(15)->withQueryString());
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'department_id' => $data['department_id'] ?? null,
            ]);

            if ($user->role === Role::Supervisor) {
                SupervisorProfile::firstOrCreate(['user_id' => $user->id], ['max_capacity' => 0, 'current_load' => 0]);
            }

            return $user;
        });

        return (new UserResource($user->load('department')))->response()->setStatusCode(201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($user, $data) {
            $user->fill([
                'name' => $data['name'] ?? $user->name,
                'email' => $data['email'] ?? $user->email,
                'role' => $data['role'] ?? $user->role->value,
                'department_id' => array_key_exists('department_id', $data) ? $data['department_id'] : $user->department_id,
            ]);

            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }

            $user->save();

            // Ensure a supervisor always has a profile.
            if ($user->role === Role::Supervisor) {
                SupervisorProfile::firstOrCreate(['user_id' => $user->id], ['max_capacity' => 0, 'current_load' => 0]);
            }
        });

        return (new UserResource($user->fresh()->load('department')))->response();
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->id === $request->user()->id, 422, 'You cannot delete your own account.');

        if ($user->isSuperAdmin() && User::where('role', Role::SuperAdmin)->count() <= 1) {
            abort(422, 'Cannot delete the only super admin.');
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
