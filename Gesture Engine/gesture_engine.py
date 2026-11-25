import sys
import os
import collections

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Load camera URLs and tokens from the git-ignored "Gesture Engine/.env".
import env_loader

# Real-time low-latency FFMPEG options: discard buffers, minimize network jitter delay
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000|reorder_queue_size;0"

import cv2
import mediapipe as mp
import pickle
from flask import Flask, Response, jsonify
from flask_cors import CORS
import threading
import time
import numpy as np
import requests
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision.core.vision_task_running_mode import VisionTaskRunningMode
from mediapipe.framework.formats import landmark_pb2
from camera_tracking import boxes_overlap, head_region, torso_histogram, update_pose_track_identity
from camera_tracking import clear_identity as clear_pose_identity
from camera_tracking import duplicate_identity_losers
from monitoring import EXCLUDED, IDENTIFYING, monitoring_status
from pose_features import (
    MotionTracker,
    joints_visible_for,
    landmarks_array,
    load_train_torso,
    scaled_model_input,
    static_exercises_from_env,
)
from workout_prediction import select_assigned_prediction
from rep_counter import RepCounter, countable_exercises_from_env
from face_matching import IdentityVote, align_box, best_member_match, face_distances, still_matches, views_agree
from face_matching import box_size as face_box_size
from enrollment_quality import assess_view
from gallery_health import (
    LIKELY_CONFUSED_DISTANCE,
    LOOK_ALIKE_DISTANCE,
    build_gallery_health,
    closest_member_distances,
    report_lines,
)
from pose_features import hidden_body_parts
from smoothing import LandmarkSmoother
from small_face_sweep import find_faces as find_small_faces
from small_face_sweep import make_detector as make_small_face_detector
from small_face_sweep import sweep_due
from face_enrollment import (
    EncodingCache,
    detect_face_box,
    encode_at,
    face_region,
    faces_signature,
    missing_face_models,
    resolve_face_path,
)
from face_encoder_pool import FaceEncoderPool
from liveness import BlinkDetector, FaceMeshEyes, liveness_required_from_env
from attendance_queue import SENT, AttendanceSender

app = Flask(__name__)
CORS(app)

LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


AI_ENGINE_TOKEN = env_loader.ai_engine_token()
if not AI_ENGINE_TOKEN:
    print("[WARNING] AI_ENGINE_TOKEN is not set. Laravel will reject attendance and workout updates.")
LARAVEL_HEADERS = {"X-AI-Engine-Token": AI_ENGINE_TOKEN, "Accept": "application/json"}
BACKEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend'))

# Main Stream 720p H.264 (Channel 101) — reverted from 102 sub-stream which caused more lag on this camera
# Camera URLs contain passwords, so they come only from the environment or
# the git-ignored "Gesture Engine/.env" (see .env.example).
CCTV_URL = os.getenv('CCTV_URL', '')

# Optional second CCTV (for example, the Reolink P330).
CCTV_2_URL = os.getenv('CCTV_2_URL', '').strip()

# Samsung A06 phone-camera stream on the FTTx_39DC_5G network.
# Override PHONE_CAMERA_URL when the phone's network address changes.
PHONE_CAMERA_URL = os.getenv(
    'PHONE_CAMERA_URL',
    'rtsp://192.168.1.55:8554/live',
).strip()
CCTV_STREAM_URLS = {
    'cctv': CCTV_URL.strip(),
    'cctv_2': CCTV_2_URL,
    'cctv_3': os.getenv('CCTV_3_URL', '').strip(),
}
AVAILABLE_CAMERA_SOURCES = [
    source for source, url in CCTV_STREAM_URLS.items()
    if url or source == 'cctv_2'
] + (
    ['webcam']
    + (['phone'] if PHONE_CAMERA_URL else [])
)
CONFIGURED_CAMERA_SOURCES = (
    [source for source, url in CCTV_STREAM_URLS.items() if url]
    + ['webcam']
    + (['phone'] if PHONE_CAMERA_URL else [])
)
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'phone').lower()
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))
WEBCAM_WIDTH = int(os.getenv('WEBCAM_WIDTH', '1280'))
WEBCAM_HEIGHT = int(os.getenv('WEBCAM_HEIGHT', '720'))
if CAMERA_SOURCE not in CONFIGURED_CAMERA_SOURCES:
    CAMERA_SOURCE = CONFIGURED_CAMERA_SOURCES[0]

camera_mode = CAMERA_SOURCE
camera_status = {
    "connected": False,
    "source": camera_mode,
    "available_sources": AVAILABLE_CAMERA_SOURCES,
    "fps": 0.0,
}

def make_placeholder_frame(status_text="Connecting to Camera..."):
    # Generate clean 640x360 dark banner with timestamp
    ph = np.zeros((360, 640, 3), dtype=np.uint8)
    ph[:] = (24, 25, 33) # sleek dark brand slate bg (#211918)
    cv2.putText(ph, "MUSCLE BROS GYM - AI ENGINE", (40, 130), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    cv2.putText(ph, f"SOURCE: {camera_mode.upper()}", (40, 170), cv2.FONT_HERSHEY_DUPLEX, 0.6, (0, 200, 255), 1)
    cv2.putText(ph, f"STATUS: {status_text}", (40, 210), cv2.FONT_HERSHEY_DUPLEX, 0.55, (100, 220, 100) if "LIVE" in status_text else (80, 130, 255), 1)
    cv2.putText(ph, time.strftime("%Y-%m-%d %H:%M:%S"), (40, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 160, 160), 1)
    return ph

def _env_number(name, default, cast=float):
    try:
        return cast(os.getenv(name, default))
    except (TypeError, ValueError):
        print(f"[WARNING] Invalid {name}; using default {default}.")
        return cast(default)


# Enrolled faces as one immutable snapshot, swapped atomically on reload so
# the face worker never sees half-loaded lists:
# (encodings array, member ids, names, workout eligibility), one row per view.
face_db = (np.empty((0, 128)), [], [], [])
face_db_reload_lock = threading.Lock()
# member id -> 'active' | 'expired' | 'none', refreshed every minute so the
# Security Monitor can flag members whose subscription has expired.
member_subscriptions = {}
SUBSCRIPTION_REFRESH_SECONDS = 60
# What the loaded faces were built from. When Laravel's list no longer
# matches (new member, new face photo, coach membership change), the faces
# are reloaded automatically; no need to press "Force AI Memory Sync".
loaded_faces_signature = None
# Enrollment problems found at the last face reload (gallery_health.py).
gallery_health = {'ready': False}
# Anti-spoofing: when on, attendance is logged only after the face blinks
# (a printed photo never does). Off by default; see liveness.py.
LIVENESS_REQUIRED = liveness_required_from_env()
BLINK_COLOR = (0, 215, 255)  # yellow (BGR)
RENEW_COLOR = (0, 140, 255)  # orange (BGR)
FACE_CACHE_PATH = os.path.join(BASE_DIR, 'models', 'face_cache.pkl')

# Recognition tuning. Override in "Gesture Engine/.env"; calibrate with
# scripts/eval_faces.py. Lower threshold = stricter matching. Distances are
# SFace's 1 - cosine (0 = identical, ~1 = unrelated), NOT the old dlib scale.
# Set 2026-11-20 from the enrolled gallery (each view matched against the
# member's other views): same person 0.21-0.56, different people >= 0.657.
FACE_MATCH_THRESHOLD = _env_number('FACE_MATCH_THRESHOLD', '0.55')
FACE_MATCH_MARGIN = _env_number('FACE_MATCH_MARGIN', '0.08')
FACE_VOTES_REQUIRED = _env_number('FACE_VOTES_REQUIRED', '3', int)
# Enrolled views of a member that must match before a sample counts for
# them (members with 3+ usable views; see face_matching.views_agree).
# 1 = old behaviour (one matching view is enough).
FACE_MIN_AGREEING_VIEWS = _env_number('FACE_MIN_AGREEING_VIEWS', '2', int)
# Size tiers: faces >= FACE_NEAR_SIZE use the rules above; faces between
# FACE_MIN_SIZE and FACE_NEAR_SIZE ("far") are enlarged before encoding and
# need a stricter distance and more agreeing samples; smaller faces are not
# recognized (the tracked body keeps the name instead).
FACE_MIN_SIZE = _env_number('FACE_MIN_SIZE', '40', int)
FACE_NEAR_SIZE = _env_number('FACE_NEAR_SIZE', '70', int)
FACE_FAR_THRESHOLD = _env_number('FACE_FAR_THRESHOLD', '0.50')
# Looser limit for a face already confirmed as a member to KEEP that name
# (hysteresis; see face_matching.still_matches). Getting a name still needs
# FACE_MATCH_THRESHOLD and two agreeing views.
FACE_KEEP_THRESHOLD = _env_number('FACE_KEEP_THRESHOLD', '0.62')
# A face lost while confirmed (e.g. a full side view the detector cannot see)
# and found again near the same spot within this many seconds starts with
# that member's earlier votes, so one agreeing check names them again.
REACQUIRE_SECONDS = _env_number('REACQUIRE_SECONDS', '6')
FACE_FAR_VOTES = max(FACE_VOTES_REQUIRED, _env_number('FACE_FAR_VOTES', '5', int))
FACE_FAR_WEIGHT = FACE_VOTES_REQUIRED / FACE_FAR_VOTES
FACE_FAR_UPSCALE = 2.0
FACE_VOTE_WINDOW = max(FACE_FAR_VOTES * 2, FACE_VOTES_REQUIRED * 2, 4)
# Frames wider than this are scaled down before detection; smaller frames
# are processed at full resolution so distant people keep their pixels.
DETECTION_MAX_WIDTH = 1280
# A face not named yet is sampled this often (an SFace sample costs ~30 ms,
# so 3 agreeing samples name a member in about half a second).
RECOGNITION_INTERVAL_UNCONFIRMED = 0.2
RECOGNITION_INTERVAL_CONFIRMED = 2.0
# A face with UNKNOWN_BACKOFF_AFTER unmatched checks in a row (~2 s) is
# probably not a member; it is re-checked every RECOGNITION_INTERVAL_UNKNOWN
# instead of every 0.2 s. Measured 2026-11-20: one unknown face at the desk
# kept the face helpers at ~0.95 CPU cores.
UNKNOWN_BACKOFF_AFTER = _env_number('UNKNOWN_BACKOFF_AFTER', '6', int)
RECOGNITION_INTERVAL_UNKNOWN = _env_number('RECOGNITION_INTERVAL_UNKNOWN', '1.5')
# The face and skeleton loops process at most this many frames per second,
# whatever the camera sends (30 fps cameras doubled the CPU use for no gain).
AI_MAX_FPS = _env_number('AI_MAX_FPS', '10')
# Face encoding (YuNet landmarks + SFace, ~30 ms) runs in this many helper
# processes (face_encoder_pool.py), so several faces are encoded at once and
# the face loop never waits on one. 0 = encode inside the engine.
FACE_ENCODER_PROCESSES = _env_number('FACE_ENCODER_PROCESSES', '2', int)
face_encoder_pool = None  # started by start_background_workers()
MOVE_CLOSER_LABEL = 'Move closer'
logged_today = {}
workout_cooldowns = {} # Prevents API spam!

shared_faces = []
tracked_faces = [] # Multi-person tracking state: list of active face tracks
next_track_id = 1
shared_athletes = []
pose_tracks = []
next_pose_track_id = 1
workout_states = {}
# Per tracked body, from the moment it appears (even while its face is still
# being identified): landmark smoothing (One Euro filter), movement history,
# and the last few seconds of smoothed landmarks. When the member is
# recognised, that history is replayed into the exercise checks, so they do
# not start from zero.
actor_pose_state = {}
PRE_ID_HISTORY_SECONDS = 3.0
# Classifier predictions seeded from that history (the stability rule needs 5 of 7).
SEED_PREDICTIONS = 7
# Longest stretch of frames kept to count repetitions done before the
# exercise was confirmed.
REPLAY_MAX_SECONDS = 8.0
workout_plans = {}
ambiguous_workout_plans = {}
# member id -> exercise class -> {'id', 'sets', 'reps', 'counted'}: the
# target of today's assigned task, and repetitions already saved for it.
workout_targets = {}
workout_plans_lock = threading.Lock()
# Exercises whose repetitions are counted from joint angles (rep_counter.py).
# A task for one of these is verified only once sets x reps are counted.
COUNTED_EXERCISES = countable_exercises_from_env()
# Counted repetitions are saved to Laravel at most this often while a
# member is still working, so the coach sees progress even if they stop early.
REP_PROGRESS_SECONDS = 3.0
# (member id, exercise) -> repetitions counted so far today. Kept per member,
# not per tracked body, so a member who steps out of view (or rests out of
# frame between sets) resumes from their count instead of zero.
member_rep_counts = {}
WORKOUT_CONFIDENCE_THRESHOLD = 0.70
MAX_POSES = 12
# Body motion (in torso lengths over ~1.5s) below which a monitored member
# is shown as "Not moving" and no exercise is checked or logged.
MOTION_MIN = _env_number('MOTION_MIN', '0.15')
STATIC_EXERCISES = static_exercises_from_env()
TRAIN_TORSO = load_train_torso(os.path.join(BASE_DIR, 'datasets', 'custom_workout_dataset.csv'))
# Head regions from pose landmarks, published by the gesture worker so the
# face worker can look for faces too small for whole-frame detection.
shared_head_regions = []

# FIX #1: Thread-safe frame sharing — protects current_raw_frame from partial reads
frame_lock = threading.Lock()
# FIX #10: Reactive stream_generator wake-up instead of sleep-polling
new_frame_event = threading.Event()

# Workout verification and per-person pose tracking state.
ml_model = None
workout_cooldowns_lock = threading.Lock()

# Load the AI Brain!
model_paths = [
    os.path.join(BASE_DIR, 'models', 'workout_model.pkl'),
    os.path.join(BASE_DIR, 'workout_model.pkl')
]

for m_path in model_paths:
    if os.path.exists(m_path):
        try:
            with open(m_path, 'rb') as f:
                ml_model = pickle.load(f)
            print(f"🧠 [SUCCESS] Machine Learning Workout Brain Loaded from '{m_path}'!")
            break
        except Exception as e:
            print(f"⚠️ Could not load model from '{m_path}': {e}")

if ml_model is None:
    print("❌ [WARNING] 'workout_model.pkl' not found. Ensure you ran train_model.py.")

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
# POSE_MODEL=full (default) is more accurate for small, distant bodies at
# about twice the CPU cost; POSE_MODEL=lite is the lighter fallback.
POSE_MODEL = os.getenv('POSE_MODEL', 'full').strip().lower()
if POSE_MODEL not in ('full', 'lite'):
    print(f"[WARNING] Unknown POSE_MODEL '{POSE_MODEL}'; using 'full'.")
    POSE_MODEL = 'full'
POSE_LANDMARKER_MODEL = os.path.join(BASE_DIR, 'models', f'pose_landmarker_{POSE_MODEL}.task')
if not os.path.exists(POSE_LANDMARKER_MODEL) and POSE_MODEL == 'full':
    print("[WARNING] models/pose_landmarker_full.task is missing; falling back to the lite pose model.")
    POSE_LANDMARKER_MODEL = os.path.join(BASE_DIR, 'models', 'pose_landmarker_lite.task')
if not os.path.exists(POSE_LANDMARKER_MODEL):
    raise FileNotFoundError(f"Multi-person pose model is missing: {POSE_LANDMARKER_MODEL}")
print(f"[POSE] Using {os.path.basename(POSE_LANDMARKER_MODEL)}")
pose_landmarker = mp_vision.PoseLandmarker.create_from_options(
    mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_LANDMARKER_MODEL),
        running_mode=VisionTaskRunningMode.VIDEO,
        num_poses=MAX_POSES,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
)

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(min_detection_confidence=0.3, model_selection=1)
# Runs on small head crops found from pose landmarks (face worker thread only).
# The whole-frame detector shrinks every frame to 192x192 internally, so
# distant faces become a few pixels and are missed; a head crop keeps them large.
head_face_detector = mp_face.FaceDetection(min_detection_confidence=0.4, model_selection=0)
# Separate instance for enrollment: load_registered_faces() can run on a Flask
# thread (/refresh_ai) while face_ai_worker uses face_detector.
enroll_face_detector = mp_face.FaceDetection(min_detection_confidence=0.5, model_selection=1)
# Same settings as enroll_face_detector, so a photo that passes the member
# form's quality check is one enrollment can use. Own instance and lock:
# Flask serves checks on several threads, and MediaPipe is not thread-safe.
enrollment_check_detector = mp_face.FaceDetection(min_detection_confidence=0.5, model_selection=1)
enrollment_check_lock = threading.Lock()
# A 300x300 PNG view is ~150 KB; anything far bigger is not a face photo.
ENROLLMENT_CHECK_MAX_BYTES = 5 * 1024 * 1024

