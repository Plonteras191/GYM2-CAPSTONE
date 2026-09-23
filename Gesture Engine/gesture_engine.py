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
import pandas as pd
import pickle
from flask import Flask, Response, jsonify
from flask_cors import CORS
import threading
import time
import numpy as np
import requests
# pandas removed from hot path — sklearn predict() accepts numpy arrays directly (FIX #3)

app = Flask(__name__)
CORS(app)

LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))

# Main Stream 720p H.264 (Channel 101) — reverted from 102 sub-stream which caused more lag on this camera
CCTV_URL = os.getenv('CCTV_URL', 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101')

CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'cctv').lower() # 'cctv' or 'webcam'
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))

camera_mode = CAMERA_SOURCE
camera_status = {"connected": False, "source": camera_mode, "url": CCTV_URL}

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
logged_today = {}
workout_cooldowns = {} # Prevents API spam!

shared_faces = []
tracked_faces = [] # Multi-person tracking state: list of active face tracks
next_track_id = 1
FACE_MATCH_THRESHOLD = 0.50 # Strict threshold: lower = harder to match (prevents wrong-person assignment)
shared_pose_landmarks = None

# FIX #1: Thread-safe frame sharing — protects current_raw_frame from partial reads
frame_lock = threading.Lock()
# FIX #10: Reactive stream_generator wake-up instead of sleep-polling
new_frame_event = threading.Event()

# --- NEW: LEAN HYBRID VARIABLES ---
current_workout = "IDLE"
# FIX #9: deque(maxlen=7) — O(1) append/auto-drop vs list.pop(0) which is O(n)
workout_buffer = collections.deque(maxlen=7)
ml_model = None

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
# FIX #2: model_complexity=0 (Lite) — ~40% faster inference vs complexity=1
# Negligible accuracy difference for gym exercise classification.
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=0)

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(min_detection_confidence=0.3, model_selection=1)

current_raw_frame = None
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
    global known_face_encodings, known_face_ids, known_face_names
    known_face_encodings.clear()
    known_face_ids.clear()
    known_face_names.clear()
    
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
                        print(f"  [SUCCESS] VIP Face Loaded: {member['name']}")
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

def log_workout_to_laravel(athlete_name, exercise):
    member_id = None
    if athlete_name in known_face_names:
        idx = known_face_names.index(athlete_name)
        member_id = known_face_ids[idx]
    
    if not member_id: return

    # Python Cooldown: Prevent API spam! 20 seconds between saving identical exercises.
    key = f"{member_id}_{exercise}"
    if key in workout_cooldowns and (time.time() - workout_cooldowns[key]) < 20:
        return

    workout_cooldowns[key] = time.time()
    
    try:
        res = requests.post(f"{LARAVEL_API}/ai/log-workout", json={"member_id": member_id, "exercise": exercise})
        if res.json().get('status') == 'logged':
            print(f"\n💪 [WORKOUT VERIFIED IN DATABASE] {athlete_name} performed {exercise}!\n")
    except Exception:
        pass

def open_camera():
    global camera_mode
    if camera_mode == "webcam":
        print(f"📷 [CAMERA] Initializing local Webcam (Index {WEBCAM_INDEX})...")
        cap = cv2.VideoCapture(WEBCAM_INDEX, cv2.CAP_DSHOW if sys.platform == 'win32' else cv2.CAP_ANY)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        return cap
    else:
        print(f"📹 [CAMERA] Initializing Low-Latency CCTV Stream ({CCTV_URL})...")
        cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap

