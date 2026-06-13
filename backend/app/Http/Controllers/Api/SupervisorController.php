<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSupervisorProfileRequest;
use App\Http\Resources\SupervisorResource;
use App\Models\InterestTag;
use App\Models\SupervisorProfile;
use App\Models\User;
use App\Services\MatchScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupervisorController extends Controller
{
    /**
     * List supervisors with optional match scoring against a student's
     * proposal keywords, ranked by score. Filters: interest, department,
     * available capacity.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $proposalKeywords = $request->query('proposal_keywords');

        $query = User::query()
            ->where('role', Role::Supervisor)
            ->with(['supervisorProfile.interestTags', 'department']);

        if ($departmentId = $request->query('department_id')) {
            $query->where('department_id', (int) $departmentId);
        }

        if ($interest = $request->query('interest')) {
            $norm = InterestTag::normalise((string) $interest);
            $query->whereHas('supervisorProfile.interestTags', fn ($t) => $t->where('name', $norm));
        }

        $supervisors = $query->get();

        if ($request->boolean('available')) {
            $supervisors = $supervisors->filter(
                fn (User $s) => $s->supervisorProfile?->hasCapacity() ?? false
            );
        }

        $savedIds = $user->isStudent()
            ? $user->savedSupervisors()->pluck('supervisor_id')->all()
            : [];

        $supervisors->each(function (User $s) use ($proposalKeywords, $savedIds) {
            $tags = $s->supervisorProfile?->interestTags->pluck('name')->all() ?? [];
            $s->match_info = $proposalKeywords ? MatchScoreService::score($proposalKeywords, $tags) : null;
            $s->is_saved = in_array($s->id, $savedIds, true);
        });

        $supervisors = $proposalKeywords
            ? $supervisors->sortByDesc(fn (User $s) => $s->match_info['score'])->values()
            : $supervisors->sortBy('name')->values();

        return SupervisorResource::collection($supervisors);
    }

    public function show(Request $request, User $supervisor): JsonResponse
    {
        abort_unless($supervisor->role === Role::Supervisor, 404);

        $supervisor->load(['supervisorProfile.interestTags', 'department']);

        $proposalKeywords = $request->query('proposal_keywords');
        $tags = $supervisor->supervisorProfile?->interestTags->pluck('name')->all() ?? [];
        $supervisor->match_info = $proposalKeywords ? MatchScoreService::score($proposalKeywords, $tags) : null;

        if ($request->user()->isStudent()) {
            $supervisor->is_saved = $request->user()
                ->savedSupervisors()
                ->where('supervisor_id', $supervisor->id)
                ->exists();
        }

        return (new SupervisorResource($supervisor))->response();
    }

    /** A supervisor maintains their own profile (bio, capacity, interests). */
    public function updateProfile(UpdateSupervisorProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        $profile = SupervisorProfile::firstOrNew(['user_id' => $user->id]);
        $profile->bio = $data['bio'] ?? null;
        $profile->max_capacity = $data['max_capacity'];
        $profile->save();

        $tagIds = collect($data['interest_tags'] ?? [])
            ->map(fn ($name) => InterestTag::normalise((string) $name))
            ->filter()
            ->unique()
            ->map(fn ($name) => InterestTag::firstOrCreate(['name' => $name])->id)
            ->all();

        $profile->interestTags()->sync($tagIds);

        $user->load(['supervisorProfile.interestTags', 'department']);

        return (new SupervisorResource($user))->response();
    }
}