current_raw_frame = None
current_frame_sequence = 0
last_camera_placeholder = None

# Encoded MJPEG frames for the two video feeds ('sec' = Attendance Monitor,
# 'gest' = Gesture Monitor). video_stream_worker only draws and encodes a feed
# while someone is watching it, and notifies feed_condition the moment a new
# JPEG is ready, so each viewer gets it immediately.
#   viewers: open connections; source_sequence: camera frame last encoded;
#   sequence: counter of encoded frames; jpeg: latest encoded frame.
feed_condition = threading.Condition()
feed_state = {
    feed: {'viewers': 0, 'source_sequence': -1, 'sequence': 0, 'jpeg': None}
    for feed in ('sec', 'gest')
}
# Feeds are drawn and sent at most this wide. Shrinking first and drawing on
# the small frame is much cheaper than drawing on a 2K/4K frame.
STREAM_MAX_WIDTH = 1280

# FIX #3: Pre-build ML column list once at startup (kept for reference; numpy path is used in worker)
ml_classes = None
if ml_model is not None:
    try:
        ml_classes = ml_model.classes_
    except Exception:
        pass

def member_face_path(member):
    """Path of the member's enrolled face photo, or None if it is missing."""
    return resolve_face_path(BACKEND_DIR, member['image_file'])


def load_registered_faces():
    """Fetch enrolled members from Laravel and encode each enrolled view.

    Each registration image holds stacked views (front/left/right). Every
    view is encoded separately with the same MediaPipe framing used for live
    frames. Encodings are cached in models/face_cache.pkl, so only new or
    changed enrollments pay the slower high-jitter encoding.
    """
    global face_db, member_subscriptions, loaded_faces_signature, gallery_health

    print("\n" + "="*50)
    print("🚀 [CAPSTONE READY] HIGH-ACCURACY AI ENGINE...")
    for path in missing_face_models():
        print(f"[ERROR] Face model missing: {path}\n"
              "        Nobody can be recognized until it is downloaded: python scripts/download_face_models.py")
    print(f"[FACE] Face recognition: SFace (match threshold {FACE_MATCH_THRESHOLD}, margin {FACE_MATCH_MARGIN}, "
          f"at least {FACE_MIN_AGREEING_VIEWS} agreeing views)")
    print("[SYNC] Fetching registered members from Laravel...")
    try:
        response = requests.get(f"{LARAVEL_API}/ai/members-faces", headers=LARAVEL_HEADERS, timeout=10)
        response.raise_for_status()
        members = response.json()
    except Exception as e:
        print(f"[ERROR] Failed to connect to Laravel: {e}")
        print("="*50 + "\n")
        return

    with face_db_reload_lock:
        cache = EncodingCache(FACE_CACHE_PATH)
        encodings, ids, names, eligibility = [], [], [], []
        seen_paths = []
        health_members = []  # one entry per member for the gallery health report

        for member in members:
            filepath = member_face_path(member)
            if filepath is None:
                print(f"  [MISSING] Face image not found for {member['name']}")
                health_members.append({'id': member['id'], 'name': member['name'],
                                       'views_usable': 0, 'views_total': 0, 'status': 'missing'})
                continue
            seen_paths.append(filepath)
            try:
                member_encodings, total_views, cached = cache.get_or_encode(
                    filepath, enroll_face_detector, encode=encode_face
                )
            except Exception as img_err:
                print(f"  [ERROR] Could not process image for {member['name']}: {img_err}")
                health_members.append({'id': member['id'], 'name': member['name'],
                                       'views_usable': 0, 'views_total': 0, 'status': 'error'})
                continue

            workout_eligible = bool(member.get('workout_eligible', False))
            for encoding in member_encodings:
                encodings.append(encoding)
                ids.append(member['id'])
                names.append(member['name'])
                eligibility.append(workout_eligible)

            eligibility_label = "coach eligible" if workout_eligible else "attendance only"
            source = "cached" if cached else "encoded"
            if member_encodings:
                status = "SUCCESS" if len(member_encodings) >= min(2, total_views) else "WEAK"
                print(f"  [{status}] {member['name']}: {len(member_encodings)}/{total_views} views {source} ({eligibility_label})")
            else:
                status = "FAILED"
                print(f"  [FAILED] {member['name']}: no face found in any view. Re-capture this member's face.")
            health_members.append({'id': member['id'], 'name': member['name'],
                                   'views_usable': len(member_encodings), 'views_total': total_views,
                                   'status': status.lower()})

        cache.prune(seen_paths)
        try:
            cache.save()
        except OSError as cache_err:
            print(f"  [WARNING] Could not save face cache: {cache_err}")

        matrix = np.array(encodings) if encodings else np.empty((0, 128))
        face_db = (matrix, ids, names, eligibility)

        # Members who cannot be recognized, duplicate records and look-alikes,
        # in the log and on the Attendance Monitor (GET /gallery_health).
        gallery_health = build_gallery_health(health_members, matrix, ids)
        for line in report_lines(gallery_health):
            print(line)
        member_subscriptions = {
            member['id']: member.get('subscription_status') for member in members
        }
        loaded_faces_signature = faces_signature(members)
        print(f"[SYNC] {len(set(ids))} members ready ({len(ids)} face views).")
    print("="*50 + "\n")

def compute_iou(boxA, boxB):
    # Format: (top, right, bottom, left)
    topA, rightA, bottomA, leftA = boxA
    topB, rightB, bottomB, leftB = boxB
    inter_top = max(topA, topB)
    inter_left = max(leftA, leftB)
    inter_bottom = min(bottomA, bottomB)
    inter_right = min(rightA, rightB)
    if inter_bottom <= inter_top or inter_right <= inter_left:
        return 0.0
    inter_area = (inter_bottom - inter_top) * (inter_right - inter_left)
    areaA = (bottomA - topA) * (rightA - leftA)
    areaB = (bottomB - topB) * (rightB - leftB)
    return inter_area / float(areaA + areaB - inter_area)

# Check-ins that could not be delivered (Laravel down or restarting) are
# saved here and retried, so no arrival is lost. Git-ignored.
ATTENDANCE_QUEUE_PATH = os.path.join(BASE_DIR, 'data', 'attendance_queue.jsonl')
ATTENDANCE_RETRY_SECONDS = 30
attendance_sender = AttendanceSender(
    f"{LARAVEL_API}/ai/log-attendance", LARAVEL_HEADERS, ATTENDANCE_QUEUE_PATH
)


def log_attendance_to_laravel(member_id, name, match_distance=None):
    current_time = time.time()
    if member_id in logged_today and (current_time - logged_today[member_id]) < 10.0:
        return

    logged_today[member_id] = current_time

    outcome, detail = attendance_sender.submit(
        member_id, name, camera_source=camera_mode, match_distance=match_distance
    )
    if outcome == SENT and detail == 'logged':
        print(f"\n>>> [ATTENDANCE SUCCESS] Logged: {name}!\n")
    elif outcome == SENT and detail == 'outside_hours':
        print(f"[ATTENDANCE] {name} was recognized outside gym hours; not logged.")


