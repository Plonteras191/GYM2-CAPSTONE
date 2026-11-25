# System Diagrams & Visual Models Document

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Muscle Bros Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 2.0  
**Date:** November 17, 2026  
**Describes:** the system as built on this date.  

---

## 1. Executive Summary

This document provides a comprehensive visual and structural modeling specification for the **Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring** at Muscle Bros Gym. 

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


---

## 3. System Context Diagram (Level 0 DFD)

The Context Diagram defines the system boundary, showcasing external entities interacting with the central **Camera-Based Gym Management System**.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera<br/>(CCTV, phone camera or webcam)"]
    Member["Gym Member"]
    Mail["Email Server"]
    System(["0<br/>Gym Management System<br/>for Muscle Bros Gym"])

    Admin -->|"F1: Email and password"| System
    Admin -->|"F2: Member details (with body type and face consent), face capture, packages, subscriptions and renewals, classes and events, payments and refunds"| System
    Admin -->|"F3: Training plans and manual verification"| System
    Admin -->|"F4: Report dates, camera selection, manual check-ins and profile updates"| System

    System -->|"F5: Login result, dashboard summary and notifications"| Admin
    System -->|"F6: Member, subscription and transaction records, printable receipt"| Admin
    System -->|"F7: Live camera feeds, today's attendance, workout task status and counted repetitions"| Admin
    System -->|"F8: Reports (CSV or print)"| Admin

    Camera -->|"F9: Live video of faces and exercise movement"| System
    Member -->|"F10: Personal details, face photo and payment (through the admin)"| System
    System -->|"F11: Payment receipt (printed by the admin)"| Member
    System -->|"F12: Password-reset PIN"| Mail
```


---

## 4. Data Flow Diagram Level 1 (DFD Level 1)

DFD Level 1 decomposes the main system into eight processes and maps how data moves between external entities, processes, and the data stores (database tables and the private face-photo files).

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera"]
    Mail["Email Server"]
    P1(["1.0<br/>Log In"])
    P2(["2.0<br/>View Dashboard"])
    P3(["3.0<br/>Manage Members"])
    P4(["4.0<br/>Attendance Monitoring"])
    P5(["5.0<br/>Program Monitoring"])
    P6(["6.0<br/>Packages and Subscriptions"])
    P7(["7.0<br/>Payment Transactions"])
    P8(["8.0<br/>Reports"])

    Admin -->|"Email, password; forgot-password request, PIN and new password"| P1
    P1 -->|"Login result, session token"| Admin
    S10[("D1 admins")]
    P1 <-->|"Admin account"| S10
    S12[("D9 personal_access_tokens")]
    P1 -->|"Session token"| S12
    S13[("D11 password_reset_pins")]
    P1 <-->|"Password-reset PIN"| S13
    P1 -->|"Password-reset PIN"| Mail

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
    S23[("D4 attendances")]
    P2 ~~~ S23
    S23 -->|"Today's check-ins"| P2
    S24[("D10 coach_events")]
    P2 ~~~ S24
    S24 -->|"Classes and events this week"| P2

    Admin -->|"Member details, body type, face capture, consent, member status"| P3
    P3 -->|"Member list and profiles"| Admin
    S30[("D2 members")]
    P3 <-->|"Member records"| S30
    S31[("D3 face photo files")]
    P3 -->|"Face photo"| S31

    Admin -->|"Camera selection, manual check-in"| P4
    P4 -->|"Live feed, today's check-ins"| Admin
    S40[("D2 members")]
    P4 ~~~ S40
    S40 -->|"Enrolled members"| P4
    P4 -->|"Returning member set back to Active"| S40
    S41[("D3 face photo files")]
    P4 ~~~ S41
    S41 -->|"Face photos"| P4
    S42[("D4 attendances")]
    P4 <-->|"Member, date, time in, method, camera, subscription status"| S42
    S43[("D7 memberships")]
    P4 ~~~ S43
    S43 -->|"Subscription on the check-in date"| P4

    Admin -->|"7-day training plan, manual verification"| P5
    P5 -->|"Task status, counted repetitions, workout history"| Admin
    S50[("D5 workout_logs")]
    P5 <-->|"Assigned tasks, counted repetitions, verified tasks"| S50
    S51[("D7 memberships")]
    P5 ~~~ S51
    S51 -->|"Active With Coach subscription"| P5

    Admin -->|"Packages, subscriptions, renewals, upgrades, classes and events"| P6
    P6 -->|"Package list, subscription status"| Admin
    S60[("D6 plans")]
    P6 <-->|"Packages"| S60
    S61[("D7 memberships")]
    P6 <-->|"Subscriptions"| S61
    S62[("D8 transactions")]
    P6 -->|"Automatic payment record"| S62
    S63[("D10 coach_events")]
    P6 <-->|"Classes and events"| S63

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
    S83[("D5 workout_logs")]
    P8 ~~~ S83
    S83 -->|"Workout tasks and counted repetitions"| P8

    Camera -->|"Live video"| P4
    Camera -->|"Live video"| P5
```


