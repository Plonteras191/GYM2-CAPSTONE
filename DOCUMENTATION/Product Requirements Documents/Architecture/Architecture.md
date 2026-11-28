# System Architecture Document

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Muscle Bros.ph Fitness Gym (Zone 2a Baluarte, Tagoloan, Misamis Oriental)  
**Document Version:** 2.0  
**Date:** November 17, 2026  
**Describes:** the system as built on this date.  

---

## 1. Architectural Overview & Design Philosophy

The **Camera-Based Gym Management System** for Muscle Bros.ph Fitness Gym is engineered using a decoupled, 4-tier client-server architecture. It seamlessly integrates a high-performance **React 19 Single Page Application (SPA)** frontend, a robust **Laravel 12 RESTful API** business logic layer, a specialized **Python 3.10+ AI Vision & Gesture Engine**, and a centralized **MySQL database**.

### Core Design Principles
1. **Decoupled Service Architecture**: The heavy computer vision processing (face recognition and MediaPipe pose estimation) is decoupled into an independent Python microservice engine, preventing CPU-intensive vision calculations from blocking backend web server HTTP requests.
2. **Real-Time Touchless Operations**: Live camera feeds (RTSP CCTV and USB Webcams) interact with AI vision pipelines to enable fast facial identification and real-time exercise repetition counting.
3. **Cross-Platform Accessibility**: The frontend interface is fully responsive, leveraging modern CSS utilities and React SPA architecture for seamless management across desktop workstations, tablets, and mobile devices.
4. **Data Integrity & Controlled Automation**: Strict business rules (e.g., operating hours validation from 9:00 AM – 9:30 PM, a single check-in per member per day, one running subscription per member, automated subscription and inactivity status changes) ensure accurate gym operations.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Hardware_Layer ["📷 Hardware & Device Layer"]
        CCTV["Hikvision IP CCTV Cameras (RTSP)"]
        WEBCAM["USB Webcams (Direct Video Capture)"]
    end

    subgraph Presentation_Layer ["🎨 Presentation Layer (Frontend SPA)"]
        UI["React 19 + Vite 8 UI"]
        TW["Tailwind CSS v4 Styling"]
        ROUTER["React Router v7"]
        STREAM_PLAYER["MJPEG video feed (image element)"]
        AXIOS["Axios HTTP Client"]
    end

    subgraph AI_Engine_Layer ["🤖 AI Vision & Gesture Engine Layer (Python 3.10+)"]
        FLASK["Flask REST & Streaming Server"]
        POOL["Face encoder processes (helper pool)"]
        OPENCV["OpenCV Frame Processor"]
        FACE_REC["Biometric Face Recognition Engine (face_recognition / dlib)"]
        MEDIAPIPE["MediaPipe Pose Landmark Tracking"]
        ML_MODEL["Exercise classifier (workout_model.pkl)"]
        REP_COUNTER["Repetition counter (joint angles)"]
    end

    subgraph Application_Layer ["⚙️ Application Layer (Laravel 12 REST API)"]
        SANCTUM["Laravel Sanctum Auth Guard"]
        CTRL_MEMBERS["Member Controller"]
        CTRL_ATTENDANCE["Attendance Controller"]
        CTRL_WORKOUTS["Workout / Task Controller"]
        CTRL_PAYMENTS["Payment & Subscription Controller"]
        CTRL_REPORTS["Analytics & Reports Engine"]
        CARBON["Carbon Schedule & Hours Guard"]
    end

    subgraph Data_Layer ["🗄️ Data & Storage Layer"]
        MYSQL[("Centralized MySQL Database")]
        STORAGE["Local File Storage (Face Profiles & Receipts)"]
    end

    %% Communications & Streams
    CCTV -->|RTSP Video Stream| OPENCV
    WEBCAM -->|USB / WebRTC / HTTP Stream| OPENCV

    UI -->|Axios REST Requests| SANCTUM
    SANCTUM --> CTRL_MEMBERS & CTRL_ATTENDANCE & CTRL_WORKOUTS & CTRL_PAYMENTS & CTRL_REPORTS

    OPENCV --> FACE_REC
    FACE_REC --- POOL
    OPENCV --> MEDIAPIPE --> ML_MODEL --> REP_COUNTER

    FACE_REC -->|HTTP Bridge API| CTRL_ATTENDANCE
    REP_COUNTER -->|HTTP Bridge API| CTRL_WORKOUTS

    FLASK -->|MJPEG Stream| STREAM_PLAYER
    STREAM_PLAYER --> UI

    CTRL_MEMBERS & CTRL_ATTENDANCE & CTRL_WORKOUTS & CTRL_PAYMENTS & CTRL_REPORTS --> MYSQL
    CTRL_MEMBERS --> STORAGE
