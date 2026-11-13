<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Operating hours
    |--------------------------------------------------------------------------
    | Check-ins are only recorded between these times (24-hour "HH:MM",
    | application timezone). Change them in backend/.env.
    */
    'open_time' => env('GYM_OPEN_TIME', '09:00'),
    'close_time' => env('GYM_CLOSE_TIME', '21:30'),

];
