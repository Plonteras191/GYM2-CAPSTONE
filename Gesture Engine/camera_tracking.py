IDENTITY_RETENTION_SECONDS = 1.5


def update_pose_track_identity(track, face, now):
    if face is not None and face.get('member_id') is not None:
        track['member_id'] = face['member_id']
        track['name'] = face['name']
        track['workout_eligible'] = bool(face.get('workout_eligible', False))
        track['identity_seen'] = now
    elif now - track.get('identity_seen', float('-inf')) > IDENTITY_RETENTION_SECONDS:
        track['member_id'] = None
        track['name'] = 'Unknown'
        track['workout_eligible'] = False

    return track['name'], track['member_id'], track.get('workout_eligible', False)
