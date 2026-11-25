# Chapter 4 Diagrams — Muscle Bros Gym Management System

One diagram for each figure in Chapter 4. Figure 4.1 shows the gym's manual process before the system. Figures 4.3 to 4.10 are drawn from what the system actually does. Diagrams only.

| Figure | Diagram |
|---|---|
| 4.1 | Manual Process Flow for Admin |
| 4.3 | System Process Flow for Administrator |
| 4.4 | Context Level Diagram |
| 4.5 | Data Flow Diagram |
| 4.6 | Use Case Diagram for Gym Owner / Admin |
| 4.7 | Use Case Diagram for Gym Member |
| 4.8 | Use Case Diagram for Camera / Gesture Engine |
| 4.9 | Logical Entity-Relationship Diagram |
| 4.10 | Physical Entity-Relationship Diagram |

---

## Figure 4.1 — Manual Process Flow for Admin

```mermaid
flowchart LR
    subgraph S1 ["Stage 1: Registration"]
        direction TB
        Start([Start]) --> A1["Member fills out the<br/>membership form on paper"]
        A1 --> A2["Member submits personal<br/>and membership information"]
        A2 --> A3["Admin receives and<br/>reviews the information"]
        A3 --> A4{"Is the information<br/>complete?"}
        A4 -- No --> A5["Return to member<br/>for correction"]
        A5 --> A2
        A4 -- Yes --> A6["Admin records member<br/>information in the<br/>logbook or spreadsheet"]
        A6 --> A7["Admin records membership<br/>and payment<br/>(Cash, GCash or Maya)"]
        A7 --> A8["Admin confirms the<br/>membership to the member"]
    end

    subgraph S2 ["Stage 2: Attendance"]
        direction TB
        B1["Member visits the gym"] --> B2["Admin records attendance<br/>in the logbook"]
        B2 --> B3{"Is the membership<br/>active?"}
        B3 -- No --> B4["Member renews<br/>the membership"]
        B4 --> B5["Admin processes the<br/>renewal and updates the<br/>membership status"]
        B5 --> B6["Member proceeds with<br/>gym activities"]
        B3 -- Yes --> B6
    end

    subgraph S3 ["Stage 3: Fitness Program"]
        direction TB
        C1["Admin assigns a fitness<br/>program (new member<br/>or new program)"] --> C2["Admin explains the<br/>exercises and proper<br/>techniques"]
        C2 --> C3["Admin observes and<br/>monitors the member"]
        C3 --> C4["Admin records progress<br/>in the logbook"]
    end

    subgraph S4 ["Stage 4: Reports"]
        direction TB
        D1["Admin maintains attendance,<br/>membership, payment<br/>and member records"] --> D2["Admin prepares reports<br/>(attendance, payments,<br/>member list)"]
        D2 --> D3["Admin files and stores<br/>the records on paper<br/>and in logbooks"]
        D3 --> End([End])
    end

    S1 --> S2 --> S3 --> S4
```

---

## Figure 4.3 — System Process Flow for Administrator

