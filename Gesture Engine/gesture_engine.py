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
import face_recognition
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
from face_matching import IdentityVote, align_box, best_member_match
from face_matching import box_size as face_box_size
from face_enrollment import EncodingCache, encode_at

app = Flask(__name__)
CORS(app)

LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


AI_ENGINE_TOKEN = env_loader.ai_engine_token()
if not AI_ENGINE_TOKEN:
    print("[WARNING] AI_ENGINE_TOKEN is not set. Laravel will reject attendance and workout updates.")
LARAVEL_HEADERS = {"X-AI-Engine-Token": AI_ENGINE_TOKEN, "Accept": "application/json"}
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))

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
    cv2.putText(ph, "DOUBLE ALPHA GYM - AI ENGINE", (40, 130), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
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
FACE_CACHE_PATH = os.path.join(BASE_DIR, 'models', 'face_cache.pkl')

# Recognition tuning. Override in "Gesture Engine/.env"; calibrate with
# scripts/eval_faces.py. Lower threshold = stricter matching.
FACE_MATCH_THRESHOLD = _env_number('FACE_MATCH_THRESHOLD', '0.50')
FACE_MATCH_MARGIN = _env_number('FACE_MATCH_MARGIN', '0.05')
FACE_VOTES_REQUIRED = _env_number('FACE_VOTES_REQUIRED', '3', int)
# Size tiers: faces >= FACE_NEAR_SIZE use the rules above; faces between
# FACE_MIN_SIZE and FACE_NEAR_SIZE ("far") are enlarged before encoding and
# need a stricter distance and more agreeing samples; smaller faces are not
# recognized (the tracked body keeps the name instead).
FACE_MIN_SIZE = _env_number('FACE_MIN_SIZE', '40', int)
FACE_NEAR_SIZE = _env_number('FACE_NEAR_SIZE', '70', int)
FACE_FAR_THRESHOLD = _env_number('FACE_FAR_THRESHOLD', '0.45')
FACE_FAR_VOTES = max(FACE_VOTES_REQUIRED, _env_number('FACE_FAR_VOTES', '5', int))
FACE_FAR_WEIGHT = FACE_VOTES_REQUIRED / FACE_FAR_VOTES
FACE_FAR_UPSCALE = 2.0
FACE_VOTE_WINDOW = max(FACE_FAR_VOTES * 2, FACE_VOTES_REQUIRED * 2, 4)
# Frames wider than this are scaled down before detection; smaller frames
# are processed at full resolution so distant people keep their pixels.
DETECTION_MAX_WIDTH = 1280
RECOGNITION_INTERVAL_UNCONFIRMED = 0.3
RECOGNITION_INTERVAL_CONFIRMED = 2.0
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
workout_plans = {}
ambiguous_workout_plans = {}
workout_plans_lock = threading.Lock()
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

current_raw_frame = None
current_frame_sequence = 0
last_camera_placeholder = None
latest_security_frame = None
latest_gesture_frame = None

# FIX #3: Pre-build ML column list once at startup (kept for reference; numpy path is used in worker)
ml_classes = None
if ml_model is not None:
    try:
        ml_classes = ml_model.classes_
    except Exception:
        pass

def member_face_path(member):
    raw_path = member['image_file'].lstrip('/')
    return os.path.normpath(os.path.join(KNOWN_FACES_DIR, raw_path))


def load_registered_faces():
    """Fetch enrolled members from Laravel and encode each enrolled view.

    Each registration image holds stacked views (front/left/right). Every
    view is encoded separately with the same MediaPipe framing used for live
    frames. Encodings are cached in models/face_cache.pkl, so only new or
    changed enrollments pay the slower high-jitter encoding.
    """
    global face_db

    print("\n" + "="*50)
    print("🚀 [CAPSTONE READY] HIGH-ACCURACY AI ENGINE...")
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

        for member in members:
            filepath = member_face_path(member)
            if not os.path.exists(filepath):
                print(f"  [MISSING] Face image not found for {member['name']}")
                continue
            seen_paths.append(filepath)
            try:
                member_encodings, total_views, cached = cache.get_or_encode(filepath, enroll_face_detector)
            except Exception as img_err:
                print(f"  [ERROR] Could not process image for {member['name']}: {img_err}")
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
                print(f"  [FAILED] {member['name']}: no face found in any view. Re-capture this member's face.")

        cache.prune(seen_paths)
        try:
            cache.save()
        except OSError as cache_err:
            print(f"  [WARNING] Could not save face cache: {cache_err}")

        matrix = np.array(encodings) if encodings else np.empty((0, 128))
        face_db = (matrix, ids, names, eligibility)
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

def log_attendance_to_laravel(member_id, name):
    current_time = time.time()
    if member_id in logged_today and (current_time - logged_today[member_id]) < 10.0:
        return 
        
    logged_today[member_id] = current_time
    
    try:
        res = requests.post(f"{LARAVEL_API}/ai/log-attendance", json={"member_id": member_id}, headers=LARAVEL_HEADERS, timeout=5)
        if res.json().get('status') == 'logged':
            print(f"\n>>> [ATTENDANCE SUCCESS] Logged: {name}!\n")
    except Exception:
        pass

def log_workout_to_laravel(member_id, athlete_name, exercise):
    if not member_id: return

    key = f"{member_id}_{exercise}"
    try:
        res = requests.post(
            f"{LARAVEL_API}/ai/log-workout",
            json={"member_id": member_id, "exercise": exercise},
            headers=LARAVEL_HEADERS,
            timeout=5,
        )
        res.raise_for_status()
        if res.json().get('status') == 'logged':
            with workout_cooldowns_lock:
                workout_cooldowns[key] = time.time()
            with workout_plans_lock:
                pending = workout_plans.get(str(member_id), set())
                pending.discard(exercise)
            print(f"\n💪 [WORKOUT VERIFIED IN DATABASE] {athlete_name} performed {exercise}!\n")
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
            }
            next_track_id += 1
            updated_tracks.append(new_track)
            
        # 3. Face recognition with multi-frame voting.
        # Unconfirmed tracks are sampled often; confirmed ones are re-verified
        # less often. A name is shown, and attendance logged, only once several
        # samples agree, so one bad frame cannot assign the wrong member.
        known_matrix, known_ids, known_names, known_eligibility = face_db
        rgb_frame = None
        for track in updated_tracks:
            if len(known_ids) == 0 or track['last_seen'] != now:
                continue
            vote = track['vote']
            interval = (
                RECOGNITION_INTERVAL_CONFIRMED if vote.confirmed is not None
                else RECOGNITION_INTERVAL_UNCONFIRMED
            )
            if (now - track['last_recon']) < interval:
                continue
            track['last_recon'] = now

            aligned = track['aligned_box']
            face_size = face_box_size(aligned)
            if face_size < FACE_MIN_SIZE:
                # Too small for a reliable descriptor: don't guess. A member
                # already confirmed on this track keeps their name.
                if vote.confirmed is None:
                    track['name'] = MOVE_CLOSER_LABEL
                    track['color'] = (0, 165, 255)
                continue

            # Far tier: enlarge before encoding, stricter distance, and each
            # sample counts as only part of a vote.
            is_far = face_size < FACE_NEAR_SIZE
            if rgb_frame is None:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            try:
                encoding = encode_at(
                    rgb_frame, aligned, jitters=1,
                    upscale=FACE_FAR_UPSCALE if is_far else 1.0,
                )
            except Exception:
                encoding = None
            if encoding is None:
                continue

            distances = face_recognition.face_distance(known_matrix, encoding)
            sample_id, _, _ = best_member_match(
                distances, known_ids,
                FACE_FAR_THRESHOLD if is_far else FACE_MATCH_THRESHOLD,
                FACE_MATCH_MARGIN,
            )
            newly_confirmed = vote.add(sample_id, weight=FACE_FAR_WEIGHT if is_far else 1.0)
            if vote.confirmed is not None and vote.confirmed not in known_ids:
                # Member was removed by a face reload while being tracked.
                vote.confirmed = None
                newly_confirmed = False

            if vote.confirmed is not None:
                idx = known_ids.index(vote.confirmed)
                track['member_id'] = vote.confirmed
                track['name'] = known_names[idx]
                track['workout_eligible'] = known_eligibility[idx]
                track['color'] = (0, 255, 0)
                if newly_confirmed:
                    threading.Thread(
                        target=log_attendance_to_laravel,
                        args=(vote.confirmed, known_names[idx]),
                        daemon=True,
                    ).start()
            else:
                track['member_id'] = None
                track['name'] = 'Unknown'
                track['workout_eligible'] = False
                track['color'] = (0, 0, 255)


        tracked_faces = updated_tracks
        # Update shared_faces for Security Monitor HUD and skeleton binding
        shared_faces = [
            {
                'id': t['id'],
                'box': t['box'],
                'name': t['name'],
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
    global workout_plans, ambiguous_workout_plans
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
        for task in tasks:
            member_id = task.get('member_id')
            assigned_class = task.get('gesture_class') or task.get('exercise', '')
            assigned_class = str(assigned_class).replace('ASSIGNED:', '').strip()
            class_key = ''.join(character for character in assigned_class.upper() if character.isalnum())
            model_class = classes_by_key.get(class_key)
            if member_id is not None and model_class:
                refreshed_counts[str(member_id)][model_class] += 1

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
        print(f"[SYNC] Loaded today's workout targets for {len(workout_plans)} member(s).")
    except (requests.RequestException, ValueError) as e:
        print(f"[ERROR] Could not refresh assigned workout targets: {e}")

def workout_plan_worker():
    while True:
        refresh_workout_plans()
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

    pose_tracks = updated_tracks + available_tracks
    return results

def gesture_ai_worker():
    global current_raw_frame, shared_athletes, shared_head_regions
    infer_counter = 0
    last_processed_sequence = -1

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

        athletes = []
        for person in poses:
            member_id = person['member_id']
            workout_eligible = person.get('workout_eligible', False)

            # Only members with an active coach membership are monitored.
            status = monitoring_status(member_id, workout_eligible)
            person['status'] = status
            if status == EXCLUDED:
                workout_states.pop(person['actor_id'], None)
                continue
            if status == IDENTIFYING:
                workout_states.pop(person['actor_id'], None)
                athletes.append(person)
                continue

            expected = current_plans.get(str(member_id), set())
            ambiguous = current_ambiguities.get(str(member_id), set())
            state = workout_states.setdefault(person['actor_id'], {
                'buffer': collections.deque(maxlen=7),
                'exercise': 'SCANNING',
                'confidence': 0.0,
                'motion': MotionTracker(),
            })
            state['last_seen'] = time.monotonic()
            target_signature = tuple(sorted(expected))
            if state.get('target_signature') != target_signature:
                state['buffer'].clear()
                state['exercise'] = 'SCANNING'
                state['confidence'] = 0.0
                state['target_signature'] = target_signature

            points = landmarks_array(person['landmarks'])
            state['motion'].add(points)

            def gate(label):
                # Not checkable right now: show why, and require fresh
                # stable predictions once the person can be checked again.
                state['buffer'].clear()
                state['exercise'] = label
                state['confidence'] = 0.0

            if not expected:
                gate('NO PLAN TODAY')
            elif ml_model is not None and infer_counter % 3 == 0:
                motion = state['motion'].motion()
                checks_static = bool(expected & STATIC_EXERCISES)
                if not any(joints_visible_for(exercise, points) for exercise in expected):
                    gate('BODY NOT FULLY VISIBLE')
                elif not checks_static and motion is not None and motion < MOTION_MIN:
                    gate('NOT MOVING')
                else:
                    # Rescale the body to the training data's size so near
                    # and far members look the same to the model.
                    pose_array = scaled_model_input(points, TRAIN_TORSO)
                    if pose_array is not None:
                        try:
                            probabilities = ml_model.predict_proba(pose_array)[0]
                            prediction, confidence = select_assigned_prediction(
                                probabilities,
                                ml_classes,
                                expected,
                            )
                            state['buffer'].append((prediction, confidence))
                            state['exercise'] = collections.Counter(
                                label for label, _ in state['buffer']
                            ).most_common(1)[0][0]
                            matching_confidences = [
                                score for label, score in state['buffer'] if label == state['exercise']
                            ]
                            state['confidence'] = sum(matching_confidences) / len(matching_confidences)
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
            })

            if target_match:
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
            athletes.append(person)

        shared_athletes = athletes
        stale_actors = [
            actor_id
            for actor_id, state in workout_states.items()
            if time.monotonic() - state.get('last_seen', 0.0) > 1.0
        ]
        for actor_id in stale_actors:
            workout_states.pop(actor_id, None)

        time.sleep(0.015)

