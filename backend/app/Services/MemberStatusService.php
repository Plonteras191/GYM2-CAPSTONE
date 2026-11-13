<?php

namespace App\Services;

use App\Models\Member\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Member profile status (Active / Inactive).
 *
 * Rule: an Active member becomes Inactive when the camera has not seen them
 * for a month. A check-in, or an admin, sets them Active again.
 */
class MemberStatusService
{
    public const STATUSES = ['Active', 'Inactive'];

    /**
     * Set Active members to Inactive when they have had no attendance for a
     * month. Members who joined, or whose status was set, within the last
     * month are left alone. Returns how many members were changed.
     */
    public function demoteInactiveMembers(): int
    {
        $oneMonthAgo = Carbon::now()->subMonth();
        $cutoffDate = $oneMonthAgo->toDateString();

        return Member::where('status', 'Active')
            ->whereNotExists(function ($query) use ($cutoffDate) {
                $query->select(DB::raw(1))
                    ->from('attendances')
                    ->whereColumn('attendances.member_id', 'members.id')
                    ->where('attendances.date', '>', $cutoffDate);
            })
            ->where(function ($query) use ($oneMonthAgo) {
                $query->whereExists(function ($attendance) {
                    $attendance->select(DB::raw(1))
                        ->from('attendances')
                        ->whereColumn('attendances.member_id', 'members.id');
                })->orWhere('created_at', '<', $oneMonthAgo);
            })
            ->where(function ($query) use ($oneMonthAgo) {
                $query->whereNull('status_updated_at')
                    ->orWhere('status_updated_at', '<', $oneMonthAgo);
            })
            ->update(['status' => 'Inactive', 'status_updated_at' => Carbon::now()]);
    }

    /**
     * Run the inactivity rule at most once per day. Called from busy
     * endpoints so the rule still runs when the scheduler is not running.
     */
    public function demoteOncePerDay(): void
    {
        $key = 'member-status:demoted:' . Carbon::today()->toDateString();

        try {
            if (!Cache::add($key, true, Carbon::now()->endOfDay())) {
                return;
            }
        } catch (Throwable) {
            // Cache unavailable: running the rule again is harmless.
        }

        $this->demoteInactiveMembers();
    }
}
