# 4.1-A Updated Manual Process Flow Diagram

This document presents the corrected and verified **Manual Process Flow Diagram** for Double Alpha Fitness Gym prior to the implementation of the proposed Camera-Based Gym Management System. It captures the existing paper-based and observational workflow conducted by the Gym Owner / Administrator and Gym Members.

---

## 1. Updated Manual Process Flow Diagram (Mermaid)

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

> **Note:** This diagram was updated on 2026-11-11 to match the current system. The written explanation in this file may still describe the earlier version of the diagram.


**Figure 4.1.** Corrected Manual Process Flow Diagram for Double Alpha Fitness Gym.

---

## 2. Summary of Applied Corrections (Audit Trail)

| # | Flaw in Original Diagram | Applied Correction | Rationale / Source |
|---|---|---|---|
| **1** | **Duplicate Box in Column 3:**<br>`Admin records progress manually (logbook)` was rendered twice consecutively. | **Removed Duplicate Box:**<br>Now progresses directly from manual observation to a single progress-recording step. | Fixes visual diagram error and prevents confusing redundant steps. |
| **2** | **Actor Typo in Column 1 Box 3:**<br>Labeled as `Gym member/admin receives and reviews information`. | **Corrected Actor Label:**<br>Changed to `Gym owner / admin receives and reviews information`. | The applicant submits; the gym owner/admin is the party receiving and reviewing. |
| **3** | **Outdated Payment Branding:**<br>Labeled as `(cash / GCash / PayMaya)`. | **Updated to Current Branding:**<br>Changed to `(Cash / GCash / Maya)`. | Aligns with `manus.md` and actual system implementation. |
| **4** | **Input Specificity:**<br>Vaguely described general registration data. | **Detailed Input Data:**<br>Specified personal, contact, and anthropometric data (height/weight). | Directly connects manual intake with Chapter 1 anthropometric requirements. |

---

## 3. Operational Analysis of the Manual Flow

### A. Stage-by-Stage Breakdown
1. **Registration:** Operates via physical forms and manual review. Any omission halts progress and loops back to the member for manual correction.
2. **Attendance & Verification:** Members queue at the desk; the admin manually logs arrival time in a physical notebook and looks up subscription records to verify active status. Expired members must settle renewal payments manually before exercising.
3. **Program Monitoring:** The admin acts simultaneously as a personal trainer, verbally demonstrating technique, visually tracking repetitions, and writing progress notes by hand.
4. **Record Maintenance:** Consolidation requires counting entries by hand across multiple notebooks and filing physical binders.

### B. Identified Pain Points Justifying Automation
* **Queue Congestion:** Arrival logbooks cause front-desk bottlenecks during peak evening gym hours.
* **Overlooked Expirations:** Manual card/spreadsheet lookup allows some expired memberships to go unnoticed until late into the session.
* **Distracted Coaching:** Coaches cannot visually count repetitions accurately when multiple members perform exercises simultaneously.
* **Vulnerable Ledgers:** Paper notebooks and loose receipts are vulnerable to physical damage, misplacement, and tallying errors.
