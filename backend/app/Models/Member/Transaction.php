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
        'description', 'payment_method', 'amount', 'status', 'reference_number'
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
