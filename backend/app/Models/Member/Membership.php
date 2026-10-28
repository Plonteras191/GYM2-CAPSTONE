<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Gym\Plan;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'plan_id',
        'plan_type',
        'start_date',
        'end_date',
        'status',
        'auto_renew',
        'payment_method',
        'color',
        'notes'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function scopeActiveWithCoach(Builder $query): Builder
    {
        return $query
            ->where('status', 'Active')
            ->whereDate('start_date', '<=', today())
            ->whereDate('end_date', '>=', today())
            ->where(function (Builder $query) {
                $query->whereHas('plan', function (Builder $planQuery) {
                    $planQuery->where('category', 'with_coach');
                })->orWhere(function (Builder $legacyQuery) {
                    $legacyQuery
                        ->whereNull('plan_id')
                        ->whereRaw('LOWER(TRIM(plan_type)) = ?', ['with coach']);
                });
            });
    }
}
