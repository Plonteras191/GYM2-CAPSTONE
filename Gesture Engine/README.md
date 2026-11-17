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
├── tests/                   # Automated tests (run: python -m unittest discover tests)
├── main.py                  # Standard application entry point wrapper
├── gesture_engine.py        # Core Flask streaming web service & vision inference engine
├── face_encoder_pool.py     # Helper processes that encode faces without stalling the video
├── face_matching.py         # Distance, margin and vote rules for naming a face
├── face_enrollment.py       # Loads the enrolled face photos
├── rep_counter.py           # Counts repetitions from joint angles
├── attendance_queue.py      # Saves check-ins to a file and retries when Laravel is down
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

For a standalone Reolink P330, enable RTSP through the Reolink mobile app (the
web or desktop interface may not expose this setting). The RTSP port shown in
the app is 554. Reolink's documented stream paths are `Preview_01_main` for the
main stream and `Preview_01_sub` for the sub-stream. Confirm these if using an
NVR or Home Hub, where channel numbering may differ.
Use the main stream to evaluate detail, keeping in mind that decoding a 4K stream
can reduce capture FPS on the engine PC. To test the P330 as CCTV 2 and select it
at startup:

```powershell
$p330Ip = Read-Host 'P330 IP address'
$cameraUser = Read-Host 'P330 username'
$securePassword = Read-Host 'P330 password' -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
$encodedUser = [uri]::EscapeDataString($cameraUser)
$encodedPassword = [uri]::EscapeDataString($plainPassword)
$env:CCTV_2_URL = "rtsp://${encodedUser}:${encodedPassword}@${p330Ip}:554/Preview_01_main"
$env:CAMERA_SOURCE = 'cctv_2'
Remove-Variable securePassword, plainPassword, encodedPassword, cameraUser, encodedUser
python scripts/test_cam.py
# After pressing q to close the test window:
python main.py
```

The test script shows received frames without printing the stream URL. Set the
same variables before `python main.py` to use the P330 in the Gesture and
Security Monitors. If a username or password contains URL-reserved characters,
URL-encode them. Do not commit or share the RTSP URL; it contains the camera
credentials.

Set `CCTV_URL` as well if CCTV 1 does not use the existing default. Keep stream
credentials in environment variables rather than source code. CCTV 2 is listed
in both monitors even before it is configured; selecting it without `CCTV_2_URL`
will show a configuration error. Other optional sources appear only when their
URL is configured. If a configured source is unreachable, its feed reports a
connection problem; the engine does not silently switch to another camera.
Wired Ethernet/PoE cameras connected through
a router or network switch are generally more reliable than Wi-Fi for fixed
gym CCTV, while the phone hotspot is suitable as a temporary demo network.

---

## 🛠️ Key Technologies
* **Python 3.10+**: Core execution language.
* **OpenCV (`opencv-python`)**: Video stream ingestion and frame drawing.
* **`face_recognition` / `dlib`**: Biometric 128-d face vector extraction & matching.
* **MediaPipe Pose**: 33 3D body landmark joint tracking.
* **Scikit-Learn**: Random Forest exercise classifier (`workout_model.pkl`).
* **Repetition counter**: joint-angle state machine for squat, push-up, curl and sit-up (`rep_counter.py`).
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

## Face recognition rules (current)

A face is named only when all of these hold: its distance to an enrolled photo is at most `FACE_MATCH_THRESHOLD` (0.50; `FACE_FAR_THRESHOLD` 0.45 for a small, far face), the best member leads the second best by `FACE_MATCH_MARGIN` (0.05), and `FACE_VOTES_REQUIRED` (3) recent checks agree. Faces smaller than `FACE_MIN_SIZE` (40 px) are not recognized. Encoding runs in `FACE_ENCODER_PROCESSES` helper processes (default 2) so the live video keeps moving. If Laravel cannot be reached, a check-in is saved to a queue file and retried. An unrecognized face is shown as Unknown, and the admin can check the member in by hand from the Attendance Monitor. Settings are in `.env` (see `.env.example`).

## Who is tracked and how repetitions are counted

* **Eligibility.** The Gesture Monitor tracks only members with an active With Coach subscription. A recognized member without one gets a grey "name - no coach plan" tag. Laravel sends the eligible members with today's plans.
* **Counted exercises.** For the exercises listed in `REP_EXERCISES` (default: SQUAT, PUSH UP, CURL, SIT UP) the engine counts repetitions from the joint angle (knee, elbow or hip) with smoothing and a down/up state change. The count is kept per member, so it continues if the pose track changes.
* **Progress and completion.** While counting, the engine sends `completed = false` with `counted_reps` every few seconds; Laravel keeps the highest value. When the target (sets × reps from the training plan) is reached it sends the final verification (`verified_by = ai`). Exercises that are not counted are verified when recognized, as described above.
* **Pose model.** `POSE_MODEL=full` (default in `.env.example`) is more accurate for distant people; `lite` is lighter on the CPU.
* **Not a posture checker.** The system counts movement; it does not judge form or safety.
