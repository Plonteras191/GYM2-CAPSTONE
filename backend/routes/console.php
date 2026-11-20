<?php

use Illuminate\Foundation\Inspiring;
use App\Services\MemberStatusService;
use App\Services\WorkoutPlanScheduler;
use App\Support\MemberMediaStorage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Members not seen by the camera for a month become Inactive. Runs daily
// while `php artisan schedule:work` (or a cron entry) is running; the
// attendance and member endpoints also apply the rule as a fallback.
Artisan::command('members:demote-inactive', function (MemberStatusService $memberStatus) {
    $count = $memberStatus->demoteInactiveMembers();
    $this->info("{$count} member(s) set to Inactive.");
})->purpose('Set members with no attendance for a month to Inactive');

Schedule::command('members:demote-inactive')->dailyAt('00:10');

// Weekly training plans repeat: each day, schedule the coming 7 days from each
// member's saved plan. Loading a plan (dashboard or Gesture Engine) also does
// this as a fallback when the scheduler is not running.
Artisan::command('workouts:schedule-week', function (WorkoutPlanScheduler $scheduler) {
    $count = $scheduler->fillUpcomingWeek();
    $this->info("{$count} workout task(s) scheduled.");
})->purpose('Schedule the next 7 days of each member weekly training plan');

Schedule::command('workouts:schedule-week')->dailyAt('00:05');

// Face photos are biometric data. This moves photos saved by older versions
// out of public/faces (reachable by URL) into storage/app/private/faces.
Artisan::command('faces:secure', function (MemberMediaStorage $media) {
    $count = $media->moveLegacyFacesToPrivate();
    $this->info("{$count} face photo(s) moved to private storage.");
})->purpose('Move enrolled face photos out of the public web folder');
