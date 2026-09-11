"""
AI Vision & Gesture Engine - Entry Point
Double Alpha Fitness Gym Management System
"""

import sys
import os

# Ensure the root folder of AI Vision Engine is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from gesture_engine import app

if __name__ == '__main__':
    print("🚀 [STARTUP] Starting AI Vision & Gesture Engine Microservice...")
    print("🌐 Listening on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