```


---

## 3. Tier-by-Tier Architectural Breakdown

### 3.1. Layer 1: Presentation Layer (Frontend)
The frontend is the operational portal for the gym owner and the coach, who share one administrator login. Its pages are Overview, Member Registration, Attendance (every subscriber's visits), Packages (Subscriptions, Calendar, Price list), Transactions, Reports, Attendance Monitor, Gesture Monitor and Admin Profile. The gym gives no refunds: on Packages a subscription is paused and resumed instead.

* **Framework & Build System**: React 19 SPA built with Vite 8 for fast hot-module replacement and optimized bundle sizes.
* **Routing**: React Router v7 handling client-side routing, protected routes, and page navigation.
* **Styling & Components**: Tailwind CSS v4, dynamic color tokens, custom component libraries, and responsive layouts.
* **Data Visualization**:
  * **Recharts**: Render financial performance, attendance volume trends, and workout compliance charts.
  * **FullCalendar**: The Packages calendar for subscriptions, classes and events.
* **Live Video Feed Rendering**:
  * **MJPEG feed**: The Python Flask server sends annotated frames as an MJPEG stream (one for attendance, one for gestures) that the pages show in an image element.
* **State & API Management**: Axios instances send the login token with every request. The login asks only for email and password.

---

### 3.2. Layer 2: Application Business Logic Layer (Laravel Backend)
The backend manages administrative logic, database transactions, authorization, and system schedules.

* **Framework**: Laravel 12 running on PHP 8.2+.
* **Security & Authentication**:
  * **Laravel Sanctum**: Token-based API authentication for the administrator login (email and password; no verification code). A forgotten password is recovered with an emailed PIN.
  * **One operator role**: The gym owner and the coach share one administrator account. Members never log in. The Python engine uses a separate shared secret (`X-AI-Engine-Token`).
* **Core Business Rules Engine**:
  * **Operating Hours Enforcement**: Uses `Carbon` date-time library to evaluate check-in timestamps strictly within official operating hours (9:00 AM – 9:30 PM).
  * **Single Daily Attendance Rule**: Verifies whether a member has already checked in on the current calendar date before recording a new entry (also enforced by a unique key).
  * **Inactivity Rule**: An Active member with no check-in for a month becomes Inactive; a check-in or renewal makes the member Active again.
  * **Subscription Rules**: One running subscription per member; **Renew** extends a running subscription or starts a new one; an upgrade charges only the balance; a package cannot be deleted while members are subscribed to it.
  * **Coach Eligibility**: Only members with an active With Coach subscription are tracked by the Gesture Monitor.
  * **Subscription Status Badges**: Calculated from the end date:
    * 🟢 **Active**: Valid membership.
    * 🟡 **Expiring Soon**: 7 days or less prior to expiration.
    * 🔴 **Expired**: Past renewal date.
* **Financial & Receipt Engine**: Manages cash, GCash, and Maya payment records, generates printable invoice metadata, and logs payment history.

---

### 3.3. Layer 3: AI Vision & Gesture Engine Layer (Python Microservice)
A dedicated computer vision engine running Python 3.10+ that performs live biometric verification and workout posture estimation.

```mermaid
flowchart LR
    subgraph Video_Input ["Video Input"]
        FRAME["Video Frame"]
    end

    subgraph AI_Processing ["AI Vision Engine"]
        direction TB
        FACE_ENGINE["Biometric Face Engine"]
        GESTURE_ENGINE["Gesture Engine"]

        FRAME --> FACE_ENGINE
        FRAME --> GESTURE_ENGINE

        FACE_ENGINE -->|1. Face Detection| FD["dlib / HOG"]
        FD -->|2. Facial Embedding| FE["128-d Vector Generator"]
        FE -->|3. Distance and Vote Matching| FM["Distance 0.50 or less, 3 of 6 agreeing checks"]

        GESTURE_ENGINE -->|1. Pose Estimation| MP["MediaPipe Pose (33 Landmarks)"]
        MP -->|2. Feature Vector| SK["Random Forest Exercise Classifier"]
        SK -->|3. Assigned Exercise Confirmed| RC["5 of 7 predictions at 70% or more"]
        MP -->|Joint angles| CNT["Repetition Counter (squat, push-up, curl, sit-up)"]
        RC --> CNT
    end

    subgraph Backend_Bridge ["Laravel API Integration"]
        FM -->|POST /api/ai/log-attendance| ATTENDANCE_API["Attendance API"]
        CNT -->|"POST /api/ai/log-workout (progress, then final)"| WORKOUT_API["Workout Task API"]
        RC -->|"POST /api/ai/log-workout (other exercises)"| WORKOUT_API
    end
