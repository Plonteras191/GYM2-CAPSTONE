# 3. Data Flow Diagram Level 1 — Processes 6.0 to 10.0

[Back to the list of diagrams](../Correct_Diagrams.md)

The Level 1 DFD is drawn as one small figure per process so each one stays readable. Data store numbers (D1 to D14) are the same in every figure.

Processes 1.0 to 5.0 are in [the previous file](3A_Data_Flow_Diagram_Processes_1_to_5.md).

## 3.6 Process 6.0 — Manage Packages and Subscriptions

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P6(["6.0<br/>Manage Packages<br/>and Subscriptions"])
    D2[("D2 members")]
    D6[("D6 plans")]
    D7[("D7 memberships")]
    D8[("D8 transactions")]
    D9[("D9 package_categories")]

    Admin -->|"Packages, categories, subscriptions, upgrades"| P6
    P6 -->|"Package list, subscription calendar and status"| Admin
    P6 <-->|"Packages"| D6
    P6 <-->|"Package categories"| D9
    P6 <-->|"Subscriptions"| D7
    P6 -->|"Automatic payment record"| D8
    P6 -->|"Member plan and status"| D2
```

## 3.7 Process 7.0 — Record Payments

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P7(["7.0<br/>Record Payments"])
    D2[("D2 members")]
    D6[("D6 plans")]
    D8[("D8 transactions")]

    Admin -->|"Payment details, refund request"| P7
    P7 -->|"Transaction list, receipt"| Admin
    P7 <-->|"Transactions"| D8
    D6 -->|"Package name and category"| P7
    D2 -->|"Member name"| P7
```

## 3.8 Process 8.0 — Generate Reports

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P8(["8.0<br/>Generate Reports"])
    D2[("D2 members")]
    D4[("D4 attendances")]
    D6[("D6 plans")]
    D7[("D7 memberships")]
    D8[("D8 transactions")]

    Admin -->|"Report type, date range"| P8
    P8 -->|"Report table, CSV or print"| Admin
    D8 -->|"Payments"| P8
    D7 -->|"Subscriptions"| P8
    D2 -->|"New sign-ups"| P8
    D4 -->|"Check-ins"| P8
    D6 -->|"Package categories"| P8
```

## 3.9 Process 9.0 — Manage Coach Events

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P9(["9.0<br/>Manage Coach Events"])
    D10[("D10 coach_events")]
    D11[("D11 coach_event_categories")]

    Admin -->|"Event details"| P9
    P9 -->|"Calendar events"| Admin
    P9 <-->|"Events"| D10
    P9 <-->|"Event categories"| D11
```

## 3.10 Process 10.0 — Manage Admin Profile

```mermaid
flowchart LR
    Admin["Gym Owner / Admin"]
    P10(["10.0<br/>Manage Admin Profile"])
    D1[("D1 admins")]

    Admin -->|"Name, email, logo, new password"| P10
    P10 -->|"Updated profile"| Admin
    P10 <-->|"Admin account"| D1
```
