<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectProjectRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectKeyword;
use App\Services\MatchScoreService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectController extends Controller
{
    /**
     * Browse/search the APPROVED repository. Free-text over title+abstract via
     * FULLTEXT, plus filters: keyword, topic, graduation_year, department.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Project::class);

        $query = Project::query()
            ->approved()
            ->with(['department', 'uploader', 'keywords']);

        $q = trim((string) $request->query('q', ''));
        if ($q !== '') {
            if (DB::connection()->getDriverName() === 'mysql') {
                $query->whereRaw('MATCH(title, abstract) AGAINST (? IN NATURAL LANGUAGE MODE)', [$q])
                    ->orderByRaw('MATCH(title, abstract) AGAINST (? IN NATURAL LANGUAGE MODE) DESC', [$q]);
            } else {
                $query->where(fn ($w) => $w->where('title', 'like', "%{$q}%")->orWhere('abstract', 'like', "%{$q}%"));
            }
        } else {
            $query->latest();
        }

        if ($year = $request->query('year')) {
            $query->where('graduation_year', (int) $year);
        }

        if ($departmentId = $request->query('department_id')) {
            $query->where('department_id', (int) $departmentId);
        }

        // "topic area" is derived from keywords (per brief §12.5).
        foreach (['keyword', 'topic'] as $param) {
            if ($value = $request->query($param)) {
                $norm = ProjectKeyword::normalise((string) $value);
                $query->whereHas('keywords', fn ($k) => $k->where('keyword', $norm));
            }
        }

        return ProjectResource::collection($query->paginate(12)->withQueryString());
    }

    /** Show a single project (approved → anyone; otherwise owner/admin only). */
    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $project->load(['department', 'uploader', 'keywords']);

        return (new ProjectResource($project))
            ->additional(['similar_projects' => $this->similarProjects($project)])
            ->response();
    }

    /**
     * Student uploads a completed FYP. PDF is stored on the private disk
     * (outside the web root); the row enters the moderation queue as pending.
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $data = $request->validated();

        $path = $request->file('pdf')->storeAs(
            'projects',
            Str::uuid().'.pdf',
            'local' // storage/app/private — never publicly served
        );

        $project = DB::transaction(function () use ($data, $path, $request) {
            $project = Project::create([
                'title' => $data['title'],
                'abstract' => $data['abstract'],
                'department_id' => $data['department_id'],
                'graduation_year' => $data['graduation_year'],
                'uploaded_by' => $request->user()->id,
                'pdf_path' => $path,
                'status' => ProjectStatus::Pending,
            ]);

            $this->syncKeywords($project, $data['keywords']);

            return $project;
        });

        NotificationService::projectSubmitted($project);

        $project->load(['department', 'uploader', 'keywords']);

        return (new ProjectResource($project))
            ->additional([
                'duplicate_advisory' => $this->similarProjects($project),
            ])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Controlled PDF download: authenticated + permission-checked, streamed
     * from private storage. There is no public URL to the file.
     */
    public function download(Project $project): StreamedResponse
    {
        $this->authorize('download', $project);

        abort_unless(Storage::disk('local')->exists($project->pdf_path), 404, 'File not found.');

        $filename = Str::slug($project->title).'.pdf';

        return Storage::disk('local')->download($project->pdf_path, $filename);
    }

    // ----- Moderation (Dept Admin / Super Admin) -------------------------

    /** Pending queue, scoped to the admin's department (super admin: all). */
    public function moderationQueue(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        abort_unless($user->isAdmin(), 403);

        $query = Project::query()
            ->where('status', ProjectStatus::Pending)
            ->with(['department', 'uploader', 'keywords'])
            ->latest();

        if ($user->isDeptAdmin()) {
            $query->where('department_id', $user->department_id);
        }

        return ProjectResource::collection($query->paginate(12));
    }

    public function approve(Project $project): JsonResponse
    {
        $this->authorize('moderate', $project);

        $project->update([
            'status' => ProjectStatus::Approved,
            'rejection_feedback' => null,
        ]);

        NotificationService::projectModerated($project);

        return (new ProjectResource($project->load(['department', 'uploader', 'keywords'])))->response();
    }

    public function reject(RejectProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('moderate', $project);

        $project->update([
            'status' => ProjectStatus::Rejected,
            'rejection_feedback' => $request->validated('rejection_feedback'),
        ]);

        NotificationService::projectModerated($project);

        return (new ProjectResource($project->load(['department', 'uploader', 'keywords'])))->response();
    }

    // ----- Helpers -------------------------------------------------------

    /** Persist normalised, de-duplicated keywords for a project. */
    private function syncKeywords(Project $project, array $keywords): void
    {
        $normalised = collect($keywords)
            ->map(fn ($k) => ProjectKeyword::normalise((string) $k))
            ->filter()
            ->unique()
            ->values();

        foreach ($normalised as $keyword) {
            $project->keywords()->create(['keyword' => $keyword]);
        }
    }

    /**
     * Advisory duplicate/overlap indicator: approved projects with the highest
     * keyword overlap against this one. Not a hard block (per brief §7.1).
     *
     * @return array<int, array<string, mixed>>
     */
    private function similarProjects(Project $project): array
    {
        $own = $project->keywords()->pluck('keyword')->all();
        if (empty($own)) {
            return [];
        }

        return Project::query()
            ->approved()
            ->where('id', '!=', $project->id)
            ->whereHas('keywords', fn ($k) => $k->whereIn('keyword', $own))
            ->with('keywords')
            ->limit(25)
            ->get()
            ->map(function (Project $other) use ($own) {
                $overlap = MatchScoreService::overlap($own, $other->keywords->pluck('keyword')->all());

                return [
                    'id' => $other->id,
                    'title' => $other->title,
                    'graduation_year' => $other->graduation_year,
                    'overlap_count' => $overlap['overlap_count'],
                    'overlap_ratio' => $overlap['overlap_ratio'],
                    'matching_keywords' => $overlap['matching'],
                ];
            })
            ->filter(fn ($row) => $row['overlap_count'] > 0)
            ->sortByDesc('overlap_ratio')
            ->take(5)
            ->values()
            ->all();
    }
}
