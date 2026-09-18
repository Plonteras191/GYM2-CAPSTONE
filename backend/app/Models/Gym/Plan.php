<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Membership;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'price', 
        'duration_days'
    ];

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }
}
