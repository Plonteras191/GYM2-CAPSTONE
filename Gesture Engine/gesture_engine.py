import sys
import os
import collections

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

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
from camera_tracking import update_pose_track_identity
from workout_prediction import select_assigned_prediction

app = Flask(__name__)
CORS(app)

LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))

# Main Stream 720p H.264 (Channel 101) — reverted from 102 sub-stream which caused more lag on this camera
CCTV_URL = os.getenv('CCTV_URL', 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101')

# Samsung A06 phone-camera stream on the FTTx_39DC_5G network.
# Override PHONE_CAMERA_URL when the phone's network address changes.
PHONE_CAMERA_URL = os.getenv(
    'PHONE_CAMERA_URL',
    'rtsp://192.168.1.55:8554/live',
).strip()
CCTV_STREAM_URLS = {
    'cctv': CCTV_URL.strip(),
    'cctv_2': os.getenv('CCTV_2_URL', '').strip(),
    'cctv_3': os.getenv('CCTV_3_URL', '').strip(),
}
CCTV_STREAM_URLS = {source: url for source, url in CCTV_STREAM_URLS.items() if url}
AVAILABLE_CAMERA_SOURCES = (
    list(CCTV_STREAM_URLS)
    + ['webcam']
    + (['phone'] if PHONE_CAMERA_URL else [])
)
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'phone').lower()
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))
if CAMERA_SOURCE not in AVAILABLE_CAMERA_SOURCES:
    CAMERA_SOURCE = AVAILABLE_CAMERA_SOURCES[0]

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

known_face_encodings = []
known_face_ids = []
known_face_names = []
known_face_workout_eligibility = []
logged_today = {}
workout_cooldowns = {} # Prevents API spam!

shared_faces = []
tracked_faces = [] # Multi-person tracking state: list of active face tracks
next_track_id = 1
FACE_MATCH_THRESHOLD = 0.50 # Strict threshold: lower = harder to match (prevents wrong-person assignment)
shared_athletes = []
pose_tracks = []
next_pose_track_id = 1
workout_states = {}
workout_plans = {}
ambiguous_workout_plans = {}
workout_plans_lock = threading.Lock()
WORKOUT_CONFIDENCE_THRESHOLD = 0.70
MAX_POSES = 12

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
POSE_LANDMARKER_MODEL = os.path.join(BASE_DIR, 'models', 'pose_landmarker_lite.task')
if not os.path.exists(POSE_LANDMARKER_MODEL):
    raise FileNotFoundError(f"Multi-person pose model is missing: {POSE_LANDMARKER_MODEL}")
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

current_raw_frame = None
current_frame_sequence = 0
latest_security_frame = None
latest_gesture_frame = None

# FIX #3: Pre-build ML column list once at startup (kept for reference; numpy path is used in worker)
ml_classes = None
if ml_model is not None:
    try:
        ml_classes = ml_model.classes_
    except Exception:
        pass

def load_registered_faces():
    global known_face_encodings, known_face_ids, known_face_names, known_face_workout_eligibility
    known_face_encodings.clear()
    known_face_ids.clear()
    known_face_names.clear()
    known_face_workout_eligibility.clear()
    
    print("\n" + "="*50)
    print("🚀 [CAPSTONE READY] HIGH-ACCURACY AI ENGINE...")
    print("[SYNC] Fetching registered members from Laravel...")
    try:
        response = requests.get(f"{LARAVEL_API}/ai/members-faces")
        members = response.json()
        
        for member in members:
            raw_path = member['image_file']
            if raw_path.startswith('/'): raw_path = raw_path[1:] 
            filepath = os.path.normpath(os.path.join(KNOWN_FACES_DIR, raw_path)) 
            
            if os.path.exists(filepath):
                try:
                    image = face_recognition.load_image_file(filepath)
                    # Fast 1-jitter encoding for instant startup & sync
                    encodings = face_recognition.face_encodings(image, num_jitters=1)

                    
                    if len(encodings) > 0:
                        known_face_encodings.append(encodings[0])
                        known_face_ids.append(member['id'])
                        known_face_names.append(member['name'])
                        known_face_workout_eligibility.append(bool(member.get('workout_eligible', False)))
                        eligibility_label = "coach eligible" if known_face_workout_eligibility[-1] else "attendance only"
                        print(f"  [SUCCESS] Face Loaded: {member['name']} ({eligibility_label})")
                except Exception as img_err:
                    print(f"  [ERROR] Could not process image: {img_err}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Laravel: {e}")
    print("="*50 + "\n")