```mermaid
flowchart TD
    Start([Start]) --> Cred["Enter email and password"]
    Cred --> Valid{"Email and password<br/>correct?"}
    Valid -- No --> Err1["Show login error"]
    Err1 --> Cred
    Cred -.->|"Forgot password?"| Rst1["Request a PIN<br/>by email"]
    Rst1 --> Rst2["Enter the PIN and<br/>choose a new password"]
    Rst2 --> Cred
    Valid -- Yes --> Dash["Dashboard"]
    Dash --> Select["Select function"]

    Select --> A1["Module 1: Member Registration"]
    A1 --> A2["Enter name, contact details, address,<br/>date of birth, height, weight<br/>and body type"]
    A2 --> A2b["Add a profile photo<br/>(optional)"]
    A2b --> A2c["Member agrees to face enrollment<br/>(consent date is recorded)"]
    A2c --> A3["Capture face: front,<br/>chin down, left and right"]
    A3 --> A4["Save member record<br/>and face photo"]

    Select --> B1["Module 2: Attendance Monitoring"]
    B1 --> B2["Camera captures<br/>the member's face"]
    B2 --> B3{"Face<br/>recognized?"}
    B3 -- Yes --> B5{"Within 9:00 AM to 9:30 PM<br/>and not yet logged today?"}
    B3 -- No --> B4["Show 'Unknown'<br/>on the live feed"]
    B4 --> B4b["Admin checks the member in manually<br/>(member and reason)"]
    B4b --> B5
    B5 -- No --> B6["No attendance saved"]
    B5 -- Yes --> B7["Save member, date, time in, method,<br/>camera and subscription status<br/>(expired is flagged RENEW, paused is flagged Paused)"]
    B7 --> B8{"Member profile<br/>Inactive?"}
    B8 -- Yes --> B9["Set member<br/>back to Active"]
    B1 --> T1["Attendance page: every subscriber's<br/>last visit, visits this week and month,<br/>and coach-plan progress"]
    T1 --> T2["Open a member: attendance calendar,<br/>check-in history and coach plan"]

    Select --> C1["Module 3: Program Monitoring"]
    C1 --> C2["Open the member's Training plan and build<br/>the 7-day plan: exercise, date, sets and reps"]
    C2 --> C2b{"Member has an active<br/>With Coach subscription?"}
    C2b -- Yes --> C3["Camera captures the member<br/>doing the exercise"]
    C2b -- No --> C5["Coach verifies<br/>the task manually"]
    C3 --> C4{"Assigned exercise<br/>recognized?"}
    C4 -- No --> C5
    C4 -- Yes --> C4b{"Counted exercise?<br/>(squat, push-up, curl, sit-up)"}
    C4b -- No --> C6["Task marked as verified"]
    C4b -- Yes --> C4c["Camera counts repetitions<br/>and saves the progress"]
    C4c --> C4d{"Target sets x reps<br/>reached?"}
    C4d -- No --> C4c
    C4d -- Yes --> C6
    C5 --> C6

    Select --> D1["Module 4: Packages and Subscriptions"]
    D1 --> D2["Select member<br/>and package"]
    D2 --> D3{"Member has an active<br/>subscription?"}
    D3 -- Yes --> D4["Upgrade to a higher-priced<br/>package and pay the balance"]
    D3 -- No --> D5["Save new subscription"]
    D5 --> D6["Payment transaction<br/>created automatically"]
    D4 --> D6
    D1 --> R1["Renew a subscription"]
    R1 --> R2{"Subscription still<br/>running?"}
    R2 -- Yes --> R3["Extend the same package from its<br/>end date (no paid days lost)"]
    R2 -- No --> R4["Start a new<br/>subscription today"]
    R3 --> R5["Renewal payment<br/>recorded"]
    R4 --> R5
    D1 --> Q1["Pause a running subscription<br/>(no refunds; the days left are kept)"]
    Q1 --> Q2["Resume: the end date moves later<br/>by the days spent paused"]
    D1 --> P1["Price list: create, edit<br/>or delete a package"]
    P1 --> P2{"Deleting a package members<br/>are still subscribed to?"}
    P2 -- Yes --> P3["Delete refused"]
    P2 -- No --> P4["Package saved or deleted"]
    D1 --> V1["Calendar: add a<br/>class or event"]
    V1 --> V2["Save class or event"]

    Select --> E1["Module 5: Payment Transactions"]
    E1 --> E2["Select package and member<br/>(none for a walk-in guest)"]
    E2 --> E3["Enter amount, reference number<br/>and method: Cash, GCash or Maya"]
    E3 --> E4["Save transaction"]
    E4 --> E5["Print receipt"]

    Select --> F1["Module 6: Reports"]
    F1 --> F2["Choose report type: Payments, Memberships,<br/>Attendance or Program Monitoring"]
    F2 --> F3["Set start and end date"]
    F3 --> F4["View report, then<br/>export CSV or print"]

    A4 --> Out{"Log out?"}
    B6 --> Out
    B8 -- No --> Out
    B9 --> Out
    T2 --> Out
    C6 --> Out
    D6 --> Out
    R5 --> Out
    Q2 --> Out
    P3 --> Out
    P4 --> Out
    V2 --> Out
    E5 --> Out
    F4 --> Out
    Out -- No --> Dash
    Out -- Yes --> Logout["Log out"]
    Logout --> End([End])
```

---

