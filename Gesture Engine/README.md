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
│   └── workout_model.pkl    # Trained Scikit-Learn workout classifier model binary
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

---

## 🛠️ Key Technologies
* **Python 3.10+**: Core execution language.
* **OpenCV (`opencv-python`)**: Video stream ingestion and frame drawing.
* **`face_recognition` / `dlib`**: Biometric 128-d face vector extraction & matching.
* **MediaPipe Pose**: 33 3D body landmark joint tracking.
* **Scikit-Learn**: Random Forest exercise classifier (`workout_model.pkl`).
* **Flask & Flask-CORS**: Lightweight streaming server & API bridge.
