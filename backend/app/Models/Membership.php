<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'plan_type',
        'start_date',
        'end_date',
        'status',
        'auto_renew',
        'payment_method',
        'color',
        'notes'
    ];

    // Tells Laravel that every membership belongs to a specific member
    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}