## Figure 4.4 — Context Level Diagram

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera<br/>(CCTV, phone camera or webcam)"]
    Member["Gym Member"]
    Mail["Email Server"]
    System(["0<br/>Gym Management System<br/>for Muscle Bros Gym"])

    Admin -->|"F1: Email and password"| System
    Admin -->|"F2: Member details (with body type and face consent), face capture, packages, subscriptions, renewals, pausing and resuming subscriptions, classes and events, payments"| System
    Admin -->|"F3: Training plans and manual verification"| System
    Admin -->|"F4: Report dates, camera selection, manual check-ins and profile updates"| System

    System -->|"F5: Login result, dashboard summary and notifications"| Admin
    System -->|"F6: Member, subscription and transaction records, printable receipt"| Admin
    System -->|"F7: Live camera feeds, today's attendance, every subscriber's attendance summary, workout task status and counted repetitions"| Admin
    System -->|"F8: Reports (CSV or print)"| Admin

    Camera -->|"F9: Live video of faces and exercise movement"| System
    Member -->|"F10: Personal details, face photo and payment (through the admin)"| System
    System -->|"F11: Payment receipt (printed by the admin)"| Member
    System -->|"F12: Password-reset PIN"| Mail
```

---

## Figure 4.5 — Data Flow Diagram

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

    Admin -->|"Camera selection, manual check-in, attendance page filters"| P4
    P4 -->|"Live feed, today's check-ins, every subscriber's attendance"| Admin
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
    S43 -->|"Subscription on the check-in date, latest subscription per member"| P4
    S44[("D5 workout_logs")]
    P4 ~~~ S44
    S44 -->|"This week's coach tasks"| P4

    Admin -->|"7-day training plan, manual verification"| P5
    P5 -->|"Task status, counted repetitions, workout history"| Admin
    S50[("D5 workout_logs")]
    P5 <-->|"Assigned tasks, counted repetitions, verified tasks"| S50
    S51[("D7 memberships")]
    P5 ~~~ S51
    S51 -->|"Active With Coach subscription"| P5

    Admin -->|"Packages, subscriptions, renewals, upgrades, pause and resume, classes and events"| P6
    P6 -->|"Package list, subscription status"| Admin
    S60[("D6 plans")]
    P6 <-->|"Packages"| S60
    S61[("D7 memberships")]
    P6 <-->|"Subscriptions"| S61
    S62[("D8 transactions")]
    P6 -->|"Automatic payment record"| S62
    S63[("D10 coach_events")]
    P6 <-->|"Classes and events"| S63
    S64[("D12 membership_pauses")]
    P6 <-->|"Pause history"| S64

    Admin -->|"Payment details"| P7
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

## Figure 4.6 — Use Case Diagram for Gym Owner / Admin

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]

    subgraph Boundary ["Gym Management System"]
        Login(["Log In"])
        ValCred(["Validate Email and Password"])
        Reset(["Reset Password by PIN"])
        Logout(["Log Out"])

        Dash(["View Dashboard"])
        Notif(["View Notifications"])

        AddMem(["Add Member"])
        Face(["Capture Face<br/>(front, chin down, left, right)"])
        Consent(["Record Face Consent"])
        ViewMem(["View Member Profile,<br/>Attendance and Workouts"])
        UpdMem(["Update Member"])
        SetStatus(["Set Member Status<br/>(Active / Inactive)"])
        DelMem(["Delete Member"])

        Pack(["Manage Packages and Prices"])
        DelPack(["Delete Package<br/>(refused while members are subscribed)"])
        Cat(["Manage Package Categories"])
        NewSub(["Create Subscription"])
        UpSub(["Upgrade Subscription"])
        RenewSub(["Renew Subscription"])
        PauseSub(["Pause Subscription<br/>(no refunds; days left are kept)"])
        ResumeSub(["Resume Subscription"])
        AutoPay(["Create Payment Transaction"])
        Events(["Manage Classes and Events"])

        Pay(["Record Payment<br/>(Cash, GCash, Maya)"])
        Receipt(["Print Receipt"])

        Plan(["Build 7-Day Training Plan"])
        Manual(["Manually Verify Workout Task"])

        AttMon(["View Attendance Monitor"])
        AttPage(["View Every Subscriber's Attendance<br/>(Attendance page)"])
        AttDetail(["View a Member's Attendance Calendar,<br/>Check-ins and Coach Plan"])
        ManualIn(["Check In Member Manually"])
        GesMon(["View Gesture Monitor"])
        Switch(["Switch Camera Source"])
        Sync(["Re-sync Enrolled Faces"])

        Report(["Generate Report<br/>(Payments, Memberships,<br/>Attendance, Program Monitoring)"])
        Export(["Export CSV or Print"])

        Profile(["Update Admin Profile"])
        Pass(["Change Password"])
        Logo(["Update System Logo"])

        Login -.->|"«include»"| ValCred
        Login ~~~ Reset
        Reset -.->|"«extend»"| Login
        AddMem -.->|"«include»"| Face
        Face -.->|"«include»"| Consent
        UpdMem ~~~ SetStatus
        SetStatus -.->|"«extend»"| UpdMem
        DelPack -.->|"«extend»"| Pack
        NewSub -.->|"«include»"| AutoPay
        UpSub -.->|"«include»"| AutoPay
        RenewSub -.->|"«include»"| AutoPay
        Pay ~~~ Receipt
        Receipt -.->|"«extend»"| Pay
        ManualIn -.->|"«extend»"| AttMon
        AttPage ~~~ AttDetail
        AttDetail -.->|"«extend»"| AttPage
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
    Admin --> RenewSub
    Admin --> PauseSub
    Admin --> ResumeSub
    Admin --> Events
    Admin --> Pay
    Admin --> Plan
    Admin --> Manual
    Admin --> AttMon
    Admin --> AttPage
    Admin --> ManualIn
    Admin --> GesMon
    Admin --> Switch
    Admin --> Sync
    Admin --> Report
    Admin --> Profile
    Admin --> Pass
    Admin --> Logo
```

