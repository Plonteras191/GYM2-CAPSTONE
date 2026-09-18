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
        'date',
        'time_in',
        'time_out'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}
