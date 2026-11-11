# System Use Case Specification
**Project Title:** Design and Development of an IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym  
**Document Version:** 2.3 (Capstone Documentation Standard)

---

## 1. System Overview — Combined Use Case Diagram

This diagram shows the complete system boundary with all three actors and their associated use cases.

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


---

## 2. System Actors and Roles

| Actor Name | Type | Description |
|---|---|---|
| **Gym Owner / Coach (Admin)** | **Primary System Actor** | The unified administrator and coach who directly uses the web system to manage members, plans, payments, workouts, cameras, and reports. |
| **Security Camera / AI Vision Engine** | **IoT / Device Actor** | The camera hardware (RTSP CCTV or USB webcam) and Python microservice that autonomously detects faces, tracks pose landmarks, counts repetitions, and streams video data. |
| **Gym Member** | **Participating Actor (Physical)** | Registered member who physically interacts with camera terminals for biometric attendance and gesture-guided workout sessions. They do not log into the web system. |

---

## 3. Actor 1 — Gym Owner / Coach (Admin)

### 3.1 Use Case Diagram

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]

    subgraph Boundary ["Gym Management System"]
        Login(["Log In"])
        ValCred(["Validate Email and Password"])
        VerPin(["Verify 6-Digit PIN"])
        Reset(["Reset Password by PIN"])
        Logout(["Log Out"])

        Dash(["View Dashboard"])
        Notif(["View Notifications"])

        AddMem(["Add Member"])
        Face(["Capture Face<br/>(front, left, right)"])
        ViewMem(["View Member Profile,<br/>Attendance and Workouts"])
        UpdMem(["Update Member"])
        DelMem(["Delete Member"])

        Pack(["Manage Packages and Prices"])
        Cat(["Manage Package Categories"])
        NewSub(["Create Subscription"])
        UpSub(["Upgrade Subscription"])
        AutoPay(["Create Payment Transaction"])
        Events(["Manage Coach Events"])

        Pay(["Record Payment<br/>(Cash, GCash, Maya)"])
        Receipt(["Print Receipt"])
        Refund(["Refund Transaction"])

        Plan(["Build 7-Day Workout Plan"])
        Manual(["Manually Verify Workout Task"])

        AttMon(["View Attendance Monitor"])
        GesMon(["View Gesture Monitor"])
        Switch(["Switch Camera Source"])
        Sync(["Re-sync Enrolled Faces"])

        Report(["Generate Report"])
        Export(["Export CSV or Print"])

        Profile(["Update Admin Profile"])
        Pass(["Change Password"])
        Logo(["Update System Logo"])

        Login -.->|"«include»"| ValCred
        Login -.->|"«include»"| VerPin
        Login ~~~ Reset
        Reset -.->|"«extend»"| Login
        AddMem -.->|"«include»"| Face
        NewSub -.->|"«include»"| AutoPay
        UpSub -.->|"«include»"| AutoPay
        Pay ~~~ Receipt
        Receipt -.->|"«extend»"| Pay
        Report ~~~ Export
        Export -.->|"«extend»"| Report
    end

    Admin --> Login
    Admin --> Logout
    Admin --> Dash
    Admin --> Notif
    Admin --> AddMem
    Admin --> ViewMem
    Admin --> UpdMem
    Admin --> DelMem
    Admin --> Pack
    Admin --> Cat
    Admin --> NewSub
    Admin --> UpSub
    Admin --> Events
    Admin --> Pay
    Admin --> Refund
    Admin --> Plan
    Admin --> Manual
    Admin --> AttMon
    Admin --> GesMon
    Admin --> Switch
    Admin --> Sync
    Admin --> Report
    Admin --> Profile
    Admin --> Pass
    Admin --> Logo
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


### 3.2 Use Case Relationships and Scope Boundaries

#### A. Narrative Explanation of Relationships
The use case diagram illustrates the administrative capabilities of the Gym Owner / Coach, distinguishing between primary functions directly initiated by the admin and specialized sub-functions governed by UML relationship stereotypes (`<<include>>` and `<<extend>>`), as well as clearly defined system exclusions:

