<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProjectStatus;
use App\Enums\RequestStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Faculty-wide aggregate analytics (Super Admin only).
 */
class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => [
            'projects_by_year' => Project::query()
                ->where('status', ProjectStatus::Approved)
                ->select('graduation_year', DB::raw('COUNT(*) as count'))
                ->groupBy('graduation_year')
                ->orderBy('graduation_year')
                ->get(),

            'projects_by_status' => [
                'approved' => Project::where('status', ProjectStatus::Approved)->count(),
                'pending' => Project::where('status', ProjectStatus::Pending)->count(),
                'rejected' => Project::where('status', ProjectStatus::Rejected)->count(),
            ],

            'requests_by_status' => [
                'pending' => SupervisionRequest::where('status', RequestStatus::Pending)->count(),
                'accepted' => SupervisionRequest::where('status', RequestStatus::Accepted)->count(),
                'declined' => SupervisionRequest::where('status', RequestStatus::Declined)->count(),
            ],

            'capacity_utilisation' => $this->capacity(),

            'top_interest_areas' => DB::table('interest_tags')
                ->join('supervisor_interest_tag', 'interest_tags.id', '=', 'supervisor_interest_tag.interest_tag_id')
                ->select('interest_tags.name', DB::raw('COUNT(*) as supervisors'))
                ->groupBy('interest_tags.name')
                ->orderByDesc('supervisors')
                ->limit(8)
                ->get(),

            'top_topics' => DB::table('project_keywords')
                ->join('projects', 'projects.id', '=', 'project_keywords.project_id')
                ->where('projects.status', ProjectStatus::Approved->value)
                ->select('project_keywords.keyword', DB::raw('COUNT(*) as count'))
                ->groupBy('project_keywords.keyword')
                ->orderByDesc('count')
                ->limit(8)
                ->get(),
        ]]);
    }

    /** @return array{total_load: int, total_capacity: int, percentage: int, supervisors: int} */
    private function capacity(): array
    {
        $totals = SupervisorProfile::query()
            ->selectRaw('COALESCE(SUM(current_load),0) as total_load, COALESCE(SUM(max_capacity),0) as total_cap, COUNT(*) as n')
            ->first();

        $load = (int) ($totals->total_load ?? 0);
        $cap = (int) ($totals->total_cap ?? 0);

        return [
            'total_load' => $load,
            'total_capacity' => $cap,
            'percentage' => $cap > 0 ? (int) round($load / $cap * 100) : 0,
            'supervisors' => (int) ($totals->n ?? 0),
        ];
    }
}
