<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    // THIS IS THE VIP LIST! If this is missing, Laravel crashes with a 500 error.
    protected $fillable = [
        'name', 
        'price', 
        'duration_days'
    ];
}