<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CoachEventCategory extends Model
{
    protected $fillable = ['name', 'color'];

    public function events(): HasMany
    {
        return $this->hasMany(CoachEvent::class, 'category_id');
    }
}
