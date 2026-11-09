import os
import re

# Base directory of the AI Vision & Gesture Engine component
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_env_file(path):
    """Load KEY=VALUE lines from a local .env file into os.environ.

    Secrets (camera password, AI service key) live in "Gesture Engine/.env",
    which is git-ignored, so they are never committed. Real environment
    variables always win over values in the file.
    """
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_env_file(os.path.join(BASE_DIR, '.env'))

# Backend API Configuration
LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")

# Shared secret sent to Laravel in the X-AI-Key header. Must equal AI_SERVICE_KEY in backend/.env.
AI_SERVICE_KEY = os.getenv("AI_SERVICE_KEY", "")
AI_HEADERS = {"X-AI-Key": AI_SERVICE_KEY, "Accept": "application/json"}

# Directory Paths
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')

# File Paths
WORKOUT_MODEL_PATH = os.path.join(MODELS_DIR, 'workout_model.pkl')
DATASET_CSV_PATH = os.path.join(DATASETS_DIR, 'custom_workout_dataset.csv')


def build_cctv_url(channel):
    """Build the Hikvision RTSP URL from .env values (no password in source code).

    Set CCTV_URL to override everything, or set CCTV_USER / CCTV_PASSWORD /
    CCTV_HOST / CCTV_PORT individually.
    """
    if os.getenv('CCTV_URL'):
        return os.getenv('CCTV_URL')
    user = os.getenv('CCTV_USER', 'admin')
    password = os.getenv('CCTV_PASSWORD', '')
    host = os.getenv('CCTV_HOST', '192.168.1.45')
    port = os.getenv('CCTV_PORT', '554')
    return f"rtsp://{user}:{password}@{host}:{port}/Streaming/Channels/{channel}"


def mask_url(url):
    """Hide the password in an RTSP URL before printing or returning it."""
    return re.sub(r'(rtsp://[^:/@]+:)[^/]*@', r'\1****@', url or '')


# Camera Stream Configuration (101 = main stream, 102 = low-latency sub-stream)
DEFAULT_CCTV_URL = build_cctv_url(os.getenv('CCTV_CHANNEL', '101'))
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'cctv').lower()  # 'cctv' or 'webcam'
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))

# Browser origins allowed to call the Flask API (CORS). Default: localhost and
# private LAN addresses on any port, so phones on the gym Wi-Fi still work.
CORS_ORIGINS = os.getenv(
    'CORS_ORIGINS',
    r'^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$'
)

# OpenCV Environment Flags for Real-Time Zero-Buffer Streaming
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000|reorder_queue_size;0"
