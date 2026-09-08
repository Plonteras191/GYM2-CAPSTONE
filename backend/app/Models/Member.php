<?php

namespace App\Models;

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
}