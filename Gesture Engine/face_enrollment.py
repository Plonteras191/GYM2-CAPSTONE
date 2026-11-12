"""Turn enrolled face images into dlib face encodings.

Shared by gesture_engine.py and scripts/eval_faces.py so both encode
enrollments exactly the same way as live frames are encoded.
"""

import os
import pickle

import cv2
import face_recognition
import numpy as np

from face_matching import ALIGN_SCALE, ALIGN_SHIFT_DOWN, align_box, normalize_lighting

# Random re-samples averaged per enrolled view (dlib num_jitters). 5 gives most
# of the stability of 10 at half the cost (~1.6s per view on a laptop CPU).
# Paid once per enrollment thanks to the cache.
try:
    ENROLL_JITTERS = max(1, int(os.getenv('FACE_ENROLL_JITTERS', '5')))
except ValueError:
    ENROLL_JITTERS = 5
# Extra margin kept around the face so the landmark predictor sees the
# whole jaw line instead of a hard crop edge.
CONTEXT_MARGIN = 0.25
# Bump when encoding settings change so stale cached encodings are rebuilt.
CACHE_VERSION = f"v2-j{ENROLL_JITTERS}-s{ALIGN_SCALE}-d{ALIGN_SHIFT_DOWN}-c{CONTEXT_MARGIN}"


def encode_at(rgb_image, box, jitters=1, upscale=1.0):
    """Encode the face at box (top, right, bottom, left); None if it fails.

    upscale > 1 enlarges the face region first (used for small, far faces)
    so the landmark predictor has more pixels to place the eyes and nose.
    """
    top, right, bottom, left = box
    height, width = rgb_image.shape[:2]
    pad = int((bottom - top) * CONTEXT_MARGIN)
    crop_top, crop_left = max(0, top - pad), max(0, left - pad)
    crop_bottom, crop_right = min(height, bottom + pad), min(width, right + pad)

    region = np.ascontiguousarray(rgb_image[crop_top:crop_bottom, crop_left:crop_right])
    if region.size == 0:
        return None
    region = normalize_lighting(region)
    location = [(top - crop_top, right - crop_left, bottom - crop_top, left - crop_left)]
    if upscale > 1.0:
        region = cv2.resize(region, None, fx=upscale, fy=upscale, interpolation=cv2.INTER_CUBIC)
        location = [tuple(int(round(value * upscale)) for value in location[0])]
    encodings = face_recognition.face_encodings(region, known_face_locations=location, num_jitters=jitters)
    return encodings[0] if encodings else None


def split_views(rgb_image):
    """Split the registration composite (square views stacked vertically).

    Registration stores front/left/right as one 300x900 image. Any other
    shape (e.g. an older single photo) is treated as a single view.
    """
    height, width = rgb_image.shape[:2]
    if width > 0 and height > width and height % width == 0:
        return [rgb_image[i * width:(i + 1) * width] for i in range(height // width)]
    return [rgb_image]


def detect_face_box(rgb_image, detector):
    """Largest face in the image as an aligned box, or None.

    Uses the same MediaPipe detector type as the live camera so enrollment
    and live faces are framed the same way. Falls back to dlib HOG with
    upsampling for views MediaPipe misses.
    """
    height, width = rgb_image.shape[:2]
    results = detector.process(rgb_image)
    if results.detections:
        largest = max(
            results.detections,
            key=lambda d: d.location_data.relative_bounding_box.width
            * d.location_data.relative_bounding_box.height,
        )
        bbox = largest.location_data.relative_bounding_box
        return align_box(bbox.xmin, bbox.ymin, bbox.width, bbox.height, width, height)

    locations = face_recognition.face_locations(rgb_image, number_of_times_to_upsample=2)
    if locations:
        return max(locations, key=lambda b: (b[2] - b[0]) * (b[1] - b[3]))
    return None


def encode_enrollment_image(filepath, detector, jitters=ENROLL_JITTERS):
    """Return (encodings, total_views) for one enrollment image."""
    image = face_recognition.load_image_file(filepath)
    views = split_views(image)
    encodings = []
    for view in views:
        view = np.ascontiguousarray(view)
        box = detect_face_box(view, detector)
        if box is None:
            continue
        encoding = encode_at(view, box, jitters=jitters)
        if encoding is not None:
            encodings.append(encoding)
    return encodings, len(views)


class EncodingCache:
    """Disk cache of enrollment encodings keyed by file path + mtime + size.

    The cache holds biometric data: it lives under models/ and is git-ignored.
    """

    def __init__(self, path):
        self.path = path
        self.entries = {}
        try:
            with open(path, 'rb') as cache_file:
                data = pickle.load(cache_file)
            if data.get('version') == CACHE_VERSION:
                self.entries = data.get('entries', {})
        except (OSError, EOFError, pickle.UnpicklingError, AttributeError, ValueError):
            self.entries = {}

    @staticmethod
    def _key(filepath):
        stat = os.stat(filepath)
        return os.path.normcase(os.path.abspath(filepath)), stat.st_mtime_ns, stat.st_size

    def get_or_encode(self, filepath, detector):
        """Return (encodings, total_views, from_cache)."""
        path_key, mtime, size = self._key(filepath)
        entry = self.entries.get(path_key)
        if entry and entry['mtime'] == mtime and entry['size'] == size:
            return entry['encodings'], entry['views'], True

        encodings, views = encode_enrollment_image(filepath, detector)
        self.entries[path_key] = {'mtime': mtime, 'size': size, 'encodings': encodings, 'views': views}
        return encodings, views, False

    def prune(self, keep_paths):
        keep = {os.path.normcase(os.path.abspath(p)) for p in keep_paths}
        self.entries = {k: v for k, v in self.entries.items() if k in keep}

    def save(self):
        tmp_path = self.path + '.tmp'
        with open(tmp_path, 'wb') as cache_file:
            pickle.dump({'version': CACHE_VERSION, 'entries': self.entries}, cache_file)
        os.replace(tmp_path, self.path)