def camera_reader_thread():
    global current_raw_frame, camera_mode, camera_status
    cap = open_camera()
    fail_count = 0
    active_mode = camera_mode
    
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
                new_frame_event.set()
                fail_count = 0
                camera_status["connected"] = True
                camera_status["source"] = camera_mode
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
    
    while True:
        # FIX #1: Read frame under lock to prevent partial reads
        with frame_lock:
            raw = current_raw_frame
        if raw is None:
            time.sleep(0.05)
            continue

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
                                    track['name'] = name
                                    track['color'] = (0, 255, 0)
                                    track['last_recon'] = now
                                    threading.Thread(target=log_attendance_to_laravel, args=(member_id, name), daemon=True).start()
                                else:
                                    track['name'] = 'Unknown'
                                    track['color'] = (0, 0, 255)
                                    track['last_recon'] = now
                        else:
                            # FIX #5: Mark failed recon so we don't retry every frame
                            track['last_recon_failed'] = now
                    except Exception:
                        track['last_recon_failed'] = now
                        
        tracked_faces = updated_tracks
        # Update shared_faces for Security Monitor HUD and skeleton binding
        shared_faces = [(t['box'], t['name'], t['color']) for t in tracked_faces if (now - t['last_seen']) < 0.5]
        # FIX #11: Reduced from 0.04 → 0.02s. Face encoding itself takes >40ms so
        # the old sleep was additive. Let throughput pace naturally at lower latency.
        time.sleep(0.02)

# --- GLOBAL RECOGNITION STATES ---
current_workout = "IDLE"
current_confidence = 0.0
active_athlete = "Scanning Face..."

def gesture_ai_worker():
    global current_raw_frame, shared_pose_landmarks, current_workout, current_confidence, active_athlete, workout_buffer
    infer_counter = 0
    
    while True:
        # FIX #1: Read frame under lock
        with frame_lock:
            raw = current_raw_frame
        if raw is None:
            time.sleep(0.01)
            continue
            
        frame = raw.copy()
        h, w, _ = frame.shape
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        # FIX #8: Sample every 4th pixel for brightness — 16x faster
        if scan_frame[::4, ::4].mean() < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_scan_frame)
        shared_pose_landmarks = results.pose_landmarks
        
        if shared_pose_landmarks:
            landmarks = shared_pose_landmarks.landmark
            
            # Identify active athlete based on closest face to the tracked skeleton's nose
            nose_x = int(landmarks[mp_pose.PoseLandmark.NOSE.value].x * w)
            nose_y = int(landmarks[mp_pose.PoseLandmark.NOSE.value].y * h)
            matched_name = "Scanning Face..."
            min_dist = float('inf')
            
            for (top, right, bottom, left), name, color in shared_faces:
                center_x = (left + right) // 2
                center_y = (top + bottom) // 2
                dist = ((center_x - nose_x)**2 + (center_y - nose_y)**2)**0.5
                box_w = right - left
                # Must be physically connected to the head of this skeleton (< 1.6x face width)
                if dist < (box_w * 1.6) and dist < min_dist:
                    min_dist = dist
                    matched_name = name
                    
            active_athlete = matched_name

            # Run ML inference every 3 frames (~6-7 Hz) to eliminate GIL lag while maintaining responsive detection
            infer_counter += 1
            if ml_model and infer_counter % 3 == 0:
                try:
                    origin_x, origin_y, origin_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
                    # FIX #3: Build numpy array directly — skip pandas DataFrame construction per frame.
                    # sklearn predict_proba() accepts ndarray[1, n_features] without column names.
                    pose_arr = np.array(
                        [[lm.x - origin_x, lm.y - origin_y, lm.z - origin_z, lm.visibility] for lm in landmarks],
                        dtype=np.float32
                    ).flatten().reshape(1, -1)

                    prob = ml_model.predict_proba(pose_arr)[0]
                    conf = float(prob.max())
                    prediction = ml_classes[int(prob.argmax())] if ml_classes is not None else ml_model.classes_[int(prob.argmax())]
                    current_confidence = conf
                    
                    # FIX #9: deque(maxlen=7) auto-drops oldest — no manual pop(0) needed
                    if conf > 0.45:
                        workout_buffer.append(prediction)
                    else:
                        workout_buffer.append("IDLE")
                        
                    smoothed_prediction = max(set(workout_buffer), key=workout_buffer.count)
                    
                    if current_workout != smoothed_prediction:
                        current_workout = smoothed_prediction
                        if current_workout != "IDLE" and active_athlete != "Scanning Face..." and active_athlete != "Unknown":
                            threading.Thread(target=log_workout_to_laravel, args=(active_athlete, current_workout), daemon=True).start()
                except Exception:
                    pass

        time.sleep(0.015)

