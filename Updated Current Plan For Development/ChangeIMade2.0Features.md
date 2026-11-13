
## Changes by Mr. Plonteras — November 11 to 13, 2026

### 13. Face Recognition Accuracy for Attendance
- **The Problem:** Registered members often stayed "Unknown", were sometimes given another member's name, or their name kept flickering.
- **The Solution:**
  1. **Fixed a matching bug.** Each member has several saved face views. The old check compared the two closest *views*, which were usually the same person, and rejected the match as "too similar". Matching now compares each *member* against the nearest *different* member.
  2. **A name needs several agreeing checks.** A name is shown, and attendance is logged, only after 3 of the last 6 face checks agree. One bad frame can no longer pick the wrong person.
  3. **Same face framing at registration and on camera.** Both now use the same detector and the same face box.
  4. **Small faces are not guessed.** Faces under 40px show "Move closer". Faces of 40–70px are enlarged and need a stricter match (0.45) and 5 agreeing checks.
  5. **Registration captures 4 face views** instead of 3: front, chin down, slight left, slight right.
  6. **Settings in `Gesture Engine/.env`:** `FACE_MATCH_THRESHOLD` (0.50), `FACE_MATCH_MARGIN` (0.05), `FACE_MIN_SIZE`, `FACE_VOTES_REQUIRED`. A new script, `scripts/eval_faces.py`, suggests the best threshold.
- **Note:** this replaces the 0.52 threshold and 0.035 margin described in item 10.
- **Why It Matters:** Fewer missed members and far fewer wrong names in the attendance log.

---

### 14. Gesture Monitor: Coached Members Only, and Better at a Distance
- **The Problem:** The Gesture Monitor showed everyone, lost a member's name as soon as they walked away from the camera, and was inaccurate for people far away.
- **The Solution:**
  1. **Only members with an active With Coach subscription are monitored.** Other members are hidden from the Gesture Monitor. People not yet recognized show only a small "Identifying..." tag. Attendance in the Security Monitor is not affected.
  2. **The name stays with the body.** Once recognized, a member keeps their name for up to 120 seconds while their body is tracked, with a shirt-colour check so names are not swapped when two people cross.
  3. **Far faces are found through the body skeleton**, because the face detector misses small faces in a full frame.
  4. **Sharper input:** webcam at 1280×720, no shrinking before detection, and the more accurate pose model (`POSE_MODEL=full`).
  5. **Exercise checks:** each body is resized to the training data's size before classification; a still body shows "Not moving"; hidden joints show "Body not fully visible".
- **Limit:** the exercise model is still trained on only 167 frames, so similar exercises can be confused. No retraining was done.

---

### 15. Attendance Monitoring: Phase 1 (Bug and Data Fixes)
> Needs `php artisan migrate` in `backend` before it works. Back up the database first.

- **The Problems found in review:** duplicate check-ins were possible; check-ins were lost when Laravel was down; a returning Inactive member stayed Inactive with no way to fix it; the Inactive rule only ran when the Members page was opened; deleting a member erased their attendance; a record did not say how it was made.
- **The Solution:**
  1. **One check-in per member per day is enforced by the database.** Existing duplicates are merged, keeping the earliest.
  2. **Returning members become Active.** When an Inactive member checks in, their profile is set back to Active.
  3. **Manual Active/Inactive switch in Edit Member.** The server accepts only these two values. A manual "Active" gives the member a fresh month before the Inactive rule applies again.
  4. **The Inactive rule runs every day** (command `members:demote-inactive`, scheduled daily). It also runs once a day when the Dashboard or Security Monitor is opened, so `php artisan schedule:work` is optional.
  5. **Attendance is kept when a member is deleted**, with the member's name saved.
  6. **Each check-in records more:** method (face or manual), camera, match confidence, the member's subscription status and plan on that day, and whether the check-in reactivated the member.
  7. **No lost check-ins.** If Laravel is down, the engine saves the check-in to `Gesture Engine/data/attendance_queue.jsonl`, retries every 30 seconds, and keeps the real arrival time. Refusals such as a wrong token are printed.
  8. **Gym hours are settings:** `GYM_OPEN_TIME` and `GYM_CLOSE_TIME` in `backend/.env` (default 9:00 AM to 9:30 PM).
- **Database changes (no new tables):**
  - `attendances`: 9 new columns (`member_name_snapshot`, `source`, `camera_source`, `match_distance`, `subscription_status`, `plan_snapshot`, `reactivated`, `recorded_by_admin_id`, `reason`); `member_id` can now be empty; one row per member per day; deleting a member no longer deletes the rows.
  - `members`: 1 new column (`status_updated_at`).
