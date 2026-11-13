<?php

namespace App\Services;

use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Tracking\Attendance;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The single place where a check-in is recorded, used by the camera
 * (Python engine) and by manual check-ins, so both follow the same rules.
 */
class AttendanceService
{
    public const LOGGED = 'logged';
    public const ALREADY_LOGGED = 'already_logged';
    public const OUTSIDE_HOURS = 'outside_hours';

    public const SOURCE_FACE = 'face';
    public const SOURCE_MANUAL = 'manual';

    /**
     * Record a check-in.
     *
     * $details may contain: source, camera_source, match_distance,
     * recorded_by_admin_id, reason.
     *
     * Returns ['status' => logged|already_logged|outside_hours,
     *          'reactivated' => bool, 'attendance' => ?Attendance].
     */
    public function checkIn(Member $member, ?Carbon $at = null, array $details = []): array
    {
        $at ??= Carbon::now();

        if (!$this->isWithinOperatingHours($at)) {
            Log::info('Attendance ignored: outside gym operating hours.', [
                'member_id' => $member->id,
                'time' => $at->toDateTimeString(),
            ]);

            return ['status' => self::OUTSIDE_HOURS, 'reactivated' => false, 'attendance' => null];
        }

        $date = $at->toDateString();
        $existing = Attendance::where('member_id', $member->id)->where('date', $date)->first();
        if ($existing) {
            return ['status' => self::ALREADY_LOGGED, 'reactivated' => false, 'attendance' => $existing];
        }

        $wasInactive = $member->status === 'Inactive';
        [$subscriptionStatus, $planName] = $this->subscriptionOn($member, $date);

        try {
            $attendance = DB::transaction(function () use (
                $member, $date, $at, $details, $wasInactive, $subscriptionStatus, $planName
            ) {
                $attendance = Attendance::create([
                    'member_id' => $member->id,
                    'member_name_snapshot' => trim($member->first_name . ' ' . $member->last_name),
                    'date' => $date,
                    'time_in' => $at->toTimeString(),
                    'source' => $details['source'] ?? self::SOURCE_FACE,
                    'camera_source' => $details['camera_source'] ?? null,
                    'match_distance' => $details['match_distance'] ?? null,
                    'subscription_status' => $subscriptionStatus,
                    'plan_snapshot' => $planName,
                    'reactivated' => $wasInactive,
                    'recorded_by_admin_id' => $details['recorded_by_admin_id'] ?? null,
                    'reason' => $details['reason'] ?? null,
                ]);

                // A returning member is active again.
                if ($wasInactive) {
                    $member->forceFill([
                        'status' => 'Active',
                        'status_updated_at' => Carbon::now(),
                    ])->save();
                }

                return $attendance;
            });
        } catch (UniqueConstraintViolationException) {
            // Another request recorded this member a moment ago: the
            // database's one-per-day rule kept a single record.
            return [
                'status' => self::ALREADY_LOGGED,
                'reactivated' => false,
                'attendance' => Attendance::where('member_id', $member->id)->where('date', $date)->first(),
            ];
        }

        return ['status' => self::LOGGED, 'reactivated' => $wasInactive, 'attendance' => $attendance];
    }

    public function isWithinOperatingHours(Carbon $at): bool
    {
        $open = $at->copy()->setTimeFromTimeString(config('gym.open_time', '09:00'));
        $close = $at->copy()->setTimeFromTimeString(config('gym.close_time', '21:30'));

        return $at->between($open, $close);
    }

    /**
     * The member's subscription on a date: ['active'|'expired'|'none', plan name].
     */
    public function subscriptionOn(Member $member, string $date): array
    {
        $active = Membership::where('member_id', $member->id)
            ->activeOn($date)
            ->orderByDesc('id')
            ->first();

        if ($active) {
            return ['active', $active->plan_type];
        }

        $latest = Membership::where('member_id', $member->id)->orderByDesc('id')->first();

        return $latest ? ['expired', $latest->plan_type] : ['none', null];
    }
}
