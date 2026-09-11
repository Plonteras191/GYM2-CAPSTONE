# User & Technical Documentation Manual

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. Document Purpose & Audience

This comprehensive manual combines **User Operational Guides** for daily gym staff/administrators and **Technical System Specifications** for system administrators, developers, and hardware maintenance technicians.

### Target Audiences
1. **Gym Owner & System Administrators**: Daily operational usage, member enrollment, payment processing, subscription management, and report generation.
2. **Gym Coaches & Trainers**: Workout program assignment, live AI gesture verification monitoring, and manual task verification overrides.
3. **Gym Members / Athletes**: Onboarding procedures, biometric face enrollment, and touchless attendance check-in.
4. **Developers & System Technicians**: Local/server installation, environment configuration, database migrations, Python AI engine microservice execution, camera setup, and troubleshooting.

---

# PART A: USER OPERATIONAL MANUAL

## 2. Gym Owner & System Administrator Guide

### 2.1. System Authentication & Dashboard Access
1. Open a web browser (Google Chrome, Microsoft Edge, or Mozilla Firefox) and navigate to the application URL (e.g., `http://localhost:5173` or gym domain).
2. Enter administrative email and password credentials.
3. Upon validation via **Laravel Sanctum**, the system redirects to the **Executive Dashboard**.

```
+-----------------------------------------------------------------------------------+
|  🏋️‍♂️ DOUBLE ALPHA FITNESS GYM - EXECUTIVE DASHBOARD                                 |
+-----------------------------------------------------------------------------------+
|  [ Total Members: 154 ] [ Active: 120 ] [ Today's Attendance: 42 ] [ Revenue: ₱45K ] |
+-----------------------------------------------------------------------------------+
|  📊 Attendance Volume Chart (Recharts)     | 💳 Recent Transactions Ledger          |
|  🟢 Today: Peak 5:00 PM (18 Check-ins)     | 🟢 John Doe - ₱1,500 (GCash)           |
+-----------------------------------------------------------------------------------+
```

---

### 2.2. Member Directory & Biometric Registration
1. Navigate to **Member Management** -> **Add New Member**.
2. Complete the required personal information fields:
   * **First & Last Name**, **Email Address**, **Contact Number**, **Residential Address**.
3. Input physical & anthropometric body metrics:
   * **Date of Birth**, **Height (cm)**, **Weight (kg)**, **Body Type** (Ectomorph, Mesomorph, Endomorph).
4. **Profile Photo & Biometric Face Enrollment**:
   * Upload a clear front-facing profile photo (`.jpg`/`.png`).
   * Click **Enroll Facial Biometrics**. The system captures the face image and sends it to the Python AI engine to extract and store the **128-dimensional vector encoding** (`enrolled_face_id`).
5. Click **Save Member**. The member status defaults to **Active**.

---

### 2.3. Attendance Tracking & Live Feed Monitor
1. Navigate to **Attendance Monitor**.
2. The page features two primary components:
   * **Live Stream Feed**: Low-latency video player (JSMpeg / Canvas) displaying entrance camera coverage with real-time face detection bounding boxes.
   * **Today's Attendance Ticker**: Real-time table displaying check-in date, exact timestamp, member name, and verification method.
3. **Automated Touchless Check-in Rules**:
   * **Operating Hours Enforcement**: Attendance check-in is strictly active between **9:00 AM and 9:30 PM**. Check-ins attempted outside operating hours will be rejected by the backend guard.
   * **Single Daily Check-in Rule**: A member can only log one official attendance check-in per calendar day. Subsequent detections on the same day will trigger a soft warning alert without duplicating logs.

---

### 2.4. Subscription Lifecycle & Membership Management
1. Navigate to **Subscription Management**.
2. To create or renew a membership:
   * Select the target member.
   * Select a **Plan Tier** (e.g., Daily Pass, Monthly Basic, VIP Annual).
   * Specify **Start Date** and **End Date** (automatically calculated based on plan duration).
   * Choose **Payment Method** (Cash, GCash, Maya) and input payment reference codes.
3. **Automated Status Badges**:
   * 🟢 **Active**: Valid active membership (`end_date` > today + 7 days).
   * 🟡 **Expiring Soon**: Membership expiring within 7 days.
   * 🔴 **Expired**: Past renewal date (`end_date` < today).
   * ⚪ **Inactive**: Member inactive for 30+ days (automatically flagged by the AI Inactivity Auditor).

---

