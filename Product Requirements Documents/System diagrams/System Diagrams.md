# System Diagrams & Visual Models Document

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. Executive Summary

This document provides a comprehensive visual and structural modeling specification for the **Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring** at Double Alpha Fitness Gym. 

It encompasses all standard software engineering diagrams required for technical analysis, system design, capstone defense, and architecture validation:
1. **Input-Process-Output (IPO) Conceptual Model**
2. **System Context Diagram (Level 0 DFD)**
3. **Data Flow Diagram Level 1 (DFD Level 1)**
4. **Use Case Diagram (UCD) & Actor Specifications**
5. **System Architecture & Hardware Topology Diagram**
6. **Operational Sequence Diagrams** (Biometric Check-In, Gesture Verification, Payment Processing)

---

## 2. Input-Process-Output (IPO) Model

The Input-Process-Output (IPO) model illustrates the high-level operational data flow of the proposed system from initial data capture to final generated output reports.

```mermaid
flowchart LR
    subgraph INPUT ["📥 INPUT PHASE"]
        direction TB
        I1["Member Personal Data\n(Name, Contact, Address)"]
        I2["Anthropometric & Body Metrics\n(Height, Weight, Body Type)"]
        I3["Biometric Facial Enrollment\n(Face Vector Encodings)"]
        I4["Program Assignments\n(Exercise Types & Rep Targets)"]
        I5["Payment Transaction Info\n(Amount, Method: Cash/GCash/Maya)"]
        I6["Live Video Streams\n(RTSP CCTV / USB Webcams)"]
    end

    subgraph PROCESS ["⚙️ PROCESS PHASE"]
        direction TB
        P1["Member Registration & Profile Creation"]
        P2["Touchless Facial Recognition Attendance Check-In"]
        P3["MediaPipe Pose Tracking & Rep Counting State Machine"]
        P4["Subscription Expiration & Status Auditor"]
        P5["Payment Transaction Invoicing & Billing Log"]
        P6["Executive Analytics & Report Aggregation"]
    end

    subgraph OUTPUT ["📤 OUTPUT PHASE"]
        direction TB
        O1["Enrolled Member Profiles & Badges"]
        O2["Daily Attendance Logs & Timestamps"]
        O3["AI-Verified Workout & Rep Reports"]
        O4["Automated Subscription Renewal Alerts"]
        O5["Digital Payment Receipts & Financial Ledger"]
        O6["Executive Dashboard Analytics & Exported Reports"]
    end

    INPUT --> PROCESS --> OUTPUT
```

---

## 3. System Context Diagram (Level 0 DFD)

The Context Diagram defines the system boundary, showcasing external entities interacting with the central **Camera-Based Gym Management System**.

```mermaid
flowchart TB
    subgraph System_Boundary ["System Boundary"]
        SYS(("Camera-Based Gym Management System"))
    end

    subgraph External_Entities ["External Entities"]
        ADMIN["🛡️ Gym Owner / Authorized Admin"]
        MEMBER["🧘 Registered Gym Member"]
        COACH["🏋️‍♂️ Gym Coach / Trainer"]
        CAM["📹 RTSP / USB AI Cameras"]
    end

    %% Admin Interactions
    ADMIN -->|Member Registration & Payment Records| SYS
    ADMIN -->|Subscription Plan Configurations| SYS
    SYS -->|Executive Dashboards & Financial Reports| ADMIN

    %% Member Interactions
    MEMBER -->|Registration Data & Biometric Face Image| SYS
    MEMBER -->|Physical Attendance Walk-In| SYS
    MEMBER -->|Workout Exercise Execution| SYS
    SYS -->|Attendance Status & Subscription Badges| MEMBER

    %% Coach Interactions
    COACH -->|Assigns Workout Tasks & Manual Overrides| SYS
    SYS -->|Real-Time Rep Counter & Task Verification Logs| COACH

    %% Camera Stream Interactions
    CAM -->|Live RTSP / MJPEG Video Frames| SYS
    SYS -->|Camera Feed Render & Gesture Feedback Overlay| CAM
```

---

