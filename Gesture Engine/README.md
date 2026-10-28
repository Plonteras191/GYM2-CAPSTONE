# 🤖 AI Vision & Gesture Engine Component

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Component:** AI Vision & Gesture Processing Engine  

---

## 📌 Component Overview

The **AI Vision & Gesture Engine** is a dedicated Python 3.10+ microservice responsible for real-time computer vision processing, biometric touchless face recognition, and pose-based exercise repetition tracking. It communicates seamlessly with the **Laravel REST API** backend and streams real-time visual feeds to the **React SPA** frontend canvas interface.

---

## 📁 Organized Directory Structure

```
AI Vision & Gesture Engine/
├── config/
│   └── settings.py          # Centralized configuration (RTSP URLs, API endpoints, paths)
├── datasets/
│   └── custom_workout_dataset.csv  # Pose landmark dataset CSV file (33 3D joints)
├── models/
│   ├── workout_model.pkl    # Trained Scikit-Learn workout classifier model binary
│   └── pose_landmarker_lite.task # MediaPipe multi-person pose model (up to 8 poses)
├── scripts/
│   ├── auto_scraper.py      # Video dataset scraper utility
│   ├── collect_data.py      # Real-time pose landmark recording script
│   ├── test_cam.py          # Camera input & RTSP diagnostic tool
│   └── train_model.py       # Scikit-Learn model training pipeline
├── main.py                  # Standard application entry point wrapper
├── gesture_engine.py        # Core Flask streaming web service & vision inference engine
├── requirements.txt         # Python package dependencies
└── README.md                # Component documentation & directory guide
```

---

## ⚙️ Quick Start & Execution Commands

### 1. Launch Main AI Microservice Engine
To start the primary Flask streaming service (listening on `http://127.0.0.1:5000`):
```bash
# Using standard main.py entry point:
python main.py

# Or directly running gesture_engine.py:
python gesture_engine.py
```

### 2. Collect Training Dataset Landmarks
To record landmark feature vectors for new exercises:
```bash
python scripts/collect_data.py
```

### 3. Train Machine Learning Model
To train and output `models/workout_model.pkl`:
```bash
python scripts/train_model.py
```

### 4. Test Camera Stream
To verify camera connection and RTSP streaming latency:
```bash
python scripts/test_cam.py
```

### Camera sources

The Gesture and Security Monitors switch one live feed at a time among CCTV 1,
the laptop webcam, an optional phone camera, and up to two additional CCTV
streams. CCTV 1 uses `CCTV_URL` (kept for compatibility); CCTV 2 and 3 use
`CCTV_2_URL` and `CCTV_3_URL`. The webcam uses `WEBCAM_INDEX` (default `0`).

For the current Samsung A06 test on `FTTx_39DC_5G`, `PHONE_CAMERA_URL` defaults
to `rtsp://192.168.1.55:8554/live`, and the engine starts with the PHONE source
selected. Connect the laptop and phone to the same Wi-Fi, start the IP Camera
app's RTSP server, and confirm the address in VLC. The address may change when
the phone joins a different network; override `PHONE_CAMERA_URL` with the
address shown by the app. For the hotspot demo, connect the laptop to the A06
hotspot and use the RTSP address the app shows on that network.

To override the phone URL or configure additional CCTV feeds, set these values
in PowerShell before launching the engine:

```powershell
$env:PHONE_CAMERA_URL = 'rtsp://<phone-ip>:<port>/<stream-path>'
$env:CCTV_2_URL = 'rtsp://<camera-2-ip>:<port>/<stream-path>'
$env:CCTV_3_URL = 'rtsp://<camera-3-ip>:<port>/<stream-path>'
python main.py
```

Set `CCTV_URL` as well if CCTV 1 does not use the existing default. Keep stream
credentials in environment variables rather than source code. Optional sources
appear in both monitors only when their URL is configured. If a selected source
is unreachable, its feed reports a connection problem; the engine does not
silently switch to another camera. Wired Ethernet/PoE cameras connected through
a router or network switch are generally more reliable than Wi-Fi for fixed
gym CCTV, while the phone hotspot is suitable as a temporary demo network.

---

## 🛠️ Key Technologies
* **Python 3.10+**: Core execution language.
* **OpenCV (`opencv-python`)**: Video stream ingestion and frame drawing.
* **`face_recognition` / `dlib`**: Biometric 128-d face vector extraction & matching.
* **MediaPipe Pose**: 33 3D body landmark joint tracking.
* **Scikit-Learn**: Random Forest exercise classifier (`workout_model.pkl`).
* **Flask & Flask-CORS**: Lightweight streaming server & API bridge.

## Multi-Person Gesture Monitoring

The gesture engine uses `models/pose_landmarker_lite.task`, the official MediaPipe
Pose Landmarker Lite model, configured to detect up to eight poses in a frame.
The Gesture Monitor associates each pose with the nearest tracked face, draws
the face box and full-body pose box together, and displays the person's name,
detected exercise, and today's assigned exercise directly above that person rather than
in a shared floating HUD. The engine uses the recognized member's workout plan
for today to rank only that member's assigned gesture classes, while retaining
the model's original (un-normalized) class probabilities so the plan cannot
force a low-confidence match. It only submits a workout for automatic
verification when a recognized member's assigned exercise is detected in at
least five of the last seven predictions and the latest and smoothed confidence
are both at least 70%. Assigned plans are refreshed from the Laravel API every
15 seconds. A successful confirmation updates the assigned workout log, which
is then available in that member's workout history and coach plan. If a member
has multiple
pending tasks with the same gesture class, the engine displays a coach-verification
warning instead of asking the API to complete an ambiguous task.

Twelve is the configured maximum, not a guaranteed frame rate or recognition
accuracy. Results depend on laptop performance, camera resolution, lighting,
distance, and whether each person's full body is visible. Test with the actual
demo camera and laptop before presenting.

The pose model is published at:
`https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`

Each newly captured camera frame is processed at most once by face and pose
inference workers; if inference falls behind, workers use the latest frame
instead of repeatedly analyzing a stale frame. A recognized member's identity
is retained on the same tracked pose for up to 1.5 seconds while the face is
temporarily turned away or occluded. Keep the exerciser's face and full body
visible to the camera between repetitions; identity retention is brief and
does not replace a clear face match. Gesture Monitor reports the camera's
measured capture FPS rather than a simulated latency value.
