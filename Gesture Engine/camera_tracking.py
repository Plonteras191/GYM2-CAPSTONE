"""Keep a recognized member's name on their tracked body.

Faces are only recognizable up close, but bodies (pose tracks) are tracked
much farther away. Once a face confirms who a body is, the body keeps that
name while it stays tracked, so members stay named when they train away from
the camera. A clothing-colour check (torso HSV histogram) drops the name if
the tracked body no longer looks like the person the face confirmed, e.g.
after two people cross paths.
"""

import os

import cv2
import numpy as np

# How long a body keeps its name without the face being seen again.
IDENTITY_MAX_UNCONFIRMED = float(os.getenv('IDENTITY_MAX_UNCONFIRMED', '120'))
# Bhattacharyya distance (0 = identical, 1 = completely different).
APPEARANCE_MAX_DISTANCE = 0.55
# Stricter limit right after the body overlapped another person.
APPEARANCE_MAX_DISTANCE_AFTER_OVERLAP = 0.35
APPEARANCE_CHECK_INTERVAL = 1.0

_TORSO = (11, 12, 24, 23)  # shoulders and hips (MediaPipe indices)
_MIN_VISIBILITY = 0.5


def torso_histogram(frame_bgr, landmarks):
    """Hue/saturation histogram of the shirt area, or None if not visible.

    Brightness is ignored so moving between lit and darker parts of the gym
    changes the signature less.
    """
    height, width = frame_bgr.shape[:2]
    points = []
    for index in _TORSO:
        point = landmarks[index]
        visibility = getattr(point, 'visibility', None)
        if visibility is not None and visibility < _MIN_VISIBILITY:
            return None
        if point.x is None or point.y is None:
            return None
        points.append((point.x * width, point.y * height))

    xs, ys = zip(*points)
    left, right = int(max(0, min(xs))), int(min(width, max(xs)))
    top, bottom = int(max(0, min(ys))), int(min(height, max(ys)))
    # Shrink inward so arms and background at the edges are excluded.
    margin_x, margin_y = (right - left) // 6, (bottom - top) // 8
    left, right = left + margin_x, right - margin_x
    top, bottom = top + margin_y, bottom - margin_y
    if right - left < 6 or bottom - top < 6:
        return None

    hsv = cv2.cvtColor(frame_bgr[top:bottom, left:right], cv2.COLOR_BGR2HSV)
    histogram = cv2.calcHist([hsv], [0, 1], None, [16, 8], [0, 180, 0, 256])
    cv2.normalize(histogram, histogram)
    return histogram


def appearance_distance(first, second):
    return float(cv2.compareHist(first, second, cv2.HISTCMP_BHATTACHARYYA))


def _clear_identity(track):
    track['member_id'] = None
    track['name'] = 'Unknown'
    track['workout_eligible'] = False
    track.pop('appearance_ref', None)
    track['overlapped'] = False


def update_pose_track_identity(track, face, now, appearance=None, overlapped=False):
    """Update a pose track's identity; returns (name, member_id, eligible).

    face: the recognized face matched to this body this frame, or None.
    appearance: torso_histogram() for this body this frame, or None.
    overlapped: True if this body overlaps another body this frame.
    """
    if face is not None and face.get('member_id') is not None:
        track['member_id'] = face['member_id']
        track['name'] = face['name']
        track['workout_eligible'] = bool(face.get('workout_eligible', False))
        track['identity_seen'] = now
        track['overlapped'] = False
        if appearance is not None:
            track['appearance_ref'] = appearance
            track['appearance_checked'] = now
    elif track.get('member_id') is not None:
        if overlapped:
            track['overlapped'] = True

        if now - track.get('identity_seen', float('-inf')) > IDENTITY_MAX_UNCONFIRMED:
            _clear_identity(track)
        elif track.get('overlapped') and (appearance is None or track.get('appearance_ref') is None):
            # Bodies crossed and we cannot tell them apart by clothing:
            # safer to wait for the face than to risk a swapped name.
            if not overlapped:
                _clear_identity(track)
        elif (
            appearance is not None
            and track.get('appearance_ref') is not None
            and (track.get('overlapped') or now - track.get('appearance_checked', 0.0) >= APPEARANCE_CHECK_INTERVAL)
            and not overlapped
        ):
            limit = APPEARANCE_MAX_DISTANCE_AFTER_OVERLAP if track.get('overlapped') else APPEARANCE_MAX_DISTANCE
            track['appearance_checked'] = now
            if appearance_distance(track['appearance_ref'], appearance) > limit:
                _clear_identity(track)
            else:
                track['overlapped'] = False

    if track.get('member_id') is None:
        track['name'] = 'Unknown'
        track['workout_eligible'] = False
    return track['name'], track['member_id'], track.get('workout_eligible', False)


def boxes_overlap(box_a, box_b, min_iou=0.15):
    """True if two (top, right, bottom, left) boxes overlap noticeably."""
    top = max(box_a[0], box_b[0])
    left = max(box_a[3], box_b[3])
    bottom = min(box_a[2], box_b[2])
    right = min(box_a[1], box_b[1])
    if bottom <= top or right <= left:
        return False
    intersection = (bottom - top) * (right - left)
    area_a = (box_a[2] - box_a[0]) * (box_a[1] - box_a[3])
    area_b = (box_b[2] - box_b[0]) * (box_b[1] - box_b[3])
    union = area_a + area_b - intersection
    return union > 0 and intersection / union >= min_iou


def head_region(landmarks, frame_width, frame_height, scale=3.0):
    """Square region around the head from pose landmarks, or None.

    Sized from the ear-to-ear (or eye) span so it fits the face at any
    distance. Used to find faces too small for whole-frame face detection.
    """
    head_points = []
    for index in range(11):  # nose, eyes, ears, mouth
        point = landmarks[index]
        visibility = getattr(point, 'visibility', None)
        if point.x is None or point.y is None or (visibility is not None and visibility < 0.3):
            continue
        head_points.append((point.x * frame_width, point.y * frame_height))
    if len(head_points) < 3:
        return None
    xs, ys = np.array(head_points).T
    span = max(xs.max() - xs.min(), ys.max() - ys.min(), 4.0)
    side = span * scale
    center_x, center_y = xs.mean(), ys.mean()
    top = int(max(0, center_y - side / 2))
    left = int(max(0, center_x - side / 2))
    bottom = int(min(frame_height, center_y + side / 2))
    right = int(min(frame_width, center_x + side / 2))
    if bottom - top < 8 or right - left < 8:
        return None
    return (top, right, bottom, left)