- **Tests:** 15 new backend tests and 7 new engine tests for these rules.
- **Continued in:** item 16 (Phase 2) and item 17 (Phase 3) below.

---

### 16. Attendance Monitoring: Phase 2 (Attendance Is Now Visible and Correct)
> Uses the columns added in item 15, so it also needs `php artisan migrate` first.

- **The Problems found in review:** there was no attendance report screen; the Security Monitor's "Full Log" button opened the subscription report; some report numbers were fixed text ("Tracking Active", "Online", "Verified"); the member profile calendar showed only the last 10 visits; the Dashboard had no attendance count; staff could not see at the door that a subscription had expired.
- **The Solution:**
  1. **New Attendance tab in Reports** with real numbers: Total Check-ins, Unique Members, Avg. Daily Visits and Busiest Hour. Columns: Date / Time, Member Details, Plan, Subscription Status, Method (Face or Manual), Camera. CSV export and print work the same as the other tabs.
  2. **The report shows what was true on the day of the visit** (plan and subscription status), so old reports no longer change when a member changes plan. Check-ins of deleted members stay in the report with their name.
  3. **"Full Log" on the Security Monitor opens the Attendance tab.** The old tab is renamed "Membership Status".
  4. **Dashboard:** new "Today's Check-ins" card with the count and a check-ins-per-hour bar chart.
  5. **Member profile:** the attendance calendar loads the last 2 years of visits instead of the last 10, and shows "Visits this month".
  6. **Security Monitor attendance list:** each check-in shows badges (Active, Expired, No Sub, Returned, Manual), the list shows today's count, and the empty message is now correct ("No check-ins yet today" or "Engine offline").
  7. **Expired members are flagged at the door:** the camera feed shows an orange box and "NAME - RENEW". The member is still logged. The engine re-reads subscription statuses every minute, so the tag clears about a minute after a renewal.
  8. **Fixed a date bug in the member profile:** the "checked in today?" check used the UTC date, which is still yesterday before 8:00 AM in the Philippines. It now uses the local date.
- **Note:** check-ins saved before item 15 show "Not Recorded" and "No plan" in the report, because those details were not saved then.
- **Database changes:** **None.** No new tables and no new columns. Phase 2 only reads the columns added in item 15.
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** **Not changed**, because there is no database change.
- **Tests:** 6 new backend tests (report numbers, dashboard counts, full attendance history, subscription status sent to the engine).

---

### 17. Attendance Monitoring: Phase 3 (Safeguards)
> Needs `php artisan migrate` (one new column) and, once, `php artisan faces:secure` to move the existing face photos. Back up the database first.

- **The Problems found in review:** there was no way to check in a member the camera could not recognize; a printed photo of a member could be used to log attendance; enrolled face photos could be opened by anyone with the link, without logging in; no consent was recorded for face enrollment; a newly registered member was not recognized until someone pressed "Force AI Memory Sync".
- **The Solution:**
  1. **Manual check-in (fallback).** New button on the Security Monitor (person-plus icon) and in the member profile's Attendance Calendar tab. The admin picks the member and a reason. It follows the same rules as the camera (gym hours, once per day, sets an Inactive member back to Active) and is saved as "Manual" with the admin's account and the reason.
  2. **Blink check against printed photos (off by default).** With `LIVENESS_REQUIRED=true` in `Gesture Engine/.env`, a recognized member is checked in only after the camera sees them blink. Until then the name tag is yellow and says "BLINK". Faces too small to see the eyes say "COME CLOSER".
     - **Limits:** it stops a printed photo or a still picture on a screen. It does not stop a video of the member played on a phone.
     - **Why it is off by default:** it was tested on a saved webcam frame only, not yet on a live camera with real blinking. Test it on the gym camera before turning it on.
  3. **Face photos are private.** New face photos are saved in `backend/storage/app/private/faces`, which cannot be opened from a browser. `php artisan faces:secure` moves the old photos out of `backend/public/faces`. The engine reads both folders, so recognition keeps working before and after the move.
  4. **The face photo is no longer used as a picture in the app.** Lists and the attendance log show the profile picture only. A new registration already saves the front view as the profile picture.
  5. **Consent is recorded.** Registration has a required consent checkbox for face enrollment (Data Privacy Act of 2012, RA 10173). The server refuses to save a face without it and records the date and time. Members enrolled earlier have no consent date.
  6. **Automatic face sync.** Every minute the engine compares its loaded faces with Laravel's member list and reloads when a member is added, re-captured, renamed, or their coach subscription changes. The "Force AI Memory Sync" button still works.
