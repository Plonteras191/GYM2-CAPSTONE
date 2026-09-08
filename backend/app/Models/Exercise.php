<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'exercise_id', 
        'name', 
        'category', 
        'body_part', 
        'equipment', 
        'gif_path'
    ];
}