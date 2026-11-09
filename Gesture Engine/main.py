"""
AI Vision & Gesture Engine - Entry Point
Double Alpha Fitness Gym Management System
"""

import sys
import os

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure the root folder of AI Vision Engine is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from gesture_engine import app, start_background_workers, AI_ENGINE_HOST, AI_ENGINE_PORT

if __name__ == '__main__':
    print("🚀 [STARTUP] Starting AI Vision & Gesture Engine Microservice...")
    print(f"🌐 Listening on http://{AI_ENGINE_HOST}:{AI_ENGINE_PORT}")
    start_background_workers()
    app.run(host=AI_ENGINE_HOST, port=AI_ENGINE_PORT, debug=False, threaded=True)
