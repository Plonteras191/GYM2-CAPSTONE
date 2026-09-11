import os
# Force OpenCV to use strict TCP FFMPEG pipeline before loading anything else
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
import cv2

# Your specific Hikvision Camera
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/102'

print("Attempting to connect to HIKVISION camera via Python...")
cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)

if not cap.isOpened():
    print("ERROR: OpenCV completely failed to open the camera stream. Check IP/Credentials.")
else:
    print("SUCCESS: Camera opened! Waiting for video frames...")
    while True:
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print("ERROR: Connected, but the camera sent a dead/blank frame.")
            break
            
        cv2.imshow("Direct Python CCTV Test", frame)
        
        # Press 'q' on your keyboard to close the window
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()