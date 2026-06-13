<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Models\InterestTag;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MetaController extends Controller
{
    /** Public: needed on the registration screen. */
    public function departments(): AnonymousResourceCollection
    {
        return DepartmentResource::collection(
            Department::query()->orderBy('faculty')->orderBy('name')->get()
        );
    }

    /** All interest tags (for supervisor filtering and profile editing). */
    public function interestTags(): JsonResponse
    {
        return response()->json([
            'data' => InterestTag::query()->orderBy('name')->pluck('name'),
        ]);
    }

    /**
     * Distinct keyword "topic areas" derived from approved projects — feeds the
     * repository topic filter (per brief §12.5).
     */
    public function topics(): JsonResponse
    {
        $topics = Project::query()
            ->approved()
            ->join('project_keywords', 'projects.id', '=', 'project_keywords.project_id')
            ->distinct()
            ->orderBy('project_keywords.keyword')
            ->pluck('project_keywords.keyword');

        return response()->json(['data' => $topics]);
    }
}