1. **Include Relationships (`<<include>>`) — Mandatory Sub-Processes:**
   An `<<include>>` relationship represents an essential, mandatory behavior that is automatically and unconditionally executed as part of the base use case. In this module:
   * **`UC-01: Login / Authentication` includes `Validate Credentials`:** Whenever the administrator attempts to log into the web system, the system must execute the validation routine against the database-stored bcrypt password hash. Login cannot proceed without successful credential verification.
   * **`Forgot Password` includes `Reset Password`:** Initiating account recovery mandates resetting the security password once the temporary recovery token is verified.
   * **`UC-01b: Logout` includes `Invalidate Session Token`:** Logging out always revokes the active Laravel Sanctum bearer token and purges the session from local storage, preventing unauthorized back-navigation.
   * **`UC-10a: Generate & Filter System Reports` includes `UC-10b: Export CSV / Print PDF Report`:** Report compilation includes formatting the aggregated operational data into a downloadable CSV or printable PDF document.
   * **`UC-03a: Add Member` includes `Biometric Enrollment`:** Creating a new member profile mandatorily incorporates capturing the member's facial reference photo and extracting 128-dimensional facial encodings to prepare them for automated attendance tracking.
   * **`UC-05a: Record Payment Transaction` includes `Activate / Update Subscription`:** Confirming a payment transaction automatically updates the linked member's subscription status and extends their validity period in the centralized database.

2. **Extend Relationships (`<<extend>>`) — Conditional / Optional Behaviors:**
   An `<<extend>>` relationship represents an optional or conditional behavior that only executes at specific extension points under certain circumstances:
   * **`Forgot Password` extends `UC-01: Login / Authentication`:** This workflow is optional and only triggered when the administrator fails to remember their password and explicitly clicks the "Recovery?" link on the login interface.
   * **`UC-05b: Print Payment Receipt` extends `UC-05a: Record Payment Transaction`:** Printing a formal payment receipt is an optional extension executed only when the member requests a physical copy or when the admin chooses to print proof of payment.
   * **`UC-07b: Manually Verify Workout Log` extends `UC-07a: Assign Exercise Task to Member`:** Manual log verification is an optional branch utilized only when camera visibility issues or AI classification discrepancies necessitate direct coach confirmation of completed exercises.

3. **System Exclusions — Features Explicitly Out of Scope:**
   To maintain alignment with the approved study boundaries documented in `manus.md` (Scope and Limitations), the following features are explicitly **excluded** from the administrator module:
   * **Excluded: Full Payment Gateway Integration:** The system does not integrate automated payment gateways (e.g., direct Stripe or PayPal card processing APIs). It is strictly limited to manually recording payments received through Cash, GCash, or Maya.
   * **Excluded: Native Mobile Application:** There is no standalone mobile application for iOS or Android; administrative access is provided exclusively via responsive web browsers.
   * **Excluded: Automated Medical Diagnosis:** The system records anthropometric data (height, weight, body type) purely as reference metrics for coach-guided program assignment; automated nutritional or medical diagnoses are excluded.
   * **Excluded: Multi-Factor Authentication (MFA):** Access security is restricted to single-factor email and bcrypt-hashed password authentication; SMS or hardware token MFA is excluded due to project constraints.

---

### 3.3 Admin Use Case Summary

| Use Case ID | Use Case Name | Description |
|:---:|---|---|
| **UC-01** | User Authentication & Authorization | Verifies admin credentials and establishes a secure session token. |
| **UC-02** | View Dashboard & Real-Time Statistics | Displays active members, daily attendance, expiring plans, pending tasks, and live activity. |
| **UC-03** | Member Registration & Biometric Enrollment | Creates member profiles, records anthropometrics, and enrolls facial reference images. |
| **UC-04** | Membership Plans & Subscription Tracking | Creates plans, assigns subscriptions, monitors status, and manages renewals. |
| **UC-05** | Payment Transaction Recording | Records Cash, GCash, Maya payments and generates printable receipts. |
| **UC-06** | Attendance Monitoring (Security Monitor) | Views the Security Monitor page where facial recognition results and attendance logs appear in real time. |
| **UC-07** | Program Exercise Assignment & Verification | Assigns selected program exercises to members and manually verifies completed workout logs. |
| **UC-09** | Camera Stream & Hardware Control | Views live feeds and switches between RTSP CCTV and USB webcam sources. |
| **UC-10** | System Reports & Analytics Generation | Filters and exports attendance, program monitoring, membership, and payment reports. |
| **UC-11** | Admin Profile & Security Settings | Updates profile details, password, and profile picture. |

