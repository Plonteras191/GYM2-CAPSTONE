"""Basic anti-spoofing: a real face blinks, a printed photo does not.

Eye openness is measured with the eye aspect ratio (EAR) from MediaPipe
Face Mesh landmarks: the eye's height divided by its width. It drops sharply
while the eye is closed. A blink is "open, then closed, then open again"
within a short time.

Limits (be honest about these at the defense): this stops a printed photo
or a still image on a screen. It does not stop a video of the member played
on a phone, and it needs a face large enough to see the eyes.
"""

import os
import time

import numpy as np

# Face Mesh landmark indices: (outer corner, upper 1, upper 2, inner corner, lower 2, lower 1)
LEFT_EYE = (33, 160, 158, 133, 153, 144)
RIGHT_EYE = (362, 385, 387, 263, 373, 380)

EAR_OPEN = float(os.getenv('LIVENESS_EAR_OPEN', '0.24'))
EAR_CLOSED = float(os.getenv('LIVENESS_EAR_CLOSED', '0.19'))
MAX_BLINK_SECONDS = 0.8


def liveness_required_from_env():
    return os.getenv('LIVENESS_REQUIRED', 'false').strip().lower() in ('1', 'true', 'yes', 'on')


def eye_aspect_ratio(points, eye):
    """EAR for one eye. points: (N, 2) array of pixel coordinates."""
    outer, upper1, upper2, inner, lower2, lower1 = (points[i] for i in eye)
    width = np.linalg.norm(outer - inner)
    if width < 1e-6:
        return None
    height = (np.linalg.norm(upper1 - lower1) + np.linalg.norm(upper2 - lower2)) / 2
    return float(height / width)


def face_ear(points):
    """Average EAR of both eyes, or None if it cannot be measured."""
    left = eye_aspect_ratio(points, LEFT_EYE)
    right = eye_aspect_ratio(points, RIGHT_EYE)
    if left is None or right is None:
        return None
    return (left + right) / 2


class BlinkDetector:
    """Detects one blink in a stream of EAR values for a single face."""

    def __init__(self, ear_open=EAR_OPEN, ear_closed=EAR_CLOSED, max_blink_seconds=MAX_BLINK_SECONDS):
        self.ear_open = ear_open
        self.ear_closed = ear_closed
        self.max_blink_seconds = max_blink_seconds
        self.blinked = False
        self._state = 'unknown'   # unknown -> open -> closed -> (open = blink)
        self._closed_at = None

    def add(self, ear, now=None):
        """Feed one EAR sample. Returns True once a blink has been seen."""
        if self.blinked or ear is None:
            return self.blinked
        now = time.monotonic() if now is None else now

        if self._state == 'closed' and now - self._closed_at > self.max_blink_seconds:
            # Eyes stayed "closed" too long: not a blink (e.g. looking down,
            # or a photo of closed eyes). Wait for open eyes again.
            self._state = 'unknown'

        if ear >= self.ear_open:
            if self._state == 'closed':
                self.blinked = True
            else:
                self._state = 'open'
        elif ear <= self.ear_closed and self._state == 'open':
            self._state = 'closed'
            self._closed_at = now

        return self.blinked


class FaceMeshEyes:
    """Measures EAR for a face region using MediaPipe Face Mesh.

    Not thread-safe: create and use it from a single thread.
    """

    def __init__(self):
        import mediapipe as mp
        self._mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
        )

    def ear(self, rgb_frame, box, margin=0.25):
        """EAR of the face inside box (top, right, bottom, left), or None."""
        top, right, bottom, left = box
        height, width = rgb_frame.shape[:2]
        pad = int((bottom - top) * margin)
        crop = rgb_frame[max(0, top - pad):min(height, bottom + pad), max(0, left - pad):min(width, right + pad)]
        if crop.size == 0:
            return None
        results = self._mesh.process(np.ascontiguousarray(crop))
        if not results.multi_face_landmarks:
            return None
        crop_h, crop_w = crop.shape[:2]
        landmarks = results.multi_face_landmarks[0].landmark
        points = np.array([[point.x * crop_w, point.y * crop_h] for point in landmarks], dtype=np.float32)
        return face_ear(points)
