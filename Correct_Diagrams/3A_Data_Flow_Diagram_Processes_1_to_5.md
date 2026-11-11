# 3. Data Flow Diagram Level 1 — Processes 1.0 to 5.0

[Back to the list of diagrams](../Correct_Diagrams.md)

The Level 1 DFD is drawn as one small figure per process so each one stays readable. Data store numbers (D1 to D14) are the same in every figure.

Processes 6.0 to 10.0 are in [the next file](3B_Data_Flow_Diagram_Processes_6_to_10.md).

## 3.1 Process 1.0 — Log In

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Mail["Email Server"]
    P1(["1.0<br/>Log In"])
    D1[("D1 admins")]
    D12[("D12 auth_verification_codes")]
    D13[("D13 password_reset_pins")]
    D14[("D14 personal_access_tokens")]

    Admin -->|"Email, password, PIN"| P1
    P1 -->|"Login result, session token"| Admin
    P1 <-->|"Admin account, new password"| D1
    P1 <-->|"Login PIN"| D12
    P1 <-->|"Reset PIN"| D13
    P1 -->|"Session token"| D14
    P1 -->|"Login PIN, reset PIN"| Mail
```

## 3.2 Process 2.0 — View Dashboard and Notifications

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P2(["2.0<br/>View Dashboard<br/>and Notifications"])
    D2[("D2 members")]
    D5[("D5 workout_logs")]
    D7[("D7 memberships")]
    D8[("D8 transactions")]
    D10[("D10 coach_events")]

    Admin -->|"Dashboard request"| P2
    P2 -->|"Totals, sales chart, recent records, notifications"| Admin
    D2 -->|"Member count, recent members"| P2
    D7 -->|"Active and expiring subscriptions"| P2
    D8 -->|"Revenue, recent transactions"| P2
    D5 -->|"Unverified tasks today"| P2
    D10 -->|"Coach events"| P2
```

## 3.3 Process 3.0 — Manage Members

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P3(["3.0<br/>Manage Members"])
    D2[("D2 members")]
    D3[("D3 face photo files")]
    D4[("D4 attendances")]
    D5[("D5 workout_logs")]

    Admin -->|"Member details, profile photo, face capture"| P3
    P3 -->|"Member list and profiles"| Admin
    P3 <-->|"Member records"| D2
    P3 -->|"Face photo"| D3
    D4 -->|"Attendance history"| P3
    D5 -->|"Workout history"| P3
```

## 3.4 Process 4.0 — Recognize Faces and Log Attendance

```mermaid
flowchart LR
    Camera["Camera"]
    Admin["Gym Owner / Admin"]
    P4(["4.0<br/>Recognize Faces<br/>and Log Attendance"])
    D2[("D2 members")]
    D3[("D3 face photo files")]
    D4[("D4 attendances")]

    Admin -->|"Camera selection, face re-sync"| P4
    P4 -->|"Live feed with names, today's check-ins"| Admin
    Camera -->|"Live video"| P4
    D2 -->|"Enrolled members"| P4
    D3 -->|"Face photos"| P4
    P4 <-->|"Attendance: member, date, time in"| D4
```

## 3.5 Process 5.0 — Monitor Workout Program

```mermaid
flowchart LR
    Camera["Camera"]
    Admin["Gym Owner / Admin"]
    P4(["4.0<br/>Recognize Faces<br/>and Log Attendance"])
    P5(["5.0<br/>Monitor Workout Program"])
    D5[("D5 workout_logs")]
    D6[("D6 plans")]
    D7[("D7 memberships")]

    Admin -->|"7-day workout plan, manual verification"| P5
    P5 -->|"Live feed with exercise labels, task status, workout history"| Admin
    Camera -->|"Live video"| P5
    P4 -->|"Recognized member"| P5
    P5 <-->|"Assigned and verified tasks"| D5
    D7 -->|"Active With Coach subscription"| P5
    D6 -->|"Package category"| P5
```
