<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Tracking\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * 1. The AI Attendance Logger: Python CCTV service hits this when a member is recognized.
     */
    public function logAttendance(Request $request)
    {
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
    }

    /**
     * 2. Retrieve recent attendance history for a specific member.
     */
    public function getMemberAttendance($id)
    {
        return Attendance::where('member_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->take(10)
            ->get();
    }

    /**
     * 3. Live Dashboard: Lightweight route that only grabs TODAY'S attendance check-ins.
     */
    public function getTodayAttendance()
    {
        return Attendance::with('member:id,first_name,last_name')
            ->where('date', Carbon::now()->toDateString())
            ->orderBy('time_in', 'desc')
            ->get();
    }
}