load_registered_faces()

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

def prepare_face_crop(face_crop):
    # Preserves natural 3D RGB color chroma required by dlib ResNet face descriptor
    rgb_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
    # FIX #8: Sample every 4th pixel — 16x faster brightness check, same result
    if rgb_crop[::4, ::4].mean() < 65:
        # Gentle brightening in HSV space without flattening grayscale contours
        hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        hsv[:, :, 2] = cv2.convertScaleAbs(hsv[:, :, 2], alpha=1.2, beta=20)
        rgb_crop = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    return rgb_crop

def log_attendance_to_laravel(member_id, name):
    current_time = time.time()
    if member_id in logged_today and (current_time - logged_today[member_id]) < 10.0:
        return 
        
    logged_today[member_id] = current_time
    
    try:
        res = requests.post(f"{LARAVEL_API}/ai/log-attendance", json={"member_id": member_id})
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
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
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

def camera_reader_thread():
    global current_raw_frame, current_frame_sequence, camera_mode, camera_status
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
            # FIX #1: Write frame under lock so workers never read a partial frame
            with frame_lock:
                current_raw_frame = make_placeholder_frame("Connecting to camera stream...")
            new_frame_event.set()
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
            with frame_lock:
                current_raw_frame = make_placeholder_frame("Stream disconnected. Reconnecting...")
            new_frame_event.set()
            time.sleep(1.0)
            if cap is not None:
                cap.release()
            cap = open_camera()
            fail_count = 0

