<?php

namespace App\Http\Controllers\Api;

use App\Enums\RequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\DeclineSupervisionRequestRequest;
use App\Http\Requests\StoreSupervisionRequestRequest;
use App\Http\Resources\SupervisionRequestResource;
use App\Models\SupervisionRequest;
use App\Models\SupervisorProfile;
use App\Services\MatchScoreService;
use App\Services\NotificationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SupervisionRequestController extends Controller
{
    /** Role-scoped list: students see sent requests, supervisors see received. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        if ($user->isStudent()) {
            $requests = $user->sentRequests()
                ->with(['supervisor.supervisorProfile.interestTags', 'supervisor.department'])
                ->latest()->get();
        } elseif ($user->isSupervisor()) {
            $requests = $user->receivedRequests()
                ->with(['student.department'])
                ->latest()->get();
        } else {
            abort(403);
        }

        return SupervisionRequestResource::collection($requests);
    }

    /**
     * Submit a supervision request. Enforces the one-active-request rule inside
     * a transaction; the DB-level unique `active_lock` index is the race-safe
     * backstop if two submissions arrive concurrently.
     */
    public function store(StoreSupervisionRequestRequest $request): JsonResponse
    {
        $this->authorize('create', SupervisionRequest::class);

        $user = $request->user();
        $data = $request->validated();
        $keywords = MatchScoreService::tokenise($data['proposal_keywords']);

        try {
            $supervisionRequest = DB::transaction(function () use ($user, $data, $keywords) {
                // Best-effort lock on any existing active rows for this student.
                $hasActive = SupervisionRequest::query()
                    ->where('student_id', $user->id)
                    ->whereIn('status', RequestStatus::ACTIVE)
                    ->lockForUpdate()
                    ->exists();

                if ($hasActive) {
                    abort(422, 'You already have an active supervision request. Resolve it before submitting another.');
                }

                return SupervisionRequest::create([
                    'student_id' => $user->id,
                    'supervisor_id' => $data['supervisor_id'],
                    'proposed_title' => $data['proposed_title'],
                    'proposal_summary' => $data['proposal_summary'],
                    'proposal_keywords' => implode(', ', $keywords),
                    'status' => RequestStatus::Pending,
                ]);
            });
        } catch (QueryException $e) {
            // 23000 = integrity constraint violation (the active_lock unique key).
            if ($e->getCode() === '23000') {
                abort(422, 'You already have an active supervision request.');
            }
            throw $e;
        }

        $supervisionRequest->load(['supervisor.supervisorProfile', 'student']);

        NotificationService::requestReceived($supervisionRequest);

        return (new SupervisionRequestResource($supervisionRequest))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Supervisor accepts. Increments current_load transactionally under a row
     * lock and refuses if it would exceed max_capacity (race-safe).
     */
    public function accept(Request $request, SupervisionRequest $supervisionRequest): JsonResponse
    {
        $this->authorize('decide', $supervisionRequest);

        if ($supervisionRequest->status !== RequestStatus::Pending) {
            abort(422, 'Only a pending request can be accepted.');
        }

        DB::transaction(function () use ($request, $supervisionRequest) {
            $profile = SupervisorProfile::query()
                ->where('user_id', $supervisionRequest->supervisor_id)
                ->lockForUpdate()
                ->first();

            if (! $profile || $profile->current_load >= $profile->max_capacity) {
                abort(422, 'You are at full capacity and cannot accept more students.');
            }

            $profile->increment('current_load');

            $supervisionRequest->update([
                'status' => RequestStatus::Accepted,
                'decision_reason' => $request->input('decision_reason'),
            ]);
        });

        $supervisionRequest->load(['supervisor.supervisorProfile', 'student']);

        NotificationService::requestDecided($supervisionRequest);

        return (new SupervisionRequestResource($supervisionRequest))->response();
    }

    /** Supervisor declines (reason required). Frees the student to request again. */
    public function decline(DeclineSupervisionRequestRequest $request, SupervisionRequest $supervisionRequest): JsonResponse
    {
        $this->authorize('decide', $supervisionRequest);

        if ($supervisionRequest->status !== RequestStatus::Pending) {
            abort(422, 'Only a pending request can be declined.');
        }

        $supervisionRequest->update([
            'status' => RequestStatus::Declined,
            'decision_reason' => $request->validated('decision_reason'),
        ]);

        $supervisionRequest->load(['supervisor.supervisorProfile', 'student']);

        NotificationService::requestDecided($supervisionRequest);

        return (new SupervisionRequestResource($supervisionRequest))->response();
    }
}
