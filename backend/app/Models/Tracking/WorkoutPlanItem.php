<?php

namespace App\Models\Tracking;

use App\Models\Member\Member;
use Illuminate\Database\Eloquent\Model;

/** One exercise in a member's weekly plan: repeats on the same weekday every week. */
class WorkoutPlanItem extends Model
{
    protected $fillable = [
        'member_id', 'weekday', 'exercise', 'sets', 'reps', 'gesture_class', 'position',
    ];

    protected $casts = [
        'weekday' => 'integer',
        'sets' => 'integer',
        'reps' => 'integer',
        'position' => 'integer',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
