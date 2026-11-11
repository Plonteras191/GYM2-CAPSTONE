# System Architecture Document

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. Architectural Overview & Design Philosophy

The **Camera-Based Gym Management System** for Double Alpha Fitness Gym is engineered using a decoupled, 4-tier client-server architecture. It seamlessly integrates a high-performance **React 19 Single Page Application (SPA)** frontend, a robust **Laravel 11/12 RESTful API** business logic layer, a specialized **Python 3.10+ AI Vision & Gesture Engine**, and a centralized **MySQL database**.

### Core Design Principles
1. **Decoupled Service Architecture**: The heavy computer vision processing (face recognition and MediaPipe pose estimation) is decoupled into an independent Python microservice engine, preventing CPU-intensive vision calculations from blocking backend web server HTTP requests.
2. **Real-Time Touchless Operations**: Live camera feeds (RTSP CCTV and USB Webcams) interact with AI vision pipelines to enable sub-second facial identification and real-time exercise rep counting.
3. **Cross-Platform Accessibility**: The frontend interface is fully responsive, leveraging modern CSS utilities and React SPA architecture for seamless management across desktop workstations, tablets, and mobile devices.
4. **Data Integrity & Controlled Automation**: Strict business rules (e.g., operating hours validation from 9:00 AM – 9:30 PM, single daily attendance check-ins, automated subscription status transitions) ensure accurate gym operations.

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
        STREAM_PLAYER["JSMpeg Player / Canvas Stream"]
        AXIOS["Axios HTTP Client"]
    end

    subgraph AI_Engine_Layer ["🤖 AI Vision & Gesture Engine Layer (Python 3.10+)"]
        FLASK["Flask REST & Streaming Server"]
        OPENCV["OpenCV Frame Processor"]
        FACE_REC["Biometric Face Recognition Engine (face_recognition / dlib)"]
        MEDIAPIPE["MediaPipe Pose Landmark Tracking"]
        ML_MODEL["Scikit-Learn Classifier (workout_model.pkl)"]
        REP_COUNTER["Exercise Classifier (Random Forest)"]
    end

    subgraph Application_Layer ["⚙️ Application Layer (Laravel 11/12 REST API)"]
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
    OPENCV --> MEDIAPIPE --> ML_MODEL --> REP_COUNTER

    FACE_REC -->|HTTP Bridge API| CTRL_ATTENDANCE
    REP_COUNTER -->|HTTP Bridge API| CTRL_WORKOUTS

    FLASK -->|MJPEG / WebSocket Stream| STREAM_PLAYER
    STREAM_PLAYER --> UI

    CTRL_MEMBERS & CTRL_ATTENDANCE & CTRL_WORKOUTS & CTRL_PAYMENTS & CTRL_REPORTS --> MYSQL
    CTRL_MEMBERS --> STORAGE
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

## 3. Tier-by-Tier Architectural Breakdown

### 3.1. Layer 1: Presentation Layer (Frontend)
The frontend serves as the primary operational portal for the Gym Owner, Authorized Admin, and Coaches.

* **Framework & Build System**: React 19 SPA built with Vite 8 for fast hot-module replacement and optimized bundle sizes.
* **Routing**: React Router v7 handling client-side routing, protected routes, and page navigation.
* **Styling & Components**: Tailwind CSS v4, dynamic color tokens, custom component libraries, and responsive layouts.
* **Data Visualization**:
  * **Recharts**: Render financial performance, attendance volume trends, and workout compliance charts.
  * **FullCalendar**: Visual calendar interfaces for tracking attendance and gym session schedules.
* **Live Video Feed Rendering**:
  * **JSMpeg Player**: Low-latency video player rendering processed video streams from the Python AI Flask server directly onto HTML5 Canvas elements.
* **State & API Management**: Axios instances configured with inter-request token injection via local storage/session authentication.

---

### 3.2. Layer 2: Application Business Logic Layer (Laravel Backend)
The backend manages administrative logic, database transactions, authorization, and system schedules.

* **Framework**: Laravel 11 / 12 running on PHP 8.2+.
* **Security & Authentication**:
  * **Laravel Sanctum**: Token-based API authentication for secure session validation across administrator logins.
  * **RBAC (Role-Based Access Control)**: Separates permissions between Administrator / Gym Owner, Coach / Trainer, and Member.
