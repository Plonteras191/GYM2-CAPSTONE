"""Turn face images into face encodings (enrolled photos and live frames).

Shared by gesture_engine.py, the encoder helpers (face_encoder_pool.py) and
scripts/eval_faces.py, so enrolled and live faces are encoded the same way.

Two OpenCV models (OpenCV model zoo, Apache 2.0) do the work:
  YuNet  finds the face inside the crop and its 5 landmarks (eyes, nose,
         mouth corners), used to straighten the face;
  SFace  turns the straightened 112x112 face into 128 numbers (unit length).
Encodings are compared with face_matching.face_distances (1 - cosine).

Measured 2026-11-20 on the gym laptop (Ryzen 5 7430U): about 50 ms per face.
The dlib model used before took about 500 ms (its Windows build had no BLAS),
so faces took seconds to be named and groups of 2-3 often never were.
"""

import os
import pickle
import threading

import cv2
import numpy as np

from face_matching import ALIGN_SCALE, ALIGN_SHIFT_DOWN, align_box, normalize_lighting
from small_face_sweep import YUNET_MODEL_PATH

SFACE_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'models', 'face_recognition_sface_2021dec.onnx',
)
# Extra margin kept around the face, so YuNet sees a whole face (jaw line
# and forehead) inside the crop instead of a hard crop edge.
CONTEXT_MARGIN = 0.25
# YuNet score needed to place landmarks in a crop already known to hold a face.
LANDMARK_MIN_SCORE = 0.5
# The face YuNet finds must overlap the requested box this much (IoU), so a
# neighbour's face at the edge of the crop is never encoded instead.
LANDMARK_MIN_OVERLAP = 0.25
# Small crops are enlarged to at least this many pixels (and at most
# MAX_ENLARGE times) before YuNet looks, so far faces still get landmarks.
LANDMARK_MIN_SIDE = 160
MAX_ENLARGE = 4.0
# Bump when encoding settings change so stale cached encodings are rebuilt
# (this also drops encodings made by the old dlib model).
CACHE_VERSION = f"sface-v1-s{ALIGN_SCALE}-d{ALIGN_SHIFT_DOWN}-c{CONTEXT_MARGIN}-m{LANDMARK_MIN_SIDE}"

# One YuNet + SFace pair per process. OpenCV networks must not run on two
# threads at once, and Flask starts a new thread per request, so the pair is
# shared behind a lock instead of being loaded per thread.
_models = None
_models_lock = threading.Lock()


def missing_face_models():
    """Paths of face model files that are not downloaded yet."""
    return [path for path in (YUNET_MODEL_PATH, SFACE_MODEL_PATH) if not os.path.isfile(path)]


def _face_models():
    """(YuNet, SFace) for this process. Call with _models_lock held."""
    global _models
    if _models is None:
        missing = missing_face_models()
        if missing:
            raise FileNotFoundError(
                f"Face model missing: {', '.join(missing)}. Run: python scripts/download_face_models.py"
            )
        detector = cv2.FaceDetectorYN.create(YUNET_MODEL_PATH, '', (320, 320), LANDMARK_MIN_SCORE)
        recognizer = cv2.FaceRecognizerSF.create(SFACE_MODEL_PATH, '')
        _models = (detector, recognizer)
    return _models


def _overlap(box_a, box_b):
    """IoU of two (top, right, bottom, left) boxes."""
    top, left = max(box_a[0], box_b[0]), max(box_a[3], box_b[3])
    bottom, right = min(box_a[2], box_b[2]), min(box_a[1], box_b[1])
    if bottom <= top or right <= left:
        return 0.0
    inter = (bottom - top) * (right - left)
    area_a = (box_a[2] - box_a[0]) * (box_a[1] - box_a[3])
    area_b = (box_b[2] - box_b[0]) * (box_b[1] - box_b[3])
    return inter / float(area_a + area_b - inter)


def _detect_faces(detector, bgr_image):
    """YuNet rows [x, y, w, h, 5 landmark points, score]. Hold _models_lock."""
    height, width = bgr_image.shape[:2]
    detector.setInputSize((width, height))
    _, faces = detector.detect(bgr_image)
    return [] if faces is None else list(faces)


def resolve_face_path(backend_dir, image_file):
    """Absolute path of an enrolled face photo, or None if it is missing.

    Face photos are biometric data, so Laravel keeps them in
    storage/app/private (not reachable from the web). Photos enrolled by
    older versions may still be in public/ until "php artisan faces:secure"
    is run, so both places are checked.
    """
    relative = str(image_file).lstrip('/\\')
    for base in (os.path.join(backend_dir, 'storage', 'app', 'private'), os.path.join(backend_dir, 'public')):
        root = os.path.abspath(base)
        path = os.path.normpath(os.path.join(root, relative))
        if path.startswith(root + os.sep) and os.path.isfile(path):
            return path
    return None


def faces_signature(members):
    """Changes whenever the enrolled faces, names or coach eligibility change."""
    return sorted(
        (member.get('id'), member.get('name'), member.get('image_file'), bool(member.get('workout_eligible', False)))
        for member in members
    )


