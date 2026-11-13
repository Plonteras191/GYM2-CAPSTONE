<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\AdminProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\CoachEventController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\PackageCategoryController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\MembershipController;
use App\Http\Controllers\Member\TransactionController;
use App\Http\Controllers\AI\AiBridgeController;
use App\Http\Controllers\AI\AttendanceController;
use App\Http\Controllers\Tracking\WorkoutController;

// =====================================================================
// PUBLIC ROUTES
// =====================================================================

// --- 1. AUTHENTICATION ROUTES (rate limited per IP) ---
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/login/verify', [AuthController::class, 'verifyLogin']);
    Route::post('/auth/password-reset/verify', [AuthController::class, 'verifyPasswordResetPin']);
    Route::post('/auth/password-reset', [AuthController::class, 'resetPassword']);
});
// Sending a reset PIN emails the admin, so allow fewer requests.
Route::post('/auth/password-reset/request', [AuthController::class, 'requestPasswordReset'])
    ->middleware('throttle:3,1');

Route::get('/branding', [AdminProfileController::class, 'branding']);
Route::get('/branding/logo', [AdminProfileController::class, 'logo']);

// =====================================================================
// PROTECTED ADMIN ROUTES (React dashboard) - require a Sanctum token
// =====================================================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/admin/me', [AdminProfileController::class, 'show']);
    Route::post('/admin/profile', [AdminProfileController::class, 'update']);
    Route::post('/admin/logo', [AdminProfileController::class, 'updateLogo']);
    Route::post('/admin/password', [AdminProfileController::class, 'updatePassword']);

    // --- 2. MEMBER ROUTES ---
    Route::get('/members', [MemberController::class, 'index']);
    Route::post('/members', [MemberController::class, 'store']);
    Route::put('/members/{id}', [MemberController::class, 'update']);
    Route::delete('/members/{id}', [MemberController::class, 'destroy']);

    // --- 3. SUBSCRIPTION / MEMBERSHIP ROUTES ---
    Route::get('/memberships', [MembershipController::class, 'index']);
    Route::post('/memberships', [MembershipController::class, 'store']);
    Route::put('/memberships/{id}', [MembershipController::class, 'update']);
    Route::delete('/memberships/{id}', [MembershipController::class, 'destroy']);

    // --- 4. PLAN ROUTES ---
    Route::get('/plans', [PlanController::class, 'index']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::put('/plans/{id}', [PlanController::class, 'update']);
    Route::delete('/plans/{id}', [PlanController::class, 'destroy']);
    Route::post('/plans/bulk-update', [PlanController::class, 'bulkUpdate']);
    Route::get('/package-categories', [PackageCategoryController::class, 'index']);
    Route::post('/package-categories', [PackageCategoryController::class, 'store']);
    Route::put('/package-categories/{id}', [PackageCategoryController::class, 'update']);
    Route::delete('/package-categories/{id}', [PackageCategoryController::class, 'destroy']);

    // --- 4A. COACH CALENDAR EVENT ROUTES ---
    Route::get('/coach-events', [CoachEventController::class, 'index']);
    Route::post('/coach-events', [CoachEventController::class, 'store']);
    Route::put('/coach-events/{id}', [CoachEventController::class, 'update']);
    Route::delete('/coach-events/{id}', [CoachEventController::class, 'destroy']);
    Route::get('/coach-event-categories', [CoachEventController::class, 'categories']);
    Route::put('/coach-event-categories/{id}', [CoachEventController::class, 'updateCategory']);
    Route::delete('/coach-event-categories/{id}', [CoachEventController::class, 'destroyCategory']);

    // --- 5. TRANSACTION ROUTES ---
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);
    Route::post('/transactions/{id}/refund', [TransactionController::class, 'refund']);

    // --- 6. REPORTS ---
    Route::get('/reports', [ReportController::class, 'index']);

    // --- 7. DASHBOARD ---
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/notifications', [DashboardController::class, 'notifications']);

    // --- 8. ATTENDANCE ---
    Route::get('/members/{id}/attendance', [AttendanceController::class, 'getMemberAttendance']);
    Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);
    Route::post('/attendance/manual', [AttendanceController::class, 'manualCheckIn']);

    // --- 9. WORKOUTS (SUPERVISOR MODE) ---
    Route::post('/members/{id}/assign-task', [WorkoutController::class, 'assignTask']);
    Route::get('/members/{id}/workout-plan', [WorkoutController::class, 'showPlan']);
    Route::post('/members/{id}/workout-plan', [WorkoutController::class, 'syncPlan']);
    Route::get('/members/{id}/workouts', [WorkoutController::class, 'history']);
    Route::put('/workouts/{id}/manual-verify', [WorkoutController::class, 'manualVerify']);
    Route::get('/workouts/live', [WorkoutController::class, 'live']);
});

// =====================================================================
// PYTHON AI BRIDGE ROUTES - require the shared X-AI-Engine-Token header
// =====================================================================
Route::middleware('ai.engine')->group(function () {
    Route::get('/ai/members-faces', [AiBridgeController::class, 'memberFaces']);
    Route::get('/ai/workout-plans', [AiBridgeController::class, 'workoutPlans']);
    Route::post('/ai/log-attendance', [AttendanceController::class, 'logAttendance']);
    Route::post('/ai/log-workout', [AiBridgeController::class, 'logWorkout']);
});
