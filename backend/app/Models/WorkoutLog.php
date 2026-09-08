<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    use HasFactory;
    protected $fillable = ['member_id', 'exercise', 'date'];

    public function member() {
        return $this->belongsTo(Member::class);
    }
}