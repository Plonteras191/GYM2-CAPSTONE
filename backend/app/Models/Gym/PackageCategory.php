<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Model;

class PackageCategory extends Model
{
    protected $fillable = ['name', 'color'];

    public function plans()
    {
        return $this->hasMany(Plan::class, 'category_detail', 'name')
            ->where('category', 'other');
    }
}
