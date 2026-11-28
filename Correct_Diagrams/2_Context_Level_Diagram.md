# 2. Context Level Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

> **Updated November 25, 2026:** refunds were replaced by pausing and resuming a subscription (new table `membership_pauses`), and the Attendance page was added.

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    Camera["Camera<br/>(CCTV, phone camera or webcam)"]
    Member["Gym Member"]
    Mail["Email Server"]
    System(["0<br/>Gym Management System<br/>for Muscle Bros.ph Fitness Gym"])

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

Flow F12 applies when email is configured. In local mode the PIN is shown on the screen instead.
