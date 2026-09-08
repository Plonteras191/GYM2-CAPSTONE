<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;


// --- NEW IMPORTS FOR THE AI BRIDGE ---
use App\Models\Member;
use App\Models\Attendance;
use Carbon\Carbon;

// --- 1. AUTHENTICATION ROUTES ---
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    Route::get('/admin/me', function (Request $request) {
        return $request->user();
    });
});

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
Route::post('/plans', [PlanController::class, 'store']); // Adds a new plan
Route::delete('/plans/{id}', [PlanController::class, 'destroy']); // Deletes a plan
Route::post('/plans/bulk-update', [PlanController::class, 'bulkUpdate']);

// --- 5. TRANSACTION ROUTES ---
Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::put('/transactions/{id}', [TransactionController::class, 'update']);
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

// --- 6. REPORTS ROUTE ---
Route::get('/reports', [ReportController::class, 'index']);

// --- 7. PYTHON AI BRIDGE ROUTES ---
        // 1. The API Bridge: Tells Python who owns which face image
Route::get('/ai/members-faces', function () {
    return Member::whereNotNull('enrolled_face_id')
        ->select('id', 'first_name', 'last_name', 'enrolled_face_id')
        ->get()
        ->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->first_name . ' ' . $member->last_name,
                // Assuming enrolled_face_id stores the filename like "1783...png"
                'image_file' => $member->enrolled_face_id 
            ];
        });
});

        // 2. The Attendance Logger: Python will hit this when it sees a member
Route::post('/ai/log-attendance', function (Request $request) {
    $now = Carbon::now();
    $today = $now->toDateString();

    // RULE 1: Enforce Gym Operating Hours (9:00 AM to 9:30 PM)
    $openingTime = Carbon::createFromTime(9, 0, 0);
    $closingTime = Carbon::createFromTime(21, 30, 0);

    if (!$now->between($openingTime, $closingTime)) {
        return response()->json(['status' => 'ignored', 'message' => 'Outside gym operating hours.']);
    }

    $memberId = $request->member_id;

    // RULE 2: Enforce the "Once-a-Day" check-in rule
    $alreadyLogged = Attendance::where('member_id', $memberId)
                               ->where('date', $today)
                               ->exists(); 

    if (!$alreadyLogged) {
        Attendance::create([
            'member_id' => $memberId,
            'date' => $today,
            'time_in' => $now->toTimeString(),
        ]);
        return response()->json(['status' => 'logged', 'message' => 'Attendance recorded!']);
    }

    return response()->json(['status' => 'ignored', 'message' => 'Already logged today.']);
});

// --- 8. DASHBOARD ROUTES ---
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/notifications', [DashboardController::class, 'notifications']);

// --- 9. ATTENDANCE ROUTES ---
Route::get('/members/{id}/attendance', function ($id) {
    return App\Models\Attendance::where('member_id', $id)
        ->orderBy('date', 'desc')
        ->orderBy('time_in', 'desc')
        ->take(10)
        ->get();
});

// --- 10. LIVE DASHBOARD ROUTE ---
// Lightweight route that only grabs TODAY'S attendance so React doesn't crash
Route::get('/attendance/today', function () {
    return App\Models\Attendance::with('member:id,first_name,last_name')
        ->where('date', Carbon::now()->toDateString())
        ->orderBy('time_in', 'desc')
        ->get();
});

// --- 11. AI WORKOUT LOGGING PIPELINE (SUPERVISOR MODE) ---

// React Route: Coach Assigns a Task
Route::post('/members/{id}/assign-task', function (Request $request, $id) {
    $request->validate(['exercise' => 'required|string']);
    $exerciseName = strtoupper($request->exercise);

    // Prevent assigning the exact same task twice in one day
    $alreadyAssigned = App\Models\WorkoutLog::where('member_id', $id)
        ->where('date', Carbon::today())
        ->where('exercise', 'ASSIGNED: ' . $exerciseName)
        ->exists();

    if (!$alreadyAssigned) {
        App\Models\WorkoutLog::create([
            'member_id' => $id,
            'exercise' => 'ASSIGNED: ' . $exerciseName,
            'date' => Carbon::today(),
        ]);
    }
    return response()->json(['message' => 'Task assigned successfully!']);
});

// Python Route: AI Verifies the Task
Route::post('/ai/log-workout', function (Request $request) {
    $request->validate([
        'member_id' => 'required|exists:members,id',
        'exercise' => 'required|string'
    ]);
    
    $exerciseName = strtoupper($request->exercise);
    
    // Check if there is a PENDING task assigned for this exercise today
    $assignedTask = App\Models\WorkoutLog::where('member_id', $request->member_id)
        ->where('date', Carbon::today())
        ->where('exercise', 'ASSIGNED: ' . $exerciseName)
        ->first();

    if ($assignedTask) {
        // Task Verified! Strip the "ASSIGNED: " tag to mark it completed
        $assignedTask->update([
            'exercise' => $exerciseName,
            'created_at' => Carbon::now() // Log the exact time it was verified
        ]);
        return response()->json(['status' => 'logged', 'message' => 'Task verified!']);
    }

    // Anti-Spam: Normal unassigned logging
    $recentlyLogged = App\Models\WorkoutLog::where('member_id', $request->member_id)
        ->where('exercise', $exerciseName)
        ->where('created_at', '>=', Carbon::now()->subMinutes(2))
        ->exists();
        
    if (!$recentlyLogged) {
        App\Models\WorkoutLog::create([
            'member_id' => $request->member_id,
            'exercise' => $exerciseName,
            'date' => Carbon::today(),
        ]);
        return response()->json(['status' => 'logged']);
    }
    
    return response()->json(['status' => 'ignored']);
});

// React Route: Fetch a specific member's workout history
Route::get('/members/{id}/workouts', function ($id) {
    return App\Models\WorkoutLog::where('member_id', $id)
        ->orderBy('created_at', 'desc')
        ->take(15) 
        ->get();
});

// React Route: Coach Manually Verifies an Obscure Task (Biometrically Locked)
Route::put('/workouts/{id}/manual-verify', function ($id) {
    $log = App\Models\WorkoutLog::findOrFail($id);
    
    // Strip the "ASSIGNED: " tag to officially mark it as complete
    $cleanExerciseName = str_replace('ASSIGNED: ', '', $log->exercise);
    
    $log->update([
        'exercise' => $cleanExerciseName,
        'created_at' => Carbon::now() // Log the exact time the coach verified it
    ]);
    
    return response()->json(['message' => 'Task manually verified!']);
});

// --- LIVE GESTURE LOGS ROUTE ---
Route::get('/workouts/live', function () {
    return App\Models\WorkoutLog::with('member:id,first_name,last_name')
        ->orderBy('created_at', 'desc')
        ->take(15)
        ->get()
        ->map(function ($log) {
            return [
                'id' => $log->id,
                'time' => \Carbon\Carbon::parse($log->created_at)->format('h:i:s A'),
                'name' => $log->member ? $log->member->first_name . ' ' . $log->member->last_name : 'Unknown Athlete',
                'event' => str_replace('ASSIGNED: ', '(Pending) ', $log->exercise)
            ];
        });
});