<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    // 1. Whitelist the exact columns the AI sends
    protected $fillable = [
        'member_id',
        'date',
        'time_in',
        'time_out'
    ];

    // 2. Link this to the Member table so we can grab their name
    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}