def face_ai_worker():
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
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        # FIX #8: Sample every 4th pixel for brightness — 16x faster
        if scan_frame[::4, ::4].mean() < 70:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=20)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        face_results = face_detector.process(rgb_scan_frame)
        
        detected_boxes = []
        now = time.time()
        
        if face_results.detections:
            for detection in face_results.detections:
                bboxC = detection.location_data.relative_bounding_box
                xmin, ymin = int(bboxC.xmin * w), int(bboxC.ymin * h)
                box_w, box_h = int(bboxC.width * w), int(bboxC.height * h)
                
                # Asymmetric tight padding: more headroom above (forehead), minimal sides
                # Reduced from 20% to 10% to prevent neighbor face bleed-over when people stand close
                pad_top = int(box_h * 0.15)   # slight forehead room
                pad_side = int(box_w * 0.08)  # tight sides to avoid bleed
                pad_bot = int(box_h * 0.05)   # minimal chin
                top, left = max(0, ymin - pad_top), max(0, xmin - pad_side)
                bottom, right = min(h, ymin + box_h + pad_bot), min(w, xmin + box_w + pad_side)
                
                if (bottom - top) > 25 and (right - left) > 25:
                    detected_boxes.append((top, right, bottom, left))
        
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
                'name': 'Unknown',
                'member_id': None,
                'color': (0, 0, 255),
                'last_seen': now,
                'last_recon': 0.0,
                # FIX #5: Skip re-encoding for 2s after a failed crop attempt
                'last_recon_failed': 0.0
            }
            next_track_id += 1
            updated_tracks.append(new_track)
            
        # 3. Perform Deep Face Recognition for tracks that are Unknown or due for re-check (every 4s)
        # Longer interval = stable identity, prevents re-recognition confusion when people shift
        for track in updated_tracks:
            # FIX #5: Skip tracks that failed encoding recently — 2s cooldown prevents
            # hammering dlib every frame when a crop returns no encodings.
            if (now - track.get('last_recon_failed', 0.0)) < 2.0:
                continue
            if track['name'] == 'Unknown' or (now - track['last_recon']) > 4.0:
                top, right, bottom, left = track['box']
                face_crop = frame[top:bottom, left:right]
                if face_crop.size > 0 and known_face_encodings:
                    try:
                        prep_crop = prepare_face_crop(face_crop)
                        crop_h, crop_w = prep_crop.shape[:2]

                        # FIX #4: Resize crop to max 160x160 before dlib ResNet encoding.
                        # dlib internally resizes anyway — quality is identical but we avoid
                        # feeding large 720p crops through the descriptor network.
                        MAX_CROP = 160
                        if crop_h > MAX_CROP or crop_w > MAX_CROP:
                            scale = MAX_CROP / max(crop_h, crop_w)
                            prep_crop = cv2.resize(prep_crop, (int(crop_w * scale), int(crop_h * scale)))
                            crop_h, crop_w = prep_crop.shape[:2]
                        
                        # CRITICAL FIX: Pass explicit face location so face_recognition does NOT
                        # run its own internal face detector on the crop. Without this, dlib may
                        # detect the wrong face (e.g. a neighbor's face bleeding in from padding)
                        # or return 0 encodings when the cropped face is too close to the edge.
                        # Format: [(top, right, bottom, left)] in crop coordinates
                        explicit_location = [(0, crop_w, crop_h, 0)]
                        encs = face_recognition.face_encodings(prep_crop, known_face_locations=explicit_location, num_jitters=1)
                        
                        if encs and len(encs) > 0:
                            distances = face_recognition.face_distance(known_face_encodings, encs[0])
                            if len(distances) > 0:
                                best_idx = int(np.argmin(distances))
                                best_dist = float(distances[best_idx])
                                
                                # Strict threshold (0.50): lower = harder to match
                                is_match = best_dist < FACE_MATCH_THRESHOLD
                                
                                # Margin check: require at least 0.06 gap between top-2 candidates.
                                # Prevents "coin-flip" assignments when two people look similar.
                                if is_match and len(distances) > 1:
                                    sorted_dists = sorted(distances)
                                    if (sorted_dists[1] - sorted_dists[0]) < 0.06:
                                        is_match = False # Too ambiguous, treat as Unknown
                                
                                if is_match:
                                    member_id = known_face_ids[best_idx]
                                    name = known_face_names[best_idx]
                                    workout_eligible = known_face_workout_eligibility[best_idx]
                                    track['name'] = name
                                    track['member_id'] = member_id
                                    track['workout_eligible'] = workout_eligible
                                    track['color'] = (0, 255, 0)
                                    track['last_recon'] = now
                                    threading.Thread(target=log_attendance_to_laravel, args=(member_id, name), daemon=True).start()
                                else:
                                    track['name'] = 'Unknown'
                                    track['member_id'] = None
                                    track['workout_eligible'] = False
                                    track['color'] = (0, 0, 255)
                                    track['last_recon'] = now
                        else:
                            # FIX #5: Mark failed recon so we don't retry every frame
                            track['last_recon_failed'] = now
                    except Exception:
                        track['last_recon_failed'] = now
                        
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
        response = requests.get(f"{LARAVEL_API}/ai/workout-plans", timeout=5)
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

def associate_poses_with_people(pose_landmarks, faces, frame_width, frame_height, now):
    global pose_tracks, next_pose_track_id
    pose_boxes = [pose_bounding_box(points, frame_width, frame_height) for points in pose_landmarks]
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

        name, member_id, workout_eligible = update_pose_track_identity(track, face, now)
        updated_tracks.append(track)
        actor_id = f"pose:{track['id']}"
        face_box = face['box'] if face else None

        results.append({
            'actor_id': actor_id,
            'landmarks': landmarks,
            'box': box,
            'face_box': face_box,
            'name': name,
            'member_id': member_id,
            'workout_eligible': workout_eligible,
        })

    pose_tracks = updated_tracks + available_tracks
    return results

