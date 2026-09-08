import os
import cv2
import json
import mediapipe as mp
import numpy as np
import pandas as pd

DATASET_JSON = r"C:\Users\THUNDEROBOT\OneDrive\Desktop\gym2\frontend\public\dataset\data\exercises.json"
GIF_FOLDER = r"C:\Users\THUNDEROBOT\OneDrive\Desktop\gym2\frontend\public\dataset\videos"

# 🚨 THE TARGET LIST: Broadened keywords to ensure we catch the GIFs!
TARGET_EXERCISES = [
    "squat", "curl", "jumping jack", "push up", "lunge", 
    "crunch", "plank", "high knee", "burpee", "deadlift",
    "mountain climber", "sit up", "russian twist"
]

mp_pose = mp.solutions.pose
dataset = []

print("🚀 INITIALIZING NORMALIZED AI SCRAPER...")

try:
    with open(DATASET_JSON, 'r', encoding='utf-8') as f:
        all_exercises = json.load(f)
        if isinstance(all_exercises, dict) and 'data' in all_exercises:
            all_exercises = all_exercises['data']
except FileNotFoundError:
    print(f"❌ ERROR: Could not find exercises.json at {DATASET_JSON}")
    exit()

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    for target in TARGET_EXERCISES:
        
        matched_exercise = None
        for ex in all_exercises:
            if target.lower() in ex.get('name', '').lower():
                matched_exercise = ex
                break 
                
        if not matched_exercise:
            continue
            
        ex_name = matched_exercise.get('name')
        ex_id = str(matched_exercise.get('id')).zfill(4) 
        
        gif_path = None
        for filename in os.listdir(GIF_FOLDER):
            if filename.startswith(ex_id) and filename.endswith('.gif'):
                gif_path = os.path.join(GIF_FOLDER, filename)
                break
                
        if not gif_path:
            continue

        cap = cv2.VideoCapture(gif_path)
        frames_extracted = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break 
                
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # 🚨 THE CAPSTONE FIX: Translation Invariance (Normalization)
                # We use the Nose (landmark 0) as the anchor point (0,0)
                origin_x, origin_y, origin_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
                
                pose_row = list(np.array([[lm.x - origin_x, lm.y - origin_y, lm.z - origin_z, lm.visibility] for lm in landmarks]).flatten())
                
                # Tag the math data with the clean generic target name
                pose_row.append(target.upper()) 
                dataset.append(pose_row)
                frames_extracted += 1
                
        cap.release()
        print(f"  ✅ Extracted {frames_extracted} frames for {target.upper()}")

if len(dataset) > 0:
    landmarks_columns = []
    for i in range(1, 34):
        landmarks_columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
    landmarks_columns.append('class_label')
    df = pd.DataFrame(dataset, columns=landmarks_columns)
    df.to_csv('custom_workout_dataset.csv', index=False)
    print("\n✅ NORMALIZED DATASET SAVED! Run train_model.py!")