---

## 5. Use Case Diagram (UCD) & Actor Specifications

The Use Case Diagram highlights all functional interactions provided by the system, categorized by user roles and automated AI camera actors.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera / Gesture Engine"]
    Member["Gym Member"]

    subgraph Boundary ["Gym Management System"]
        UC1(["Log In with Email<br/>and Password"])
        UC2(["View Dashboard<br/>and Notifications"])
        UC3(["Manage Members,<br/>Body Type and Face Capture"])
        UC4(["Manage Packages, Subscriptions,<br/>Renewals and Upgrades"])
        UC5(["Record Payments,<br/>Receipts and Refunds"])
        UC6(["Build Training Plans and<br/>Verify Tasks Manually"])
        UC7(["View Attendance and<br/>Gesture Monitors,<br/>Check In Manually"])
        UC8(["Generate Reports"])
        UC9(["Manage Admin Profile"])
        UC10(["Recognize Faces and<br/>Log Attendance"])
        UC11(["Recognize Exercise, Count<br/>Repetitions and Verify Task"])
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


### Actor Description Matrix

| Actor | Type | Description & System Responsibilities |
| :--- | :--- | :--- |
| **Gym Owner / Admin** | Primary Human Actor | Full system access through one shared login: members, packages and subscriptions, payments, reports, training plans, manual verification and manual check-in, and the live camera feeds. The gym owner and the coach use this same account. |
| **Gym Member** | External Human Participant | Never logs in. Gives personal details and consent, poses for face enrollment, faces the camera for attendance, and performs assigned exercises. |
| **Gesture Engine (camera)** | Automated Hardware/Software Actor | Reads the video feed, matches faces, extracts MediaPipe pose landmarks, classifies the exercise, counts repetitions for squat, push-up, curl and sit-up, and reports to Laravel. |

---

## 6. System Architecture & Topology Model

```mermaid
flowchart TB
    subgraph Layer1 ["1️⃣ PRESENTATION LAYER (React 19 SPA)"]
        UI_DASH["Admin & Coach Dashboard"]
        UI_MEMBERS["Member Directory & Registration"]
        UI_ATTENDANCE["Live Attendance Feed"]
        UI_WORKOUTS["Gesture Monitor & Training Plans"]
        UI_FINANCE["Payment & Invoicing Panel"]
    end

    subgraph Layer2 ["2️⃣ APPLICATION LAYER (Laravel REST API & Python AI Engine)"]
        subgraph Laravel_API ["Laravel 12 REST Services"]
            AUTH["Sanctum Auth Guard"]
            API_MEMBERS["Member Management API"]
            API_ATTENDANCE["Attendance Controller"]
            API_PAYMENTS["Subscription, Renewal & Payment API"]
            API_REPORTS["Analytics Generator"]
            CARBON_GUARD["Operating Hours & Expiry Guard"]
        end

        subgraph Python_AI ["Python 3.10+ AI Microservice Engine"]
            FLASK_SERVER["Flask Streaming API Server"]
            FACE_RECOGNITION["Face Recognition Engine (128-d Vector Match, helper processes)"]
            MEDIAPIPE_POSE["MediaPipe Pose Estimator (33 Landmarks)"]
            ML_CLASSIFIER["Exercise Classifier (Random Forest, workout_model.pkl)"]
            REP_STATE["Repetition Counter (joint angles)"]
        end
    end

    subgraph Layer3 ["3️⃣ DATA LAYER (Centralized MySQL 8.0+)"]
        MYSQL_DB[("Centralized MySQL Database")]
        FILE_STORAGE["Private Face Photo & Profile Photo Storage"]
    end

    subgraph Layer4 ["4️⃣ HARDWARE & DEVICE LAYER"]
        CCTV_CAM["Hikvision RTSP IP CCTV Cameras (Entrance & Gym Floor)"]
        USB_CAM["USB Webcams (Registration Desk)"]
    end

    %% Connections
    Layer1 <-->|"HTTP / Axios REST API"| Laravel_API
    Layer1 <-->|"MJPEG video feed"| Python_AI
    
    Layer4 -->|"RTSP Video Feed (Port 554)"| Python_AI
    Layer4 -->|"USB Video Capture"| Python_AI

    Python_AI -->|"POST /api/ai/log-attendance"| API_ATTENDANCE
    Python_AI -->|"POST /api/ai/log-workout"| API_MEMBERS

    Laravel_API <-->|"Eloquent PDO Queries"| MYSQL_DB
    Laravel_API -->|"Save Files"| FILE_STORAGE
```