def gesture_ai_worker():
    global current_raw_frame, shared_athletes
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
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
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
        )
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
            expected = (
                current_plans.get(str(member_id), set())
                if member_id is not None and workout_eligible
                else set()
            )
            ambiguous = current_ambiguities.get(str(member_id), set()) if member_id is not None else set()
            state = workout_states.setdefault(person['actor_id'], {
                'buffer': collections.deque(maxlen=7),
                'exercise': 'SCANNING',
                'confidence': 0.0,
            })
            state['last_seen'] = time.monotonic()
            target_signature = tuple(sorted(expected))
            if state.get('target_signature') != target_signature:
                state['buffer'].clear()
                state['exercise'] = 'SCANNING'
                state['confidence'] = 0.0
                state['target_signature'] = target_signature

            if expected and ml_model is not None and infer_counter % 3 == 0:
                try:
                    landmarks = person['landmarks']
                    origin_x = landmarks[0].x if landmarks[0].x is not None else 0.0
                    origin_y = landmarks[0].y if landmarks[0].y is not None else 0.0
                    origin_z = landmarks[0].z if landmarks[0].z is not None else 0.0
                    pose_array = np.array(
                        [[
                            (point.x if point.x is not None else 0.0) - origin_x,
                            (point.y if point.y is not None else 0.0) - origin_y,
                            (point.z if point.z is not None else 0.0) - origin_z,
                            point.visibility if point.visibility is not None else 0.0,
                        ] for point in landmarks],
                        dtype=np.float32,
                    ).flatten().reshape(1, -1)
                    probabilities = ml_model.predict_proba(pose_array)[0]
                    prediction, confidence = select_assigned_prediction(
                        probabilities,
                        ml_classes,
                        expected,
                    )
                    state['buffer'].append((prediction, confidence))
                    state['exercise'] = collections.Counter(label for label, _ in state['buffer']).most_common(1)[0][0]
                    matching_confidences = [
                        score for label, score in state['buffer'] if label == state['exercise']
                    ]
                    state['confidence'] = sum(matching_confidences) / len(matching_confidences)
                except (ValueError, RuntimeError) as e:
                    print(f"[ERROR] Could not classify pose for {person['name']}: {e}")
                    state['exercise'] = 'SCANNING'
                    state['confidence'] = 0.0

            if not expected:
                state['buffer'].clear()
                if member_id is None:
                    state['exercise'] = 'UNRECOGNIZED'
                elif not workout_eligible:
                    state['exercise'] = 'COACH MEMBERSHIP REQUIRED'
                else:
                    state['exercise'] = 'NO PLAN'
                state['confidence'] = 0.0

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

def draw_athlete_overlay(frame, athlete):
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


threading.Thread(target=camera_reader_thread, daemon=True).start()
threading.Thread(target=face_ai_worker, daemon=True).start()
threading.Thread(target=gesture_ai_worker, daemon=True).start()
threading.Thread(target=video_stream_worker, daemon=True).start()
threading.Thread(target=workout_plan_worker, daemon=True).start()

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

@app.route('/refresh_ai', methods=['POST'])
def refresh_ai():
    # Asynchronously reload registered faces to avoid blocking the caller
    threading.Thread(target=load_registered_faces, daemon=True).start()
    return jsonify({"message": "Face synchronization started in background!"})

@app.route('/camera_status', methods=['GET'])
def get_camera_status():
    return jsonify(camera_status)

@app.route('/switch_camera', methods=['POST'])
def switch_camera():
    global camera_mode
    from flask import request
    req_data = request.get_json(silent=True) or {}
    target_mode = req_data.get('source')
    if target_mode is None:
        target_mode = AVAILABLE_CAMERA_SOURCES[
            (AVAILABLE_CAMERA_SOURCES.index(camera_mode) + 1) % len(AVAILABLE_CAMERA_SOURCES)
        ]
    if not isinstance(target_mode, str) or target_mode.lower() not in AVAILABLE_CAMERA_SOURCES:
        return jsonify({
            "error": "Invalid or unavailable camera source.",
            "available_sources": AVAILABLE_CAMERA_SOURCES,
        }), 400

    camera_mode = target_mode.lower()
    camera_status["source"] = camera_mode
    print(f"Camera source switched to: {camera_mode.upper()}")
    return jsonify({"status": "success", "mode": camera_mode})

if __name__ == '__main__':
    print("\n[SYSTEM] CAPSTONE-READY AI ENGINE ONLINE (LOW LATENCY MODE)")
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False)
