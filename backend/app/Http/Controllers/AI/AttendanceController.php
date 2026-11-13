<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use App\Services\AttendanceService;
use App\Services\MemberStatusService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private MemberStatusService $memberStatus,
    ) {
    }

    /**
     * 1. The AI Attendance Logger: Python CCTV service hits this when a member is recognized.
     *
     * Rules (see AttendanceService): gym operating hours only, one check-in
     * per member per day, and a returning Inactive member becomes Active.
     *
     * "checked_in_at" lets the engine report the real arrival time when it
     * had to retry later (e.g. Laravel was restarting). Only today is
     * accepted, and never a time in the future.
     */
    public function logAttendance(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'checked_in_at' => 'nullable|date',
            'camera_source' => 'nullable|string|max:30',
            'match_distance' => 'nullable|numeric|between:0,2',
        ]);

        $now = Carbon::now();
        $at = $now;
        if (!empty($validated['checked_in_at'])) {
            $at = Carbon::parse($validated['checked_in_at'], config('app.timezone'))
                ->setTimezone(config('app.timezone'));

            if (!$at->isSameDay($now) || $at->gt($now->copy()->addMinute())) {
                return response()->json([
                    'status' => 'rejected',
                    'message' => 'checked_in_at must be today and not in the future.',
                ], 422);
            }
        }

        $result = $this->attendance->checkIn(Member::findOrFail($validated['member_id']), $at, [
            'source' => AttendanceService::SOURCE_FACE,
            'camera_source' => $validated['camera_source'] ?? null,
            'match_distance' => $validated['match_distance'] ?? null,
        ]);

        $message = match ($result['status']) {
            AttendanceService::LOGGED => $result['reactivated']
                ? 'Attendance recorded. Member set back to Active.'
                : 'Attendance recorded!',
            AttendanceService::ALREADY_LOGGED => 'Already logged today.',
            AttendanceService::OUTSIDE_HOURS => 'Outside gym operating hours.',
        };

        return response()->json([
            'status' => $result['status'],
            'reactivated' => $result['reactivated'],
            'message' => $message,
        ]);
    }

    /**
     * 1b. Manual check-in by an admin: the fallback when the camera cannot
     * recognize a member (mask, lighting, camera offline). Same rules as the
     * camera, and the record keeps who did it and why.
     */
    public function manualCheckIn(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'reason' => 'required|string|min:3|max:255',
        ]);

        $result = $this->attendance->checkIn(Member::findOrFail($validated['member_id']), Carbon::now(), [
            'source' => AttendanceService::SOURCE_MANUAL,
            'recorded_by_admin_id' => $request->user()?->id,
            'reason' => trim($validated['reason']),
        ]);

        return match ($result['status']) {
            AttendanceService::LOGGED => response()->json([
                'status' => $result['status'],
                'reactivated' => $result['reactivated'],
                'message' => $result['reactivated']
                    ? 'Manual check-in recorded. Member set back to Active.'
                    : 'Manual check-in recorded.',
                'attendance' => $result['attendance'],
            ], 201),
            AttendanceService::ALREADY_LOGGED => response()->json([
                'status' => $result['status'],
                'message' => 'This member already checked in today.',
            ], 409),
            AttendanceService::OUTSIDE_HOURS => response()->json([
                'status' => $result['status'],
                'message' => 'Check-ins are only recorded during gym operating hours.',
            ], 422),
        };
    }

    /**
     * 2. Attendance history for a specific member (the profile calendar).
     *
     * Returns the last two years, not just the latest few visits, so older
     * months in the calendar are not shown as empty. A member has at most
     * one check-in per day, so this stays small.
     */
    public function getMemberAttendance($id)
    {
        return Attendance::where('member_id', $id)
            ->where('date', '>=', Carbon::today()->subYears(2)->toDateString())
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();
    }

    /**
     * 3. Live Dashboard: Lightweight route that only grabs TODAY'S attendance check-ins.
     */
    public function getTodayAttendance()
    {
        // Keeps member statuses current even when the scheduler is not running.
        $this->memberStatus->demoteOncePerDay();

        return Attendance::with('member:id,first_name,last_name,profile_pic,enrolled_face_id')
            ->where('date', Carbon::now()->toDateString())
            ->orderBy('time_in', 'desc')
            ->get();
    }
}
