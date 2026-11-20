"""Quality check for one face enrollment photo (one view).

The member form sends each photo here before accepting it, so only photos
the engine can actually use are saved. The checks follow the ideas of
ISO/IEC 29794-5 (face image quality): one face, big enough, evenly lit,
sharp, and at the expected head angle.

Limits were measured on real enrollment photos (2026-11-20): good views
had a face height of 0.40-0.70 of the photo, face brightness 63-106 and
sharpness 104-824; the photos that failed recognition had brightness 16 and
sharpness 17. Front views had a head-turn ratio within +/-0.07, good side
views 0.37-0.46, and "side" views where the member did not turn 0.03-0.07.

Pure numpy/OpenCV: the face detector runs in the engine and its results are
passed in, so this can be unit-tested without a camera.
"""

import cv2
import numpy as np

# Face height as a share of the photo height.
FACE_HEIGHT_MIN = 0.30
FACE_HEIGHT_MAX = 0.85
# Mean brightness (0-255) of the face area.
BRIGHTNESS_MIN = 60
BRIGHTNESS_MAX = 220
# Variance of the Laplacian of the face, scaled to a 100 px tall face.
SHARPNESS_MIN = 50
# Head turn: nose offset from the middle of the eyes, in eye-distances.
FRONT_MAX_TURN = 0.15
SIDE_MIN_TURN = 0.20
SIDE_MAX_TURN = 0.65

# MediaPipe face detection keypoint order.
KP_RIGHT_EYE, KP_LEFT_EYE, KP_NOSE = 0, 1, 2

FRONT_VIEWS = {'front', 'chin down'}
SIDE_VIEWS = {'left', 'right'}

MESSAGES = {
    'no_face': 'No face found. Look at the camera with your whole face in the frame.',
    'many_faces': 'More than one face in the photo. Only the member should be in the frame.',
    'too_far': 'Face is too small. Move closer to the camera.',
    'too_close': 'Face is too close. Move back a little.',
    'too_dark': 'Too dark. Face a light or a window; avoid light from behind.',
    'too_bright': 'Too bright. Move away from the direct light.',
    'blurry': 'Photo is blurry. Hold still and try again.',
    'not_facing': 'Look straight at the camera.',
    'turn_more': 'Turn your head a bit more to the side.',
    'turned_too_far': 'Turned too far. Turn back a little so both eyes are visible.',
    'same_side': 'Turned the same way as the other side photo. Turn to the other side.',
}


def head_turn(keypoints):
    """Signed head-turn ratio from MediaPipe keypoints in pixels, or None.

    About 0 when facing the camera; the sign tells the direction. Measured
    along the eye line, so a tilted head is not mistaken for a turned one.
    """
    if keypoints is None or len(keypoints) <= KP_NOSE:
        return None
    right_eye = np.asarray(keypoints[KP_RIGHT_EYE], dtype=np.float64)
    left_eye = np.asarray(keypoints[KP_LEFT_EYE], dtype=np.float64)
    nose = np.asarray(keypoints[KP_NOSE], dtype=np.float64)
    eye_vector = left_eye - right_eye
    eye_distance = float(np.linalg.norm(eye_vector))
    if eye_distance < 1e-6:
        return None
    middle = (right_eye + left_eye) / 2
    return float(np.dot(nose - middle, eye_vector / eye_distance) / eye_distance)


def sharpness(gray_face):
    """Variance of the Laplacian, scaled to a 100 px tall face (higher = sharper)."""
    if gray_face is None or gray_face.size == 0 or min(gray_face.shape[:2]) < 8:
        return 0.0
    height, width = gray_face.shape[:2]
    if height != 100:
        gray_face = cv2.resize(gray_face, (max(8, int(width * 100 / height)), 100))
    return float(cv2.Laplacian(gray_face, cv2.CV_64F).var())


def assess_view(view, image_bgr, faces, opposite_turn=None):
    """Check one enrollment photo.

    view: the photo's label ('Front', 'Chin down', 'Left', 'Right').
    image_bgr: the photo.
    faces: detected faces, each {'box': (xmin, ymin, width, height) relative
           to the photo, 'keypoints': [(x, y), ...] in pixels, 'score': float}.
    opposite_turn: head-turn of the already accepted other side photo
           (for Right after Left, or Left after Right), so the two can be
           checked to point in opposite directions.

    Returns {'ok', 'issues': [{'code', 'message'}], 'metrics': {...}}.
    """
    view_key = str(view or '').strip().lower()
    issues = []
    metrics = {'faces': len(faces)}

    def fail(code):
        issues.append({'code': code, 'message': MESSAGES[code]})

    if not faces:
        fail('no_face')
        return {'ok': False, 'issues': issues, 'metrics': metrics}
    if len(faces) > 1:
        fail('many_faces')

    face = max(faces, key=lambda f: f['box'][2] * f['box'][3])
    height, width = image_bgr.shape[:2]
    xmin, ymin, box_w, box_h = face['box']
    metrics['face_height'] = round(float(box_h), 3)
    if box_h < FACE_HEIGHT_MIN:
        fail('too_far')
    elif box_h > FACE_HEIGHT_MAX:
        fail('too_close')

    top, left = max(0, int(ymin * height)), max(0, int(xmin * width))
    bottom, right = min(height, int((ymin + box_h) * height)), min(width, int((xmin + box_w) * width))
    gray = cv2.cvtColor(image_bgr[top:bottom, left:right], cv2.COLOR_BGR2GRAY) \
        if bottom > top and right > left else None

    brightness = float(gray.mean()) if gray is not None and gray.size else 0.0
    metrics['brightness'] = round(brightness, 1)
    if brightness < BRIGHTNESS_MIN:
        fail('too_dark')
    elif brightness > BRIGHTNESS_MAX:
        fail('too_bright')

    blur = sharpness(gray)
    metrics['sharpness'] = round(blur, 1)
    if blur < SHARPNESS_MIN and brightness >= BRIGHTNESS_MIN:
        # A dark face also looks "blurry"; only one message for it.
        fail('blurry')

    turn = head_turn(face.get('keypoints'))
    metrics['turn'] = None if turn is None else round(turn, 3)
    if turn is not None:
        if view_key in FRONT_VIEWS and abs(turn) > FRONT_MAX_TURN:
            fail('not_facing')
        elif view_key in SIDE_VIEWS:
            if abs(turn) < SIDE_MIN_TURN:
                fail('turn_more')
            elif abs(turn) > SIDE_MAX_TURN:
                fail('turned_too_far')
            elif opposite_turn is not None and abs(opposite_turn) >= SIDE_MIN_TURN \
                    and np.sign(turn) == np.sign(opposite_turn):
                fail('same_side')

    return {'ok': not issues, 'issues': issues, 'metrics': metrics}
