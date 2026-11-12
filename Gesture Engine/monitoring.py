"""Who the Gesture Monitor watches.

Only members with an active with-coach membership are monitored. Laravel
reports that as `workout_eligible` (Membership::scopeActiveWithCoach).
"""

IDENTIFYING = 'identifying'   # body tracked, face not recognized yet
EXCLUDED = 'excluded'         # recognized member without an active coach membership
MONITORED = 'monitored'       # recognized member with an active coach membership


def monitoring_status(member_id, workout_eligible):
    if member_id is None:
        return IDENTIFYING
    return MONITORED if workout_eligible else EXCLUDED
