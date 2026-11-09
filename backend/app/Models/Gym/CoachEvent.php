<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachEvent extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'description',
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'location',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(CoachEventCategory::class, 'category_id');
    }
}
