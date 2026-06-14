<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SavedSupervisorController;
use App\Http\Controllers\Api\SupervisionRequestController;
use App\Http\Controllers\Api\SupervisorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes (under the stateful `api` group — Sanctum SPA cookie auth).
| RBAC is enforced server-side via the `role` middleware + model policies.
|--------------------------------------------------------------------------
*/

// ----- Public -----------------------------------------------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/departments', [MetaController::class, 'departments']);

// ----- Authenticated (any role) -----------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Role-tailored dashboard payload (Module 4).
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ----- Module 5: In-app notifications (all roles) -------------------
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // ----- Super Admin: user management + faculty analytics -------------
    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::patch('/users/{user}', [AdminUserController::class, 'update']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
        Route::get('/analytics', [AnalyticsController::class, 'index']);
    });

    Route::get('/interest-tags', [MetaController::class, 'interestTags']);
    Route::get('/topics', [MetaController::class, 'topics']);

    // ----- Module 1: Repository (browse/search/download) ----------------
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/projects/{project}/download', [ProjectController::class, 'download'])
        ->name('projects.download');

    // Upload (students only).
    Route::post('/projects', [ProjectController::class, 'store'])
        ->middleware('role:student');

    // Moderation (dept admin / super admin).
    Route::middleware('role:dept_admin,super_admin')->group(function () {
        Route::get('/moderation/projects', [ProjectController::class, 'moderationQueue']);
        Route::patch('/projects/{project}/approve', [ProjectController::class, 'approve']);
        Route::patch('/projects/{project}/reject', [ProjectController::class, 'reject']);
    });

    // ----- Module 2: Supervisor matching --------------------------------
    Route::get('/supervisors', [SupervisorController::class, 'index']);
    Route::get('/supervisors/{supervisor}', [SupervisorController::class, 'show']);

    // Supervisor maintains their own profile.
    Route::put('/supervisor/profile', [SupervisorController::class, 'updateProfile'])
        ->middleware('role:supervisor');

    // Bookmarks (students only).
    Route::middleware('role:student')->group(function () {
        Route::get('/saved-supervisors', [SavedSupervisorController::class, 'index']);
        Route::post('/supervisors/{supervisor}/save', [SavedSupervisorController::class, 'store']);
        Route::delete('/supervisors/{supervisor}/save', [SavedSupervisorController::class, 'destroy']);
    });

    // ----- Module 3: Supervision requests -------------------------------
    Route::get('/requests', [SupervisionRequestController::class, 'index']);
    Route::post('/requests', [SupervisionRequestController::class, 'store'])
        ->middleware('role:student');
    Route::patch('/requests/{supervisionRequest}/accept', [SupervisionRequestController::class, 'accept'])
        ->middleware('role:supervisor');
    Route::patch('/requests/{supervisionRequest}/decline', [SupervisionRequestController::class, 'decline'])
        ->middleware('role:supervisor');
});
