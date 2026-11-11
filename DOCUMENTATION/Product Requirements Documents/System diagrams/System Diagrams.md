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
        I2["Anthropometric & Body Metrics\n(Height, Weight, Date of Birth)"]
        I3["Biometric Facial Enrollment\n(Face Vector Encodings)"]
        I4["Program Assignments\n(Exercise Types & Rep Targets)"]
        I5["Payment Transaction Info\n(Amount, Method: Cash/GCash/Maya)"]
        I6["Live Video Streams\n(RTSP CCTV / USB Webcams)"]
    end

    subgraph PROCESS ["⚙️ PROCESS PHASE"]
        direction TB
        P1["Member Registration & Profile Creation"]
        P2["Touchless Facial Recognition Attendance Check-In"]
        P3["MediaPipe Pose Tracking & Exercise Classification"]
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

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

## 3. System Context Diagram (Level 0 DFD)

The Context Diagram defines the system boundary, showcasing external entities interacting with the central **Camera-Based Gym Management System**.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera<br/>(CCTV, phone camera or webcam)"]
    Member["Gym Member"]
    Mail["Email Server"]
    System(["0<br/>Gym Management System<br/>for Double Alpha Fitness Gym"])

    Admin -->|"F1: Email, password and login PIN"| System
    Admin -->|"F2: Member details, face capture, packages, subscriptions, coach events, payments and refunds"| System
    Admin -->|"F3: Workout plans and manual verification"| System
    Admin -->|"F4: Report dates, camera selection and profile updates"| System

    System -->|"F5: Login result, dashboard summary and notifications"| Admin
    System -->|"F6: Member, subscription and transaction records, printable receipt"| Admin
    System -->|"F7: Live camera feeds, today's attendance and workout task status"| Admin
    System -->|"F8: Reports (CSV or print)"| Admin

    Camera -->|"F9: Live video of faces and exercise movement"| System
    Member -->|"F10: Personal details, face photo and payment (through the admin)"| System
    System -->|"F11: Payment receipt (printed by the admin)"| Member
    System -->|"F12: Login PIN and password-reset PIN"| Mail
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

## 4. Data Flow Diagram Level 1 (DFD Level 1)

