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
        'member_name_snapshot',
        'member_profile_pic_snapshot',
        'member_email_snapshot',
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

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /** Subscriptions that are active (not cancelled, within their dates) on a date. */
    public function scopeActiveOn(Builder $query, string $date): Builder
    {
        return $query
            ->where('status', 'Active')
            ->where(function (Builder $query) use ($date) {
                $query->whereNull('start_date')->orWhereDate('start_date', '<=', $date);
            })
            ->where(function (Builder $query) use ($date) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', $date);
            });
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
                })->orWhere(function (Builder $unlinkedQuery) {
                    // No plan row to ask: an older membership saved without
                    // a plan, or one whose plan was deleted afterwards. The
                    // member still paid for a coach, so go by the plan name
                    // saved on the membership ("With Coach", "Monthly With
                    // Coach", ...).
                    $unlinkedQuery
                        ->whereDoesntHave('plan')
                        ->whereRaw('LOWER(plan_type) LIKE ?', ['%with coach%']);
                });
            });
    }
}
