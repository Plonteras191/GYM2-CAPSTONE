import os
# Force OpenCV to use strict TCP FFMPEG pipeline before loading anything else
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
import cv2

CAMERA_URL = (
    os.getenv('CAMERA_TEST_URL')
    or os.getenv('CCTV_2_URL')
    or os.getenv('CCTV_URL')
    or ''
).strip()

if not CAMERA_URL:
    raise SystemExit(
        "Set CAMERA_TEST_URL, CCTV_2_URL, or CCTV_URL to an RTSP stream before testing."
    )

print("Attempting to connect to the configured CCTV stream...")
cap = cv2.VideoCapture(CAMERA_URL, cv2.CAP_FFMPEG)

if not cap.isOpened():
    print(
        "ERROR: Could not open the CCTV stream. Check the camera IP, RTSP settings, "
        "stream path, and credentials."
    )
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