def draw_identifying_tag(frame, athlete):
    """Small grey tag for a body whose face has not been recognized yet."""
    top, right, bottom, left = athlete['box']
    label = "Identifying..."
    font, scale, thickness = cv2.FONT_HERSHEY_DUPLEX, 0.42, 1
    (text_w, text_h), _ = cv2.getTextSize(label, font, scale, thickness)
    x = max(0, min((left + right) // 2 - text_w // 2 - 5, frame.shape[1] - text_w - 10))
    y = max(0, top - text_h - 10)
    cv2.rectangle(frame, (x, y), (x + text_w + 10, y + text_h + 8), (90, 90, 90), cv2.FILLED)
    cv2.putText(frame, label, (x + 5, y + text_h + 3), font, scale, (235, 235, 235), thickness)


def draw_athlete_overlay(frame, athlete):
    if athlete.get('status') == IDENTIFYING:
        draw_identifying_tag(frame, athlete)
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
            exercise_label = f"{athlete['exercise']} ({'/'.join(athlete['expected'])})"
        elif athlete['target_match']:
            exercise_label = f"MATCH: {athlete['exercise']} ({int(athlete['confidence'] * 100)}%)"
        else:
            exercise_label = f"VERIFYING: {athlete['exercise']} ({int(athlete['confidence'] * 100)}%)"
    else:
        exercise_label = athlete['exercise']

    caption_lines = [f"EXERCISE: {exercise_label}", f"NAME: {athlete['name']}"]
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
    exercise_color = (100, 255, 100) if athlete['target_match'] else (255, 255, 255)
    if athlete['requires_confirmation']:
        exercise_color = (0, 190, 255)
    cv2.rectangle(
        frame,
        (caption_x, caption_y),
        (min(width, caption_x + caption_width), min(height, caption_y + caption_height)),
        (24, 25, 33),
        cv2.FILLED,
    )
    cv2.putText(
        frame,
        caption_lines[0],
        (caption_x + 6, caption_y + 17),
        caption_font,
        caption_scale,
        exercise_color,
        caption_thickness,
    )
    cv2.putText(
        frame,
        caption_lines[1],
        (caption_x + 6, caption_y + 17 + line_height),
        caption_font,
        caption_scale,
        (255, 255, 255),
        caption_thickness,
    )

def video_stream_worker():
    global latest_security_frame, latest_gesture_frame, current_raw_frame
    last_processed_sequence = -1

    while True:
        # FIX #1: Read frame under lock
        with frame_lock:
            raw = current_raw_frame
            frame_sequence = current_frame_sequence
        if raw is None:
            time.sleep(0.01)
            continue
        if frame_sequence == last_processed_sequence:
            time.sleep(0.005)
            continue
        last_processed_sequence = frame_sequence

        # FIX #7: One copy per stream, only when we actually start drawing —
        # removed 3x redundant frame.copy() calls from the old code.
        _, w = raw.shape[:2]

        # --- SECURITY FEED: draw face boxes ---
        sec_frame = raw.copy()
        faces = shared_faces.copy()
        athletes = shared_athletes.copy()
        for face in faces:
            (top, right, bottom, left) = face['box']
            name, color = face['name'], face['color']
            cv2.rectangle(sec_frame, (left, top), (right, bottom), color, 3)
            cv2.rectangle(sec_frame, (left, max(0, top - 35)), (right, top), color, cv2.FILLED)
            cv2.putText(sec_frame, name, (left + 6, max(20, top - 10)), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        # --- GESTURE FEED: draw a separate identity and pose overlay per person ---
        gest_frame = raw.copy()
        for athlete in athletes:
            draw_athlete_overlay(gest_frame, athlete)

        # FIX #6: Cap output at 1280x720 if source is larger, then encode at quality 75.
        # Quality 75 vs 85 saves ~25% encode time with no perceptible difference in browser streaming.
        if w > 1280:
            sec_frame = cv2.resize(sec_frame, (1280, 720))
            gest_frame = cv2.resize(gest_frame, (1280, 720))

        _, sec_buffer = cv2.imencode('.jpg', sec_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        _, gest_buffer = cv2.imencode('.jpg', gest_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        latest_security_frame = sec_buffer.tobytes()
        latest_gesture_frame = gest_buffer.tobytes()

        # Smooth ~28-30 FPS output
        time.sleep(0.033)


_workers_started = False
_workers_lock = threading.Lock()


def start_background_workers():
    """Sync faces from Laravel and start the camera/AI threads (once).

    Called from main.py (or __main__) so that merely importing this module,
    e.g. from tests or scripts, does not open cameras or start threads.
    """
    global _workers_started
    with _workers_lock:
        if _workers_started:
            return
        _workers_started = True

    load_registered_faces()
    threading.Thread(target=camera_reader_thread, daemon=True).start()
    threading.Thread(target=face_ai_worker, daemon=True).start()
    threading.Thread(target=gesture_ai_worker, daemon=True).start()
    threading.Thread(target=video_stream_worker, daemon=True).start()
    threading.Thread(target=workout_plan_worker, daemon=True).start()


# Listen only on this computer by default. Set AI_ENGINE_HOST=0.0.0.0 in
# "Gesture Engine/.env" to let other devices on the LAN view the feeds.
AI_ENGINE_HOST = os.getenv('AI_ENGINE_HOST', '127.0.0.1')
AI_ENGINE_PORT = int(os.getenv('AI_ENGINE_PORT', '5000'))

def stream_generator(feed_type):
    # FIX #10: Use threading.Event instead of sleep-polling.
    # Wakes up immediately when camera_reader_thread sets new_frame_event,
    # saving idle CPU cycles and reducing stream latency.
    last_sent = None
    while True:
        new_frame_event.wait(timeout=0.5)
        new_frame_event.clear()
        frame_data = latest_security_frame if feed_type == 'sec' else latest_gesture_frame
        if frame_data is None or frame_data == last_sent:
            continue
        last_sent = frame_data
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')

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
