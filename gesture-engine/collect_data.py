import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import os
import time

# Force TCP for CCTV
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

# --- CONFIGURATION ---
# Change this variable to the name of the exercise you are about to perform!
EXERCISE_NAME = "IDLE"  
FRAMES_TO_COLLECT = 300 # It will record 300 frames of you doing the exercise
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/102'

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Create an empty list to hold your body coordinates
dataset = []

print(f"⚠️ GET READY! Starting data collection for {EXERCISE_NAME} in 5 seconds...")
time.sleep(5)

# Open the CCTV Camera!
print("Connecting to CCTV...")
cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    frames_collected = 0
    
    while cap.isOpened() and frames_collected < FRAMES_TO_COLLECT:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame. Make sure CCTV is online.")
            break
            
        # Recolor image to RGB for MediaPipe
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        
        # Make detection
        results = pose.process(image)
        
        # Recolor back to BGR for OpenCV display
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # Extract landmarks and save them to the dataset
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            
            # Grab the coordinates of all 33 joints
            landmarks = results.pose_landmarks.landmark
            
            # Flatten the X, Y, Z, and Visibility data into a single row
            pose_row = list(np.array([[landmark.x, landmark.y, landmark.z, landmark.visibility] for landmark in landmarks]).flatten())
            
            # Append the name of the exercise to the end of the row as the "Label"
            pose_row.append(EXERCISE_NAME)
            dataset.append(pose_row)
            
            frames_collected += 1
            
        # Display the UI
        cv2.putText(image, f"Recording {EXERCISE_NAME}: {frames_collected}/{FRAMES_TO_COLLECT}", 
                    (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
                    
        cv2.imshow('AI Dataset Collector', image)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()

# --- SAVE TO SPREADSHEET ---
if frames_collected > 0:
    # Dynamically create the column names for all 33 joints (x, y, z, v)
    landmarks_columns = []
    for i in range(1, 34):
        landmarks_columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
    landmarks_columns.append('class_label') # The final column is the name of the exercise

    # Save the recorded data to a CSV file!
    df = pd.DataFrame(dataset, columns=landmarks_columns)

    # If the file already exists, append to it. If not, create a new one.
    if os.path.exists('custom_workout_dataset.csv'):
        df.to_csv('custom_workout_dataset.csv', mode='a', header=False, index=False)
    else:
        df.to_csv('custom_workout_dataset.csv', index=False)

    print(f"\n✅ SUCCESS! {frames_collected} frames of {EXERCISE_NAME} have been successfully injected into custom_workout_dataset.csv!")
else:
    print("\n❌ FAILED to collect any frames. Make sure you are visible to the camera.")