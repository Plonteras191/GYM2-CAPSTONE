<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name', 
        'last_name', 
        'email', 
        'phone', 
        'plan', 
        'status',
        'enrolled_face_id', 
        'profile_pic', 
        'dob', 
        'height', 
        'weight', 
        'address'
    ];

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    public function activeMembership()
    {
        return $this->hasOne(Membership::class)
            ->where('status', 'Active')
            ->whereDate('start_date', '<=', today())
            ->where(function ($query) {
                $query->whereDate('end_date', '>=', today())
                    ->orWhereNull('end_date');
            })
            ->latestOfMany();
    }
}