- **Database changes (no new tables):**
  - `members`: 1 new column, `biometric_consent_at` (timestamp, nullable).
  - `attendances`: no new columns. Manual check-ins use `source`, `recorded_by_admin_id` and `reason`, which were added in item 15.
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** **Updated** for the new column. See "Diagram changes for item 17" at the end of this file.
- **Tests:** 9 new backend tests (manual check-in, consent, private photo storage, moving old photos) and 17 new engine tests (blink detection, finding photos in both folders, automatic sync).
- **Not done yet (Phase 4):** live test checklist with several people, and updating the README.


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

## 6. Physical & Logical Entity-Relationship Diagrams
📁 `DOCUMENTATION/Physical Entity-Relationship Diagram/` & `DOCUMENTATION/Logical Entity-Relationship Diagram/`
> Files updated: `Physical Entity-Relationship Diagram.md`, `Physical Entity-Relationship Diagram docs.md`, `Logical Entity-Relationship Diagram.md`, and `Logical Entity-Relationship Diagram docs.md`

| # | What Changed | Why |
|---|---|---|
| 1 | **Removed `auto_renew` from `memberships` entity and Data Dictionary** in both Physical and Logical ERDs | Double Alpha Fitness Gym does not support automated recurring credit card billing; renewals are purely manual at the desk via Cash/GCash/Maya. Removing prevents defense panel questions on unimplemented payment gateways. |

---

## Summary

| Diagram | No. of Fixes |
|---|:---:|
| Context Level Diagram | 2 |
| Data Flow Diagram | 2 |
| Manual Process Flow | 2 |
| System Process Flow | 3 |
| Use Case Diagram | 4 |
| Entity-Relationship Diagrams (Physical & Logical) | 1 |
| **Total** | **14** |

---

# Documentation Changes Log
**Date:** November 13, 2026
**Session:** Chapter 4 diagrams updated for items 13 and 15 above
📁 `Chapter4_Diagrams (2).md`

Use this table to update the drawn diagrams. Everything not listed here is unchanged. Figures 4.1 and 4.4 have no changes.

## Figure 4.3 — System Process Flow for Administrator

| # | Part | Change | Why |
|---|---|---|---|
| 1 | Module 1, face capture box | **Text changed:** "Capture face: front, left and right" → "Capture face: front, chin down, left and right" | Registration now captures 4 views |
| 2 | Module 2, save box | **Text changed:** "Save member, date and time in" → "Save member, date, time in, camera and subscription status" | A check-in now records more details |
| 3 | Module 2, after the save box | **New decision:** "Member profile Inactive?" | Returning members are set back to Active |
| 4 | Module 2, Yes branch of the new decision | **New box:** "Set member back to Active", then to "Log out?" | Same |
| 5 | Module 2, arrows | **Arrow changed:** the save box no longer goes straight to "Log out?"; it goes to the new decision, whose No branch goes to "Log out?" | Same |

## Figure 4.5 — Data Flow Diagram

| # | Part | Change | Why |
|---|---|---|---|
| 1 | Admin → 3.0 Manage Members | **Label changed:** "Member details, face capture" → "Member details, face capture, member status" | Admin can set Active/Inactive |
| 2 | 4.0 Attendance Monitoring → D2 members | **New arrow:** "Returning member set back to Active" | Check-in reactivates the member |
| 3 | 4.0 Attendance Monitoring ↔ D4 attendances | **Label changed:** "Member, date, time in" → "Member, date, time in, method, camera, subscription status" | New attendance details |
| 4 | D7 memberships → 4.0 Attendance Monitoring | **New data store copy and arrow:** "Subscription on the check-in date" | Subscription status is recorded at check-in |

## Figure 4.6 — Use Case Diagram for Gym Owner / Admin

| # | Part | Change | Why |
|---|---|---|---|
| 1 | "Capture Face" use case | **Text changed:** (front, left, right) → (front, chin down, left, right) | 4 face views |
| 2 | Next to "Update Member" | **New use case:** "Set Member Status (Active / Inactive)" | Manual status switch |
| 3 | "Set Member Status" → "Update Member" | **New «extend» arrow** | It is an optional part of updating a member |

## Figure 4.7 — Use Case Diagram for Gym Member

