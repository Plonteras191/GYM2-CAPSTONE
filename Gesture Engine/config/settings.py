import os

# Base directory of the AI Vision & Gesture Engine component
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Backend API Configuration
LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")

# Directory Paths
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')

# File Paths
WORKOUT_MODEL_PATH = os.path.join(MODELS_DIR, 'workout_model.pkl')
DATASET_CSV_PATH = os.path.join(DATASETS_DIR, 'custom_workout_dataset.csv')

# Camera Stream Configuration
DEFAULT_CCTV_URL = os.getenv('CCTV_URL', 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101')

# OpenCV Environment Flags
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"