```


* **Biometric Facial Recognition Sub-Engine**:
  * Uses `face_recognition` (built on `dlib`) for face detection and 128-dimensional vector encoding. Encoding runs in helper processes so the live video does not stall.
  * Compares live face vectors against the enrolled member photos (front, chin down, left, right) by Euclidean distance. A face is accepted when the distance is 0.50 or less (0.45 for a small, far face), the best match leads the second best by a margin, and 3 of the last 6 checks agree.
  * Sends the check-in to the Laravel API after a confident match; when Laravel is unreachable the check-in is saved to a file and retried.
* **Gesture & Workout Tracking Sub-Engine**:
  * **MediaPipe Pose**: Extracts 33 3D body landmark coordinates (shoulders, elbows, hips, knees, ankles) in real time.
  * **Scikit-Learn Machine Learning Model (`workout_model.pkl`)**: A Random Forest that classifies the exercise from normalized landmark coordinates. An exercise counts as recognized when it is predicted in 5 of the last 7 checks at 70% confidence or more.
  * **Repetition Counter (`rep_counter.py`)**: For **squat, push-up, curl and sit-up**, repetitions are counted from the joint angle (knee, elbow or hip) with smoothing and a down/up state change. The count is sent as progress every few seconds and never goes down; when the target sets × reps is reached the task is verified. Other exercises are verified when recognized.
  * **Eligibility**: Only members with an active With Coach subscription are tracked; others show a grey "no coach plan" tag.
* **Service Bridge**:
  * Built using **Flask** & **Flask-CORS**.
  * Exposes local endpoints for the two live annotated video feeds, camera selection, face re-sync and status.

---

### 3.4. Layer 4: Data & Storage Layer (MySQL Database)
Centralized relational data store organizing all gym entity records and relationship maps.

#### Key Entity Schema & Relationships

```mermaid
erDiagram
    admins {
        bigint id PK
        varchar name
        varchar email UK
        varchar password
        varchar logo_path "nullable"
        timestamp created_at
        timestamp updated_at
    }
    password_reset_pins {
        bigint id PK
        varchar email
        varchar pin_hash
        tinyint attempts
        timestamp expires_at
        timestamp verified_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    personal_access_tokens {
        bigint id PK
        varchar tokenable_type
        bigint tokenable_id
        text name
        varchar token UK
        text abilities "nullable"
        timestamp last_used_at "nullable"
        timestamp expires_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    members {
        bigint id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar plan
        varchar status
        timestamp status_updated_at "nullable"
        longtext enrolled_face_id "nullable, face photo path"
        timestamp biometric_consent_at "nullable"
        varchar profile_pic "nullable"
        date dob "nullable"
        decimal height "nullable"
        decimal weight "nullable"
        varchar body_type "nullable, Ectomorph/Mesomorph/Endomorph"
        text address "nullable"
        timestamp created_at
        timestamp updated_at
    }
    package_categories {
        bigint id PK
        varchar name UK
        varchar color
        timestamp created_at
        timestamp updated_at
    }
    plans {
        bigint id PK
        varchar name
        decimal price
        int duration_days
        varchar category
        varchar category_detail "nullable"
        varchar color "nullable"
        timestamp created_at
        timestamp updated_at
    }
    memberships {
        bigint id PK
        bigint member_id FK "nullable"
        varchar member_name_snapshot "nullable"
        varchar member_email_snapshot "nullable"
        varchar member_profile_pic_snapshot "nullable"
        bigint plan_id "nullable, no FK"
        varchar plan_type
        date start_date
        date end_date
        varchar status "Active, Paused, Expired or Cancelled"
        date paused_at "nullable, day the current pause started"
        boolean auto_renew
        varchar payment_method
        varchar color
        text notes "nullable"
        timestamp created_at
        timestamp updated_at
    }
    membership_pauses {
        bigint id PK
        bigint membership_id FK
        date paused_on
        date resumed_on "nullable"
        int days "nullable, added to end_date on resume"
        bigint paused_by_admin_id "nullable, no FK"
        bigint resumed_by_admin_id "nullable, no FK"
        timestamp created_at
        timestamp updated_at
    }
    transactions {
        bigint id PK
        varchar transaction_id UK
        date transaction_date
        bigint member_id FK "nullable"
        varchar member_name_snapshot "nullable"
        varchar member_email_snapshot "nullable"
        varchar member_profile_pic_snapshot "nullable"
        bigint membership_id FK "nullable"
        varchar type
        varchar description "nullable"
        varchar payment_method
        decimal amount
        varchar status
        varchar reference_number "nullable"
        varchar package_name_snapshot "nullable"
        varchar package_category_snapshot "nullable"
        timestamp created_at
        timestamp updated_at
    }
    attendances {
        bigint id PK
        bigint member_id FK "nullable, unique with date"
        varchar member_name_snapshot "nullable"
        date date "unique with member_id"
        time time_in
        varchar source "face or manual"
        varchar camera_source "nullable"
        decimal match_distance "nullable"
        varchar subscription_status "nullable"
        varchar plan_snapshot "nullable"
        boolean reactivated
        bigint recorded_by_admin_id "nullable, no FK"
        varchar reason "nullable"
        timestamp created_at
        timestamp updated_at
    }
    workout_logs {
        bigint id PK
        bigint member_id FK
        varchar exercise
        date date
        smallint sets "nullable"
        smallint reps "nullable"
        smallint counted_reps "nullable, counted by the camera"
        varchar gesture_class "nullable"
        varchar verified_by "nullable, ai or coach"
        timestamp verified_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    coach_event_categories {
        bigint id PK
        varchar name UK
        varchar color
        timestamp created_at
        timestamp updated_at
    }
    coach_events {
        bigint id PK
        bigint category_id FK
        varchar title
        text description "nullable"
        date start_date
        date end_date
        time start_time
        time end_time
        varchar location
        timestamp created_at
        timestamp updated_at
    }

    admins ||..o{ personal_access_tokens : "tokenable_id (no FK)"
    admins ||..o{ password_reset_pins : "email (no FK)"
    members |o--o{ memberships : "member_id"
    plans |o..o{ memberships : "plan_id (no FK)"
    package_categories |o..o{ plans : "category_detail = name (no FK)"
    members |o--o{ transactions : "member_id"
    memberships |o--o{ transactions : "membership_id"
    memberships ||--o{ membership_pauses : "membership_id"
    members |o--o{ attendances : "member_id"
    members ||--o{ workout_logs : "member_id"
    coach_event_categories ||--o{ coach_events : "category_id"
```

`memberships.plan_id` has no foreign key in the database; the application keeps the link (it refuses to delete a package that members are subscribed to). Tables in the database that the application does not use are not drawn. The full column list is in the Database Documentation (v2.0).

---

### 3.5. Layer 5: Hardware & Network Integration Layer

* **Camera Hardware**:
  * **Hikvision IP CCTV Cameras**: Network-attached surveillance cameras providing RTSP video streams over local IP addresses (`rtsp://admin:password@192.168.x.x:554/Streaming/Channels/101`).
  * **USB Webcams / phone cameras**: Plug-and-play or network cameras the Gesture Engine can read directly. A webcam is enough for a small gym; a CCTV camera is optional.
* **Network Infrastructure**:
  * **Local Area Network (LAN)**: High-bandwidth Ethernet/Wi-Fi local network hosting IP RTSP camera streams, ensuring low streaming latency without internet bandwidth consumption.

---

## 4. Key Operational Flow Diagrams

### 4.1. Touchless Facial Recognition Check-In Flow

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    participant Cam as CCTV / USB Camera
    participant Py as Python AI Engine
    participant LV as Laravel API
    participant DB as MySQL Database
    actor Admin as Gym Admin Interface

    Member->>Cam: Walks in front of the camera
    Cam->>Py: Streams video frames
    Py->>Py: Detect face and compare with enrolled faces (helper process)

    alt Match confirmed (distance 0.50 or less, 3 of 6 checks agree)
        Py->>LV: POST /api/ai/log-attendance (member_id, camera, distance)
        LV->>LV: Inside gym hours (9:00 AM - 9:30 PM)?
        LV->>LV: Already checked in today?

        alt Verification passed
            LV->>DB: INSERT INTO attendances (member, date, time_in, method, camera, subscription status)
            LV->>DB: Set member Active again if the profile was Inactive
            LV-->>Py: 200 OK (check-in saved)
        else Outside hours or duplicate
            LV-->>Py: 422 (reason)
        end
        Py->>Admin: Live feed shows a green box with the name (orange RENEW if expired)
    else Laravel unreachable
        Py->>Py: Save the check-in to a queue file and retry later
    else No match
        Py->>Admin: Red box labelled Unknown
        Admin->>LV: Manual check-in (member and reason)
        LV->>DB: INSERT INTO attendances (method = manual)
    end
```


---

### 4.2. AI Gesture Workout Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    actor Admin as Admin / Coach
    participant Cam as Workout Zone Camera
    participant Py as Python AI Engine
    participant LV as Laravel API
    participant DB as MySQL Database
    participant UI as React Member Profile

    Admin->>UI: Opens the member's Training plan
    Admin->>UI: Chooses exercises, dates, sets and reps
    UI->>LV: POST the dated tasks (next 7 days)
    LV->>DB: Replace the pending tasks in workout_logs

    Member->>Cam: Starts the exercise in camera view
    Cam->>Py: Streams video frames
    Py->>LV: Today's plans and members with an active With Coach subscription
    Py->>Py: Recognize the member's face and detect the body pose
    Py->>Py: Classify the exercise (5 of 7 predictions, 70% or more)

    alt Squat, push-up, curl or sit-up
        loop Every few seconds
            Py->>Py: Count repetitions from the joint angle
            Py->>LV: POST /api/ai/log-workout (counted_reps, completed = false)
            LV->>DB: Save the progress (never lowered)
        end
        Py->>LV: POST /api/ai/log-workout (completed = true) when sets x reps is reached
    else Other exercise
        Py->>LV: POST /api/ai/log-workout (exercise recognized)
    end
    LV->>DB: Mark the matching task verified_by = ai

    opt The camera cannot check the exercise
        Admin->>UI: Verify the task manually
        UI->>LV: Verify (verified_by = coach)
    end
```

Repetitions are counted by the Gesture Engine for squat, push-up, curl and sit-up. For other exercises the system only confirms that the assigned movement was recognized. The coach can always verify a task by hand.

---

## 5. Non-Functional & System Constraints Architecture

### 5.1. Performance & Latency Targets
* **Design targets (not yet measured in formal testing):** the live video should stay smooth while faces are encoded in helper processes, pose tracking should keep up with the feed on a standard workstation, and pages should respond quickly over the LAN. Measured results will be added after the formal testing.

### 5.2. System Boundaries & Security Scope
* **Scope Boundary**: Web-based application accessible via desktop/tablet browsers; no native mobile app build required.
* **Exercise Recognition Boundary**: Pose estimation engine is scoped strictly to approved exercises (repetitions are counted for squat, push-up, curl and sit-up) for task completion. It does not provide medical analysis or posture safety grading.
* **Data Security & Privacy**: Enrolled face photos are stored in protected backend storage (not reachable from a browser) and are encoded into 128-d vectors by the engine. The member's consent to face enrollment is recorded with its date. The administrator login uses email and password; there is no multi-factor authentication (out of scope).

---

## 6. Deployment & Infrastructure Architecture

```mermaid
flowchart LR
    subgraph Host_Environment ["🖥️ Gym Server / Local Host Workstation"]
        subgraph Web_Server ["Web & API Tier"]
            NGINX["Nginx / Apache"]
            LARAVEL_APP["Laravel PHP-FPM Service"]
        end

        subgraph Vision_Service ["AI Microservice"]
            FLASK_APP["Python Flask Service (Port 5000)"]
            CV_MODELS["OpenCV + MediaPipe + Scikit-Learn"]
        end

        subgraph DB_Tier ["Database Tier"]
            MYSQL_SERVER["MySQL Database Server (Port 3306)"]
        end
    end

    subgraph Local_Clients ["📱 Admin & Client Workstations"]
        DESKTOP["Admin PC (Chrome / Edge Browser)"]
        TABLET["Coach Tablet (Safari / Chrome)"]
    end

    subgraph Cameras ["📷 Video Inputs"]
        RTSP_CAM["IP Camera (RTSP Port 554)"]
        USB_CAM["Webcam (Direct USB Port)"]
    end

    RTSP_CAM --> Vision_Service
    USB_CAM --> Vision_Service
    
    DESKTOP & TABLET <-->|HTTP / Port 80 / 443| NGINX
    NGINX <--> LARAVEL_APP
    Vision_Service <-->|REST Bridge / Internal HTTP| LARAVEL_APP
    LARAVEL_APP <--> MYSQL_SERVER
```

---

## 7. Summary Matrix of Architectural Technologies

| Component / Layer | Technology Selected | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | v19.x | Single Page Application UI rendering |
| **Build Tool** | Vite | v8.x | Frontend build optimization & dev server |
| **Styling** | Tailwind CSS | v4.x | Utility-first responsive design system |
| **Router** | React Router | v7.x | Declarative client-side routing |
| **Charts & Calendar** | Recharts & FullCalendar | Latest | Dashboard charts & the Packages calendar |
| **HTTP Client** | Axios | Latest | Frontend REST API communication |
| **Backend Framework** | Laravel | v12.x | Core API, Auth & Business Logic engine |
| **Runtime Language** | PHP | v8.2+ | Server-side execution environment |
| **Authentication** | Laravel Sanctum | Latest | Token-based admin & staff authentication |
| **Database** | MySQL | v8.0+ | Relational data management system |
| **AI Vision Language**| Python | v3.10+ | Computer Vision & ML execution |
| **Face Biometrics** | `face_recognition` / `dlib` | Latest | 128-d vector embedding & face matching |
| **Pose Estimation** | MediaPipe Pose | Latest | 33 3D body landmark joint tracking and joint angles for repetition counting |
| **ML Classification**| Scikit-Learn | Latest | Exercise gesture classifier (`workout_model.pkl`) |
| **AI Web Bridge** | Flask & Flask-CORS | Latest | Python REST API & MJPEG streaming server |
| **Camera Protocols** | RTSP, USB and phone camera | Port 554 / USB / HTTP | Live video ingestion |