* **Core Business Rules Engine**:
  * **Operating Hours Enforcement**: Uses `Carbon` date-time library to evaluate check-in timestamps strictly within official operating hours (9:00 AM – 9:30 PM).
  * **Single Daily Attendance Rule**: Verifies whether a member has already checked in on the current calendar date before recording a new entry.
  * **Subscription Lifecycle Manager**: Automatically evaluates subscription end dates and updates status badges:
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
        
        FACE_ENGINE -->|1. Face Detection| FD["dlib / HOG / CNN"]
        FD -->|2. Facial Embedding| FE["128-d Vector Generator"]
        FE -->|3. Vector Distance Matching| FM["Threshold Match (< 0.6)"]
        
        GESTURE_ENGINE -->|1. Pose Estimation| MP["MediaPipe Pose (33 Landmarks)"]
        MP -->|2. Feature Vector Extraction| SK["Scikit-Learn Classifier"]
        SK -->|3. 33 Landmark Coordinates| SM["Random Forest Exercise Classifier"]
        SM -->|4. Assigned Exercise Confirmed| RC["Verified Workout Task"]
    end

    subgraph Backend_Bridge ["Laravel API Integration"]
        FM -->|POST /api/ai/log-attendance| ATTENDANCE_API["Attendance API"]
        RC -->|POST /api/ai/log-workout| WORKOUT_API["Workout Task API"]
    end
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


* **Biometric Facial Recognition Sub-Engine**:
  * Uses `face_recognition` (built on `dlib`) for real-time facial landmark detection and 128-dimensional vector encoding.
  * Compares live face vectors against stored member reference encodings using Euclidean distance matching.
  * Triggers automated check-in requests to Laravel API upon high-confidence identification.
* **Gesture & Workout Tracking Sub-Engine**:
  * **MediaPipe Pose**: Extracts 33 3D body landmark coordinates (shoulders, elbows, hips, knees, ankles) in real time.
  * **Scikit-Learn Machine Learning Model (`workout_model.pkl`)**: Classifies exercise forms (Squats, Bicep Curls, Push-ups) from normalized landmark coordinate matrices.
  * **Repetition Counter State Machine**: Tracks joint angles (e.g., knee flexion for squats, elbow flexion for curls) and transitions through movement states (`START` -> `INFLECTION` -> `COMPLETE`) to increment validated rep counts.
