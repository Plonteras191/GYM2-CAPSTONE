# Master System Installation & Deployment Guide

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. Executive System Overview & Architecture Topology

The **Camera-Based Gym Management System** is composed of three interconnected application tiers:
1. **Laravel 12 REST API Backend** (`http://127.0.0.1:8000`) - Manages database records, authentication, Carbon time guards, subscriptions, and financial billing.
2. **React 19 SPA Frontend** (`http://localhost:5173`) - Provides interactive management dashboards, attendance tickers, and camera stream monitors.
3. **Python 3.10+ AI Vision & Gesture Microservice** (`http://127.0.0.1:5000`) - Ingests RTSP/USB camera feeds, executes OpenCV / `face_recognition` biometric matching, tracks MediaPipe body landmarks, and counts exercise repetitions.

---

## 2. Complete Multi-Tier Installation Sequence

```mermaid
flowchart TD
    PREREQ["1️⃣ Install Prerequisites\n(PHP 8.2+, Node 18+, Python 3.10+, MySQL 8.0+)"] --> DB["2️⃣ Create MySQL Database\n(gym_management)"]
    DB --> BACKEND["3️⃣ Backend Setup\n(composer install -> php artisan migrate --seed -> serve)"]
    BACKEND --> FRONTEND["4️⃣ Frontend Setup\n(npm install -> npm run dev)"]
    BACKEND --> PYTHON["5️⃣ Python AI Engine Setup\n(venv -> pip install -r requirements.txt -> gesture_engine.py)"]
    FRONTEND & PYTHON --> READY["🚀 Fully Operational System!"]
```

---

## 3. Terminal Execution Command Cheat-Sheet

### Terminal 1: MySQL Database Initialization
```bash
# Open MySQL CLI
mysql -u root -p

# Create Database
CREATE DATABASE gym_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

---

### Terminal 2: Backend (Laravel API)
```bash
cd c:\CLIENT\GYM\GYM2-CAPSTONE\backend
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

---

### Terminal 3: Frontend (React SPA)
```bash
cd c:\CLIENT\GYM\GYM2-CAPSTONE\frontend
npm install
npm run dev
```

---

### Terminal 4: AI Vision & Gesture Engine (Python Microservice)
```bash
cd "c:\CLIENT\GYM\GYM2-CAPSTONE\AI Vision & Gesture Engine"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python gesture_engine.py
```

---

## 4. Single-Command System Startup Script Options

To streamline daily operations for the Gym Owner or System Administrator, a single-command startup script can be used:

### Windows PowerShell Startup Script (`start_system.ps1`)
```powershell
# Create script in project root
Write-Host "🚀 Launching Double Alpha Gym Management System..." -ForegroundColor Green

# Start Backend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\CLIENT\GYM\GYM2-CAPSTONE\backend'; php artisan serve --port=8000"

# Start Frontend Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\CLIENT\GYM\GYM2-CAPSTONE\frontend'; npm run dev"

# Start AI Engine
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\CLIENT\GYM\GYM2-CAPSTONE\AI Vision & Gesture Engine'; .\venv\Scripts\Activate.ps1; python gesture_engine.py"

Write-Host "✅ All System Services Started Successfully!" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "⚙️ Backend API: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "🤖 AI Vision Feed: http://127.0.0.1:5000/video_feed" -ForegroundColor Yellow
```

---

## 5. Summary of System Port Allocations

| Service / Microservice | Technology | Local URL / Endpoint | Port |
| :--- | :--- | :--- | :--- |
| **Frontend Web Portal** | React 19 / Vite 8 | `http://localhost:5173` | `5173` |
| **Backend REST API** | Laravel 12 / PHP 8.2 | `http://127.0.0.1:8000/api` | `8000` |
| **AI Vision Engine** | Python / Flask | `http://127.0.0.1:5000` | `5000` |
| **MySQL Database** | MySQL Server 8.0+ | `localhost:3306` (`gym_management`) | `3306` |
| **RTSP CCTV Cameras** | Hikvision RTSP Stream| `rtsp://admin:pass@192.168.x.x:554` | `554` |