---

## 7. Operational Sequence Diagrams

### 7.1. Touchless Facial Recognition Attendance Check-In Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    participant Cam as Camera
    participant PyAI as Python AI Engine
    participant LV as Laravel REST API
    participant DB as MySQL Database
    actor Admin as Admin Dashboard UI

    Member->>Cam: Steps in front of the camera
    Cam->>PyAI: Live video
    PyAI->>PyAI: Detect face and compare with the enrolled faces

    alt Match confirmed (distance 0.50 or less, 3 of 6 checks agree)
        PyAI->>LV: POST /api/ai/log-attendance {member_id, camera, distance}
        LV->>LV: Is the time between 9:00 AM and 9:30 PM?
        LV->>LV: Has the member already checked in today?

        alt All checks passed
            LV->>DB: INSERT INTO attendances (member, date, time_in, method, camera, subscription status)
            LV->>DB: Set the member back to Active if Inactive
            LV-->>PyAI: 200 OK (Attendance recorded)
        else Duplicate entry or outside hours
            LV-->>PyAI: 422 (reason)
        end
        PyAI->>Admin: Live feed shows the name (orange RENEW if the subscription expired)
    else No match
        PyAI->>Admin: Red box labelled Unknown
        Admin->>LV: Manual check-in with a reason
        LV->>DB: INSERT INTO attendances (method = manual)
    end
```


---

### 7.2. Gesture Workout Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Member as Gym Member
    actor Coach as Admin / Coach
    participant Cam as Workout Zone Camera
    participant Py as Python AI Engine
    participant LV as Laravel API
    participant DB as MySQL Database
    participant UI as React Member Profile

    Coach->>UI: Opens the member's Training plan
    Coach->>UI: Chooses exercises, dates, sets and reps
    UI->>LV: POST the dated tasks for the next 7 days
    LV->>DB: Replace the pending tasks in workout_logs

    Member->>Cam: Starts the exercise in camera view
    Cam->>Py: Streams frames
    Py->>Py: Recognize the face, detect the pose, classify the exercise
    Note over Py: Only members with an active With Coach subscription are tracked

    alt Squat, push-up, curl or sit-up
        loop Every few seconds
            Py->>Py: Count repetitions from the joint angle
            Py->>LV: POST /api/ai/log-workout (counted_reps, completed = false)
            LV->>DB: Save the progress
        end
        Py->>LV: POST /api/ai/log-workout (completed = true) when the target is reached
        LV->>DB: Mark the task verified (verified_by = ai)
    else Other exercise
        Py->>LV: POST /api/ai/log-workout (exercise recognized)
        LV->>DB: Mark the matching task verified (verified_by = ai)
    end

    opt The camera cannot check the exercise
        Coach->>UI: Verify the task manually
        UI->>LV: Verify (verified_by = coach)
    end
```


---

## 8. Diagram Summary Reference Matrix

| Diagram Type | Primary Purpose | Key Components & Standards |
| :--- | :--- | :--- |
| **IPO Model** | Conceptual System Flow | Categorizes System Inputs, Core Processes, and Generated Outputs |
| **Context Diagram (DFD L0)** | System Boundary & Entities | Defines high-level interaction between Admin, Member, Camera, Email Server & System |
| **DFD Level 1** | Process & Data Store Mapping | Decomposes the system into 8 processes interacting with 11 data stores (10 tables and the private face photo files) |
| **Use Case Diagram (UCD)** | Functional User Roles | Maps the use cases across 3 actors (Admin, Member, Camera / Gesture Engine); the detailed diagrams are in Section 4.2-D |
| **System Architecture** | Technical Tier Composition | 4-Layer model (Presentation, Application REST/AI, Data Layer, Hardware Layer) |
| **Sequence Diagrams** | Step-by-Step Runtime Logic | Detail execution sequences for touchless check-in (with manual check-in) and gesture repetition counting |
