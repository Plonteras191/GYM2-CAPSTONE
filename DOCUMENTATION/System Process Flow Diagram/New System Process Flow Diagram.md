# 4.2-A System Process Flow Diagram

This section presents the System Process Flow Diagram for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros Gym**. The diagram was developed from the requirements gathering phase (interview with the gym owner, observation of the gym and its paper records) and updated to match the system as built.

It shows the flow the Administrator (Gym Owner / Coach) follows from login to logout, the six modules, and the decisions the system makes.

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

---

## 1. System Process Flow Diagram (Mermaid Render)

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

**Figure 4.3.** System Process Flow Diagram for the Administrator.

---

## 2. Process Narrative (Chapter 4 Standard)

### A. Narrative Walkthrough (EXPLAIN)
The flow begins when the administrator opens the system and enters an **email and password**. If they are not correct, an error is shown and the administrator tries again. A forgotten password is recovered by asking for a **PIN sent by email** and choosing a new password. There is no verification code at login. After a correct login the administrator reaches the Dashboard.

From the dashboard the administrator can open six modules:

1. **Member Registration.** The administrator enters name, contact details, address, date of birth, height, weight and **body type** (Ectomorph, Mesomorph or Endomorph), optionally adds a profile photo, records that the member **agrees to face enrollment** (the date of consent is saved), and captures the face in four views (front, chin down, left and right). The member record and face photo are then saved.
2. **Attendance Monitoring.** The camera captures the member's face and the system looks for a match. A recognized member is checked in only inside gym hours (9:00 AM to 9:30 PM) and once per day. The check-in saves the time, how it was made, the camera and the subscription status; an expired subscription is flagged **RENEW** on the live feed, and an Inactive member is set back to Active. A face that is not recognized shows "Unknown", and the administrator can **check the member in manually** by choosing the member and typing a reason.
3. **Program Monitoring.** In the member's **Training plan** the administrator builds a 7-day plan (exercise, date, sets, reps). Only members with an **active With Coach subscription** are tracked by the camera; for others the coach verifies tasks by hand. When the camera recognizes the assigned exercise, a task is verified. For **squat, push-up, curl and sit-up** the camera first **counts repetitions** and saves the progress until the target sets × reps is reached.
4. **Packages and Subscriptions.** The administrator subscribes a member to a package, or upgrades a running subscription to a higher-priced package and pays the balance. **Renew** extends a running subscription from its end date, or starts a new one today if it has ended. The **Price list** creates, edits and deletes packages; deleting a package that members are subscribed to is refused. The **Calendar** holds classes and events. Every subscription, renewal or upgrade creates its payment record automatically.
5. **Payment Transactions.** The administrator records a payment (package, member or walk-in guest, amount, reference number, Cash, GCash or Maya), and prints the receipt. Payments are never refunded.
6. **Reports.** The administrator chooses Payments, Memberships, Attendance or Program Monitoring, sets the dates, views the report, and exports a CSV file or prints it.

After any activity the administrator may return to the dashboard or log out.

### B. Meaning and Operational Impact (INTERPRET)
Manual sign-in sheets, watching members count repetitions, checking renewal dates by hand and paper receipts are replaced by automatic checks. Each decision in the flow (login check, face match, gym hours and one check-in per day, With Coach eligibility, target repetitions reached, package in use) protects the data before a record is saved.

### C. Alignment with Study Objectives (CONNECT)
The flow supports the objectives in Chapter 1: touchless **biometric attendance**, **computer-vision-assisted program monitoring** with repetition counting for selected exercises, **automatic subscription and renewal tracking**, and **payment recording** in Cash, GCash and Maya linked to subscriptions.

---

## 3. Changes Made on November 17, 2026 (Audit Trail)

| # | Part | Before | Now |
|---|---|---|---|
| 1 | Login | Email and password, then a 6-digit PIN | Email and password only; "Forgot password?" recovers by emailed PIN |
| 2 | Module 1 | Body type and face capture | Adds address, profile photo, face consent (date recorded) |
| 3 | Module 2 | Face match only | Adds manual check-in with a reason, the RENEW flag, and the check-in details saved |
| 4 | Module 3 | Select a member, assign an exercise, camera | Training plan for 7 days; only With Coach members are tracked; repetition counting until the target is reached; coach verifies by hand otherwise |
| 5 | Module 4 | Check status, renew | Subscribe, upgrade, **Renew**, Price list with delete guard, classes and events calendar |
| 6 | Module 6 | Two report types | Four: Payments, Memberships, Attendance, Program Monitoring |