## 4. Data Flow Diagram Level 1 (DFD Level 1)

DFD Level 1 decomposes the main system into six primary sub-processes and maps how data moves between external entities, processes, and central MySQL data stores.

```mermaid
flowchart TB
    %% External Entities
    ADMIN["🛡️ Gym Admin"]
    MEMBER["🧘 Gym Member"]
    COACH["🏋️‍♂️ Gym Coach"]
    CAM["📹 AI Cameras"]

    %% Processes
    P1["1.0\nMember Registration &\nFacial Enrollment"]
    P2["2.0\nFacial Recognition\nAttendance Logging"]
    P3["3.0\nGesture Program\nMonitoring & Rep Counting"]
    P4["4.0\nSubscription Lifecycle\nManagement"]
    P5["5.0\nPayment Transaction\nRecording"]
    P6["6.0\nSystem Reports &\nAnalytics Engine"]

    %% Data Stores
    D1[("D1: Members DB")]
    D2[("D2: Attendance Logs DB")]
    D3[("D3: Subscriptions DB")]
    D4[("D4: Payment Transactions DB")]
    D5[("D5: Workout Logs DB")]
    D6[("D6: Plans DB")]

    %% Process 1.0 Connections
    ADMIN -->|Member Details & Face Profile| P1
    P1 -->|Store Member Profile & Face ID| D1

    %% Process 2.0 Connections
    CAM -->|RTSP Video Frames| P2
    D1 -->|Fetch Enrolled Face Vectors| P2
    P2 -->|Log Verified Entry & Timestamp| D2
    P2 -->|Display Live Check-in Ticker| ADMIN

    %% Process 3.0 Connections
    COACH -->|Assign Workout Tasks| P3
    CAM -->|Video Stream (Pose Tracking)| P3
    P3 -->|Save AI Rep Count & Verification| D5
    D5 -->|Update Task Progress| COACH

    %% Process 4.0 Connections
    ADMIN -->|Configure Plan Tiers| D6
    D6 -->|Fetch Active Plan Rates| P4
    P4 -->|Create & Update Membership Status| D3
    D1 & D2 -->|Audit Activity / Expiration| P4

    %% Process 5.0 Connections
    ADMIN -->|Record Cash / GCash / Maya Payments| P5
    P5 -->|Insert Payment Ledger Entry| D4
    P5 -->|Update Active Subscription| D3

    %% Process 6.0 Connections
    D1 & D2 & D3 & D4 & D5 -->|Aggregate Operational Metrics| P6
    P6 -->|Render Financial & Attendance Reports| ADMIN
```

---

## 5. Use Case Diagram (UCD) & Actor Specifications

The Use Case Diagram highlights all functional interactions provided by the system, categorized by user roles and automated AI camera actors.

```mermaid
flowchart LR
    subgraph Actors ["System Actors"]
        ADMIN["🛡️ Gym Owner / Admin"]
        COACH["🏋️‍♂️ Gym Coach"]
        MEMBER["🧘 Gym Member"]
        AI_CAM["🤖 AI Vision Camera Engine"]
    end

    subgraph Use_Cases ["System Use Cases"]
        UC1["UC-1: Authenticate Admin Session"]
        UC2["UC-2: Register Member & Profile"]
        UC3["UC-3: Enroll Biometric Face Embeddings"]
        UC4["UC-4: Touchless Facial Recognition Attendance"]
        UC5["UC-5: Manage Subscription Plans & Renewals"]
        UC6["UC-6: Record Payment Transaction (Cash/GCash/Maya)"]
        UC7["UC-7: Assign Workout Program"]
        UC8["UC-8: Real-Time Gesture Tracking & Rep Counting"]
        UC9["UC-9: Manual Workout Verification Override"]
        UC10["UC-10: View Live Multi-Camera Stream"]
        UC11["UC-11: Generate Financial & Attendance Reports"]
    end

    %% Admin Interactions
    ADMIN --> UC1
    ADMIN --> UC2
    ADMIN --> UC3
    ADMIN --> UC5
    ADMIN --> UC6
    ADMIN --> UC10
    ADMIN --> UC11

    %% Coach Interactions
    COACH --> UC1
    COACH --> UC7
    COACH --> UC8
    COACH --> UC9

    %% Member Interactions
    MEMBER --> UC2
    MEMBER --> UC3
    MEMBER --> UC4
    MEMBER --> UC8

    %% AI Camera System Interactions
    AI_CAM --> UC4
    AI_CAM --> UC8
    AI_CAM --> UC10

    %% Use Case Relationships
    UC2 -.->|<<include>>| UC3
    UC4 -.->|<<extend>>| UC11
    UC8 -.->|<<extend>>| UC9
```

