<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\AdminProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\MembershipController;
use App\Http\Controllers\Member\TransactionController;
use App\Http\Controllers\AI\AttendanceController;

use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use App\Models\Tracking\WorkoutLog;
use Carbon\Carbon;

// --- 1. AUTHENTICATION ROUTES ---
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/branding', [AdminProfileController::class, 'branding']);
Route::get('/branding/logo', [AdminProfileController::class, 'logo']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/admin/me', [AdminProfileController::class, 'show']);
    Route::post('/admin/profile', [AdminProfileController::class, 'update']);
    Route::post('/admin/logo', [AdminProfileController::class, 'updateLogo']);
    Route::post('/admin/password', [AdminProfileController::class, 'updatePassword']);
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
Route::post('/ai/log-attendance', [AttendanceController::class, 'logAttendance']);

// --- 8. DASHBOARD ROUTES ---
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/notifications', [DashboardController::class, 'notifications']);

// --- 9. ATTENDANCE ROUTES ---
Route::get('/members/{id}/attendance', [AttendanceController::class, 'getMemberAttendance']);

// --- 10. LIVE DASHBOARD ROUTE ---
Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);

// --- 11. AI WORKOUT LOGGING PIPELINE (SUPERVISOR MODE) ---

// React Route: Coach Assigns a Task
Route::post('/members/{id}/assign-task', function (Request $request, $id) {
    $request->validate([
        'exercise' => 'required|string',
        'sets' => 'nullable|integer|min:1|max:99',
        'reps' => 'nullable|integer|min:1|max:999',
        'date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
        'gesture_class' => 'nullable|string|in:BURPEE,CRUNCH,CURL,DEADLIFT,HIGH KNEE,LUNGE,MOUNTAIN CLIMBER,PLANK,PUSH UP,RUSSIAN TWIST,SIT UP,SQUAT',
    ]);
    $exerciseName = strtoupper($request->exercise);
    $taskDate = $request->input('date', Carbon::today()->toDateString());

    // Prevent assigning the exact same task twice on the same date
    $alreadyAssigned = WorkoutLog::where('member_id', $id)
        ->where('date', $taskDate)
        ->where('exercise', 'ASSIGNED: ' . $exerciseName)
        ->first();

    if ($alreadyAssigned) {
        $alreadyAssigned->update($request->only('sets', 'reps'));
    } else {
        WorkoutLog::create([
            'member_id' => $id,
            'exercise' => 'ASSIGNED: ' . $exerciseName,
            'date' => $taskDate,
            'sets' => $request->input('sets'),
            'reps' => $request->input('reps'),
            'gesture_class' => $request->input('gesture_class'),
        ]);
    }
    return response()->json(['message' => 'Task assigned successfully!']);
});

Route::get('/members/{id}/workout-plan', function ($id) {
    abort_unless(\App\Models\Member\Member::whereKey($id)->exists(), 404);

    $today = Carbon::today()->toDateString();
    $lastDate = Carbon::today()->addDays(6)->toDateString();

    return WorkoutLog::where('member_id', $id)
        ->whereBetween('date', [$today, $lastDate])
        ->where(function ($query) {
            $query->where('exercise', 'like', 'ASSIGNED: %')
                ->orWhere(function ($completed) {
                    $completed->whereNotNull('sets')->whereNotNull('reps');
                });
        })
        ->orderBy('date')
        ->orderBy('id')
        ->get();
});

Route::post('/members/{id}/workout-plan', function (Request $request, $id) {
    abort_unless(\App\Models\Member\Member::whereKey($id)->exists(), 404);

    $today = Carbon::today();
    $lastDate = $today->copy()->addDays(6);
    $validated = $request->validate([
        'tasks' => 'present|array',
        'tasks.*.exercise' => 'required|string|max:255',
        'tasks.*.sets' => 'required|integer|min:1|max:99',
        'tasks.*.reps' => 'required|integer|min:1|max:999',
        'tasks.*.date' => 'required|date_format:Y-m-d|after_or_equal:' . $today->toDateString() . '|before_or_equal:' . $lastDate->toDateString(),
        'tasks.*.gesture_class' => 'nullable|string|in:BURPEE,CRUNCH,CURL,DEADLIFT,HIGH KNEE,LUNGE,MOUNTAIN CLIMBER,PLANK,PUSH UP,RUSSIAN TWIST,SIT UP,SQUAT',
    ]);

    $startDate = $today->toDateString();
    $endDate = $lastDate->toDateString();
    \Illuminate\Support\Facades\DB::transaction(function () use ($id, $validated, $startDate, $endDate) {
        WorkoutLog::where('member_id', $id)
            ->whereBetween('date', [$startDate, $endDate])
            ->where('exercise', 'like', 'ASSIGNED: %')
            ->delete();

        foreach ($validated['tasks'] as $task) {
            WorkoutLog::create([
                'member_id' => $id,
                'exercise' => 'ASSIGNED: ' . strtoupper($task['exercise']),
                'date' => $task['date'],
                'sets' => $task['sets'],
                'reps' => $task['reps'],
                'gesture_class' => $task['gesture_class'] ?? null,
            ]);
        }
    });

    return response()->json(['message' => 'Workout plan synchronized.', 'task_count' => count($validated['tasks'])]);
});