### 2.5. Payment Processing & Receipt Generation
1. Navigate to **Financial Transactions**.
2. Click **Record New Payment**.
3. Fill in transaction details:
   * **Member Name**, **Transaction Type** (Membership Fee, Renewal, Day Pass).
   * **Amount (₱)**, **Payment Mode** (`Cash`, `GCash`, `Maya`).
   * **E-Wallet Reference Code** (Required for GCash and Maya).
4. Click **Submit & Generate Receipt**.
5. Click **Print / Download Receipt** to output a formatted digital invoice containing gym header, transaction ID, date, member code, amount, and staff signature block.

---

### 2.6. Reports & Analytics Module
1. Navigate to **Reports & Analytics**.
2. Select desired report type:
   * **Attendance History Report**: Filterable by date range, peak hours, and member attendance frequency.
   * **Financial Revenue Report**: Income breakdown by payment method (Cash vs. Digital), plan tier revenue, and daily/monthly totals.
   * **Membership Status Summary**: Total active vs. expired vs. inactive member distributions.
   * **Workout Verification Logs**: Total AI-verified exercise repetitions completed.
3. Click **Export Report** to download formatted **CSV** or **PDF** files for official gym auditing.

---

## 3. Gym Coach & Trainer Operational Guide

### 3.1. Assigning Workout Programs
1. Navigate to **Coach Portal** -> **Assign Program**.
2. Select member and choose an approved exercise movement:
   * **Squats**, **Bicep Curls**, **Push-ups**.
3. Input target repetition count (e.g., 3 sets of 10 reps).
4. Click **Assign Program**. The task appears on the member's workout queue.

---

### 3.2. Live AI Gesture Verification & Rep Counting
1. Navigate to **Gesture Verification Monitor**.
2. Select the active camera stream pointing to the gym exercise floor.
3. As the member executes the exercise in front of the camera:
   * MediaPipe tracks **33 3D body landmark joints** in real time.
   * The **Scikit-Learn classifier (`workout_model.pkl`)** verifies correct exercise form.
   * The **Repetition Counter State Machine** tracks flexion/extension joint angles and automatically increments verified rep counts on screen (`0/10` -> `1/10` -> `10/10`).
4. Once target reps are reached, the system automatically marks the task as **`verified_ai`** and logs it in the database.

---

### 3.3. Manual Verification Override
If camera visibility is obscured or a member performs an unassisted variation:
1. The Coach reviews the live or recorded exercise attempt.
2. Click **Manual Verification Override** next to the target task.
3. Enter Coach authentication PIN and confirm task completion.
4. The system logs the exercise status as **`verified_manual`**.

---

# PART B: TECHNICAL & DEVELOPER DOCUMENTATION

## 4. System Requirements & Environment Prerequisites

### 4.1. Hardware Requirements
| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Host CPU** | Intel Core i5 (8th Gen) / AMD Ryzen 5 | Intel Core i7 (11th Gen+) / AMD Ryzen 7 |
| **RAM** | 8 GB DDR4 | 16 GB DDR4/DDR5 |
| **Storage** | 256 GB SSD | 512 GB NVMe SSD |
| **Cameras** | 1x USB Webcam (720p 30fps) | Hikvision RTSP IP Cameras (1080p 30fps) |
| **Network** | Fast Ethernet (100 Mbps LAN) | Gigabit Ethernet (1 Gbps LAN) |

---

### 4.2. Software Dependencies
| Software / Runtime | Required Version | Purpose |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11 or Ubuntu 22.04 LTS | Operating environment |
| **PHP** | v8.2.x or v8.3.x | Backend Laravel core runtime |
| **Composer** | v2.6+ | PHP package manager |
| **Node.js** | v18.x or v20.x LTS | Frontend JavaScript runtime |
| **NPM** | v9.x or v10.x | React frontend package manager |
| **Python** | v3.10.x or v3.11.x | AI Vision & Gesture Engine runtime |
| **MySQL Server** | v8.0+ | Centralized database server |
| **OpenCV** | `opencv-python` v4.8+ | Computer vision stream processing |
| **MediaPipe** | `mediapipe` v0.10+ | Human pose estimation & landmark tracking |

---

## 5. System Installation & Setup Guide

### Step 1: Database Setup
1. Launch MySQL Server (via XAMPP, WampServer, or native MySQL service).
2. Create an empty database named `gym_management`:
   ```sql
   CREATE DATABASE gym_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Step 2: Backend Installation (Laravel API)
1. Open terminal and navigate to the backend directory:
   ```bash
   cd c:\CLIENT\GYM\GYM2-CAPSTONE\backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Environment Configuration:
   * Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   * Update database credentials in `.env`:
     ```ini
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=gym_management
     DB_USERNAME=root
     DB_PASSWORD=
     ```
