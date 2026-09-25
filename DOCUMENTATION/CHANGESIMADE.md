# Documentation Changes Log
**Date:** September 25, 2026
**Session:** Diagram Alignment Review vs. manus.md

---

## 1. Context Level Diagram
📁 `DOCUMENTATION/Context Level Diagram/Context Level Diagram.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **Flow 16 label** — changed from `"Real-time exercise repetition and workout feedback"` → `"Real-time exercise repetition count and monitoring result"` | "Workout feedback" implies posture correction which is **out of scope** in the manuscript |
| 2 | **Flow 16 description** — added sentence: *"The system does not provide posture correction or professional form assessment"* | To match the manuscript's stated limitation exactly |

---

## 2. Data Flow Diagram (DFD Level 1)
📁 `DOCUMENTATION/Data Flow Diagram/Data Flow Diagram.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **P2 Dashboard** — added `D8 -->|Revenue and transaction summary| P2` | Dashboard shows revenue KPIs but D8 (transactions) had no data flow into it |
| 2 | **P5 Program Monitoring** — changed Admin input label from `"Exercise assignment and manual verification"` → `"Exercise assignment and AI-verified repetition result"` | "Manual verification" contradicts the whole purpose of the gesture AI engine |

---

## 3. Manual Process Flow Diagram
📁 `DOCUMENTATION/Manual Process Flow for Admin B. User Definition/`
> Both files updated: `New Manual Process Flow Diagram.md` and `Manual Process Flow for Admin B. User Definition.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **Stage 2 order fixed** — membership check (`Active or Expired?`) now happens **BEFORE** `Admin records attendance in logbook` | An expired member should NOT get an attendance entry before renewal is processed |
| 2 | **Stage 3 new step added** — `Admin assesses member body type (Ectomorph / Mesomorph / Endomorph)` inserted before `Admin assigns fitness program` | Manuscript says body type is used as reference for program assignment — it was missing from the flow |

---

## 4. System Process Flow Diagram
📁 `DOCUMENTATION/System Process Flow Diagram/New System Process Flow Diagram.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **Module 1 (Registration)** — body type split into its own step: `Select Member Body Type (Ectomorph / Mesomorph / Endomorph)` after entering personal info | Manuscript emphasizes body type as a distinct classification step for program assignment |
| 2 | **Module 4 (Subscription)** — added `Record Renewal Payment (Cash / GCash / Maya)` step between "Process Renewal" and "Update Membership Record" | Renewals cannot update the record without a payment step — it was completely missing |
| 3 | **Module 3 (Program Monitoring) fail path** — `"Adjust Position"` now loops back to `Camera Captures Exercise Movement` instead of going to `LogoutCheck` | Adjusting position means retry camera — it should NOT end the entire session |

---

## 5. Use Case Diagram
📁 `DOCUMENTATION/USECASE DIAGRAM/usecase.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **UC-06 threshold** — corrected from `Distance ≤ 0.50` → `Distance ≤ 0.52` | `ChangesImade.md` explicitly states threshold was calibrated to **0.52** — the spec had the wrong number |
| 2 | **Admin diagram — 3 new nodes added** — `A_ViewAtt` (UC-06 Security Monitor), `A_EnrollBio` (Enroll Facial Biometric), `A_ActivateSub` (Activate Subscription) | These sub-use cases were described in the narrative but completely absent from the diagram code |
| 3 | **Admin diagram — 2 missing `<<include>>` arrows added** — `A_AddMem <<include>> A_EnrollBio` and `A_RecordPay <<include>> A_ActivateSub` | Narrative Section 3.2 described these as mandatory include relationships but they were not drawn |
| 4 | **Admin diagram — UC-06 connected to Admin actor** — added `Admin --> A_ViewAtt` | UC-06 was listed in the Admin UC summary table but Admin had no arrow to it in the diagram |

---

## Summary

| Diagram | No. of Fixes |
|---|:---:|
| Context Level Diagram | 2 |
| Data Flow Diagram | 2 |
| Manual Process Flow | 2 |
| System Process Flow | 3 |
| Use Case Diagram | 4 |
| **Total** | **13** |