// Python Route: AI Verifies the Task
Route::post('/ai/log-workout', function (Request $request) {
    $request->validate([
        'member_id' => 'required|exists:members,id',
        'exercise' => 'required|string'
    ]);
    
    $exerciseName = strtoupper($request->exercise);
    $today = Carbon::today()->toDateString();
    
    // Check if there is a PENDING task assigned for this exercise today
    $assignedTasks = WorkoutLog::where('member_id', $request->member_id)
        ->where('date', $today)
        ->where('exercise', 'like', 'ASSIGNED: %')
        ->where(function ($query) use ($exerciseName) {
            $query->where('gesture_class', $exerciseName)
                ->orWhere(function ($legacyQuery) use ($exerciseName) {
                    $legacyQuery->whereNull('gesture_class')
                        ->where('exercise', 'ASSIGNED: ' . $exerciseName);
                });
        })
        ->get();

    if ($assignedTasks->count() > 1) {
        return response()->json([
            'status' => 'ambiguous',
            'message' => 'More than one assigned exercise matches this Gesture Engine class. Coach verification is required.',
        ], 409);
    }

    if ($assignedTasks->count() === 1) {
        $assignedTask = $assignedTasks->first();
        // Task Verified! Strip the "ASSIGNED: " tag to mark it completed
        $assignedTask->update([
            'exercise' => substr($assignedTask->exercise, strlen('ASSIGNED: ')),
            'date' => $today,
            'created_at' => Carbon::now() // Log the exact time it was verified
        ]);
        return response()->json(['status' => 'logged', 'message' => 'Task verified!']);
    }

    // Anti-Spam: Normal unassigned logging
    $recentlyLogged = WorkoutLog::where('member_id', $request->member_id)
        ->where('exercise', $exerciseName)
        ->where('created_at', '>=', Carbon::now()->subMinutes(2))
        ->exists();
        
    if (!$recentlyLogged) {
        WorkoutLog::create([
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
    return WorkoutLog::where('member_id', $id)
        ->orderBy('created_at', 'desc')
        ->take(50)
        ->get();
});

// React Route: Coach Manually Verifies an Obscure Task (Biometrically Locked)
Route::put('/workouts/{id}/manual-verify', function ($id) {
    $log = WorkoutLog::findOrFail($id);
    
    // Strip the "ASSIGNED: " tag to officially mark it as complete
    $cleanExerciseName = str_replace('ASSIGNED: ', '', $log->exercise);
    
    $log->update([
        'exercise' => $cleanExerciseName,
        'date' => Carbon::today(),
        'created_at' => Carbon::now() // Log the exact time the coach verified it
    ]);
    
    return response()->json(['message' => 'Task manually verified!']);
});

// --- LIVE GESTURE LOGS ROUTE ---
Route::get('/workouts/live', function () {
    return WorkoutLog::with('member:id,first_name,last_name')
        ->where(function ($query) {
            $query->where(function ($pending) {
                $pending->where('exercise', 'like', 'ASSIGNED: %')
                    ->whereDate('date', '>=', Carbon::today());
            })->orWhere('created_at', '>=', Carbon::now()->subDay());
        })
        ->orderBy('created_at', 'desc')
        ->take(50)
        ->get()
        ->map(function ($log) {
            $isPending = str_starts_with($log->exercise, 'ASSIGNED: ');
            $exerciseName = $isPending ? substr($log->exercise, strlen('ASSIGNED: ')) : $log->exercise;
            $status = $isPending
                ? ($log->gesture_class ? 'Pending AI verification' : 'Pending manual verification')
                : 'AI detected';
            $target = $log->sets && $log->reps ? " · {$log->sets} sets x {$log->reps} reps" : '';

            return [
                'id' => $log->id,
                'time' => $isPending ? Carbon::parse($log->date)->format('M j') : Carbon::parse($log->created_at)->format('h:i:s A'),
                'name' => $log->member ? $log->member->first_name . ' ' . $log->member->last_name : 'Unknown Athlete',
                'event' => "{$status} · {$exerciseName}{$target}",
            ];
        });
});