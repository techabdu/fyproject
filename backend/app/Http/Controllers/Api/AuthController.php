<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\SupervisorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Self-registration for students and supervisors. A supervisor gets an
     * empty profile they can complete later.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->string('name'),
                'email' => $request->string('email'),
                'password' => $request->string('password'),
                'role' => $request->role(),
                'department_id' => $request->integer('department_id'),
            ]);

            if ($user->role === Role::Supervisor) {
                SupervisorProfile::create([
                    'user_id' => $user->id,
                    'max_capacity' => 0,
                    'current_load' => 0,
                ]);
            }

            return $user;
        });

        Auth::login($user);
        $this->regenerateSession($request);

        return (new UserResource($user->load('department', 'supervisorProfile')))
            ->response()
            ->setStatusCode(201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'), true)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $this->regenerateSession($request);

        return $this->me($request);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    /** Rotate the session id (fixation protection) when a session is present. */
    private function regenerateSession(Request $request): void
    {
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
    }

    /** Current authenticated user with department + (if any) supervisor profile. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'department',
            'supervisorProfile.interestTags',
        ]);

        return (new UserResource($user))->response();
    }
}
