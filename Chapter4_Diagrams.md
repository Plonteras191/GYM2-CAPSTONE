# Chapter 4 Diagrams — Double Alpha Fitness Gym Management System

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
    Valid -- Yes --> EnterPin["Enter the 6-digit PIN"]
    EnterPin --> PinOk{"PIN correct?"}
    PinOk -- No --> Err2["Show PIN error"]
    Err2 --> EnterPin
    PinOk -- Yes --> Dash["Dashboard"]
    Dash --> Select["Select function"]

    Select --> A1["Module 1: Member Registration"]
    A1 --> A2["Enter name, contact details,<br/>date of birth, height and weight"]
    A2 --> A3["Capture face:<br/>front, left and right"]
    A3 --> A4["Save member record<br/>and face photo"]

    Select --> B1["Module 2: Attendance Monitoring"]
    B1 --> B2["Camera captures<br/>the member's face"]
    B2 --> B3{"Face<br/>recognized?"}
    B3 -- No --> B4["Show 'Unknown'<br/>on the live feed"]
    B3 -- Yes --> B5{"Within 9:00 AM to 9:30 PM<br/>and not yet logged today?"}
    B5 -- No --> B6["No attendance saved"]
    B5 -- Yes --> B7["Save member, date<br/>and time in"]

    Select --> C1["Module 3: Program Monitoring"]
    C1 --> C2["Build the member's 7-day plan:<br/>exercise, date, sets and reps"]
    C2 --> C3["Camera captures the member<br/>doing the exercise"]
    C3 --> C4{"Assigned exercise<br/>recognized?"}
    C4 -- No --> C5["Coach verifies<br/>the task manually"]
    C4 -- Yes --> C6["Task marked as verified"]
    C5 --> C6

    Select --> D1["Module 4: Packages and Subscriptions"]
    D1 --> D2["Select member<br/>and package"]
    D2 --> D3{"Member has an active<br/>subscription?"}
    D3 -- Yes --> D4["Upgrade to a higher-priced<br/>package and pay the balance"]
    D3 -- No --> D5["Save new subscription"]
    D5 --> D6["Payment transaction<br/>created automatically"]
    D4 --> D6

    Select --> E1["Module 5: Payment Transactions"]
    E1 --> E2["Select package and member<br/>(none for a walk-in guest)"]
    E2 --> E3["Enter amount, reference number<br/>and method: Cash, GCash or Maya"]
    E3 --> E4["Save transaction"]
    E4 --> E5["Print receipt<br/>or refund if needed"]

    Select --> F1["Module 6: Reports"]
    F1 --> F2["Choose report type:<br/>Payment Transactions, or<br/>Membership and Attendance"]
    F2 --> F3["Set start and end date"]
    F3 --> F4["View report, then<br/>export CSV or print"]

    A4 --> Out{"Log out?"}
    B4 --> Out
    B6 --> Out
    B7 --> Out
    C6 --> Out
    D6 --> Out
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

---

## Figure 4.5 — Data Flow Diagram

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

---

## Figure 4.6 — Use Case Diagram for Gym Owner / Admin

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

---

## Figure 4.7 — Use Case Diagram for Gym Member

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

---

## Figure 4.9 — Logical Entity-Relationship Diagram

```mermaid
erDiagram
    ADMIN {
        text name
        text email
        text password
        image system_logo
    }
    LOGIN_PIN {
        text purpose
        text pin
        datetime expires_at
        number attempts
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
        text status
        text current_plan
        image profile_photo
        image face_photo
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
        text payment_method
        text notes
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
    }
    WORKOUT_LOG {
        text exercise
        date date
        number sets
        number reps
        text gesture_class
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

    ADMIN ||--o{ LOGIN_PIN : "verifies with"
    MEMBER ||--o{ MEMBERSHIP : "subscribes to"
    PLAN ||--o{ MEMBERSHIP : "is sold as"
    PACKAGE_CATEGORY |o--o{ PLAN : "groups"
    MEMBERSHIP ||--o{ TRANSACTION : "is paid by"
    MEMBER |o--o{ TRANSACTION : "pays"
    MEMBER ||--o{ ATTENDANCE : "checks in"
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

Decimal sizes: `members.height` and `members.weight` are DECIMAL(5,2), `plans.price` is DECIMAL(9,2), `transactions.amount` is DECIMAL(10,2).

On delete: `attendances`, `workout_logs` and `auth_verification_codes` cascade; `memberships.member_id`, `transactions.member_id` and `transactions.membership_id` are set to null; `coach_events.category_id` is restricted.

Confirm on your database before finalizing: whether `memberships.plan_id` has a real foreign key (`SHOW CREATE TABLE memberships;`). It is drawn here as one.

Not drawn because the application does not use them: `face_encodings`, `payments`, `exercise_sessions`, `gesture_logs`, `exercises`, `users`, and Laravel's own tables (`sessions`, `cache`, `jobs` and similar).
