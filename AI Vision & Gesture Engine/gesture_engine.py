import os
# Force TCP but instruct FFMPEG to discard corrupted packets instead of crashing
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

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

app = Flask(__name__)
CORS(app)

LARAVEL_API = "http://127.0.0.1:8000/api"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101'

known_face_encodings = []
known_face_ids = []
known_face_names = []
logged_today = {}
workout_cooldowns = {} # Prevents API spam!

shared_faces = []
face_memory_cache = {}
shared_pose_landmarks = None

# --- NEW: LEAN HYBRID VARIABLES ---
current_workout = "IDLE"
workout_buffer = [] # Used to smooth out flickering AI guesses
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
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=1)

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(min_detection_confidence=0.3, model_selection=1)

current_raw_frame = None
latest_security_frame = None
latest_gesture_frame = None

def load_registered_faces():
    global known_face_encodings, known_face_ids, known_face_names
    known_face_encodings.clear()
    known_face_ids.clear()
    known_face_names.clear()
    
    print("\n" + "="*50)
    print("🚀 [CAPSTONE READY] LONG-RANGE AI ENGINE...")
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
                    encodings = face_recognition.face_encodings(image, num_jitters=3)
                    
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

def auto_adjust_lighting(cv2_frame):
    gray = cv2.cvtColor(cv2_frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

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

def camera_reader_thread():
    global current_raw_frame
    cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    while True:
        success = cap.grab()
        if success:
            success, frame = cap.retrieve()
            if success and frame is not None:
                current_raw_frame = frame  
        else:
            time.sleep(0.5)
            cap.release()
            cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

def face_ai_worker():
    global current_raw_frame, shared_faces, face_memory_cache
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.1)
            continue
            
        frame = current_raw_frame.copy()
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        if np.mean(scan_frame) < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        face_results = face_detector.process(rgb_scan_frame)
        temp_faces = []
        
        if face_results.detections:
            h, w, _ = frame.shape
            for detection in face_results.detections:
                bboxC = detection.location_data.relative_bounding_box
                xmin, ymin = int(bboxC.xmin * w), int(bboxC.ymin * h)
                box_w, box_h = int(bboxC.width * w), int(bboxC.height * h)
                
                pad_y, pad_x = int(box_h * 0.25), int(box_w * 0.25)
                top, left = max(0, ymin - pad_y), max(0, xmin - pad_x)
                bottom, right = min(h, ymin + box_h + pad_y), min(w, xmin + box_w + pad_x)
                
                if bottom - top > 15 and right - left > 15:
                    name, color = "Unknown", (0, 0, 255)
                    box_center_x, box_center_y = left + (right - left) // 2, top + (bottom - top) // 2
                    
                    for mem_name, data in list(face_memory_cache.items()):
                        if time.time() - data['time'] < 3.0:
                            m_top, m_right, m_bottom, m_left = data['box']
                            m_center_x, m_center_y = m_left + (m_right - m_left) // 2, m_top + (m_bottom - m_top) // 2
                            if abs(box_center_x - m_center_x) < 250 and abs(box_center_y - m_center_y) < 250:
                                name, color = mem_name, (0, 255, 0)
                                break
                    try:
                        if name == "Unknown":
                            face_crop = frame[top:bottom, left:right]
                            enhanced_face = auto_adjust_lighting(face_crop)
                            encodings = face_recognition.face_encodings(enhanced_face)
                            if len(encodings) > 0 and known_face_encodings:
                                distances = face_recognition.face_distance(known_face_encodings, encodings[0])
                                if len(distances) > 0:
                                    best_match = np.argmin(distances)
                                    if distances[best_match] < 0.65: 
                                        member_id = known_face_ids[best_match]
                                        name = known_face_names[best_match]
                                        color = (0, 255, 0)
                                        threading.Thread(target=log_attendance_to_laravel, args=(member_id, name), daemon=True).start()
                        
                        if name != "Unknown":
                            face_memory_cache[name] = {"box": (top, right, bottom, left), "time": time.time()}

                    except Exception:
                        pass 

                    temp_faces.append(((top, right, bottom, left), name, color))
                    
        shared_faces = temp_faces
        time.sleep(0.05)

def gesture_ai_worker():
    global current_raw_frame, shared_pose_landmarks
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.01)
            continue
            
        frame = current_raw_frame.copy()
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        if np.mean(scan_frame) < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_scan_frame)
        shared_pose_landmarks = results.pose_landmarks
        time.sleep(0.01)