DFD Level 1 decomposes the main system into six primary sub-processes and maps how data moves between external entities, processes, and central MySQL data stores.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera"]
    P1(["1.0<br/>Log In"])
    P2(["2.0<br/>View Dashboard"])
    P3(["3.0<br/>Manage Members"])
    P4(["4.0<br/>Attendance Monitoring"])
    P5(["5.0<br/>Program Monitoring"])
    P6(["6.0<br/>Packages and Subscriptions"])
    P7(["7.0<br/>Payment Transactions"])
    P8(["8.0<br/>Reports"])

    Admin -->|"Email, password, PIN"| P1
    P1 -->|"Login result, session token"| Admin
    S10[("D1 admins")]
    P1 <-->|"Admin account"| S10
    S11[("D9 auth_verification_codes")]
    P1 <-->|"Login PIN"| S11
    S12[("D10 personal_access_tokens")]
    P1 -->|"Session token"| S12

    Admin -->|"Dashboard request"| P2
    P2 -->|"Totals, sales chart, notifications"| Admin
    S20[("D2 members")]
    P2 ~~~ S20
    S20 -->|"Member count"| P2
    S21[("D7 memberships")]
    P2 ~~~ S21
    S21 -->|"Active and expiring subscriptions"| P2
    S22[("D8 transactions")]
    P2 ~~~ S22
    S22 -->|"Revenue"| P2

    Admin -->|"Member details, face capture"| P3
    P3 -->|"Member list and profiles"| Admin
    S30[("D2 members")]
    P3 <-->|"Member records"| S30
    S31[("D3 face photo files")]
    P3 -->|"Face photo"| S31

    Admin -->|"Camera selection"| P4
    P4 -->|"Live feed, today's check-ins"| Admin
    S40[("D2 members")]
    P4 ~~~ S40
    S40 -->|"Enrolled members"| P4
    S41[("D3 face photo files")]
    P4 ~~~ S41
    S41 -->|"Face photos"| P4
    S42[("D4 attendances")]
    P4 <-->|"Member, date, time in"| S42

    Admin -->|"7-day workout plan, manual verification"| P5
    P5 -->|"Task status, workout history"| Admin
    S50[("D5 workout_logs")]
    P5 <-->|"Assigned and verified tasks"| S50
    S51[("D7 memberships")]
    P5 ~~~ S51
    S51 -->|"Active With Coach subscription"| P5

    Admin -->|"Packages, subscriptions, upgrades"| P6
    P6 -->|"Package list, subscription status"| Admin
    S60[("D6 plans")]
    P6 <-->|"Packages"| S60
    S61[("D7 memberships")]
    P6 <-->|"Subscriptions"| S61
    S62[("D8 transactions")]
    P6 -->|"Automatic payment record"| S62

    Admin -->|"Payment details, refund request"| P7
    P7 -->|"Transaction list, receipt"| Admin
    S70[("D8 transactions")]
    P7 <-->|"Transactions"| S70
    S71[("D6 plans")]
    P7 ~~~ S71
    S71 -->|"Package name"| P7

    Admin -->|"Report type, date range"| P8
    P8 -->|"Report table, CSV or print"| Admin
    S80[("D8 transactions")]
    P8 ~~~ S80
    S80 -->|"Payments"| P8
    S81[("D7 memberships")]
    P8 ~~~ S81
    S81 -->|"Subscriptions"| P8
    S82[("D4 attendances")]
    P8 ~~~ S82
    S82 -->|"Check-ins"| P8

    Camera -->|"Live video"| P4
    Camera -->|"Live video"| P5
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

## 5. Use Case Diagram (UCD) & Actor Specifications

The Use Case Diagram highlights all functional interactions provided by the system, categorized by user roles and automated AI camera actors.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera / Gesture Engine"]
    Member["Gym Member"]

    subgraph Boundary ["Gym Management System"]
        UC1(["Log In with Email,<br/>Password and PIN"])
        UC2(["View Dashboard<br/>and Notifications"])
        UC3(["Manage Members<br/>and Face Capture"])
        UC4(["Manage Packages<br/>and Subscriptions"])
        UC5(["Record Payments,<br/>Receipts and Refunds"])
        UC6(["Build Workout Plans and<br/>Verify Tasks Manually"])
        UC7(["View Attendance and<br/>Gesture Monitors"])
        UC8(["Generate Reports"])
        UC9(["Manage Admin Profile"])
        UC10(["Recognize Faces and<br/>Log Attendance"])
        UC11(["Recognize Assigned<br/>Exercise and Verify Task"])
        UC12(["Stream Live Video"])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9

    Camera --> UC10
    Camera --> UC11
    Camera --> UC12

    Member --> UC3
    Member --> UC5
    Member --> UC10
    Member --> UC11
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


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
            REP_STATE["Exercise Classifier (Random Forest)"]
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
    Layer1 <-->|"HTTP / Axios REST API"| Laravel_API
    Layer1 <-->|"MJPEG Stream / Canvas Render"| Python_AI
    
    Layer4 -->|"RTSP Video Feed (Port 554)"| Python_AI
    Layer4 -->|"USB Video Capture"| Python_AI

    Python_AI -->|"POST /api/ai/log-attendance"| API_ATTENDANCE
    Python_AI -->|"POST /api/ai/log-workout"| API_MEMBERS

    Laravel_API <-->|"Eloquent PDO Queries"| MYSQL_DB
    Laravel_API -->|"Save Files"| FILE_STORAGE
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


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
        PyAI->>LV: POST /api/ai/log-attendance {member_id}
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

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


---

### 7.2. Gesture Workout Verification Sequence

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

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


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