def face_region(rgb_image, box):
    """Crop the face at box (top, right, bottom, left) with its context margin.

    Returns (region, location of the face inside the region), or (None, None)
    when the box is empty. The crop is a small copy, cheap to hand to a
    helper process (see face_encoder_pool.py).
    """
    top, right, bottom, left = box
    height, width = rgb_image.shape[:2]
    pad = int((bottom - top) * CONTEXT_MARGIN)
    crop_top, crop_left = max(0, top - pad), max(0, left - pad)
    crop_bottom, crop_right = min(height, bottom + pad), min(width, right + pad)

    region = np.ascontiguousarray(rgb_image[crop_top:crop_bottom, crop_left:crop_right])
    if region.size == 0:
        return None, None
    return region, (top - crop_top, right - crop_left, bottom - crop_top, left - crop_left)


def encode_region(region, location, upscale=1.0):
    """Encode the face at location inside a face_region() RGB crop.

    Returns a unit-length float32 encoding, or None when YuNet finds no face
    where location says (e.g. a full side view or the back of the head).
    upscale > 1 enlarges the crop first (used for small, far faces); small
    crops are always enlarged to LANDMARK_MIN_SIDE.
    """
    region = normalize_lighting(region)
    scale = max(1.0, float(upscale), LANDMARK_MIN_SIDE / float(max(1, min(region.shape[:2]))))
    scale = min(scale, MAX_ENLARGE)
    bgr = cv2.cvtColor(region, cv2.COLOR_RGB2BGR)
    if scale > 1.0:
        bgr = cv2.resize(bgr, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    wanted = tuple(value * scale for value in location)

    with _models_lock:
        detector, recognizer = _face_models()
        best, best_overlap = None, LANDMARK_MIN_OVERLAP
        for face in _detect_faces(detector, bgr):
            x, y, w, h = (float(v) for v in face[:4])
            overlap = _overlap((y, x + w, y + h, x), wanted)
            if overlap >= best_overlap:
                best, best_overlap = face, overlap
        if best is None:
            return None
        feature = recognizer.feature(recognizer.alignCrop(bgr, best))

    feature = np.asarray(feature, dtype=np.float32).reshape(-1)
    norm = float(np.linalg.norm(feature))
    return feature / norm if norm > 0 else None


def encode_at(rgb_image, box, upscale=1.0):
    """Encode the face at box (top, right, bottom, left); None if it fails."""
    region, location = face_region(rgb_image, box)
    if region is None:
        return None
    return encode_region(region, location, upscale=upscale)


def load_rgb_image(filepath):
    """Read an image file as RGB (also works with non-ASCII Windows paths)."""
    image = cv2.imdecode(np.fromfile(filepath, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Not a readable image: {filepath}")
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


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
    and live faces are framed the same way. Falls back to YuNet for views
    MediaPipe misses (often strongly turned side views).
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

    with _models_lock:
        faces = _detect_faces(_face_models()[0], cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR))
    if not faces:
        return None
    x, y, w, h = (float(v) for v in max(faces, key=lambda f: f[2] * f[3])[:4])
    return (max(0, int(y)), min(width, int(x + w)), min(height, int(y + h)), max(0, int(x)))


def encode_enrollment_image(filepath, detector, encode=encode_at):
    """Return (encodings, total_views) for one enrollment image.

    encode has encode_at's signature; the engine passes one that runs in a
    helper process so enrolling a member does not freeze the live video.
    """
    image = load_rgb_image(filepath)
    views = split_views(image)
    encodings = []
    for view in views:
        view = np.ascontiguousarray(view)
        box = detect_face_box(view, detector)
        if box is None:
            continue
        encoding = encode(view, box)
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

    def get_or_encode(self, filepath, detector, encode=encode_at):
        """Return (encodings, total_views, from_cache)."""
        path_key, mtime, size = self._key(filepath)
        entry = self.entries.get(path_key)
        if entry and entry['mtime'] == mtime and entry['size'] == size:
            return entry['encodings'], entry['views'], True

        encodings, views = encode_enrollment_image(filepath, detector, encode=encode)
        # A photo with no usable view is not cached: if that was a passing
        # failure (e.g. an encoder helper failing), caching it would keep the
        # member unrecognizable until their photo changed. Re-trying a photo
        # that really has no face costs a few tens of ms per reload.
        if encodings:
            self.entries[path_key] = {'mtime': mtime, 'size': size, 'encodings': encodings, 'views': views}
        else:
            self.entries.pop(path_key, None)
        return encodings, views, False

    def prune(self, keep_paths):
        keep = {os.path.normcase(os.path.abspath(p)) for p in keep_paths}
        self.entries = {k: v for k, v in self.entries.items() if k in keep}

    def save(self):
        tmp_path = self.path + '.tmp'
        with open(tmp_path, 'wb') as cache_file:
            pickle.dump({'version': CACHE_VERSION, 'entries': self.entries}, cache_file)
        os.replace(tmp_path, self.path)
