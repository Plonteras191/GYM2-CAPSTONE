"""Find small (far) faces that the main face detector misses.

The face loop's main detector, MediaPipe, shrinks the whole frame to
192x192 before looking, so faces under ~70 px tall vanish (measured
2026-11-20 on a 1280x720 frame: found at 90 px, missed at 70 px and below).
On a ceiling CCTV most people are that small, so they were never named.

YuNet (OpenCV's small face detector) works at a chosen resolution.
Measured on this laptop:
    MediaPipe, whole frame    8 ms   smallest face found: 90 px
    YuNet at 960x540         36 ms   smallest face found: 40 px
    YuNet at 1280x720        62 ms   smallest face found: 30 px

To keep the engine fast, MediaPipe still runs on every frame and YuNet only
runs as a "sweep" every SWEEP_INTERVAL seconds, and only while someone in
view is not identified yet. When everyone in view is named, or nobody is
there, the sweep costs nothing.
"""

import os

import cv2

# Settings (override in "Gesture Engine/.env").
SWEEP_INTERVAL = float(os.getenv('SMALL_FACE_SWEEP_SECONDS', '0.4'))
SWEEP_WIDTH = int(os.getenv('SMALL_FACE_SWEEP_WIDTH', '960'))
SWEEP_SCORE = 0.6

YUNET_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'models', 'face_detection_yunet_2023mar.onnx',
)


def make_detector():
    """A YuNet detector for one thread, or None if the model file is missing."""
    if not os.path.isfile(YUNET_MODEL_PATH):
        print("[FACE] Small-face search off: models/face_detection_yunet_2023mar.onnx not found "
              "(python scripts/download_face_models.py).")
        return None
    return cv2.FaceDetectorYN.create(YUNET_MODEL_PATH, '', (320, 320), SWEEP_SCORE)


def sweep_due(now, last_sweep, unidentified_in_view, interval=SWEEP_INTERVAL):
    """True when a small-face sweep should run on this frame.

    unidentified_in_view: someone in view is not named yet (an unknown face
    track, or a body the Gesture Monitor shows as "Identifying...").
    """
    return unidentified_in_view and now - last_sweep >= interval


def find_faces(detector, bgr_frame, width=SWEEP_WIDTH):
    """Faces in the frame as relative (xmin, ymin, width, height) boxes.

    The frame is scaled to `width` pixels wide (never enlarged) before
    detection; boxes are returned relative to the frame, so the caller can
    use them at full resolution.
    """
    height_full, width_full = bgr_frame.shape[:2]
    scale = min(1.0, width / float(width_full))
    image = bgr_frame if scale == 1.0 else cv2.resize(
        bgr_frame, (int(width_full * scale), int(height_full * scale)), interpolation=cv2.INTER_AREA,
    )
    image_h, image_w = image.shape[:2]
    detector.setInputSize((image_w, image_h))
    _, faces = detector.detect(image)
    if faces is None:
        return []
    boxes = []
    for face in faces:
        x, y, w, h = (float(v) for v in face[:4])
        x, y = max(0.0, x), max(0.0, y)
        w, h = min(w, image_w - x), min(h, image_h - y)
        if w > 0 and h > 0:
            boxes.append((x / image_w, y / image_h, w / image_w, h / image_h))
    return boxes