### Actor Description Matrix

| Actor | Type | Description & System Responsibilities |
| :--- | :--- | :--- |
| **Gym Owner / Admin** | Primary Human Actor | Full system access: manages member accounts, plan configurations, financial transactions, payment logging, system reporting, and live camera feed viewing. |
| **Gym Coach / Trainer** | Human Actor | Manages athlete workout routines, monitors live AI rep counting, assigns custom workout tasks, and performs manual verification overrides. |
| **Gym Member** | External Human Participant | Participates in registration, biometrics face enrollment, touchless attendance check-in, and assigned gesture workout sessions. |
| **AI Vision Camera Engine** | Automated Hardware/Software Actor | Captures RTSP/USB video feeds, executes facial recognition matching, extracts MediaPipe 3D pose landmarks, and calculates repetitions. |

---

## 6. System Architecture & Topology Model

```mermaid
flowchart TB
    subgraph Layer1 ["1️⃣ PRESENTATION LAYER (React 19 SPA)"]
        UI_DASH["Admin & Coach Dashboard"]
        UI_MEMBERS["Member Directory & Registration"]
        UI_ATTENDANCE["Live Attendance Feed"]
        UI_WORKOUTS["AI Workout & Rep Monitor"]
        UI_FINANCE["Payment & Invoicing Panel"]
    end

    subgraph Layer2 ["2️⃣ APPLICATION LAYER (Laravel REST API & Python AI Engine)"]
        subgraph Laravel_API ["Laravel 11/12 REST Services"]
            AUTH["Sanctum Auth Guard"]
            API_MEMBERS["Member Management API"]
            API_ATTENDANCE["Attendance Controller"]
            API_PAYMENTS["Payment & Billing API"]
            API_REPORTS["Analytics Generator"]
            CARBON_GUARD["Operating Hours & Expiry Guard"]
        end

        subgraph Python_AI ["Python 3.10+ AI Microservice Engine"]
            FLASK_SERVER["Flask Streaming API Server"]
            FACE_RECOGNITION["Face Recognition Engine (128-d Vector Match)"]
            MEDIAPIPE_POSE["MediaPipe Pose Estimator (33 Landmarks)"]
            ML_CLASSIFIER["Scikit-Learn Workout Classifier (workout_model.pkl)"]
            REP_STATE["Repetition State Machine"]
        end
    end

    subgraph Layer3 ["3️⃣ DATA LAYER (Centralized MySQL 8.0+)"]
        MYSQL_DB[("Centralized MySQL Database")]
        FILE_STORAGE["Local Profile Photo & Receipt Storage"]
    end

    subgraph Layer4 ["4️⃣ HARDWARE & DEVICE LAYER"]
        CCTV_CAM["Hikvision RTSP IP CCTV Cameras (Entrance & Gym Floor)"]
        USB_CAM["USB Webcams (Registration Desk)"]
    end

    %% Connections
    Layer1 <-->|HTTP / Axios REST API| Laravel_API
    Layer1 <-->|MJPEG Stream / Canvas Render| Python_AI
    
    Layer4 -->|RTSP Video Feed (Port 554)| Python_AI
    Layer4 -->|USB Video Capture| Python_AI

    Python_AI -->|POST /api/attendance/checkin| API_ATTENDANCE
    Python_AI -->|POST /api/workouts/verify-task| API_MEMBERS

    Laravel_API <-->|Eloquent PDO Queries| MYSQL_DB
    Laravel_API -->|Save Files| FILE_STORAGE
```

---