def attendance_retry_worker():
    """Retry saved check-ins until Laravel accepts them."""
    while True:
        try:
            attendance_sender.flush()
        except Exception as error:
            print(f"[ATTENDANCE ERROR] Retry failed: {error}")
        time.sleep(ATTENDANCE_RETRY_SECONDS)


def log_workout_to_laravel(member_id, athlete_name, exercise, counted_reps=None, completed=True):
    """Tell Laravel a member performed an exercise.

    completed=True verifies today's assigned task (or logs an unassigned
    exercise). completed=False only saves the repetitions counted so far,
    so the coach can see progress even when the member stops early.
    """
    if not member_id: return

    key = f"{member_id}_{exercise}"
    payload = {"member_id": member_id, "exercise": exercise}
    if counted_reps is not None:
        payload["counted_reps"] = int(counted_reps)
    if not completed:
        payload["completed"] = False
    try:
        res = requests.post(
            f"{LARAVEL_API}/ai/log-workout",
            json=payload,
            headers=LARAVEL_HEADERS,
            timeout=5,
        )
        res.raise_for_status()
        status = res.json().get('status')
        if not completed:
            if status not in ('progress', 'ignored'):
                print(f"[WORKOUT] {athlete_name}: progress API returned status '{status}'.")
            return
        if status == 'logged':
            with workout_cooldowns_lock:
                workout_cooldowns[key] = time.time()
            with workout_plans_lock:
                pending = workout_plans.get(str(member_id), set())
                pending.discard(exercise)
            reps_text = f" ({counted_reps} reps counted)" if counted_reps is not None else ""
            print(f"\n💪 [WORKOUT VERIFIED IN DATABASE] {athlete_name} performed {exercise}{reps_text}!\n")
        else:
            with workout_cooldowns_lock:
                workout_cooldowns.pop(key, None)
            print(f"[WORKOUT] {athlete_name}: API returned status '{res.json().get('status')}'.")
    except (requests.RequestException, ValueError) as e:
        with workout_cooldowns_lock:
            workout_cooldowns.pop(key, None)
        print(f"[ERROR] Could not verify {exercise} for {athlete_name}: {e}")

