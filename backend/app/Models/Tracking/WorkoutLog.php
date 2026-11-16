<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Member;

class WorkoutLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id', 'exercise', 'date', 'sets', 'reps', 'gesture_class',
        'counted_reps', 'verified_by', 'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    /** Who verified a task: the camera, or a coach by hand. */
    public const VERIFIED_BY_AI = 'ai';
    public const VERIFIED_BY_COACH = 'coach';

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