---

## Figure 4.7 — Use Case Diagram for Gym Member

```mermaid
flowchart LR
    Member["Gym Member"]

    subgraph Boundary ["Gym Management System"]
        Info(["Provide Personal Details<br/>to the Admin"])
        Consent(["Consent to Face Enrollment"])
        FacePose(["Pose for Face Capture<br/>(front, chin down, left, right)"])
        Pay(["Pay for or Renew a Package<br/>through the Admin"])
        PauseReq(["Ask to Pause or Resume<br/>a Subscription through the Admin"])

        Scan(["Face the Camera<br/>for Attendance"])
        Recog(["Be Recognized by Face"])
        Logged(["Attendance Logged"])
        Reactivated(["Profile Set Back to Active"])

        Exercise(["Perform Assigned Exercise<br/>in Camera View"])
        ExRecog(["Exercise Recognized"])
        Counted(["Repetitions Counted"])
        Verified(["Task Marked as Verified"])

        FacePose -.->|"«include»"| Consent
        Scan -.->|"«include»"| Recog
        Logged -.->|"«extend» face matched"| Recog
        Reactivated -.->|"«extend» member was Inactive"| Logged
        Exercise -.->|"«include»"| ExRecog
        Counted -.->|"«extend» squat, push-up, curl or sit-up"| ExRecog
        Verified -.->|"«extend» assigned exercise confirmed"| ExRecog
    end

    Member --> Info
    Member --> FacePose
    Member --> Pay
    Member --> PauseReq
    Member --> Scan
    Member --> Exercise
```

---

## Figure 4.8 — Use Case Diagram for Camera / Gesture Engine

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
        Retry(["Save and Retry Attendance<br/>when Laravel is Unreachable"])

        Pose(["Detect Body Pose"])
        Link(["Link Pose to<br/>Recognized Member"])
        Classify(["Classify Exercise"])
        Count(["Count Repetitions<br/>(squat, push-up, curl, sit-up)"])
        Progress(["Send Repetition Progress<br/>to Laravel API"])
        Verify(["Send Workout Verification<br/>to Laravel API"])

        Detect -.->|"«include»"| Match
        Att -.->|"«extend» face matched"| Match
        Retry -.->|"«extend» sending failed"| Att
        Pose -.->|"«include»"| Link
        Link -.->|"«include»"| Classify
        Count -.->|"«extend» counted exercise confirmed"| Classify
        Progress -.->|"«extend» every few seconds"| Count
        Verify -.->|"«extend» assigned exercise confirmed, or target reached"| Classify
    end

    Camera --> Stream
    Camera --> SwitchSrc
    Camera --> LoadFaces
    Camera --> LoadPlans
    Camera --> Detect
    Camera --> Pose
