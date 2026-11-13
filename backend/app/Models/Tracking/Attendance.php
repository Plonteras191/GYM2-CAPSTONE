<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Member;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'member_name_snapshot',
        'date',
        'time_in',
        'source',
        'camera_source',
        'match_distance',
        'subscription_status',
        'plan_snapshot',
        'reactivated',
        'recorded_by_admin_id',
        'reason',
    ];

    protected $casts = [
        'reactivated' => 'boolean',
        'match_distance' => 'float',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
