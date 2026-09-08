<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'transaction_date', 'member_id', 'type', 
        'description', 'payment_method', 'amount', 'status', 'reference_number'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}