```

---

## Figure 4.9 — Logical Entity-Relationship Diagram

```mermaid
erDiagram
    ADMIN {
        text name
        text email
        text password
        text logo
    }
    PASSWORD_RESET_PIN {
        text pin
        datetime expires_at
        number attempts
        datetime verified_at
    }
    MEMBER {
        text first_name
        text last_name
        text email
        text phone
        text address
        date date_of_birth
        number height
        number weight
        text body_type
        text status
        datetime status_updated_at
        text current_plan
        image profile_photo
        image face_photo
        datetime biometric_consent_at
    }
    PACKAGE_CATEGORY {
        text name
        text color
    }
    PLAN {
        text name
        number price
        number duration_days
        text category
        text color
    }
    MEMBERSHIP {
        text plan_type
        date start_date
        date end_date
        text status
        date paused_at
        text payment_method
        text notes
    }
    MEMBERSHIP_PAUSE {
        date paused_on
        date resumed_on
        number days
        text paused_by
        text resumed_by
    }
    TRANSACTION {
        text transaction_id
        date transaction_date
        text type
        text description
        number amount
        text payment_method
        text reference_number
        text status
    }
    ATTENDANCE {
        date date
        time time_in
        text member_name
        text method
        text camera
        number match_distance
        text subscription_status
        text plan_name
        boolean reactivated
        text recorded_by
        text reason
    }
    WORKOUT_LOG {
        text exercise
        date date
        number sets
        number reps
        number counted_reps
        text gesture_class
        text verified_by
        datetime verified_at
    }
    COACH_EVENT_CATEGORY {
        text name
        text color
    }
    COACH_EVENT {
        text title
        text description
        date start_date
        date end_date
        time start_time
        time end_time
        text location
    }

    ADMIN ||--o{ PASSWORD_RESET_PIN : "resets password with"
    MEMBER ||--o{ MEMBERSHIP : "subscribes to"
    PLAN ||--o{ MEMBERSHIP : "is sold as"
    PACKAGE_CATEGORY |o--o{ PLAN : "groups"
    MEMBERSHIP ||--o{ TRANSACTION : "is paid by"
    MEMBERSHIP ||--o{ MEMBERSHIP_PAUSE : "is paused in"
    MEMBER |o--o{ TRANSACTION : "pays"
    MEMBER |o--o{ ATTENDANCE : "checks in"
    MEMBER ||--o{ WORKOUT_LOG : "is assigned"
    COACH_EVENT_CATEGORY ||--o{ COACH_EVENT : "classifies"
```

---

## Figure 4.10 — Physical Entity-Relationship Diagram

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

Decimal sizes: `members.height` and `members.weight` are DECIMAL(5,2), `plans.price` is DECIMAL(9,2), `transactions.amount` is DECIMAL(10,2), `attendances.match_distance` is DECIMAL(5,4).

Unique rule: `attendances` allows one row per (`member_id`, `date`), so a member has at most one check-in per day.

On delete: `workout_logs` and `membership_pauses` cascade; `attendances.member_id`, `memberships.member_id`, `transactions.member_id` and `transactions.membership_id` are set to null; `coach_events.category_id` is restricted.

Refunds are not offered: a subscription is paused instead (`memberships.status` = Paused, `memberships.paused_at`), and each pause is kept in `membership_pauses`; on resume the paused days are added to `end_date`.

`memberships.plan_id` has **no** foreign key in the database (checked on November 17, 2026); only `memberships.member_id` has one. The link to `plans` is kept by the application, which is why a package is not deleted while members are subscribed to it, and why an ended subscription keeps the package name in `plan_type`.

Not drawn because the application does not use them: `face_encodings`, `payments`, `exercise_sessions`, `gesture_logs`, `exercises`, `auth_verification_codes` (the old login PIN, removed), `users`, and Laravel's own tables (`sessions`, `cache`, `jobs` and similar).
