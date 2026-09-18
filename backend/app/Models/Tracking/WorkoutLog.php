<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Member;

class WorkoutLog extends Model
{
    use HasFactory;

    protected $fillable = ['member_id', 'exercise', 'date'];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
