<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\SupervisorResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SavedSupervisorController extends Controller
{
    /** List the current student's bookmarked supervisors. */
    public function index(Request $request): AnonymousResourceCollection
    {
        abort_unless($request->user()->isStudent(), 403);

        $supervisors = User::query()
            ->whereIn('id', $request->user()->savedSupervisors()->pluck('supervisor_id'))
            ->where('role', Role::Supervisor)
            ->with(['supervisorProfile.interestTags', 'department'])
            ->orderBy('name')
            ->get()
            ->each(fn (User $s) => $s->is_saved = true);

        return SupervisorResource::collection($supervisors);
    }

    public function store(Request $request, User $supervisor): JsonResponse
    {
        abort_unless($request->user()->isStudent(), 403);
        abort_unless($supervisor->role === Role::Supervisor, 422, 'Not a supervisor.');

        $request->user()->savedSupervisors()->firstOrCreate([
            'supervisor_id' => $supervisor->id,
        ]);

        return response()->json(['message' => 'Supervisor bookmarked.'], 201);
    }

    public function destroy(Request $request, User $supervisor): JsonResponse
    {
        abort_unless($request->user()->isStudent(), 403);

        $request->user()->savedSupervisors()
            ->where('supervisor_id', $supervisor->id)
            ->delete();

        return response()->json(['message' => 'Bookmark removed.']);
    }
}
