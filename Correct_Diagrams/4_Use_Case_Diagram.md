# 4. Use Case Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

## 4.1 Gym Owner / Admin

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
        AutoPay(["Create Payment Transaction"])
        Events(["Manage Classes and Events"])

        Pay(["Record Payment<br/>(Cash, GCash, Maya)"])
        Receipt(["Print Receipt"])
        Refund(["Refund Transaction"])

        Plan(["Build 7-Day Training Plan"])
        Manual(["Manually Verify Workout Task"])

        AttMon(["View Attendance Monitor"])
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
    Admin --> Events
    Admin --> Pay
    Admin --> Refund
    Admin --> Plan
    Admin --> Manual
    Admin --> AttMon
    Admin --> ManualIn
    Admin --> GesMon
    Admin --> Switch
    Admin --> Sync
    Admin --> Report
    Admin --> Profile
    Admin --> Pass
    Admin --> Logo
```

## 4.2 Camera / Gesture Engine

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

## 4.3 Gym Member

```mermaid
flowchart LR
    Member["Gym Member"]

    subgraph Boundary ["Gym Management System"]
        Info(["Provide Personal Details<br/>to the Admin"])
        Consent(["Consent to Face Enrollment"])
        FacePose(["Pose for Face Capture<br/>(front, chin down, left, right)"])
        Pay(["Pay for or Renew a Package<br/>through the Admin"])

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
    Member --> Scan
    Member --> Exercise
```