4. Generate Application Key & Storage Link:
   ```bash
   php artisan key:generate
   php artisan storage:link
   ```
5. Run Database Migrations & Seeders:
   ```bash
   php artisan migrate --seed
   ```
6. Start Backend API Server:
   ```bash
   php artisan serve --host=127.0.0.1 --port=8000
   ```

---

### Step 3: Frontend Installation (React SPA)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd c:\CLIENT\GYM\GYM2-CAPSTONE\frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start Development Server:
   ```bash
   npm run dev
   ```
4. Access interface in browser at `http://localhost:5173`.

---

### Step 4: AI Vision & Gesture Engine Setup (Python Microservice)
1. Open a new terminal and navigate to the AI engine directory:
   ```bash
   cd "c:\CLIENT\GYM\GYM2-CAPSTONE\AI Vision & Gesture Engine"
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Launch AI Engine Server:
   ```bash
   python gesture_engine.py
   ```
   * The Python Flask server starts listening on `http://127.0.0.1:5000`.

---

## 6. REST API Endpoint Reference Contracts

| Method | Endpoint | Auth | Description | Request Payload Sample |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login | `{"email": "admin@gym.com", "password": "secret"}` |
| `GET` | `/api/members` | Sanctum | List all members | Headers: `Authorization: Bearer <token>` |
| `POST` | `/api/members` | Sanctum | Create member profile | Multipart form data (includes `profile_pic`) |
| `POST` | `/api/attendance/checkin`| Internal/API | AI Touchless Check-in | `{"member_id": 5, "time": "2026-09-10 10:15:00"}` |
| `GET` | `/api/memberships` | Sanctum | Get active subscriptions| None |
| `POST` | `/api/transactions` | Sanctum | Record new payment | `{"member_id": 5, "amount": 1500, "payment_method": "GCash"}` |
| `POST` | `/api/workouts/verify-task`| Internal/API| AI Rep Verification | `{"task_id": 12, "completed_reps": 10, "status": "verified_ai"}` |

---

## 7. Camera & RTSP Hardware Configuration

### 7.1. Hikvision IP CCTV RTSP Connection String
To connect an IP CCTV camera to the Python AI engine, update the RTSP stream URL in configuration:
```python
RTSP_URL = "rtsp://admin:GymPassword123@192.168.1.100:554/Streaming/Channels/101"
cap = cv2.VideoCapture(RTSP_URL)
```

### 7.2. Camera Installation Guidelines
* **Camera Height**: Position entrance and floor cameras at **1.8m to 2.2m** above floor level.
* **Camera Angle**: Maintain a downward tilt angle between **15° and 30°**.
* **Lighting Requirements**: Ensure even ambient lighting (minimum **300 Lux**) without harsh backlighting directly behind faces.
* **Distance to Subject**: Face detection optimal range is **1.0m to 3.5m** from camera lens.

---

## 8. Troubleshooting & Maintenance Guide

### 8.1. Common Operational Issues & Resolutions

| Problem / Error | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **"Face Not Recognized" Alert** | Poor lighting, obstruction, or missing enrollment vector. | Ensure member faces camera directly under good lighting; re-enroll face biometrics if needed. |
| **"Check-in Rejected" Error** | Attempted check-in outside 9:00 AM–9:30 PM, or duplicate check-in. | Verify system clock time and confirm member hasn't already checked in today. |
| **CORS Policy Error in Frontend** | Laravel API missing CORS header configuration. | Verify `config/cors.php` in Laravel backend permits `http://localhost:5173`. |
| **RTSP Video Feed Disconnection** | IP CCTV network timeout or wrong IP address. | Ping camera IP address (`192.168.x.x`), check LAN cable, and verify RTSP credentials. |
| **Database Connection Refused** | MySQL service stopped or incorrect `.env` port. | Start MySQL in XAMPP/Services and verify `DB_PORT=3306` in `.env`. |

---

### 8.2. MySQL Database Backup & Maintenance Command
To perform a full manual backup of the MySQL database:
```bash
mysqldump -u root -p gym_management > gym_management_backup_2026.sql
```
To restore database from backup:
```bash
mysql -u root -p gym_management < gym_management_backup_2026.sql
```