def open_camera():
    global camera_mode
    if camera_mode == "webcam":
        print(f"📷 [CAMERA] Initializing local Webcam (Index {WEBCAM_INDEX})...")
        cap = cv2.VideoCapture(WEBCAM_INDEX, cv2.CAP_DSHOW if sys.platform == 'win32' else cv2.CAP_ANY)
        # Higher resolution keeps distant faces and bodies detectable. The
        # camera falls back to its nearest supported size automatically.
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, WEBCAM_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, WEBCAM_HEIGHT)
        cap.set(cv2.CAP_PROP_FPS, 30)
        return cap
    elif camera_mode == "phone":
        print("Initializing phone RTSP stream...")
        cap = cv2.VideoCapture(PHONE_CAMERA_URL, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap
    elif camera_mode in CCTV_STREAM_URLS:
        print(f"Initializing low-latency {camera_mode.upper()} stream...")
        cap = cv2.VideoCapture(CCTV_STREAM_URLS[camera_mode], cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap
    raise ValueError(f"Camera source is not configured: {camera_mode}")

def publish_camera_placeholder(status_text):
    global current_raw_frame, current_frame_sequence, last_camera_placeholder
    if status_text == last_camera_placeholder:
        return
    with frame_lock:
        current_raw_frame = make_placeholder_frame(status_text)
        current_frame_sequence += 1
    last_camera_placeholder = status_text
    new_frame_event.set()

def camera_reader_thread():
    global current_raw_frame, current_frame_sequence, camera_mode, camera_status
    global last_camera_placeholder
    cap = open_camera()
    fail_count = 0
    active_mode = camera_mode
    frame_count = 0
    fps_window_started = time.monotonic()
    
    while True:
        # Check if user requested camera switch via API
        if active_mode != camera_mode:
            print(f"🔄 [CAMERA] Switching mode from {active_mode} to {camera_mode}...")
            if cap is not None:
                cap.release()
            cap = open_camera()
            active_mode = camera_mode
            fail_count = 0

        if cap is None or not cap.isOpened():
            fail_count += 1
            camera_status["connected"] = False
            publish_camera_placeholder("Connecting to camera stream...")
            time.sleep(1.0)
            if cap is not None:
                cap.release()
            cap = open_camera()
            continue

        # Zero-buffer grab & retrieve
        success = cap.grab()
        if success:
            success, frame = cap.retrieve()
            if success and frame is not None:
                # FIX #1: Write under lock, then signal stream_generator reactively
                with frame_lock:
                    current_raw_frame = frame
                    current_frame_sequence += 1
                last_camera_placeholder = None
                new_frame_event.set()
                fail_count = 0
                camera_status["connected"] = True
                camera_status["source"] = camera_mode
                frame_count += 1
                fps_window_elapsed = time.monotonic() - fps_window_started
                if fps_window_elapsed >= 1.0:
                    camera_status["fps"] = round(frame_count / fps_window_elapsed, 1)
                    frame_count = 0
                    fps_window_started = time.monotonic()
            else:
                fail_count += 1
        else:
            fail_count += 1

        if fail_count > 15:
            camera_status["connected"] = False
            publish_camera_placeholder("Stream disconnected. Reconnecting...")
            time.sleep(1.0)
            if cap is not None:
                cap.release()
            cap = open_camera()
            fail_count = 0

def encode_face(rgb_image, box, upscale=1.0):
    """encode_at() that waits on a helper process when the pool is running.

    Used for enrollment photos, so every encoding runs the same way (and in
    the same model instances) as live recognition.
    """
    pool = face_encoder_pool
    if pool is not None:
        region, location = face_region(rgb_image, box)
        if region is None:
            return None
        try:
            return pool.submit(region, location, upscale=upscale).result()
        except Exception as error:
            print(f"[FACE ENCODER] Helper failed ({error!r}); encoding in the engine instead.")
    return encode_at(rgb_image, box, upscale=upscale)


def apply_face_sample(track, encoding, is_far, db):
    """Count one face encoding as a vote for who this track is.

    A name is shown, and attendance logged, only once several samples agree.
    db is the face_db snapshot to match against.
    """
    known_matrix, known_ids, known_names, known_eligibility = db
    if len(known_ids) == 0:
        return
    vote = track['vote']
    distances = face_distances(known_matrix, encoding)
    threshold = FACE_FAR_THRESHOLD if is_far else FACE_MATCH_THRESHOLD
    sample_id, sample_distance, _ = best_member_match(
        distances, known_ids,
        threshold,
        FACE_MATCH_MARGIN,
    )
    # A stranger can come close to one enrolled view (usually a turned side
    # view); a real member matches several. Without this, one enrolled member
    # was given to an unregistered person (2026-11-20).
    if sample_id is not None and not views_agree(
        distances, known_ids, sample_id, threshold, FACE_MIN_AGREEING_VIEWS,
    ):
        sample_id = None
    # Hysteresis: keeping a name is easier than getting one. A face already
    # confirmed as a member (or reappearing where that member's face was just
    # lost) keeps them while they are still the closest member within the
    # looser FACE_KEEP_THRESHOLD, so turning the head does not drop the name.
    # Another member matching strictly still wins (see still_matches).
    keep_member = vote.confirmed if vote.confirmed is not None else track.get('reacquire_member')
    if sample_id is None and keep_member is not None and keep_member in known_ids and still_matches(
        distances, known_ids, keep_member, FACE_KEEP_THRESHOLD, threshold,
    ):
        sample_id = keep_member
        sample_distance = min(float(d) for m, d in zip(known_ids, distances) if m == keep_member)
    # Unmatched samples in a row: after UNKNOWN_BACKOFF_AFTER, a face that
    # was never identified is checked less often (CPU). Members who turned
    # away are not slowed down.
    if sample_id is not None:
        track['unmatched_samples'] = 0
    elif not track.get('ever_confirmed'):
        track['unmatched_samples'] = track.get('unmatched_samples', 0) + 1
    previously_confirmed = vote.confirmed
    newly_confirmed = vote.add(sample_id, weight=FACE_FAR_WEIGHT if is_far else 1.0)
    if vote.confirmed is not None:
        track['ever_confirmed'] = True
    elif previously_confirmed is not None:
        track['unmatched_samples'] = 0
    if vote.confirmed is not None and vote.confirmed not in known_ids:
        # Member was removed by a face reload while being tracked.
        vote.confirmed = None
        newly_confirmed = False

    if vote.confirmed is not None and sample_id == vote.confirmed:
        # How closely this face last matched its member (used when two faces
        # claim the same member: the closer match keeps the name).
        track['match_distance'] = sample_distance

    if vote.confirmed is not None:
        idx = known_ids.index(vote.confirmed)
        track['member_id'] = vote.confirmed
        track['name'] = known_names[idx]
        track['workout_eligible'] = known_eligibility[idx]
        # Expired members are still logged; the orange tag tells
        # staff to ask them to renew.
        track['needs_renewal'] = member_subscriptions.get(vote.confirmed) == 'expired'
        track['color'] = RENEW_COLOR if track['needs_renewal'] else (0, 255, 0)
        if newly_confirmed:
            track['attendance_pending'] = True
            track['pending_distance'] = sample_distance if sample_id == vote.confirmed else None
    else:
        track['member_id'] = None
        track['name'] = 'Unknown'
        track['workout_eligible'] = False
        track['needs_renewal'] = False
        track['attendance_pending'] = False
        track['color'] = (0, 0, 255)


# How far (in face widths) a new face may be from a confirmed face to take
# over its name. A head turn moves the face box a little; the person standing
# next to you is about 1.5 face widths away. With 2.0 for both, the
# neighbour's face took over a member's name whenever the member's face was
# missed for one frame, and both kept dropping to Unknown (2026-11-20).
HANDOVER_MAX_WIDTHS = 0.75   # from a face missed in this frame (head turn)
REACQUIRE_MAX_WIDTHS = 1.0   # from a face lost for longer (turned away, back)
HANDOVER_MAX_SIZE_RATIO = 1.6


def nearest_recently_lost(box, recently_lost):
    """The confirmed face (just missed, or recently lost) this new face continues.

    Each candidate may set 'max_widths'; the default is REACQUIRE_MAX_WIDTHS.
    Faces of very different size are not the same face.
    """
    top, right, bottom, left = box
    width = max(right - left, 1)
    center = ((left + right) / 2, (top + bottom) / 2)
    best, best_distance = None, None
    for lost in recently_lost:
        l_top, l_right, l_bottom, l_left = lost['box']
        l_width = max(l_right - l_left, 1)
        if max(width, l_width) / min(width, l_width) > HANDOVER_MAX_SIZE_RATIO:
            continue
        l_center = ((l_left + l_right) / 2, (l_top + l_bottom) / 2)
        distance = ((center[0] - l_center[0]) ** 2 + (center[1] - l_center[1]) ** 2) ** 0.5
        limit = lost.get('max_widths', REACQUIRE_MAX_WIDTHS) * max(width, l_width)
        if distance <= limit and (best_distance is None or distance < best_distance):
            best, best_distance = lost, distance
    return best


def unconfirmed_progress(track):
    """Votes and running encodings of a face not named yet; None if it has none.

    A face is often lost before it is named: the person turns away or walks
    behind someone for a second. Without this, the face found again started
    from zero votes, so in groups of 2-3 people some faces never collected
    enough agreeing samples to be named (2026-11-20). The face found again
    near the same spot continues from these instead; it still needs its own
    agreeing sample before a name is shown (the carried votes are below
    FACE_VOTES_REQUIRED, or the face would have been named already).
    """
    if track.get('member_id') is not None:
        return None
    history = list(track['vote'].history)
    if not any(member_id is not None for member_id, _ in history):
        return None
    return {'history': history, 'jobs': list(track['encoding_jobs'])}


def face_ai_worker():
    """Run the face loop and restart it after an unexpected error.

    Without this, one exception silently kills the thread and every face
    box and recognition stops while the rest of the engine keeps running.
    """
    import traceback
    while True:
        try:
            _face_ai_loop()
        except Exception:
            print("[ERROR] Face worker crashed; restarting in 1s:")
            traceback.print_exc()
            time.sleep(1.0)


def _face_ai_loop():
    global current_raw_frame, shared_faces, tracked_faces, next_track_id
    last_processed_sequence = -1
    # Created here because Face Mesh must be used from this thread only.
    face_mesh_eyes = FaceMeshEyes() if LIVENESS_REQUIRED else None
    # YuNet for the small-face sweep; own instance, used by this thread only.
    small_face_detector = make_small_face_detector()
    last_small_face_sweep = 0.0
    last_ai_frame = 0.0
    # Confirmed faces lost in the last REACQUIRE_SECONDS (see nearest_recently_lost).
    recently_lost_faces = []

    while True:
        # FIX #1: Read frame under lock to prevent partial reads
        with frame_lock:
            raw = current_raw_frame
            frame_sequence = current_frame_sequence
        if raw is None:
            time.sleep(0.05)
            continue
        if frame_sequence == last_processed_sequence:
            time.sleep(0.005)
            continue
        # At most AI_MAX_FPS frames per second; after waiting, take the
        # newest frame instead of an old one.
        since_last = time.monotonic() - last_ai_frame
        if since_last < 1.0 / AI_MAX_FPS:
            time.sleep(1.0 / AI_MAX_FPS - since_last)
            continue
        last_ai_frame = time.monotonic()
        last_processed_sequence = frame_sequence

        frame = raw.copy()
        h, w, _ = frame.shape
        # Full resolution up to DETECTION_MAX_WIDTH, so small faces keep their pixels.
        scan_frame = frame
        if w > DETECTION_MAX_WIDTH:
            scale = DETECTION_MAX_WIDTH / w
            scan_frame = cv2.resize(frame, (0, 0), fx=scale, fy=scale)

        # FIX #8: Sample every 4th pixel for brightness — 16x faster
        if scan_frame[::4, ::4].mean() < 70:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=20)

        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        face_results = face_detector.process(rgb_scan_frame)

        detected_boxes = []
        aligned_boxes = {}
        now = time.time()

        def add_detection(rel_xmin, rel_ymin, rel_width, rel_height):
            """Add a face given in full-frame relative coordinates."""
            xmin, ymin = int(rel_xmin * w), int(rel_ymin * h)
            box_w, box_h = int(rel_width * w), int(rel_height * h)
            # Asymmetric tight padding: more headroom above (forehead), minimal sides
            # to prevent neighbor face bleed-over when people stand close.
            pad_top = int(box_h * 0.15)
            pad_side = int(box_w * 0.08)
            pad_bot = int(box_h * 0.05)
            top, left = max(0, ymin - pad_top), max(0, xmin - pad_side)
            bottom, right = min(h, ymin + box_h + pad_bot), min(w, xmin + box_w + pad_side)
            if (bottom - top) > 25 and (right - left) > 25:
                box = (top, right, bottom, left)
                detected_boxes.append(box)
                # Same framing as enrollment, used only for encoding.
                aligned_boxes[box] = align_box(rel_xmin, rel_ymin, rel_width, rel_height, w, h)

        if face_results.detections:
            for detection in face_results.detections:
                bboxC = detection.location_data.relative_bounding_box
                add_detection(bboxC.xmin, bboxC.ymin, bboxC.width, bboxC.height)

        # Faces too small for the whole-frame detector: search each head
        # region found by the pose model (from the full-resolution frame).
        for region in list(shared_head_regions):
            r_top, r_right, r_bottom, r_left = region
            if r_bottom > h or r_right > w:
                continue  # stale region from a different camera resolution
            if any(
                r_left <= (box[1] + box[3]) // 2 <= r_right and r_top <= (box[0] + box[2]) // 2 <= r_bottom
                for box in detected_boxes
            ):
                continue  # this head already has a detected face
            crop = frame[r_top:r_bottom, r_left:r_right]
            if crop.size == 0:
                continue
            crop_h, crop_w = crop.shape[:2]
            head_results = head_face_detector.process(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            if not head_results.detections:
                continue
            best = max(head_results.detections, key=lambda d: d.score[0])
            bbox = best.location_data.relative_bounding_box
            add_detection(
                (r_left + bbox.xmin * crop_w) / w,
                (r_top + bbox.ymin * crop_h) / h,
                bbox.width * crop_w / w,
                bbox.height * crop_h / h,
            )

        # Small-face sweep (small_face_sweep.py): MediaPipe misses faces under
        # ~70 px, so every SMALL_FACE_SWEEP_SECONDS YuNet looks for them, but
        # only while a body is unidentified AND has no face found. A face that
        # is already found (even if unknown, e.g. staff) needs no search.
        unidentified_in_view = any(
            athlete.get('status') == IDENTIFYING and athlete.get('face_box') is None
            for athlete in shared_athletes
        )
        if small_face_detector is not None and sweep_due(now, last_small_face_sweep, unidentified_in_view):
            last_small_face_sweep = now
            try:
                for rel_xmin, rel_ymin, rel_width, rel_height in find_small_faces(small_face_detector, scan_frame):
                    center_x = (rel_xmin + rel_width / 2) * w
                    center_y = (rel_ymin + rel_height / 2) * h
                    if any(box[3] <= center_x <= box[1] and box[0] <= center_y <= box[2] for box in detected_boxes):
                        continue  # already found by MediaPipe or the head-region search
                    add_detection(rel_xmin, rel_ymin, rel_width, rel_height)
            except cv2.error as error:
                print(f"[FACE] Small-face search failed: {error}")

        # --- MULTI-PERSON TRACKING & ASSOCIATION ---
        updated_tracks = []
        unmatched_detections = list(detected_boxes)
        
        # 1. Match detected boxes to existing tracks by IOU or tight centroid proximity (< 45px)
        for track in tracked_faces:
            t_box = track['box']
            t_center_x = (t_box[1] + t_box[3]) // 2
            t_center_y = (t_box[0] + t_box[2]) // 2
            
            best_match_idx = -1
            best_score = -1.0
            
            for i, d_box in enumerate(unmatched_detections):
                iou = compute_iou(t_box, d_box)
                d_center_x = (d_box[1] + d_box[3]) // 2
                d_center_y = (d_box[0] + d_box[2]) // 2
                dist = ((t_center_x - d_center_x)**2 + (t_center_y - d_center_y)**2)**0.5
                
                # Match if overlapping IOU > 0.3 or moved within a tight threshold (< 45px)
                box_size = max(d_box[1] - d_box[3], d_box[2] - d_box[0])
                if iou > 0.30 or (dist < min(45, box_size * 0.5)):
                    score = iou if iou > 0 else 1.0 / (1.0 + dist)
                    if score > best_score:
                        best_score = score
                        best_match_idx = i
                        
            if best_match_idx != -1:
                matched_box = unmatched_detections.pop(best_match_idx)
                track['box'] = matched_box
                track['aligned_box'] = aligned_boxes[matched_box]
                track['last_seen'] = now
                updated_tracks.append(track)
            elif (now - track['last_seen']) < 1.0:
                # Keep active for 1 second if temporarily occluded
                updated_tracks.append(track)
            elif track.get('member_id') is not None:
                # Lost while confirmed (e.g. a full side view the detector
                # cannot see): remember where, to re-identify quickly.
                recently_lost_faces.append({
                    'member_id': track['member_id'],
                    'name': track['name'],
                    'workout_eligible': track.get('workout_eligible', False),
                    'box': track['box'],
                    'lost_at': now,
                })
            else:
                # Lost before being named: keep its votes so far (see
                # unconfirmed_progress) for the face found again nearby.
                progress = unconfirmed_progress(track)
                if progress is not None:
                    recently_lost_faces.append({
                        'member_id': None, 'box': track['box'], 'lost_at': now, 'progress': progress,
                    })
        recently_lost_faces[:] = [
            lost for lost in recently_lost_faces if now - lost['lost_at'] < REACQUIRE_SECONDS
        ]

        # Confirmed faces not seen in this frame. When a head turns, the face
        # box jumps (new size and position), so the face looks like a new one
        # while the old box lingers; a new face next to one of these takes over
        # its member (and the old box is removed), instead of "John, Unknown".
        handover_candidates = recently_lost_faces + [
            {
                'member_id': track['member_id'], 'name': track['name'],
                'workout_eligible': track.get('workout_eligible', False),
                'box': track['box'], 'track': track,
                'max_widths': HANDOVER_MAX_WIDTHS,
            }
            for track in updated_tracks
            if track['last_seen'] < now and track.get('member_id') is not None
        ]
        # Same for faces not named yet but with votes: the new face continues
        # their votes instead of both showing "Unknown" and starting over.
        for track in updated_tracks:
            if track['last_seen'] < now:
                progress = unconfirmed_progress(track)
                if progress is not None:
                    handover_candidates.append({
                        'member_id': None, 'box': track['box'], 'track': track,
                        'max_widths': HANDOVER_MAX_WIDTHS, 'progress': progress,
                    })

        # 2. Any unmatched detection becomes a distinct new track
        for new_box in unmatched_detections:
            new_track = {
                'id': next_track_id,
                'box': new_box,
                'aligned_box': aligned_boxes[new_box],
                'name': 'Unknown',
                'member_id': None,
                'workout_eligible': False,
                'color': (0, 0, 255),
                'last_seen': now,
                'last_recon': 0.0,
                'vote': IdentityVote(
                    window=FACE_VOTE_WINDOW,
                    required=FACE_VOTES_REQUIRED,
                ),
                'blink': BlinkDetector(),
                # Encodings a helper process is still working on.
                'encoding_jobs': [],
                'attendance_pending': False,
                'pending_distance': None,
            }
            # Reappearing where a confirmed member's face was just lost: start
            # with that member's earlier votes, so one agreeing check (strict,
            # or the looser keep limit) names them again.
            lost = nearest_recently_lost(new_box, handover_candidates)
            if lost is not None:
                handover_candidates.remove(lost)
                if 'track' in lost:
                    updated_tracks.remove(lost['track'])  # the same face, old box
                else:
                    recently_lost_faces.remove(lost)
            if lost is not None and lost['member_id'] is None:
                # Not named yet: continue its votes and running encodings.
                new_track['vote'].history.extend(lost['progress']['history'])
                new_track['encoding_jobs'].extend(lost['progress']['jobs'])
            elif lost is not None:
                new_track['reacquire_member'] = lost['member_id']
                new_track['ever_confirmed'] = True
                # Keep showing the name while the first check runs (same person,
                # same spot); that check confirms it or turns it to Unknown.
                # Attendance is only logged on a real confirmation.
                new_track.update({
                    'member_id': lost['member_id'], 'name': lost['name'],
                    'workout_eligible': lost['workout_eligible'], 'color': (0, 255, 0),
                })
                for _ in range(max(0, FACE_VOTES_REQUIRED - 1)):
                    new_track['vote'].history.append((lost['member_id'], 1.0))
            next_track_id += 1
            updated_tracks.append(new_track)
            
        # 3. Face recognition with multi-frame voting.
        # Unconfirmed tracks are sampled often; confirmed ones are re-verified
        # less often. A name is shown, and attendance logged, only once several
        # samples agree, so one bad frame cannot assign the wrong member.
        db = face_db
        known_ids = db[1]
        rgb_frame = None
        if face_mesh_eyes is not None:
            for track in updated_tracks:
                if (
                    track['last_seen'] == now
                    and not track['blink'].blinked
                    and face_box_size(track['aligned_box']) >= FACE_NEAR_SIZE
                ):
                    if rgb_frame is None:
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    try:
                        track['blink'].add(face_mesh_eyes.ear(rgb_frame, track['aligned_box']), now)
                    except Exception:
                        pass
        # Encodings requested on earlier frames that the helpers have finished.
        for track in updated_tracks:
            jobs = track['encoding_jobs']
            for job in [job for job in jobs if job['future'].done()]:
                jobs.remove(job)
                try:
                    encoding = job['future'].result()
                except Exception:
                    encoding = None
                if encoding is not None:
                    apply_face_sample(track, encoding, job['is_far'], db)

        # Request a new sample for each face that is due. The encoding runs
        # in a helper process, so this loop (and the camera and video feeds)
        # keep running while it works. Longest-waiting faces go first so one
        # face cannot keep the helpers to itself.
        pool = face_encoder_pool
        visible = [track for track in updated_tracks if track['last_seen'] == now]
        jobs_per_track = max(1, pool.size // max(1, len(visible))) if pool is not None else 1
        for track in sorted(visible, key=lambda track: track['last_recon']):
            if len(known_ids) == 0:
                break
            vote = track['vote']
            if vote.confirmed is not None:
                interval = RECOGNITION_INTERVAL_CONFIRMED
            elif track.get('unmatched_samples', 0) >= UNKNOWN_BACKOFF_AFTER:
                # Probably not a member (staff, a visitor): checking them every
                # 0.2 s forever kept the face helpers busy. Keep checking, slower.
                interval = RECOGNITION_INTERVAL_UNKNOWN
            else:
                interval = RECOGNITION_INTERVAL_UNCONFIRMED
            if (now - track['last_recon']) < interval:
                continue

            aligned = track['aligned_box']
            face_size = face_box_size(aligned)
            if face_size < FACE_MIN_SIZE:
                # Too small for a reliable descriptor: don't guess. A member
                # already confirmed on this track keeps their name.
                track['last_recon'] = now
                if vote.confirmed is None:
                    track['name'] = MOVE_CLOSER_LABEL
                    track['color'] = (0, 165, 255)
                continue

            if pool is not None and (
                len(track['encoding_jobs']) >= jobs_per_track or not pool.has_capacity()
            ):
                continue  # helpers are busy: try again on the next frame
            track['last_recon'] = now

            # Far tier: enlarge before encoding, stricter distance, and each
            # sample counts as only part of a vote.
            is_far = face_size < FACE_NEAR_SIZE
            upscale = FACE_FAR_UPSCALE if is_far else 1.0
            if rgb_frame is None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            try:
                if pool is not None:
                    region, location = face_region(rgb_frame, aligned)
                    if region is not None:
                        track['encoding_jobs'].append({
                            'future': pool.submit(region, location, upscale=upscale),
                            'is_far': is_far,
                        })
                    continue
                encoding = encode_at(rgb_frame, aligned, upscale=upscale)
            except Exception:
                encoding = None
            if encoding is not None:
                apply_face_sample(track, encoding, is_far, db)

        # Keep the renew flag current for faces already on screen (e.g. the
        # member renews at the desk while standing in view).
        for track in updated_tracks:
            if track.get('member_id') is not None:
                track['needs_renewal'] = member_subscriptions.get(track['member_id']) == 'expired'
                track['color'] = RENEW_COLOR if track['needs_renewal'] else (0, 255, 0)

        # One member, one face: if two faces in view are both confirmed as the
        # same member, the closer match keeps the name; the other goes back to
        # Unknown and starts over. Done before check-ins are sent, so the
        # wrong face cannot log attendance.
        face_losers = duplicate_identity_losers([
            (
                track['id'],
                track.get('member_id'),
                (track['last_seen'] == now, -track.get('match_distance', float('inf'))),
            )
            for track in updated_tracks
            if now - track['last_seen'] < 1.0
        ])
        for track in updated_tracks:
            if track['id'] in face_losers:
                track['vote'] = IdentityVote(window=FACE_VOTE_WINDOW, required=FACE_VOTES_REQUIRED)
                track.update({
                    'member_id': None, 'name': 'Unknown', 'workout_eligible': False,
                    'needs_renewal': False, 'attendance_pending': False, 'color': (0, 0, 255),
                })
                track.pop('match_distance', None)

        # Send each confirmed member's check-in once. With the blink check
        # on, it waits until this face has blinked.
        for track in updated_tracks:
            track['awaiting_blink'] = False
            if not track.get('attendance_pending') or track.get('member_id') is None:
                continue
            if LIVENESS_REQUIRED and not track['blink'].blinked:
                track['awaiting_blink'] = True
                track['color'] = BLINK_COLOR
                continue
            track['attendance_pending'] = False
            threading.Thread(
                target=log_attendance_to_laravel,
                args=(track['member_id'], track['name'], track.get('pending_distance')),
                daemon=True,
            ).start()

        tracked_faces = updated_tracks
        # Update shared_faces for Security Monitor HUD and skeleton binding
        shared_faces = [
            {
                'id': t['id'],
                'box': t['box'],
                'name': t['name'],
                # Text drawn on the Security Monitor; 'name' stays the plain
                # member name for attendance and the Gesture Monitor.
                'label': t['name']
                + (
                    (" - BLINK" if face_box_size(t['aligned_box']) >= FACE_NEAR_SIZE else " - COME CLOSER")
                    if t.get('awaiting_blink') else ""
                )
                + (" - RENEW" if t.get('needs_renewal') else ""),
                'member_id': t.get('member_id'),
                'workout_eligible': t.get('workout_eligible', False),
                'color': t['color'],
            }
            for t in tracked_faces
            if (now - t['last_seen']) < 0.5
        ]
        # FIX #11: Reduced from 0.04 → 0.02s. Face encoding itself takes >40ms so
        # the old sleep was additive. Let throughput pace naturally at lower latency.
        time.sleep(0.02)

def refresh_workout_plans():
    global workout_plans, ambiguous_workout_plans, workout_targets
    try:
        response = requests.get(f"{LARAVEL_API}/ai/workout-plans", headers=LARAVEL_HEADERS, timeout=5)
        response.raise_for_status()
        tasks = response.json()
        if not isinstance(tasks, list):
            raise ValueError("Workout plan endpoint returned an unexpected response.")

        classes_by_key = {
            ''.join(character for character in str(label).upper() if character.isalnum()): str(label).upper()
            for label in (ml_classes if ml_classes is not None else [])
        }
        refreshed_counts = collections.defaultdict(collections.Counter)
        refreshed_targets = collections.defaultdict(dict)
        for task in tasks:
            member_id = task.get('member_id')
            assigned_class = task.get('gesture_class') or task.get('exercise', '')
            assigned_class = str(assigned_class).replace('ASSIGNED:', '').strip()
            class_key = ''.join(character for character in assigned_class.upper() if character.isalnum())
            model_class = classes_by_key.get(class_key)
            if member_id is not None and model_class:
                refreshed_counts[str(member_id)][model_class] += 1
                # The task's target, and reps already counted (e.g. before
                # an engine restart), so counting resumes where it stopped.
                refreshed_targets[str(member_id)].setdefault(model_class, {
                    'id': task.get('id'),
                    'sets': task.get('sets'),
                    'reps': task.get('reps'),
                    'counted': int(task.get('counted_reps') or 0),
                })

        with workout_plans_lock:
            workout_plans = {
                member_id: set(class_counts)
                for member_id, class_counts in refreshed_counts.items()
            }
            ambiguous_workout_plans = {
                member_id: {
                    model_class
                    for model_class, count in class_counts.items()
                    if count > 1
                }
                for member_id, class_counts in refreshed_counts.items()
            }
            workout_targets = dict(refreshed_targets)
        print(f"[SYNC] Loaded today's workout targets for {len(workout_plans)} member(s).")
    except (requests.RequestException, ValueError) as e:
        print(f"[ERROR] Could not refresh assigned workout targets: {e}")

def refresh_member_subscriptions():
    """Re-read each member's subscription status (no face re-encoding)."""
    global member_subscriptions
    try:
        response = requests.get(f"{LARAVEL_API}/ai/members-faces", headers=LARAVEL_HEADERS, timeout=5)
        response.raise_for_status()
        members = response.json()
        if isinstance(members, list):
            member_subscriptions = {
                member['id']: member.get('subscription_status') for member in members
            }
            if loaded_faces_signature is not None and faces_signature(members) != loaded_faces_signature:
                print("[SYNC] Member list changed in Laravel; reloading faces...")
                threading.Thread(target=load_registered_faces, daemon=True).start()
    except (requests.RequestException, ValueError, KeyError, TypeError):
        pass  # keep the last known statuses; retried on the next cycle


def workout_plan_worker():
    last_subscription_refresh = time.monotonic()
    while True:
        refresh_workout_plans()
        if time.monotonic() - last_subscription_refresh >= SUBSCRIPTION_REFRESH_SECONDS:
            refresh_member_subscriptions()
            last_subscription_refresh = time.monotonic()
        time.sleep(15)

def pose_bounding_box(landmarks, frame_width, frame_height):
    visible_points = [
        landmark
        for landmark in landmarks
        if (
            getattr(landmark, 'visibility', None) is None
            or landmark.visibility >= 0.2
        )
        and landmark.x is not None
        and landmark.y is not None
        and -0.1 <= landmark.x <= 1.1
        and -0.1 <= landmark.y <= 1.1
    ]
    if not visible_points:
        return None

    x_values = [landmark.x * frame_width for landmark in visible_points]
    y_values = [landmark.y * frame_height for landmark in visible_points]
    padding = 20
    left = max(0, int(min(x_values)) - padding)
    top = max(0, int(min(y_values)) - padding)
    right = min(frame_width, int(max(x_values)) + padding)
    bottom = min(frame_height, int(max(y_values)) + padding)
    return (top, right, bottom, left)

def associate_poses_with_people(pose_landmarks, faces, frame_width, frame_height, now, frame=None):
    global pose_tracks, next_pose_track_id
    pose_boxes = [pose_bounding_box(points, frame_width, frame_height) for points in pose_landmarks]
    overlapping = [
        box is not None and any(
            other is not None and other_index != index and boxes_overlap(box, other)
            for other_index, other in enumerate(pose_boxes)
        )
        for index, box in enumerate(pose_boxes)
    ]
    face_candidates = []

    for pose_index, landmarks in enumerate(pose_landmarks):
        if not landmarks or pose_boxes[pose_index] is None:
            continue
        pose_top, pose_right, pose_bottom, pose_left = pose_boxes[pose_index]
        pose_width = pose_right - pose_left
        pose_height = pose_bottom - pose_top
        head_left = pose_left - pose_width * 0.1
        head_right = pose_right + pose_width * 0.1
        head_top = pose_top - pose_height * 0.15
        head_bottom = pose_top + pose_height * 0.45
        nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
        nose_x = int(nose.x * frame_width) if nose.x is not None else None
        nose_y = int(nose.y * frame_height) if nose.y is not None else None
        for face in faces:
            top, right, bottom, left = face['box']
            face_width = right - left
            center_x, center_y = (left + right) // 2, (top + bottom) // 2
            if face_width <= 0:
                continue

            center_in_head_region = (
                head_left <= center_x <= head_right
                and head_top <= center_y <= head_bottom
            )
            if not center_in_head_region and (nose_x is None or nose_y is None):
                continue

            nose_distance = (
                ((center_x - nose_x) ** 2 + (center_y - nose_y) ** 2) ** 0.5
                if nose_x is not None and nose_y is not None
                else float('inf')
            )
            if center_in_head_region or nose_distance < face_width * 1.6:
                normalized_distance = nose_distance / face_width
                priority = 0 if center_in_head_region else 1
                face_candidates.append(((priority, normalized_distance), pose_index, face))

    matched_poses = {}
    claimed_poses = set()
    claimed_faces = set()
    for _, pose_index, face in sorted(face_candidates, key=lambda candidate: candidate[0]):
        if pose_index in claimed_poses or face['id'] in claimed_faces:
            continue
        matched_poses[pose_index] = face
        claimed_poses.add(pose_index)
        claimed_faces.add(face['id'])

    available_tracks = [track for track in pose_tracks if now - track['last_seen'] < 2.0]
    updated_tracks = []
    results = []
    for pose_index, landmarks in enumerate(pose_landmarks):
        box = pose_boxes[pose_index]
        if box is None:
            continue

        face = matched_poses.get(pose_index)
        best_track_index = None
        best_score = 0.0
        top, right, bottom, left = box
        center_x, center_y = (left + right) // 2, (top + bottom) // 2
        box_width = right - left
        recognized_member_id = face.get('member_id') if face else None
        for track_index, track in enumerate(available_tracks):
            if (
                recognized_member_id is not None
                and track.get('member_id') is not None
                and track['member_id'] != recognized_member_id
            ):
                continue
            old_box = track['box']
            old_center_x = (old_box[1] + old_box[3]) // 2
            old_center_y = (old_box[0] + old_box[2]) // 2
            distance = ((center_x - old_center_x) ** 2 + (center_y - old_center_y) ** 2) ** 0.5
            iou = compute_iou(box, old_box)
            if iou > 0.1 or distance < max(45, box_width * 0.25):
                score = iou if iou > 0.1 else 1.0 / (1.0 + distance)
                if recognized_member_id is not None and track.get('member_id') == recognized_member_id:
                    score += 2.0
                if score > best_score:
                    best_score = score
                    best_track_index = track_index

        if best_track_index is None:
            track = {
                'id': next_pose_track_id,
                'box': box,
                'last_seen': now,
                'name': 'Unknown',
                'member_id': None,
                'workout_eligible': False,
            }
            next_pose_track_id += 1
        else:
            track = available_tracks.pop(best_track_index)
            track['box'] = box
            track['last_seen'] = now

        appearance = torso_histogram(frame, landmarks) if frame is not None else None
        name, member_id, workout_eligible = update_pose_track_identity(
            track, face, now, appearance=appearance, overlapped=overlapping[pose_index]
        )
        updated_tracks.append(track)
        actor_id = f"pose:{track['id']}"
        face_box = face['box'] if face else None

        results.append({
            'actor_id': actor_id,
            'landmarks': landmarks,
            'box': box,
            'face_box': face_box,
            'head_region': head_region(landmarks, frame_width, frame_height),
            'name': name,
            'member_id': member_id,
            'workout_eligible': workout_eligible,
        })
        # The member whose face is on this body right now (strongest evidence).
        track['face_member_now'] = face.get('member_id') if face else None

    # One member, one body: if a name is on several bodies (one kept it from
    # memory while the member's face appears on another), keep it only on the
    # body with the face seen right now, else the most recently confirmed.
    # Bodies briefly out of view count too, so a stale name cannot come back.
    all_tracks = updated_tracks + available_tracks
    visible_ids = {track['id'] for track in updated_tracks}
    losers = duplicate_identity_losers([
        (
            track['id'],
            track.get('member_id'),
            (
                track['id'] in visible_ids and track.get('face_member_now') == track.get('member_id'),
                track.get('identity_seen', float('-inf')),
            ),
        )
        for track in all_tracks
    ])
    for track in all_tracks:
        if track['id'] in losers:
            clear_pose_identity(track)
    for track, result in zip(updated_tracks, results):
        if track['id'] in losers:
            result.update({'name': 'Unknown', 'member_id': None, 'workout_eligible': False})

    pose_tracks = all_tracks
    return results

def gesture_ai_worker():
    global current_raw_frame, shared_athletes, shared_head_regions
    infer_counter = 0
    last_processed_sequence = -1
    last_ai_frame = 0.0

    while True:
        with frame_lock:
            raw = current_raw_frame
            frame_sequence = current_frame_sequence
        if raw is None:
            time.sleep(0.01)
            continue
        if frame_sequence == last_processed_sequence:
            time.sleep(0.005)
            continue
        # At most AI_MAX_FPS skeleton detections per second (the heaviest
        # model); after waiting, take the newest frame.
        since_last = time.monotonic() - last_ai_frame
        if since_last < 1.0 / AI_MAX_FPS:
            time.sleep(1.0 / AI_MAX_FPS - since_last)
            continue
        last_ai_frame = time.monotonic()
        last_processed_sequence = frame_sequence

        frame = raw.copy()
        height, width = frame.shape[:2]
        # Full resolution up to DETECTION_MAX_WIDTH: the pose landmark model
        # crops each person from this image, so distant bodies keep detail.
        scan_frame = frame
        if width > DETECTION_MAX_WIDTH:
            scale = DETECTION_MAX_WIDTH / width
            scan_frame = cv2.resize(frame, (0, 0), fx=scale, fy=scale)
        if scan_frame[::4, ::4].mean() < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
        rgb_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = pose_landmarker.detect_for_video(image, int(time.monotonic() * 1000))
        poses = associate_poses_with_people(
            result.pose_landmarks,
            shared_faces.copy(),
            width,
            height,
            time.monotonic(),
            frame=frame,
        )
        # Let the face worker look for small faces in each body's head region
        # (names unknown bodies, and keeps re-confirming named ones).
        shared_head_regions = [
            person['head_region'] for person in poses if person['head_region'] is not None
        ]
        infer_counter += 1

        with workout_plans_lock:
            current_plans = {member_id: set(exercises) for member_id, exercises in workout_plans.items()}
            current_ambiguities = {
                member_id: set(exercises)
                for member_id, exercises in ambiguous_workout_plans.items()
            }
            current_targets = {member_id: dict(targets) for member_id, targets in workout_targets.items()}

        athletes = []
        frame_time = time.monotonic()
        aspect = width / height
        for person in poses:
            member_id = person['member_id']
            workout_eligible = person.get('workout_eligible', False)

            # Smoothed landmarks (One Euro filter) and movement history for
            # every tracked body, kept while the face is still being
            # identified, so exercise checks can start from it at once.
            pose_state = actor_pose_state.setdefault(person['actor_id'], {
                'smoother': LandmarkSmoother(),
                'motion': MotionTracker(),
                'history': collections.deque(),
            })
            pose_state['last_seen'] = frame_time
            points = pose_state['smoother'](landmarks_array(person['landmarks']), frame_time)
            pose_state['motion'].add(points, frame_time)
            history = pose_state['history']
            history.append((frame_time, points))
            while history and frame_time - history[0][0] > PRE_ID_HISTORY_SECONDS:
                history.popleft()

            # Only members with an active coach membership are monitored.
            status = monitoring_status(member_id, workout_eligible)
            person['status'] = status
            if status in (EXCLUDED, IDENTIFYING):
                # Not monitored: no skeleton, exercise check or workout log.
                # Only a small tag is drawn, so staff can tell "recognized,
                # but not on a coach plan" from "not recognized yet".
                workout_states.pop(person['actor_id'], None)
                athletes.append(person)
                continue

            expected = current_plans.get(str(member_id), set())
            ambiguous = current_ambiguities.get(str(member_id), set())
            if person['actor_id'] not in workout_states:
                # Just identified: start from what the body did while the
                # face was being recognised instead of from nothing.
                workout_states[person['actor_id']] = {
                    'buffer': collections.deque(maxlen=7),
                    'exercise': 'SCANNING',
                    'confidence': 0.0,
                    'motion': pose_state['motion'],
                    'seed': list(history)[:-1],
                }
            state = workout_states[person['actor_id']]
            state['last_seen'] = time.monotonic()
            target_signature = tuple(sorted(expected))
            if state.get('target_signature') != target_signature:
                state['buffer'].clear()
                state['exercise'] = 'SCANNING'
                state['confidence'] = 0.0
                state['target_signature'] = target_signature
                # The plan changed (a task was verified or reassigned):
                # start any repetition count afresh for the new task.
                for key in ('counting_for', 'counter', 'counter_active', 'reps_done'):
                    state.pop(key, None)

            def gate(label, hint=None):
                # Not checkable right now: show why, and require fresh
                # stable predictions once the person can be checked again.
                state['buffer'].clear()
                state['exercise'] = label
                state['confidence'] = 0.0
                state['hint'] = hint

            def classify(sample_points):
                # Rescale the body to the training data's size so near and
                # far members look the same to the model, then add one
                # prediction to the stability buffer.
                pose_array = scaled_model_input(sample_points, TRAIN_TORSO)
                if pose_array is None:
                    return
                probabilities = ml_model.predict_proba(pose_array)[0]
                prediction, confidence = select_assigned_prediction(probabilities, ml_classes, expected)
                state['buffer'].append((prediction, confidence))
                state['exercise'] = collections.Counter(
                    label for label, _ in state['buffer']
                ).most_common(1)[0][0]
                matching_confidences = [
                    score for label, score in state['buffer'] if label == state['exercise']
                ]
                state['confidence'] = sum(matching_confidences) / len(matching_confidences)
                state['hint'] = None

            motion = state['motion'].motion()
            checks_static = bool(expected & STATIC_EXERCISES)
            moving_enough = checks_static or motion is None or motion >= MOTION_MIN

            # First frame after identification: classify the recent history
            # (every 3rd frame, like the live loop), so a member who was
            # already exercising can be verified at once.
            seed = state.pop('seed', None)
            if seed and expected and ml_model is not None and moving_enough:
                state['replay'] = seed
                try:
                    for _, seed_points in seed[::-3][:SEED_PREDICTIONS][::-1]:
                        if any(joints_visible_for(exercise, seed_points) for exercise in expected):
                            classify(seed_points)
                except (ValueError, RuntimeError) as e:
                    print(f"[ERROR] Could not classify pose history for {person['name']}: {e}")

            if not expected:
                gate('NO PLAN TODAY')
            elif ml_model is not None and infer_counter % 3 == 0:
                if not any(joints_visible_for(exercise, points) for exercise in expected):
                    hidden = hidden_body_parts(expected, points)
                    gate('BODY NOT FULLY VISIBLE',
                         f"{' AND '.join(hidden).upper()} NOT VISIBLE - STEP INTO VIEW" if hidden else None)
                elif not moving_enough:
                    gate('NOT MOVING', f"NOT MOVING - START YOUR {'/'.join(sorted(expected))}")
                else:
                    try:
                        classify(points)
                    except (ValueError, RuntimeError) as e:
                        print(f"[ERROR] Could not classify pose for {person['name']}: {e}")
                        gate('SCANNING')

            exercise = state['exercise']
            confidence = state['confidence']
            stable_predictions = sum(label == exercise for label, _ in state['buffer'])
            stable_target_match = (
                exercise in expected
                and confidence >= WORKOUT_CONFIDENCE_THRESHOLD
                and state['buffer'][-1][0] == exercise
                and state['buffer'][-1][1] >= WORKOUT_CONFIDENCE_THRESHOLD
                and stable_predictions >= 5
            )
            requires_confirmation = stable_target_match and exercise in ambiguous
            target_match = stable_target_match and exercise not in ambiguous
            person.update({
                'exercise': exercise,
                'confidence': confidence,
                'expected': sorted(expected),
                'target_match': target_match,
                'requires_confirmation': requires_confirmation,
                # For the on-screen reason/progress (draw_athlete_overlay).
                'stable_predictions': stable_predictions,
                'hint': state.get('hint'),
            })

            # Repetition counting (rep_counter.py) for the selected
            # exercises. Once the camera has confirmed the assigned exercise,
            # every full bend-and-straighten of the joint is counted, and the
            # task is verified only when the target (sets x reps) is reached.
            # Other exercises are verified as soon as they are recognized.
            target = current_targets.get(str(member_id), {}).get(exercise)
            target_total = (
                int(target['sets']) * int(target['reps'])
                if target and target.get('sets') and target.get('reps') else None
            )
            counting = (
                exercise in expected
                and exercise in COUNTED_EXERCISES
                and exercise not in ambiguous
                and target_total is not None
            )
            if counting:
                rep_key = (member_id, exercise)
                if state.get('counting_for') != exercise:
                    saved = int(target.get('counted') or 0)  # already saved in Laravel
                    state['counting_for'] = exercise
                    state['counter'] = RepCounter(exercise, start=max(saved, member_rep_counts.get(rep_key, 0)))
                    # A member already confirmed on this exercise today (count
                    # in memory or saved) resumes at once; a new one must first
                    # be recognized doing the exercise.
                    state['counter_active'] = rep_key in member_rep_counts or saved > 0
                    state['reps_reported'] = saved
                    state['reps_reported_at'] = 0.0
                    state['reps_done'] = state['counter'].count >= target_total
                    state['rep_target'] = (target_total, int(target['sets']), int(target['reps']))
                if not state['counter_active']:
                    # Until the exercise is confirmed, keep the recent frames
                    # (including those from before identification), so the
                    # repetitions already done are counted once it is.
                    pending = state.setdefault('replay', [])
                    pending.append((frame_time, points))
                    while pending and frame_time - pending[0][0] > REPLAY_MAX_SECONDS:
                        pending.pop(0)
                if target_match and not state['counter_active']:
                    state['counter_active'] = True
                    if not state['reps_done']:
                        for replay_time, replay_points in state.pop('replay', []):
                            state['counter'].update(replay_points, replay_time, aspect=aspect)
                elif state['counter_active'] and not state['reps_done']:
                    state['counter'].update(points, frame_time, aspect=aspect)
                if state['counter_active']:
                    state.pop('replay', None)

                counted = state['counter'].count
                member_rep_counts[rep_key] = counted
                now_monotonic = time.monotonic()
                if counted >= target_total and not state['reps_done']:
                    state['reps_done'] = True
                    state['reps_reported'] = counted
                    member_rep_counts.pop(rep_key, None)
                    cooldown_key = f"{person['member_id']}_{exercise}"
                    with workout_cooldowns_lock:
                        should_submit = time.time() - workout_cooldowns.get(cooldown_key, 0) >= 20
                        if should_submit:
                            workout_cooldowns[cooldown_key] = time.time()
                    if should_submit:
                        threading.Thread(
                            target=log_workout_to_laravel,
                            args=(person['member_id'], person['name'], exercise, counted, True),
                            daemon=True,
                        ).start()
                elif (
                    counted > state['reps_reported']
                    and now_monotonic - state['reps_reported_at'] >= REP_PROGRESS_SECONDS
                ):
                    state['reps_reported'] = counted
                    state['reps_reported_at'] = now_monotonic
                    threading.Thread(
                        target=log_workout_to_laravel,
                        args=(person['member_id'], person['name'], exercise, counted, False),
                        daemon=True,
                    ).start()
            elif target_match:
                cooldown_key = f"{person['member_id']}_{exercise}"
                with workout_cooldowns_lock:
                    should_submit = time.time() - workout_cooldowns.get(cooldown_key, 0) >= 20
                    if should_submit:
                        workout_cooldowns[cooldown_key] = time.time()
                if should_submit:
                    threading.Thread(
                        target=log_workout_to_laravel,
                        args=(person['member_id'], person['name'], exercise),
                        daemon=True,
                    ).start()

            # Keep showing the count while the label flickers (e.g. "NOT
            # MOVING" between sets), as long as the task is still assigned.
            if state.get('counter') is not None and state.get('counting_for') in expected:
                total, sets_target, reps_per_set = state['rep_target']
                person.update({
                    'reps': state['counter'].count,
                    'reps_target': total,
                    'sets_target': sets_target,
                    'reps_per_set': reps_per_set,
                    'reps_done': state.get('reps_done', False),
                    'counting_exercise': state['counting_for'],
                })
            athletes.append(person)

        shared_athletes = athletes
        stale_actors = [
            actor_id
            for actor_id, state in workout_states.items()
            if time.monotonic() - state.get('last_seen', 0.0) > 1.0
        ]
        for actor_id in stale_actors:
            workout_states.pop(actor_id, None)
        # Pose tracks themselves expire after 2 s out of view.
        for actor_id in [
            actor_id for actor_id, pose_state in actor_pose_state.items()
            if frame_time - pose_state.get('last_seen', 0.0) > 2.0
        ]:
            actor_pose_state.pop(actor_id, None)

        time.sleep(0.015)

def draw_status_tag(frame, athlete, label):
    """Small grey tag above a body that is tracked but not monitored."""
    top, right, bottom, left = athlete['box']
    font, scale, thickness = cv2.FONT_HERSHEY_DUPLEX, 0.42, 1
    (text_w, text_h), _ = cv2.getTextSize(label, font, scale, thickness)
    x = max(0, min((left + right) // 2 - text_w // 2 - 5, frame.shape[1] - text_w - 10))
    y = max(0, top - text_h - 10)
    cv2.rectangle(frame, (x, y), (x + text_w + 10, y + text_h + 8), (90, 90, 90), cv2.FILLED)
    cv2.putText(frame, label, (x + 5, y + text_h + 3), font, scale, (235, 235, 235), thickness)


def draw_athlete_overlay(frame, athlete):
    if athlete.get('status') == IDENTIFYING:
        # Face not recognized yet: say what would help.
        if athlete.get('face_box') is None:
            label = "Identifying... face the camera"
        elif athlete.get('name') == MOVE_CLOSER_LABEL:
            label = "Move closer to be identified"
        else:
            label = "Identifying..."
        draw_status_tag(frame, athlete, label)
        return
    if athlete.get('status') == EXCLUDED:
        # Recognized, but only with-coach members are monitored here.
        draw_status_tag(frame, athlete, f"{athlete['name']} - no coach plan")
        return
    height, width = frame.shape[:2]
    landmarks = athlete['landmarks']
    landmark_list = landmark_pb2.NormalizedLandmarkList(
        landmark=[
            landmark_pb2.NormalizedLandmark(
                x=point.x if point.x is not None else 0.0,
                y=point.y if point.y is not None else 0.0,
                z=point.z if point.z is not None else 0.0,
                visibility=point.visibility if point.visibility is not None else 0.0,
            )
            for point in landmarks
        ]
    )
    landmark_style = mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=3)
    connection_style = mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2)
    mp_drawing.draw_landmarks(
        frame,
        landmark_list,
        mp_pose.POSE_CONNECTIONS,
        landmark_drawing_spec=landmark_style,
        connection_drawing_spec=connection_style,
    )

    top, right, bottom, left = athlete['box']
    cv2.rectangle(frame, (left, top), (right, bottom), (255, 0, 255), 2)

    face_box = athlete['face_box']
    if face_box is not None:
        face_top, face_right, face_bottom, face_left = face_box
        cv2.rectangle(frame, (face_left, face_top), (face_right, face_bottom), (0, 255, 0), 2)

    if athlete['expected']:
        if athlete['requires_confirmation']:
            exercise_label = "COACH VERIFY: " + athlete['exercise']
        elif athlete['exercise'] == 'SCANNING':
            exercise_label = "SCANNING TARGET: " + "/".join(athlete['expected'])
        elif athlete['exercise'] == 'WAITING':
            exercise_label = "WAITING FOR: " + "/".join(athlete['expected'])
        elif athlete['exercise'] in ('NOT MOVING', 'BODY NOT FULLY VISIBLE'):
            # Say exactly why it is not counting (e.g. "LEGS AND FEET NOT
            # VISIBLE - STEP INTO VIEW").
            exercise_label = athlete.get('hint') or f"{athlete['exercise']} ({'/'.join(athlete['expected'])})"
        elif athlete['target_match']:
            exercise_label = f"MATCH: {athlete['exercise']} ({int(athlete['confidence'] * 100)}%)"
        else:
            # Progress towards verification: 5 agreeing checks are needed.
            exercise_label = (
                f"CHECKING {athlete['exercise']}: {min(5, athlete.get('stable_predictions', 0))}/5"
                f" ({int(athlete['confidence'] * 100)}%)"
            )
    else:
        exercise_label = athlete['exercise']

    caption_lines = [f"EXERCISE: {exercise_label}", f"NAME: {athlete['name']}"]
    line_colors = [
        (0, 190, 255) if athlete['requires_confirmation']
        else (100, 255, 100) if athlete['target_match'] else (255, 255, 255),
        (255, 255, 255),
    ]
    if athlete.get('reps_target'):
        # Live repetition count for the selected exercises.
        reps, total = athlete['reps'], athlete['reps_target']
        if athlete.get('reps_done'):
            caption_lines.append(f"{athlete['counting_exercise']} DONE: {reps} / {total} REPS")
            line_colors.append((100, 255, 100))
        else:
            current_set = min(athlete['sets_target'], reps // athlete['reps_per_set'] + 1)
            caption_lines.append(
                f"{athlete['counting_exercise']} REPS: {reps} / {total}  (SET {current_set} OF {athlete['sets_target']})"
            )
            line_colors.append((0, 215, 255))
    caption_font = cv2.FONT_HERSHEY_DUPLEX
    caption_scale = 0.45
    caption_thickness = 1
    line_height = 19
    caption_width = max(
        cv2.getTextSize(line, caption_font, caption_scale, caption_thickness)[0][0]
        for line in caption_lines
    ) + 12
    caption_height = line_height * len(caption_lines) + 8
    caption_x = min(max(0, left), max(0, width - caption_width))
    caption_y = top - caption_height if top >= caption_height else min(height - caption_height, bottom + 2)
    cv2.rectangle(
        frame,
        (caption_x, caption_y),
        (min(width, caption_x + caption_width), min(height, caption_y + caption_height)),
        (24, 25, 33),
        cv2.FILLED,
    )
    for index, (line, color) in enumerate(zip(caption_lines, line_colors)):
        cv2.putText(
            frame,
            line,
            (caption_x + 6, caption_y + 17 + line_height * index),
            caption_font,
            caption_scale,
            color,
            caption_thickness,
        )

def _scale_box(box, scale):
    """Scale a (top, right, bottom, left) pixel box; None stays None."""
    if box is None or scale == 1.0:
        return box
    return tuple(int(value * scale) for value in box)


def _stream_frame(raw, scale):
    """A drawable copy of the camera frame at the feed's output size."""
    if scale == 1.0:
        return raw.copy()
    height, width = raw.shape[:2]
    return cv2.resize(raw, (max(1, int(width * scale)), max(1, int(height * scale))))


def video_stream_worker():
    while True:
        # Woken by every new camera frame (and by a new viewer). There is no
        # fixed sleep: a frame is drawn and encoded as soon as it arrives, so
        # the feed adds no delay of its own. The timeout is a safety net.
        new_frame_event.wait(timeout=0.5)
        new_frame_event.clear()
        with frame_lock:
            raw = current_raw_frame
            frame_sequence = current_frame_sequence
        if raw is None:
            continue
        with feed_condition:
            # Only feeds that someone is watching are drawn and encoded.
            pending = [
                feed for feed, state in feed_state.items()
                if state['viewers'] > 0 and state['source_sequence'] != frame_sequence
            ]
        if not pending:
            continue

        width = raw.shape[1]
        scale = min(1.0, STREAM_MAX_WIDTH / width)
        encoded = {}

        if 'sec' in pending:
            # Attendance Monitor: face boxes and names.
            sec_frame = _stream_frame(raw, scale)
            for face in shared_faces.copy():
                top, right, bottom, left = _scale_box(face['box'], scale)
                name, color = face.get('label', face['name']), face['color']
                cv2.rectangle(sec_frame, (left, top), (right, bottom), color, 3)
                cv2.rectangle(sec_frame, (left, max(0, top - 35)), (right, top), color, cv2.FILLED)
                cv2.putText(sec_frame, name, (left + 6, max(20, top - 10)), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
            ok, buffer = cv2.imencode('.jpg', sec_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ok:
                encoded['sec'] = buffer.tobytes()

        if 'gest' in pending:
            # Gesture Monitor: identity and pose overlay per person.
            gest_frame = _stream_frame(raw, scale)
            for athlete in shared_athletes.copy():
                draw_athlete_overlay(gest_frame, {
                    **athlete,
                    'box': _scale_box(athlete['box'], scale),
                    'face_box': _scale_box(athlete.get('face_box'), scale),
                })
            ok, buffer = cv2.imencode('.jpg', gest_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ok:
                encoded['gest'] = buffer.tobytes()

        with feed_condition:
            for feed, jpeg in encoded.items():
                state = feed_state[feed]
                state['source_sequence'] = frame_sequence
                state['sequence'] += 1
                state['jpeg'] = jpeg
            feed_condition.notify_all()


_workers_started = False
_workers_lock = threading.Lock()


def warm_up_face_model():
    """Run one blank request through every encoder helper at startup.

    Makes sure each helper process is up and has its face model loaded
    before the first member walks in, instead of on their face. One request
    per helper, sent together so each helper gets one.
    """
    started = time.perf_counter()
    blank = np.full((64, 64, 3), 128, np.uint8)
    pool = face_encoder_pool
    try:
        if pool is not None:
            jobs = [pool.submit(blank, (16, 48, 48, 16)) for _ in range(pool.size)]
            for job in jobs:
                job.result()
        print(f"[FACE] Face model loaded ({time.perf_counter() - started:.1f} s).")
    except Exception as error:
        print(f"[FACE] Could not pre-load the face model ({error}); it will load on the first face.")


def start_background_workers():
    """Sync faces from Laravel and start the camera/AI threads (once).

    Called from main.py (or __main__) so that merely importing this module,
    e.g. from tests or scripts, does not open cameras or start threads.
    """
    global _workers_started, face_encoder_pool
    with _workers_lock:
        if _workers_started:
            return
        _workers_started = True

    if FACE_ENCODER_PROCESSES > 0:
        pool = FaceEncoderPool(FACE_ENCODER_PROCESSES)
        if pool.start():
            face_encoder_pool = pool
            print(f"[FACE ENCODER] {pool.size} helper process(es) ready.")
        else:
            pool.close()
            print("[FACE ENCODER] Encoding inside the engine instead (video may stutter).")

    warm_up_face_model()
    load_registered_faces()
    threading.Thread(target=camera_reader_thread, daemon=True).start()
    threading.Thread(target=face_ai_worker, daemon=True).start()
    threading.Thread(target=gesture_ai_worker, daemon=True).start()
    threading.Thread(target=video_stream_worker, daemon=True).start()
    threading.Thread(target=workout_plan_worker, daemon=True).start()
    threading.Thread(target=attendance_retry_worker, daemon=True).start()


# Listen only on this computer by default. Set AI_ENGINE_HOST=0.0.0.0 in
# "Gesture Engine/.env" to let other devices on the LAN view the feeds.
AI_ENGINE_HOST = os.getenv('AI_ENGINE_HOST', '127.0.0.1')
AI_ENGINE_PORT = int(os.getenv('AI_ENGINE_PORT', '5000'))

def stream_generator(feed_type):
    """MJPEG stream: sends each newly encoded frame the moment it is ready.

    Each viewer waits on feed_condition for its own feed, so several open
    tabs never steal each other's wake-ups. While a viewer is connected the
    feed is counted as watched, which is what makes the worker encode it.
    """
    state = feed_state[feed_type]
    with feed_condition:
        state['viewers'] += 1
    new_frame_event.set()  # encode the current frame for this viewer now
    sent_sequence = None
    try:
        while True:
            with feed_condition:
                feed_condition.wait_for(
                    lambda: state['jpeg'] is not None and state['sequence'] != sent_sequence,
                    timeout=1.0,
                )
                sequence, frame_data = state['sequence'], state['jpeg']
            if frame_data is None or sequence == sent_sequence:
                continue
            sent_sequence = sequence
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')
    finally:
        with feed_condition:
            state['viewers'] -= 1
            if state['viewers'] <= 0:
                # Nobody is watching: drop the old frame so the next viewer
                # never sees a stale picture, and re-encode on reconnect.
                state['viewers'] = 0
                state['jpeg'] = None
                state['source_sequence'] = -1

@app.route('/security_feed')
def security_feed():
    return Response(stream_generator('sec'), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/gesture_feed')
def gesture_feed():
    return Response(stream_generator('gest'), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- Admin authentication for control endpoints -----------------------------
# The React dashboard sends its Laravel Sanctum token. We confirm it with
# Laravel (/api/admin/me) and cache valid tokens briefly to avoid a round
# trip on every click. Video feeds stay open because <img> tags cannot send
# headers.
ADMIN_TOKEN_CACHE_SECONDS = 60
_admin_token_cache = {}
_admin_token_cache_lock = threading.Lock()


def _is_valid_admin_token(token):
    now = time.time()
    with _admin_token_cache_lock:
        expires_at = _admin_token_cache.get(token)
        if expires_at and expires_at > now:
            return True
    try:
        res = requests.get(
            f"{LARAVEL_API}/admin/me",
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=5,
        )
    except requests.RequestException:
        return False
    if res.status_code != 200:
        return False
    with _admin_token_cache_lock:
        _admin_token_cache[token] = now + ADMIN_TOKEN_CACHE_SECONDS
        # Drop expired entries so the cache cannot grow without bound.
        for cached, expiry in list(_admin_token_cache.items()):
            if expiry <= now:
                del _admin_token_cache[cached]
    return True


def require_admin(view):
    from functools import wraps
    from flask import request

    @wraps(view)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = auth_header[7:].strip() if auth_header.lower().startswith('bearer ') else ''
        if not token or not _is_valid_admin_token(token):
            return jsonify({"error": "Admin login required."}), 401
        return view(*args, **kwargs)

    return wrapper


@app.route('/refresh_ai', methods=['POST'])
@require_admin
def refresh_ai():
    # Asynchronously reload registered faces to avoid blocking the caller
    threading.Thread(target=load_registered_faces, daemon=True).start()
    return jsonify({"message": "Face synchronization started in background!"})

def decode_data_url_image(value):
    """BGR image from a data URL (or bare base64), or None if it is not one."""
    import base64

    image_data = str(value or '')
    if ',' in image_data:
        image_data = image_data.split(',', 1)[1]
    if not image_data or len(image_data) > ENROLLMENT_CHECK_MAX_BYTES * 4 // 3:
        return None
    try:
        raw = np.frombuffer(base64.b64decode(image_data, validate=True), dtype=np.uint8)
        return cv2.imdecode(raw, cv2.IMREAD_COLOR)
    except (ValueError, TypeError, cv2.error):
        return None


@app.route('/check_enrollment_duplicates', methods=['POST'])
@require_admin
def check_enrollment_duplicates():
    """Compare a new member's face photos with every enrolled member.

    Body: {"images": [data URL, ...], "exclude_member_id": id of the member
    being edited (so they are not compared with their own old photos)}.
    Returns {"checked_views", "matches": [{"member_id", "name", "distance",
    "level"}]}, where level is 'likely_same' (distance below the match
    threshold: the camera may mistake one for the other) or 'similar'.
    """
    from flask import request

    body = request.get_json(silent=True) or {}
    images = body.get('images') or []
    if not isinstance(images, list) or not images or len(images) > 8:
        return jsonify({"error": "Send the face photos as a list of data URLs."}), 400
    exclude = body.get('exclude_member_id')
    exclude = str(exclude) if exclude not in (None, '') else None

    encodings = []
    for value in images:
        image = decode_data_url_image(value)
        if image is None:
            continue
        rgb = np.ascontiguousarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        with enrollment_check_lock:
            box = detect_face_box(rgb, enrollment_check_detector)
        if box is None:
            continue
        encoding = encode_face(rgb, box)
        if encoding is not None:
            encodings.append(encoding)

    matrix, known_ids, known_names, _ = face_db
    names = dict(zip(known_ids, known_names))
    closest = closest_member_distances(encodings, matrix, known_ids)
    matches = sorted(
        (
            {
                'member_id': member_id,
                'name': names.get(member_id, ''),
                'distance': round(distance, 3),
                'level': 'likely_same' if distance < LIKELY_CONFUSED_DISTANCE else 'similar',
            }
            for member_id, distance in closest.items()
            if distance < LOOK_ALIKE_DISTANCE and str(member_id) != exclude
        ),
        key=lambda match: match['distance'],
    )
    return jsonify({'checked_views': len(encodings), 'matches': matches})


@app.route('/gallery_health', methods=['GET'])
@require_admin
def get_gallery_health():
    """Enrollment problems found at the last face reload (gallery_health.py)."""
    return jsonify(gallery_health)


@app.route('/check_enrollment_view', methods=['POST'])
@require_admin
def check_enrollment_view():
    """Quality check for one face photo taken in the member form.

    Body: {"image": data URL, "view": "Front" | "Chin down" | "Left" | "Right",
           "opposite_turn": head turn of the accepted other side photo or null}.
    Returns enrollment_quality.assess_view's result.
    """
    from flask import request

    body = request.get_json(silent=True) or {}
    image = decode_data_url_image(body.get('image'))
    if image is None:
        return jsonify({"error": "Send one face photo as a data URL; it could not be read."}), 400

    opposite_turn = body.get('opposite_turn')
    try:
        opposite_turn = None if opposite_turn is None else float(opposite_turn)
    except (TypeError, ValueError):
        opposite_turn = None

    height, width = image.shape[:2]
    with enrollment_check_lock:
        results = enrollment_check_detector.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    faces = []
    for detection in results.detections or []:
        box = detection.location_data.relative_bounding_box
        faces.append({
            'box': (box.xmin, box.ymin, box.width, box.height),
            'keypoints': [(k.x * width, k.y * height) for k in detection.location_data.relative_keypoints],
            'score': float(detection.score[0]),
        })
    return jsonify(assess_view(body.get('view'), image, faces, opposite_turn))

@app.route('/camera_status', methods=['GET'])
def get_camera_status():
    return jsonify(camera_status)

@app.route('/switch_camera', methods=['POST'])
@require_admin
def switch_camera():
    global camera_mode
    from flask import request
    req_data = request.get_json(silent=True) or {}
    target_mode = req_data.get('source')
    if target_mode is None:
        target_mode = CONFIGURED_CAMERA_SOURCES[
            (CONFIGURED_CAMERA_SOURCES.index(camera_mode) + 1) % len(CONFIGURED_CAMERA_SOURCES)
        ]
    if not isinstance(target_mode, str) or target_mode.lower() not in AVAILABLE_CAMERA_SOURCES:
        return jsonify({
            "error": "Invalid or unavailable camera source.",
            "available_sources": AVAILABLE_CAMERA_SOURCES,
        }), 400

    target_mode = target_mode.lower()
    if target_mode in CCTV_STREAM_URLS and not CCTV_STREAM_URLS[target_mode]:
        return jsonify({
            "error": (
                f"{target_mode.upper()} is not configured. Set "
                f"{target_mode.upper()}_URL in the environment and restart the AI engine."
            ),
            "available_sources": AVAILABLE_CAMERA_SOURCES,
        }), 400

    camera_mode = target_mode
    camera_status["source"] = camera_mode
    print(f"Camera source switched to: {camera_mode.upper()}")
    return jsonify({"status": "success", "mode": camera_mode})

if __name__ == '__main__':
    print("\n[SYSTEM] CAPSTONE-READY AI ENGINE ONLINE (LOW LATENCY MODE)")
    start_background_workers()
    app.run(host=AI_ENGINE_HOST, port=AI_ENGINE_PORT, threaded=True, debug=False)