def video_stream_worker():
    global latest_security_frame, latest_gesture_frame, current_raw_frame, shared_faces, shared_pose_landmarks
    global current_workout, ml_model, workout_buffer
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.01)
            continue
            
        frame = current_raw_frame.copy()
        sec_frame = frame.copy()  
        gest_frame = frame.copy() 
        h, w, _ = frame.shape

        active_athlete = "Scanning Face..."

        # --- DRAW SKELETON & RUN AUTO-DETECTION ---
        if shared_pose_landmarks:
            
            # 1. UPGRADED VISUALS: Custom Skeleton (Red Joints, White Bones)
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
                
                # 2. UPGRADED VISUALS: Dynamic Pink Bounding Box (Like the reference image)
                x_coords = [lm.x * w for lm in landmarks]
                y_coords = [lm.y * h for lm in landmarks]
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                
                pad = 25 # Padding around the body
                cv2.rectangle(gest_frame, (max(0, x_min - pad), max(0, y_min - pad)), 
                              (min(w, x_max + pad), min(h, y_max + pad)), 
                              (255, 0, 255), 2) # 255,0,255 is the BGR code for Pink/Magenta
                
                # --- ACTIVE ATHLETE BINDING MATH ---
                nose_x = int(landmarks[mp_pose.PoseLandmark.NOSE.value].x * w)
                nose_y = int(landmarks[mp_pose.PoseLandmark.NOSE.value].y * h)
                
                for (top, right, bottom, left), name, color in shared_faces:
                    if left - 50 <= nose_x <= right + 50 and top - 50 <= nose_y <= bottom + 100:
                        active_athlete = name
                        break

                # =======================================================
                # 1. MACHINE LEARNING CLASSIFIER (Verification Mode)
                # =======================================================
                if ml_model:
                    # 🚨 THE CAPSTONE FIX: Normalize live camera coordinates to match training data
                    origin_x, origin_y, origin_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
                    pose_row = list(np.array([[lm.x - origin_x, lm.y - origin_y, lm.z - origin_z, lm.visibility] for lm in landmarks]).flatten())
                    
                    columns = []
                    for i in range(1, 34):
                        columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
                    
                    X = pd.DataFrame([pose_row], columns=columns)
                    
                    # Make the prediction!
                    prediction = ml_model.predict(X)[0]
                    prob = ml_model.predict_proba(X)[0]
                    confidence = max(prob)
                    
                    # Restored high threshold because the AI is now mathematically locked-in!
                    if confidence > 0.45:
                        workout_buffer.append(prediction)
                    else:
                        workout_buffer.append("IDLE")
                        
                    # SMOOTHING FILTER: Needs 7 frames of steady classification to verify
                    if len(workout_buffer) > 7:
                        workout_buffer.pop(0)
                        
                    smoothed_prediction = max(set(workout_buffer), key=workout_buffer.count)
                    
                    # Trigger verification log ONLY when the AI locks onto a new steady movement
                    if current_workout != smoothed_prediction:
                        current_workout = smoothed_prediction
                        
                        if current_workout != "IDLE" and active_athlete != "Scanning Face..." and active_athlete != "Unknown":
                            threading.Thread(target=log_workout_to_laravel, args=(active_athlete, current_workout), daemon=True).start()

            except Exception as e:
                pass

            # --- DRAW THE CLEAN IDENTIFICATION HUD ---
            overlay = gest_frame.copy()
            box_w = 480
            box_h = 90
            box_x1 = w - box_w - 20
            box_y1 = 20
            
            cv2.rectangle(overlay, (box_x1, box_y1), (box_x1 + box_w, box_y1 + box_h), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, gest_frame, 0.3, 0, gest_frame)
            
            athlete_color = (0, 255, 0) if active_athlete != "Scanning Face..." and active_athlete != "Unknown" else (0, 0, 255)

            cv2.putText(gest_frame, f"ATHLETE:  {active_athlete}", (box_x1 + 20, box_y1 + 40), cv2.FONT_HERSHEY_DUPLEX, 0.6, athlete_color, 1)
            
            # 🚨 THE FIX: Added the live confidence percentage to the screen!
            cv2.putText(gest_frame, f"EXERCISE: {current_workout} ({int(confidence*100)}%)", (box_x1 + 20, box_y1 + 75), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 200, 0), 1)

        # --- DRAW FACES ON SECURITY FEED ---
        for (top, right, bottom, left), name, color in shared_faces:
            cv2.rectangle(sec_frame, (left, top), (right, bottom), color, 3)
            cv2.rectangle(sec_frame, (left, max(0, top - 35)), (right, top), color, cv2.FILLED)
            cv2.putText(sec_frame, name, (left + 6, max(20, top - 10)), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        _, sec_buffer = cv2.imencode('.jpg', sec_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        _, gest_buffer = cv2.imencode('.jpg', gest_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        latest_security_frame = sec_buffer.tobytes()
        latest_gesture_frame = gest_buffer.tobytes()

        time.sleep(0.06)

threading.Thread(target=camera_reader_thread, daemon=True).start()
threading.Thread(target=face_ai_worker, daemon=True).start()
threading.Thread(target=gesture_ai_worker, daemon=True).start()
threading.Thread(target=video_stream_worker, daemon=True).start()

def stream_generator(feed_type):
    last_sent = None
    while True:
        frame_data = latest_security_frame if feed_type == 'sec' else latest_gesture_frame
        if frame_data is None or frame_data == last_sent:
            time.sleep(0.01)
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
    load_registered_faces()
    return jsonify({"message": "Synced!"})

if __name__ == '__main__':
    print("\n[SYSTEM] CAPSTONE-READY AI ENGINE ONLINE")
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False)