<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    /** Body types a member can be registered with (for program assignment). */
    public const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph'];

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
        'body_type',
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