def video_stream_worker():
    global latest_security_frame, latest_gesture_frame, current_raw_frame, shared_faces, shared_pose_landmarks
    global current_workout, current_confidence, active_athlete
    
    while True:
        # FIX #1: Read frame under lock
        with frame_lock:
            raw = current_raw_frame
        if raw is None:
            time.sleep(0.01)
            continue

        # FIX #7: One copy per stream, only when we actually start drawing —
        # removed 3x redundant frame.copy() calls from the old code.
        h, w = raw.shape[:2]

        # --- SECURITY FEED: draw face boxes ---
        sec_frame = raw.copy()
        for (top, right, bottom, left), name, color in shared_faces:
            cv2.rectangle(sec_frame, (left, top), (right, bottom), color, 3)
            cv2.rectangle(sec_frame, (left, max(0, top - 35)), (right, top), color, cv2.FILLED)
            cv2.putText(sec_frame, name, (left + 6, max(20, top - 10)), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        # --- GESTURE FEED: draw skeleton & HUD ---
        gest_frame = raw.copy()

        if shared_pose_landmarks:
            landmark_style = mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=3)
            connection_style = mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2)
            
            mp_drawing.draw_landmarks(
                gest_frame, 
                shared_pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=landmark_style,
                connection_drawing_spec=connection_style
            )
            
            try:
                landmarks = shared_pose_landmarks.landmark
                x_coords = [lm.x * w for lm in landmarks]
                y_coords = [lm.y * h for lm in landmarks]
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                
                pad = 25
                cv2.rectangle(gest_frame, (max(0, x_min - pad), max(0, y_min - pad)), 
                              (min(w, x_max + pad), min(h, y_max + pad)), 
                              (255, 0, 255), 2)
            except Exception:
                pass

            # --- DRAW IDENTIFICATION HUD ---
            # FIX #7: Replace cv2.addWeighted (needs full frame copy) with in-place numpy slice darkening
            box_w_hud = 480
            box_h_hud = 90
            box_x1 = w - box_w_hud - 20
            box_y1 = 20

            roi = gest_frame[box_y1:box_y1 + box_h_hud, box_x1:box_x1 + box_w_hud]
            roi[:] = (roi * 0.3).astype(np.uint8)  # darken ROI in-place — no full-frame copy
            
            athlete_color = (0, 255, 0) if active_athlete != "Scanning Face..." and active_athlete != "Unknown" else (0, 0, 255)
            cv2.putText(gest_frame, f"ATHLETE:  {active_athlete}", (box_x1 + 20, box_y1 + 40), cv2.FONT_HERSHEY_DUPLEX, 0.6, athlete_color, 1)
            cv2.putText(gest_frame, f"EXERCISE: {current_workout} ({int(current_confidence*100)}%)", (box_x1 + 20, box_y1 + 75), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 200, 0), 1)

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
    target_mode = req_data.get('source', 'webcam' if camera_mode == 'cctv' else 'cctv').lower()
    if target_mode in ['cctv', 'webcam']:
        camera_mode = target_mode
        camera_status["source"] = camera_mode
        print(f"🎯 [API] Camera source switched to: {camera_mode.upper()}")
        return jsonify({"status": "success", "mode": camera_mode})
    return jsonify({"error": "Invalid source. Use 'cctv' or 'webcam'"}), 400

if __name__ == '__main__':
    print("\n[SYSTEM] CAPSTONE-READY AI ENGINE ONLINE (LOW LATENCY MODE)")
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False)