| # | Part | Change | Why |
|---|---|---|---|
| 1 | "Pose for Face Capture" use case | **Text changed:** (front, left, right) → (front, chin down, left, right) | 4 face views |
| 2 | Next to "Attendance Logged" | **New use case:** "Profile Set Back to Active" | Reactivation on check-in |
| 3 | "Profile Set Back to Active" → "Attendance Logged" | **New «extend» arrow**, labelled "member was Inactive" | Only happens for Inactive members |

## Figure 4.8 — Use Case Diagram for Camera / Gesture Engine

| # | Part | Change | Why |
|---|---|---|---|
| 1 | Next to "Send Attendance to Laravel API" | **New use case:** "Save and Retry Attendance when Laravel is Unreachable" | Retry file in the engine |
| 2 | New use case → "Send Attendance to Laravel API" | **New «extend» arrow**, labelled "sending failed" | Only happens when sending fails |

## Figure 4.9 — Logical Entity-Relationship Diagram

| # | Part | Change | Why |
|---|---|---|---|
| 1 | MEMBER | **New attribute:** `status_updated_at` (datetime) | When the status was last set |
| 2 | ATTENDANCE | **9 new attributes:** `member_name`, `method`, `camera`, `match_distance`, `subscription_status`, `plan_name`, `reactivated`, `recorded_by`, `reason` | Audit details of a check-in |
| 3 | MEMBER – ATTENDANCE line | **Member side changed** from "exactly one" (`||`) to "zero or one" (`|o`) | Attendance stays after the member is deleted |

## Figure 4.10 — Physical Entity-Relationship Diagram

| # | Part | Change | Why |
|---|---|---|---|
| 1 | `members` | **New column:** `status_updated_at` timestamp, nullable | Same as logical |
| 2 | `attendances` | **9 new columns:** `member_name_snapshot` varchar nullable; `source` varchar (face or manual); `camera_source` varchar nullable; `match_distance` decimal(5,4) nullable; `subscription_status` varchar nullable; `plan_snapshot` varchar nullable; `reactivated` boolean; `recorded_by_admin_id` bigint nullable (no FK); `reason` varchar nullable | Same as logical |
| 3 | `attendances.member_id` | **Changed:** now nullable | Attendance stays after the member is deleted |
| 4 | `attendances` (`member_id`, `date`) | **New unique rule** | One check-in per member per day |
| 5 | `members` – `attendances` line | **Member side changed** from `||` to `|o` | Same as logical |
| 6 | Notes under the diagram | **Changed:** `attendances` moved from "cascade" to "set to null" on delete; unique rule and `match_distance` size added | Match the database |

## Summary

| Figure | No. of Changes |
|---|:---:|
| 4.3 System Process Flow | 5 |
| 4.5 Data Flow Diagram | 4 |
| 4.6 Use Case (Admin) | 3 |
| 4.7 Use Case (Member) | 3 |
| 4.8 Use Case (Camera / Gesture Engine) | 2 |
| 4.9 Logical ERD | 3 |
| 4.10 Physical ERD | 6 |
| **Total** | **26** |

**Not in the diagrams on purpose:** the Gesture Monitor changes (item 14) needed no diagram change, because the Data Flow Diagram already shows Program Monitoring reading the active With Coach subscription. Phase 2 of the attendance plan (item 16) has no database change, so the diagrams were not changed for it.

---

## Diagram changes for item 17 (Phase 3)
**Date:** November 13, 2026
📁 `Chapter4_Diagrams (2).md`

Only the database change is drawn. Everything not listed here is unchanged.

| # | Figure | Part | Change | Why |
|---|---|---|---|---|
| 1 | 4.9 Logical ERD | MEMBER | **New attribute:** `biometric_consent_at` (datetime) | Records when the member consented to face enrollment |
| 2 | 4.10 Physical ERD | `members` | **New column:** `biometric_consent_at` timestamp, nullable, after `enrolled_face_id` | Same as logical |

**Not drawn yet (no database change, so left as is):** the new functions in item 17 are not in the process flow, data flow or use case diagrams. If the team wants them drawn, these are the parts to add:
- Figure 4.3, Module 2: a "Manual check-in by admin (member and reason)" path into the save box.
- Figure 4.5: Admin → 4.0 Attendance Monitoring, "Manual check-in (member, reason)".
- Figure 4.6: new use case "Manually Check In Member"; "Capture Face" «include» "Record Member Consent".
- Figure 4.3 and 4.6, Reports: three report types (Payment Transactions, Membership Status, Attendance) instead of two.

