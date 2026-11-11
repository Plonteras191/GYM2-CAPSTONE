# 4.2-C Data Flow Diagram (DFD Level 1)

This section presents the **Data Flow Diagram (Level 1)** for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym**. 

---

## 1. Introduction (INTRODUCE)

A **Data Flow Diagram (DFD) Level 1** decomposes the high-level Context Level Diagram (Process 0) into its primary sub-processes. It illustrates how data moves throughout the system by showing:
1. **External Entities:** The users or sources exchanging information with the system.
2. **Sub-Processes:** The specific functional activities that receive, process, and transform data.
3. **Data Stores (Tables):** The physical MySQL database tables where records are saved, read, and updated.
4. **Data Flows:** The directed paths indicating the exact data entering and exiting each process and data store.

Following the role-based DFD structure, Figure 4.3 illustrates the Level 1 Data Flow Diagram for the **Gym Owner / Administrator**, who serves as the primary system operator managing gym operations.

---

## 2. Data Flow Diagram for Gym Owner / Administrator (PRESENT)

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


**Figure 4.3.** Data Flow Diagram (DFD Level 1) for Gym Owner / Administrator.

---

## 3. Detailed Discussion of Data Flows (EXPLAIN)

The Level 1 Data Flow Diagram breaks down the system into **eight operational processes** and connects them to **eight physical MySQL data stores**. The step-by-step movement of data is detailed below:

### Process 1.0: Login Account
* **Description:** Handles administrator authentication and security session management.
* **Inflow from Admin:** The administrator inputs their username and password.
* **Data Store Interaction:** The process queries **`D1 admins`** to verify credentials against the stored bcrypt password hash.
* **Outflow to Admin:** The process issues a Laravel Sanctum session bearer token and redirects the administrator to the main dashboard.

---

### Process 2.0: Dashboard Overview
* **Description:** Gathers real-time operational metrics across all gym activities for fast managerial decision-making.
* **Inflow from Admin:** The administrator navigates to the dashboard view.
* **Data Store Interaction:** The process reads active member totals from **`D2 members`**, current daily entries from **`D4 attendances`**, and memberships expiring within the next 7 days from **`D7 memberships`**.
* **Outflow to Admin:** The dashboard presents visual KPI cards, quick summary counters, and real-time smart notification alerts.

---

### Process 3.0: Manage Members
* **Description:** Manages member profiles, anthropometric baseline measurements, and facial biometric enrollment.
* **Inflow from Admin:** The administrator enters personal details (name, contact, gender), anthropometric data (height, weight, and body type: Ectomorph, Mesomorph, Endomorph), and captures the member's front-facing face photo.
* **Data Store Interaction:** 
  - Writes member demographics and physical measurements into **`D2 members`**.
  - Extracts and writes 128-dimensional facial vectors into **`D3 face_encodings`**.
  - Reads saved records from **`D2 members`** when searching or viewing profiles.
* **Outflow to Admin:** Returns the updated member directory, profile views, and biometric enrollment status badges.

---

### Process 4.0: Attendance Monitoring
* **Description:** Controls the automated facial recognition check-in monitor and logs member arrival timestamps.
* **Inflow from Admin:** The administrator opens the Security Monitor page to observe check-ins.
* **Data Store Interaction:**
  - Reads facial reference encodings from **`D3 face_encodings`** for real-time camera matching.
  - Inserts verified entry timestamps, dates, and attendance statuses into **`D4 attendances`**.
  - Reads today's check-in logs from **`D4 attendances`**.
* **Outflow to Admin:** Displays real-time attendance entries with member photo, timestamp, and instant alerts for unrecognized visitors.

---

### Process 5.0: Program Monitoring
* **Description:** Synchronizes the next seven days of a member's exercise assignments and matches Gesture Engine movement labels to due tasks.
* **Inflow from Admin:** The coach selects exercises from the body-part-filtered catalog, assigns weekdays and sets/reps targets, and synchronizes the plan.
* **Data Store Interaction:**
  - Reads member information from **`D2 members`** to validate the member ID sent by the face-matched engine.
  - Saves dated assigned tasks, set/rep targets, and nullable Gesture Engine class mappings in **`D5 workout_logs`**.
  - When the engine reports a matching movement class for that member, updates the assigned log as performed; otherwise logs the detection as an unassigned exercise.
* **Outflow to Admin:** Returns scheduled tasks and recent exercise detections through the Gesture Monitor and member workout history. The current engine reports movement labels, not completed rep totals.

---

### Process 6.0: Subscription Management
* **Description:** Manages membership pricing tiers, subscription durations, and expiration monitoring.
* **Inflow from Admin:** The administrator creates new membership plans or initiates subscription renewals.
* **Data Store Interaction:**
  - Reads and writes pricing plans and duration days in **`D6 plans`**.
  - Reads, writes, and updates member subscription start and expiry dates in **`D7 memberships`**.
* **Outflow to Admin:** Returns active subscription tables, plan options, and renewal alerts.

---

### Process 7.0: Payment Transactions
* **Description:** Records membership payments across multi-channel payment methods and activates subscriptions.
* **Inflow from Admin:** The administrator enters the payment amount, reference number, and payment method (Cash, GCash, or Maya).
* **Data Store Interaction:**
  - Inserts payment records and audit details into **`D8 transactions`**.
  - Updates the linked member's subscription validity in **`D7 memberships`** to activate their gym pass.
* **Outflow to Admin:** Returns a recorded transaction confirmation, updated ledger history, and a printable official PDF receipt.

---

### Process 8.0: System Reports
* **Description:** Aggregates and filters historical operational data to produce audit-ready management reports.
* **Inflow from Admin:** The administrator selects a report category (Attendance, Membership, Program Monitoring, or Payment) and sets date range filters.
* **Data Store Interaction:** Queries historical records across **`D4 attendances`**, **`D5 workout_logs`**, **`D7 memberships`**, and **`D8 transactions`**.
* **Outflow to Admin:** Delivers on-screen data summaries and downloadable, formatted reports in PDF and CSV formats.

---

## 4. Analytical Interpretation (INTERPRET)

Figure 4.3 demonstrates the architectural transition of Double Alpha Fitness Gym into an organized, database-backed information system:
1. **Centralized Data Persistence:** In contrast to manual logbooks where information was scattered across paper notebooks and mobile screenshots, every operational activity is systematically written to dedicated, indexed MySQL tables.
2. **Immediate Transactional Integrity:** When a payment is recorded in Process 7.0, it simultaneously updates **`D8 transactions`** and extends the subscription record in **`D7 memberships`**, ensuring that a member is never left active without a recorded payment.
3. **Decoupled Biometric Processing:** Facial encodings (**`D3`**) and workout logs (**`D5`**) are stored independently from primary member profiles (**`D2`**), optimizing query speeds and ensuring high-performance biometric lookups.

---

## 5. Connection to Study Objectives and Next Phases (CONNECT)

This Data Flow Diagram Level 1 operationalizes the conceptual framework established in Chapter 1:
* It satisfies **Specific Objective (b)** by detailing the data movement between system functions and physical storage.
* It directly bridges the gap between the functional requirements in **Section 4.1-C** and the database design presented in **Section 4.2-E (Logical ERD)** and **Section 4.2-F (Physical Database Schema)**.
