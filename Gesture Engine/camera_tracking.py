"""Identity rules for face tracks and pose (skeleton) tracks.

Kept free of camera/ML imports so the rules can be unit tested.

Pose tracks
-----------
A skeleton keeps the member identity it was given for as long as the pose
tracker keeps following it, even when the face is not visible (push-ups,
planks, sit-ups, crunches and burpees all face the floor). Only these change
it:
- a clear recognition of a *different* member CONFLICT_CONFIRMATIONS times
  in a row, or
- IDENTITY_MAX_UNCONFIRMED_SECONDS without any face confirming the identity,
  which limits the damage if the tracker ever swaps two people.

Face tracks
-----------
Unknown faces are re-checked at most every UNKNOWN_RECHECK_SECONDS, instead
of on every frame. A recognised face keeps its identity until
FACE_MISSES_TO_FORGET re-checks in a row fail, and only switches to another
member after FACE_SWITCH_CONFIRMATIONS agreeing matches.
"""

# --- Pose track identity -----------------------------------------------------
# Longest time a skeleton keeps an identity without any face confirming it.
IDENTITY_MAX_UNCONFIRMED_SECONDS = 90.0
# Consecutive recognitions of another member needed to relabel a skeleton.
CONFLICT_CONFIRMATIONS = 3

# --- Face track recognition --------------------------------------------------
# How often to retry recognising a face that matched nobody.
UNKNOWN_RECHECK_SECONDS = 1.0
# How often to re-confirm a face that is already recognised.
KNOWN_RECHECK_SECONDS = 4.0
# Wait after a crop produced no face encoding at all.
FAILED_ENCODING_RETRY_SECONDS = 2.0
# Failed re-checks in a row before a recognised face becomes Unknown.
FACE_MISSES_TO_FORGET = 3
# Agreeing matches in a row before a recognised face switches member.
FACE_SWITCH_CONFIRMATIONS = 2

UNKNOWN_NAME = 'Unknown'

# Face distance below which a face counts as a member (lower = stricter).
FACE_MATCH_THRESHOLD = 0.50
# Required gap between the best member and the next-best *different* member.
FACE_MATCH_MARGIN = 0.06


def select_member_match(distances, member_ids, names, eligibility,
                        threshold=FACE_MATCH_THRESHOLD, margin=FACE_MATCH_MARGIN):
    """Pick the member a face belongs to, or None.

    Each member can have several enrolled face views, i.e. several entries in
    `distances`. Distances are first reduced to the closest view per member,
    so two views of the same person are never mistaken for two similar-looking
    people.
    """
    best_per_member = {}
    for index, distance in enumerate(distances):
        member_id = member_ids[index]
        distance = float(distance)
        if member_id not in best_per_member or distance < best_per_member[member_id][0]:
            best_per_member[member_id] = (distance, index)

    if not best_per_member:
        return None

    ranked = sorted(best_per_member.items(), key=lambda item: item[1][0])
    best_member_id, (best_distance, best_index) = ranked[0]
    if best_distance >= threshold:
        return None
    if len(ranked) > 1 and ranked[1][1][0] - best_distance < margin:
        return None  # Two different members are too close to call.

    return {
        'member_id': best_member_id,
        'name': names[best_index],
        'workout_eligible': bool(eligibility[best_index]),
        'distance': best_distance,
    }


def _clear_pose_identity(track):
    track['member_id'] = None
    track['name'] = UNKNOWN_NAME
    track['workout_eligible'] = False
    track.pop('identity_seen', None)


def _set_pose_identity(track, face, now):
    track['member_id'] = face['member_id']
    track['name'] = face['name']
    track['workout_eligible'] = bool(face.get('workout_eligible', False))
    track['identity_seen'] = now


def update_pose_track_identity(track, face, now):
    """Update a skeleton's identity from the face matched to it this frame.

    `face` is None when no face is attached to the skeleton, or a dict with
    member_id (None when the face is unrecognised), name and workout_eligible.
    Returns (name, member_id, workout_eligible).
    """
    face_member_id = face.get('member_id') if face is not None else None
    current_id = track.get('member_id')

    if face_member_id is not None:
        if current_id is None or face_member_id == current_id:
            _set_pose_identity(track, face, now)
            track.pop('conflict_id', None)
            track.pop('conflict_count', None)
        else:
            if track.get('conflict_id') == face_member_id:
                track['conflict_count'] = track.get('conflict_count', 0) + 1
            else:
                track['conflict_id'] = face_member_id
                track['conflict_count'] = 1
            if track['conflict_count'] >= CONFLICT_CONFIRMATIONS:
                _set_pose_identity(track, face, now)
                track.pop('conflict_id', None)
                track.pop('conflict_count', None)
    elif current_id is not None:
        # No face, or an unrecognised one: keep the identity unless it has
        # gone unconfirmed for too long.
        if now - track.get('identity_seen', now) > IDENTITY_MAX_UNCONFIRMED_SECONDS:
            _clear_pose_identity(track)

    if track.get('member_id') is None:
        track['name'] = UNKNOWN_NAME
        track['workout_eligible'] = False

    return track['name'], track.get('member_id'), track.get('workout_eligible', False)


def face_track_needs_recognition(track, now):
    """Whether this face track should go through face recognition now."""
    if now - track.get('last_recon_failed', float('-inf')) < FAILED_ENCODING_RETRY_SECONDS:
        return False
    interval = UNKNOWN_RECHECK_SECONDS if track.get('member_id') is None else KNOWN_RECHECK_SECONDS
    return now - track.get('last_recon', float('-inf')) >= interval


def apply_face_recognition_result(track, match, now):
    """Apply one recognition attempt to a face track.

    `match` is None when the face matched no member, otherwise a dict with
    member_id, name and workout_eligible. Returns True when the track holds a
    confirmed member after this attempt (so attendance can be logged).
    """
    track['last_recon'] = now
    current_id = track.get('member_id')

    if match is None:
        track.pop('pending_id', None)
        track.pop('pending_count', None)
        if current_id is not None:
            track['misses'] = track.get('misses', 0) + 1
            if track['misses'] >= FACE_MISSES_TO_FORGET:
                track['member_id'] = None
                track['name'] = UNKNOWN_NAME
                track['workout_eligible'] = False
                track['misses'] = 0
        return False

    track['misses'] = 0
    if current_id is None or match['member_id'] == current_id:
        track['member_id'] = match['member_id']
        track['name'] = match['name']
        track['workout_eligible'] = bool(match.get('workout_eligible', False))
        track.pop('pending_id', None)
        track.pop('pending_count', None)
        return True

    # Recognised as someone else: switch only after repeated agreement.
    if track.get('pending_id') == match['member_id']:
        track['pending_count'] = track.get('pending_count', 0) + 1
    else:
        track['pending_id'] = match['member_id']
        track['pending_count'] = 1
    if track['pending_count'] >= FACE_SWITCH_CONFIRMATIONS:
        track['member_id'] = match['member_id']
        track['name'] = match['name']
        track['workout_eligible'] = bool(match.get('workout_eligible', False))
        track.pop('pending_id', None)
        track.pop('pending_count', None)
    return True