## 7. Operational Sequence Diagrams

### 7.1. Touchless Facial Recognition Attendance Check-In Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    participant Cam as CCTV Entrance Camera
    participant PyAI as Python AI Engine
    participant LV as Laravel REST API
    participant DB as MySQL Database
    actor Admin as Admin Dashboard UI

    Member->>Cam: Steps in front of entrance camera
    Cam->>PyAI: RTSP Live Video Stream (30 FPS)
    PyAI->>PyAI: Detect Face Bounding Box & Extract 128-d Vector
    PyAI->>PyAI: Calculate Euclidean Vector Distance against Enrolled Face Database
    
    alt Match Confidence < 0.6 (Successful Identification)
        PyAI->>LV: POST /api/attendance/checkin {member_id, timestamp}
        LV->>LV: Carbon Check: Is current time between 9:00 AM - 9:30 PM?
        LV->>LV: DB Query: Has member already checked in today?
        
        alt All Checks Passed
            LV->>DB: INSERT INTO attendances (member_id, date, time_in)
            LV-->>PyAI: 200 OK (Attendance Recorded)
            PyAI->>Admin: Push WebSocket / Live Ticker Update (Green Check-in Badge)
        else Duplicate Entry / Outside Hours
            LV-->>PyAI: 422 Unprocessable Entity (Reason logged)
            PyAI->>Admin: Push Soft Warning Alert to Admin Dashboard
        end
    else No Match / Unregistered Face
        PyAI->>PyAI: Ignore frame & await next camera buffer
    end
```

---

### 7.2. Gesture Workout Verification & Rep Counting Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    actor Coach as Gym Coach
    participant Cam as Workout Zone Camera
    participant PyAI as Python AI Engine
    participant LV as Laravel REST API
    participant DB as MySQL Database

    Coach->>LV: Assign Workout Task (Squats, 10 reps)
    LV->>DB: INSERT INTO workout_tasks (target_reps = 10)
    
    Member->>Cam: Begins Workout Routine
    Cam->>PyAI: Live Video Frames
    PyAI->>PyAI: Extract 33 MediaPipe Body Joint Coordinates
    PyAI->>PyAI: Evaluate Landmark Matrix with workout_model.pkl
    PyAI->>PyAI: Track Knee Flexion Angle (Down -> Up Movement)
    
    loop Repetition Counting State Machine
        PyAI->>PyAI: Flexion Angle < 90° (INFLECTION STATE)
        PyAI->>PyAI: Extension Angle > 160° (REP COMPLETED)
        PyAI->>PyAI: Rep Count = Rep Count + 1
    end
    
    alt Rep Count reaches Target (10)
        PyAI->>LV: POST /api/workouts/verify-task {task_id, completed_reps=10, status="verified_ai"}
        LV->>DB: UPDATE workout_tasks SET status='verified_ai', completed_at=NOW()
        LV-->>Coach: Push Task Verified Alert to Coach Panel
    else Obscured View / Form Ambiguity
        Coach->>LV: Perform Manual Verification Override via Coach Portal
        LV->>DB: UPDATE workout_tasks SET status='verified_manual'
    end
```

---

## 8. Diagram Summary Reference Matrix

| Diagram Type | Primary Purpose | Key Components & Standards |
| :--- | :--- | :--- |
| **IPO Model** | Conceptual System Flow | Categorizes System Inputs, Core Processes, and Generated Outputs |
| **Context Diagram (DFD L0)** | System Boundary & Entities | Defines high-level interaction between Admin, Member, Coach, Camera & System |
| **DFD Level 1** | Process & Data Store Mapping | Decomposes system into 6 core processes interacting with 6 MySQL data tables |
| **Use Case Diagram (UCD)** | Functional User Roles | Maps 11 use cases across 4 primary actors (Admin, Coach, Member, AI Camera) |
| **System Architecture** | Technical Tier Composition | 4-Layer model (Presentation, Application REST/AI, Data Layer, Hardware Layer) |
| **Sequence Diagrams** | Step-by-Step Runtime Logic | Detail execution sequences for touchless check-in and gesture rep counting |
