<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Model;

/** One pause of a subscription: when it started, when it ended and how many days it added. */
class MembershipPause extends Model
{
    protected $fillable = [
        'membership_id',
        'paused_on',
        'resumed_on',
        'days',
        'paused_by_admin_id',
        'resumed_by_admin_id',
    ];

    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }
}
