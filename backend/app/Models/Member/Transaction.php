<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Membership;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'transaction_date', 'member_id', 'membership_id', 'type',
        'description', 'payment_method', 'amount', 'status', 'reference_number',
        'member_name_snapshot', 'member_profile_pic_snapshot', 'member_email_snapshot',
        'package_name_snapshot', 'package_category_snapshot'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function membership()
    {
        return $this->belongsTo(Membership::class);
    }
}