* **Service Bridge**:
  * Built using **Flask** & **Flask-CORS**.
  * Exposes local endpoints for streaming live annotated camera feeds (`/video_feed`) and handling administrative camera configurations.

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
    auth_verification_codes {
        bigint id PK
        bigint admin_id FK
        varchar email
        varchar purpose
        varchar code_hash
        timestamp expires_at
        tinyint attempts
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
        longtext enrolled_face_id "nullable, face photo path"
        varchar profile_pic "nullable"
        date dob "nullable"
        decimal height "nullable"
        decimal weight "nullable"
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
        bigint plan_id FK "nullable"
        varchar plan_type
        date start_date
        date end_date
        varchar status
        boolean auto_renew
        varchar payment_method
        varchar color
        text notes "nullable"
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
        bigint member_id FK
        date date
        time time_in
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
        varchar gesture_class "nullable"
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

    admins ||--o{ auth_verification_codes : "admin_id"
    admins ||..o{ personal_access_tokens : "tokenable_id (no FK)"
    admins ||..o{ password_reset_pins : "email (no FK)"
    members |o--o{ memberships : "member_id"
    plans |o--o{ memberships : "plan_id"
    package_categories |o..o{ plans : "category_detail = name (no FK)"
    members |o--o{ transactions : "member_id"
    memberships |o--o{ transactions : "membership_id"
    members ||--o{ attendances : "member_id"
    members ||--o{ workout_logs : "member_id"
    coach_event_categories ||--o{ coach_events : "category_id"
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

### 3.5. Layer 5: Hardware & Network Integration Layer

* **Camera Hardware**:
  * **Hikvision IP CCTV Cameras**: Network-attached surveillance cameras providing RTSP video streams over local IP addresses (`rtsp://admin:password@192.168.x.x:554/Streaming/Channels/101`).
  * **USB Webcams**: Plug-and-play USB cameras connected directly to host workstations for desk check-ins and registration enrollment.
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

    Member->>Cam: Walks in front of Gym Entrance Camera
    Cam->>Py: Streams Video Frame
    Py->>Py: Detects Face & Extracts 128-d Vector
    Py->>Py: Compares Vector with Stored Embeddings
    
    alt Confidence Match Found (< 0.6 distance threshold)
        Py->>LV: POST /api/ai/log-attendance (member_id)
        LV->>LV: Validate Operating Hours (9:00 AM - 9:30 PM)
        LV->>LV: Check Single Daily Check-in Rule
        
        alt Verification Passed
            LV->>DB: INSERT INTO attendance_logs
            LV-->>Py: 200 OK (Check-in Successful)
            Py->>Admin: Push Live Notification & Update Dashboard Ticker
        else Verification Failed (Outside Hours / Duplicate Check-in)
            LV-->>Py: 422 Unprocessable (Reason logged)
        end
    else No Match / Low Confidence
        Py->>Py: Ignore Frame / Continue Scanning
    end
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

### 4.2. AI Gesture Workout Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    actor Coach as Gym Coach
    participant Cam as Workout Zone Camera
    participant Py as Python AI Engine
    participant LV as Laravel API
    participant DB as MySQL Database
    participant UI as React Member Profile
    participant Catalog as Exercise JSON Catalog

    Coach->>UI: Opens member's Coach's Training Plan
    UI->>Catalog: Load exercises with body_part metadata
    Coach->>UI: Filter exercises by body part and set weekday, sets, and reps
    UI->>UI: Save weekly routine in browser storage
    UI->>LV: POST next seven days of dated tasks, targets, and gesture classes
    LV->>DB: Replace pending scheduled assignments in workout_logs
    UI->>LV: Gesture Monitor polls pending assignments and recent logs
    LV-->>UI: Return member workout queue
    
    Member->>Cam: Begins Workout Routine in Camera View
    Cam->>Py: Streams Frame Sequence
    Py->>Py: MediaPipe Extracts 33 Body Joint Coordinates
    Py->>Py: Classifier emits a supported movement label
    Py->>LV: POST /api/ai/log-workout (member_id, exercise label)
    LV->>DB: Match label to that member's task scheduled for today
    alt Matching assigned task exists
        LV->>DB: Mark assigned exercise log performed, retain sets/reps targets
    else No matching assigned task
        LV->>DB: Save an unassigned exercise log (anti-spam guarded)
    end
```

The current Gesture Engine sends movement labels, not measured repetition totals. Assigned sets and reps are targets; completion counts are not currently verified by this flow.

---

## 5. Non-Functional & System Constraints Architecture

### 5.1. Performance & Latency Targets
* **Facial Recognition Latency**: Biometric face detection and vector distance comparison completed within **< 800ms** per frame.
* **Repetition Counting Frame Rate**: Pose landmark tracking processed at **≥ 15 FPS** on standard workstation hardware.
* **Web UI Response Time**: SPA page renders and API calls completed within **< 300ms** over LAN.

### 5.2. System Boundaries & Security Scope
* **Scope Boundary**: Web-based application accessible via desktop/tablet browsers; no native mobile app build required.
* **Exercise Recognition Boundary**: Pose estimation engine is scoped strictly to approved exercises (Squats, Bicep Curls, Push-ups) for rep counting and task completion. It does not provide medical analysis or posture safety grading.
* **Data Security & Privacy**: Biometric face profiles are converted into mathematical float vectors (128-d arrays). Raw images are stored securely in protected backend storage accessible only by authenticated system administrators.

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
| **Charts & Calendar** | Recharts & FullCalendar | Latest | Visual analytics & attendance scheduling |
| **HTTP Client** | Axios | Latest | Frontend REST API communication |
| **Backend Framework** | Laravel | v11.x / v12.x | Core API, Auth & Business Logic engine |
| **Runtime Language** | PHP | v8.2+ | Server-side execution environment |
| **Authentication** | Laravel Sanctum | Latest | Token-based admin & staff authentication |
| **Database** | MySQL | v8.0+ | Relational data management system |
| **AI Vision Language**| Python | v3.10+ | Computer Vision & ML execution |
| **Face Biometrics** | `face_recognition` / `dlib` | Latest | 128-d vector embedding & face matching |
| **Pose Estimation** | MediaPipe Pose | Latest | 33 3D body landmark joint tracking |
| **ML Classification**| Scikit-Learn | Latest | Exercise gesture classifier (`workout_model.pkl`) |
| **AI Web Bridge** | Flask & Flask-CORS | Latest | Python REST API & MJPEG streaming server |
| **Camera Protocols** | RTSP & Direct USB | Port 554 / USB | Live CCTV video ingestion |