### 3.4 Admin Formal Use Case Specifications

---

#### **UC-01: User Authentication & Authorization**
* **Primary Actor:** Gym Owner / Coach (Admin)
* **Preconditions:** Admin account exists in the database with a bcrypt-hashed password.
* **Main Flow:**
  1. Admin opens the system URL and is shown the Login screen.
  2. Admin enters registered email and password.
  3. System sends credentials to `POST /api/auth/login`.
  4. System generates a Laravel Sanctum bearer token and stores it in `localStorage`.
  5. System records login device info (device type, timestamp) for the Notification Bell security alert.
  6. System redirects Admin to the Dashboard (`/overview`).
* **Alternative Flows:**
  * *4a. Invalid Credentials:* System shows `"Invalid email or password"` error toast; email input is retained.
  * *4b. Forgot Password:* Admin clicks "Recovery?", provides registered email, receives reset token, and sets a new password.
  * *6a. Logout:* Admin clicks Logout; system calls `POST /api/auth/logout`, revokes the Sanctum token, and invalidates the session.
* **Postconditions:** Admin has authenticated access to all system modules.

---

#### **UC-02: View Dashboard & Real-Time Statistics**
* **Primary Actor:** Gym Owner / Coach
* **Preconditions:** Admin is logged in with a valid session token.
* **Main Flow:**
  1. Admin logs in and is automatically redirected to the Dashboard.
  2. System fetches live statistics via `GET /api/dashboard` (active members, today's attendance count, expiring subscriptions, pending AI tasks).
  3. Dashboard renders KPI summary cards, live attendance preview, and notification bell alerts.
  4. Notification bell auto-refreshes every 5 minutes: expiring memberships, upcoming events, login device activity, members without subscriptions, pending AI workout verifications.
* **Alternative Flows:**
  * *2a. API Timeout:* System displays cached last-known data and shows a subtle "Refreshing…" indicator.
* **Postconditions:** Admin has a full operational overview of all current gym activity.

---

#### **UC-03: Member Registration & Biometric Enrollment**
* **Primary Actor:** Gym Owner / Coach
* **Participating Actor:** Gym Member
* **Preconditions:** Admin is logged in; camera or file upload is available.
* **Main Flow:**
  1. Admin navigates to **Member Directory** and clicks **"Add Member"**.
  2. Admin enters personal details (Name, Contact, Gender, Emergency Contact).
  3. Admin inputs anthropometric data (Height in cm, Weight in kg; BMI is auto-calculated) and selects Body Type (Ectomorph, Mesomorph, Endomorph).
  4. Admin captures or uploads a front-facing facial reference photo of the member.
  5. Admin submits the form.
  6. Backend stores the record in MySQL and saves the face image in `/public/faces/`.
  7. Python AI Engine re-syncs enrolled face list via `GET /api/ai/members-faces` and recomputes 128-d face encodings.
* **Alternative Flows:**
  * *5a. Incomplete Required Fields:* System displays `"Please fill all required fields before proceeding"` and blocks submission.
* **Postconditions:** Member profile is active; facial biometric is enrolled for automated attendance.

---

#### **UC-04: Membership Plans & Subscription Tracking**
* **Primary Actor:** Gym Owner / Coach
* **Preconditions:** Admin is logged in.
* **Main Flow:**
  1. Admin navigates to **Subscriptions** page.
  2. Admin views existing plans. Admin clicks **"Add Plan"** to define a new tier (Name, Duration in days, Price).
  3. System stores the plan via `POST /api/plans`.
  4. Admin selects a member and assigns a plan via **"Add Subscription"**.
  5. System calculates expiry date from plan duration and saves via `POST /api/memberships`.
  6. Admin can activate/deactivate plans via the plan toggle (`POST /api/plans/bulk-update`).
* **Alternative Flows:**
  * *2a. Incomplete Plan Form:* System alerts `"Please fill all required fields"` and blocks submission.
  * *4a. Member Already Has Active Plan:* System warns admin before creating an overlapping subscription.
* **Postconditions:** Plan is saved; member subscription is active with correct start and expiry dates.

---

#### **UC-05: Payment Transaction Recording**
> **Implementation Note:** Receipt generation is an implementation-level output of payment confirmation. The paper's Payment Transaction Module covers "generating payment records and storing payment history" (manus.md), of which a printable receipt is the user-facing output artifact.
* **Primary Actor:** Gym Owner / Coach
* **Participating Actor:** Gym Member
* **Preconditions:** Admin is logged in; member exists in the database.
* **Main Flow:**
  1. Admin navigates to **Transactions** and clicks **"Add Transaction"**.
  2. Admin selects the member and linked membership plan.
  3. Admin selects payment method (Cash, GCash, Maya) and enters the amount and reference number.
  4. Admin submits the form.
  5. System saves the transaction via `POST /api/transactions`, activates the linked membership, and updates the subscription record.
  6. Admin can print a formal PDF receipt per transaction.
* **Alternative Flows:**
  * *4a. Incomplete Fields:* System displays `"Please enter all required information before saving"` and prevents submission.
  * *4b. Double-Click Guard:* `isSavingRef` lock prevents duplicate submissions on rapid repeated clicks.
* **Postconditions:** Payment record is saved; member subscription is immediately activated.

---

#### **UC-07: Program Exercise Assignment & Verification**
* **Primary Actor:** Gym Owner / Coach
* **Preconditions:** Admin is logged in; Gesture Monitor page is open; member is registered.
* **Main Flow:**
  1. Admin navigates to **Gesture Monitor** and selects a registered member.
  2. Admin chooses a selected exercise from the approved scope and clicks **"Assign Task"**.
  3. System saves the task via `POST /api/members/{id}/assign-task` with status `"ASSIGNED: [EXERCISE]"` and today's date.
  4. AI Engine detects completion and notifies `POST /api/ai/log-workout`.
  5. System strips `"ASSIGNED:"` prefix to mark the task as verified.
  6. If AI detection is ambiguous, admin manually verifies via `PUT /api/workouts/{id}/manual-verify`.
* **Alternative Flows:**
  * *3a. Same Task Already Assigned Today:* System silently skips the duplicate to prevent double logging.
  * *4a. Exercise Not Detected:* Task stays in `"ASSIGNED:"` status and appears in the Notification Bell as a Pending AI Task.
* **Postconditions:** Exercise is logged as completed in `workout_logs` with a verified timestamp.

---

#### **UC-09: Camera Stream & Hardware Control**
> **Scope Note:** Camera input supports both USB webcam and RTSP-based network cameras. Both are categorized under the "camera or webcam" IoT input defined in the approved system scope.
* **Primary Actor:** Gym Owner / Coach
* **Secondary Actor:** Security Camera / AI Vision Engine
* **Preconditions:** Python AI microservice is running on port 5000; camera hardware is connected.
* **Main Flow:**
  1. Admin opens **Security Monitor** or **Gesture Monitor** page.
  2. Page connects to the MJPEG stream at `http://127.0.0.1:5000/video_feed`.
  3. Live camera feed renders on the page.
  4. Admin clicks **"Switch to Webcam"** or **"Switch to CCTV"**.
  5. System sends `POST /switch_camera` with selected source to the AI Engine.
  6. AI Engine stops the current thread and reinitializes with the new source.
* **Alternative Flows:**
  * *3a. RTSP Unavailable:* AI Engine shows a branded standby placeholder frame instead of crashing.
  * *6a. Webcam Not Found:* Status badge shows `"Webcam device not detected"` and retains the prior source.
* **Postconditions:** Active camera source is streaming live frames.

---

#### **UC-10: System Reports & Analytics Generation**
* **Primary Actor:** Gym Owner / Coach
* **Preconditions:** Historical records exist in the database.
* **Main Flow:**
  1. Admin navigates to **Reports** page.
  2. Admin selects a Report Category: Attendance Logs, Program Monitoring, Membership Status, or Payment Transactions.
  3. Admin sets filters (Start Date, End Date, Search Keywords).
  4. System fetches filtered data via `GET /api/reports?start=&end=` and paginates to 7 rows per page.
  5. Admin exports via **"Export CSV"** or **"Print PDF"** (formal letterhead with KPI summary, data table, and sign-off lines).
* **Alternative Flows:**
  * *4a. No Records Found:* Table body displays `"No matching records found in the database."` — no error is thrown.
  * *5a. CSV Export Error:* Error is caught silently; `isExporting` state resets so the button recovers.
* **Postconditions:** Report is generated and available for download or print.

---

#### **UC-11: Admin Profile & Security Settings**
* **Primary Actor:** Gym Owner / Coach
* **Preconditions:** Admin is logged in with a valid session token.
* **Main Flow:**
  1. Admin navigates to **Admin Profile** page.
  2. System loads current profile data via `GET /api/admin/me`.
  3. Admin updates personal details (Name, Contact, Address) and saves via `PUT /api/admin/profile`.
  4. Admin clicks **"Change Password"**, enters current and new passwords.
  5. System validates match and strength, then updates the bcrypt-hashed password in the database.
  6. Admin uploads a new profile avatar via the photo upload control.
* **Alternative Flows:**
  * *5a. Passwords Do Not Match:* System shows `"New passwords do not match"` and clears password fields.
  * *5b. Wrong Current Password:* System shows `"Current password is incorrect"` and blocks the update.
  * *3a. Empty Required Fields:* System shows `"Please fill in all required fields"` and blocks submission.
* **Postconditions:** Admin profile and security credentials are updated.

---

## 4. Actor 2 — Security Camera / AI Vision Engine

### 4.1 Use Case Diagram

```mermaid
flowchart LR
    Camera["Camera / Gesture Engine"]

    subgraph Boundary ["Gym Management System"]
        Stream(["Stream Live Video Feed"])
        SwitchSrc(["Switch Camera Source<br/>on Admin Request"])
        LoadFaces(["Load Enrolled Faces"])
        LoadPlans(["Load Today's Workout Plans"])

        Detect(["Detect Faces"])
        Match(["Match Face with<br/>Enrolled Members"])
        Att(["Send Attendance<br/>to Laravel API"])

        Pose(["Detect Body Pose"])
        Link(["Link Pose to<br/>Recognized Member"])
        Classify(["Classify Exercise"])
        Verify(["Send Workout Verification<br/>to Laravel API"])

        Detect -.->|"«include»"| Match
        Att -.->|"«extend» face matched"| Match
        Pose -.->|"«include»"| Link
        Link -.->|"«include»"| Classify
        Verify -.->|"«extend» assigned exercise confirmed"| Classify
    end

    Camera --> Stream
    Camera --> SwitchSrc
    Camera --> LoadFaces
    Camera --> LoadPlans
    Camera --> Detect
    Camera --> Pose
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


### 4.2 Use Case Relationships and Scope Boundaries

#### A. Narrative Explanation of Relationships
The use case diagram for the Security Camera / AI Vision Engine depicts the automated computer vision pipeline operating in the background, governed by chained mandatory relationships and explicit scope limitations:

1. **Include Relationships (`<<include>>`) — Automated Processing Pipeline:**
   Every major vision pipeline consists of strict, mandatory sequential steps where each subsequent action is automatically included:
   * **Facial Recognition Attendance Pipeline:** `UC-06a: Detect Facial Bounding Box` includes `UC-06b: Extract 128-d Face Embeddings`, which includes `UC-06c: Match Encoding Against Enrolled Database`, which in turn includes `UC-06d: Send Attendance Record to Laravel API`. None of these steps can be bypassed; facial detection without feature extraction or matching cannot log an attendance event.
   * **Gesture Monitoring Pipeline:** `UC-08a: Detect 33-Point Skeletal Landmarks` includes `UC-08b: Calculate Joint Angles`, which includes `UC-08c: Classify Exercise Type`, which includes `UC-08d: Count Completed Repetitions`, and culminates in `UC-08e: Send Workout Record to Laravel API`. Landmark estimation directly drives angle evaluation, repetition counting, and workout logging.

2. **Extend Relationships (`<<extend>>`):**
   * There are no optional `<<extend>>` branches initiated autonomously by the AI Engine. The vision algorithms follow deterministic mathematical thresholds (e.g., Euclidean distance < 0.6 for face match; joint angle inflection triggers for repetition counting).

3. **System Exclusions — Vision Features Explicitly Out of Scope:**
   * **Excluded: Full Posture Correction and Biomechanical Form Evaluation:** As explicitly bounded in `manus.md` (Scope and Limitations), the computer vision engine is restricted to detecting movement patterns and counting completed repetitions for selected exercises in the approved scope. It does not provide professional posture correction, clinical safety evaluations, or injury risk assessments.
   * **Excluded: Wearable or Equipment Sensor Tracking:** The system relies strictly on optical camera input; wearable sensors, smartwatches, and equipment-attached accelerometers are excluded.
   * **Excluded: Continuous All-Day Video Recording / NVR Storage:** The AI microservice streams live frames for real-time monitoring and processing; continuous 24/7 video archiving is excluded.

---

### 4.3 AI Vision Engine Use Case Summary

| Use Case ID | Use Case Name | Description |
|:---:|---|---|
| **UC-06** | Facial Recognition Attendance Tracking | Captures frames, extracts embeddings, matches enrolled faces, and sends attendance logs to the backend. |
| **UC-08** | Gesture-Based Movement & Repetition Monitoring | Detects pose landmarks, calculates joint angles, classifies exercises, counts reps, and logs workout results. |
| **UC-09** | Camera Stream & Live Feed Provision | Provides the MJPEG stream to the web UI and switches camera sources on admin request. |

### 4.4 AI Vision Engine Formal Use Case Specifications

---

#### **UC-06: Facial Recognition Attendance Tracking**
* **Primary Actor:** Security Camera / AI Vision Engine
* **Participating Actor:** Gym Member
* **Preconditions:** Camera stream is online; facial data is enrolled; AI microservice is running on port 5000.
* **Main Flow:**
  1. Gym Member approaches the entrance camera terminal.
  2. AI Engine captures live frames from the RTSP/Webcam stream using OpenCV.
  3. `face_recognition` library detects facial bounding boxes and extracts 128-dimensional embeddings.
  4. Engine computes Euclidean distance against enrolled encodings: Distance ≤ 0.52 = Match Verified.
  5. A confidence margin check of ≥ 0.035 gap between the top-2 candidates is required before confirming identity.
  6. Matched `member_id` and timestamp are sent to `POST /api/ai/log-attendance`.
  7. Backend logs the record in the `attendances` table; Security Monitor UI displays a recognition card.
* **Alternative Flows:**
  * *4a. Unknown Face / Distance > 0.50:* Face is tagged `"Unknown"` — no attendance log is created.
  * *5a. Ambiguous Match (Gap < 0.035):* Engine skips logging and waits for the next frame cycle.
  * *6a. Cooldown Active:* Duplicate attendance within 15 minutes is suppressed automatically.
* **Postconditions:** Member's gym entry is logged with a precise date and time.

---

#### **UC-08: Gesture-Based Movement & Repetition Monitoring**
* **Primary Actor:** Security Camera / AI Vision Engine
* **Participating Actor:** Gym Member
* **Supporting Actor:** Gym Owner / Coach
* **Preconditions:** Member is in camera view; MediaPipe Pose is initialized; workout model is loaded.
* **Main Flow:**
  1. Gym Member performs an exercise in front of the gesture camera station.
  2. MediaPipe Pose detects 33 3D skeletal landmark coordinates (shoulders, elbows, wrists, hips, knees, ankles).
  3. Engine extracts translation-invariant coordinates relative to the nose joint.
  4. Feature vectors are fed to the Sklearn classifier (`workout_model.pkl`) for exercise classification.
  5. State machine tracks joint angle inflection (DOWN → UP cycle) to increment the repetition counter.
  6. On task completion, engine sends `POST /api/ai/log-workout` to the Laravel backend.
  7. Backend matches the log to the pending assigned task and marks it as verified.
* **Alternative Flows:**
  * *4a. Low Confidence Prediction:* `workout_buffer deque(maxlen=7)` smooths noisy predictions before confirming exercise type.
  * *5a. Incomplete Rep (Angle Threshold Not Met):* Counter does not increment; member must complete the full motion arc.
  * *6a. Workout Cooldown Active:* If the same exercise was logged within 2 minutes, duplicate is suppressed.
* **Postconditions:** Exercise repetitions are stored in `workout_logs`; the assigned task is marked verified.

---

## 5. Actor 3 — Gym Member

### 5.1 Use Case Diagram

```mermaid
flowchart LR
    Member["Gym Member"]

    subgraph Boundary ["Gym Management System"]
        Info(["Provide Personal Details<br/>to the Admin"])
        FacePose(["Pose for Face Capture<br/>(front, left, right)"])
        Pay(["Pay for a Package<br/>through the Admin"])

        Scan(["Face the Camera<br/>for Attendance"])
        Recog(["Be Recognized by Face"])
        Logged(["Attendance Logged"])

        Exercise(["Perform Assigned Exercise<br/>in Camera View"])
        ExRecog(["Exercise Recognized"])
        Verified(["Task Marked as Verified"])

        Scan -.->|"«include»"| Recog
        Logged -.->|"«extend» face matched"| Recog
        Exercise -.->|"«include»"| ExRecog
        Verified -.->|"«extend» assigned exercise confirmed"| ExRecog
    end

    Member --> Info
    Member --> FacePose
    Member --> Pay
    Member --> Scan
    Member --> Exercise
```

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


### 5.2 Use Case Relationships and Scope Boundaries

#### A. Narrative Explanation of Relationships
The use case diagram for the Gym Member depicts physical, participant-level interactions with the system, highlighting automated inclusion pipelines and fundamental system exclusions:

1. **Include Relationships (`<<include>>`) — Automated Participation Chains:**
   Because gym members do not manually operate software buttons, their physical presence initiates automatic downstream operations modeled as include relationships:
   * **Attendance Check-In:** `UC-06m: Face the Entrance Camera for Attendance Scan` includes `UC-06r: Be Identified by Facial Recognition Engine`, which automatically includes `UC-06l: Attendance Entry is Auto-Logged`. Stepping in front of the camera leads directly to automatic biometric identification and timestamp logging.
   * **Workout Monitoring:** `UC-08m: Perform Assigned Exercise in Camera View` includes `UC-08p: Pose Landmarks Detected by AI Engine`, which automatically includes `UC-08r: Repetition Count Auto-Recorded`. Performing an exercise in camera view triggers automated skeletal tracking and repetition logging.

2. **Extend Relationships (`<<extend>>`):**
   * There are no `<<extend>>` relationships for the Gym Member. Their participation is direct and uniform across registration, attendance check-in, payment handover, and exercise performance.

3. **System Exclusions — Features Explicitly Out of Scope for Members:**
   * **Excluded: Direct Web Portal / Account Login:** Members do not have login accounts, passwords, or direct web interface access. All member interactions are conducted either touchlessly via camera sensors or through admin assistance.
   * **Excluded: Self-Service Mobile Application:** Members do not download a mobile app to check in, track reps, or pay; the system is deployed purely as a web-based administrative console and IoT camera terminal.
   * **Excluded: In-App Digital Payment Gateways:** Members cannot enter credit/debit card numbers directly into an online checkout; payments are presented directly to the gym owner or admin via Cash, GCash QR, or Maya reference confirmation.

---

### 5.3 Gym Member Use Case Summary

| Use Case ID | Use Case Name | Member Role |
|:---:|---|---|
| **UC-03** | Member Registration & Biometric Enrollment | Provides personal info, anthropometrics, and poses for facial photo capture during admin-assisted registration. |
| **UC-05** | Payment Transaction Recording | Presents payment (Cash, GCash, Maya) to the admin for recording and confirmation. |
| **UC-06** | Facial Recognition Attendance Tracking | Faces the entrance camera; the AI Engine identifies them and auto-logs their attendance. |
| **UC-08** | Gesture-Based Movement & Repetition Monitoring | Performs assigned exercises in front of the gesture camera; reps are automatically tracked and recorded. |

### 5.4 Gym Member Formal Use Case Specifications

> **Note:** Gym Members do not have a web system login account. All member interactions are physical — occurring via camera terminals and admin-assisted processes. The system records their actions automatically.

---

#### **UC-03 (Member Role): Participate in Registration & Facial Enrollment**
* **Primary Actor:** Gym Member (Physical Participation)
* **Supporting Actor:** Gym Owner / Coach
* **Preconditions:** Member is physically present at the gym; Admin is conducting the registration session.
* **Main Flow:**
  1. Member provides personal information verbally or via a registration form (name, contact, gender, emergency contact).
  2. Member stands on the weighing scale; admin records height and weight; system calculates BMI.
  3. Admin selects the member's body type based on physical assessment (Ectomorph, Mesomorph, Endomorph).
  4. Member faces the camera or provides a clear front-facing photo for facial biometric enrollment.
  5. Admin submits the enrollment form; system saves the data and face image.
* **Alternative Flows:**
  * *4a. Blurry or Obstructed Photo:* Admin retakes the photo before submitting.
* **Postconditions:** Member's profile and facial biometric are registered and ready for attendance tracking.

---

#### **UC-05 (Member Role): Submit Payment for Membership**
* **Primary Actor:** Gym Member (Physical Participation)
* **Supporting Actor:** Gym Owner / Coach
* **Preconditions:** Member has an existing profile in the system.
* **Main Flow:**
  1. Member approaches the admin to renew or activate a membership plan.
  2. Member presents payment — Cash (handed over), GCash (shows QR confirmation), or Maya (shows transaction reference).
  3. Admin records the payment details in the Transactions page and confirms the transaction.
  4. System activates the linked subscription and generates a PDF receipt.
  5. Admin optionally prints or shares the receipt with the member.
* **Alternative Flows:**
  * *2a. Incorrect Amount:* Admin enters the actual amount received; transaction is flagged for manual review.
* **Postconditions:** Membership payment is recorded; subscription is active; member is cleared to use gym services.

---

#### **UC-06 (Member Role): Use Facial Recognition Attendance**
* **Primary Actor:** Gym Member (Physical Participation)
* **System Actor:** Security Camera / AI Vision Engine
* **Preconditions:** Member's facial biometric is enrolled; camera is active at the entrance.
* **Main Flow:**
  1. Member walks into the gym entrance and faces the CCTV/Webcam terminal.
  2. AI Vision Engine captures their face and extracts facial embeddings.
  3. Engine compares embeddings against the enrolled database and confirms identity.
  4. System automatically logs the member's attendance with the current date and time.
  5. Security Monitor page updates in real time showing the member's name, photo, and entry timestamp.
* **Alternative Flows:**
  * *3a. Face Not Recognized:* System labels the face as "Unknown" and does not log attendance. Member may inform admin for manual check-in or re-enrollment.
  * *3b. Member Recently Logged:* If already logged within the last 15 minutes, duplicate entry is suppressed.
* **Postconditions:** Member's gym entry is officially recorded with a precise timestamp.

---

#### **UC-08 (Member Role): Perform Gesture-Monitored Exercise**
* **Primary Actor:** Gym Member (Physical Participation)
* **System Actor:** Security Camera / AI Vision Engine
* **Supporting Actor:** Gym Owner / Coach
* **Preconditions:** Admin has assigned an exercise task to the member; gesture camera is active.
* **Main Flow:**
  1. Admin informs the member of the assigned exercise for the session.
  2. Member positions themselves in front of the gesture camera with full body visibility.
  3. Member performs the assigned exercise (e.g., Squats, Bicep Curls, Push-ups) at a natural pace.
  4. AI Engine tracks pose landmarks and counts each completed repetition automatically.
  5. Upon completing the required reps, the system records the workout and notifies the admin.
* **Alternative Flows:**
  * *4a. Body Not Fully Visible:* AI cannot accurately detect landmarks; member repositions for better camera coverage.
  * *4b. Wrong Exercise Detected:* If the AI misclassifies the movement, admin uses manual verification to approve the correct log.
* **Postconditions:** Workout session is recorded with exercise type and repetition count in the system.
