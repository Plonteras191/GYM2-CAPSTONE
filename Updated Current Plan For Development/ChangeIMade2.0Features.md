
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

---

## Changes — November 16, 2026

> No database changes, no migration needed. Restart the Python engine (`python main.py` in `Gesture Engine`) to apply items 18, 19 and 21. Item 20 works as soon as Laravel serves the next request.

### 18. Attendance Monitor: Less Lag and Delay
- **The Problem:** the Attendance Monitor (Security Monitor) video was slow and fell further behind the longer it ran, and the check-in list stayed empty for the first 3 seconds after opening the page.
- **The Causes found:**
  1. The second CCTV (`CCTV_2_URL`) points at the camera's 4K main stream (`Preview_01_main`). Every frame was decoded and copied at full size several times, which is heavy for the laptop's CPU.
  2. The video feed drew name boxes on the full-size frame before shrinking it, always encoded the Gesture Monitor feed too (even with nobody watching), waited a fixed 33 ms after every frame, and often sent the previous frame instead of the newest one.
  3. The page waited 3 seconds before its first attendance request, and if Laravel was slow the requests piled up every 3 seconds (`php artisan serve` handles one request at a time on Windows).
- **The Solution:**
  1. **Faster video feed (engine):**
     - each frame is shrunk to 1280 px wide first, then the boxes are drawn;
     - a feed is only encoded while someone is watching it;
     - a frame is sent the moment it is ready, with no fixed wait;
     - every open tab waits for its own frames, so several tabs no longer slow each other down.
  2. **Page (`SecurityMonitor.jsx`):** today's check-ins load immediately; each request waits for the previous one to finish; polling pauses while the tab is hidden and refreshes when you come back.
- **Result (simulated 4K camera at 25 fps, video feed only):** 10.7 fps before, 21.7 fps after.
- **Still recommended:** in the Reolink app, set the main stream to 1920×1080 or 2560×1440 (H.264), or use `Preview_01_sub`. The code fixes cannot remove the cost of decoding 4K.

---

### 19. Webcam: No More Freezing While a Face Is Recognized
- **The Problem:** on the webcam the video froze about once a second whenever a face was in view (6–9 fps with freezes of about 0.9 seconds).
- **The Cause:** turning a face into a face "fingerprint" (dlib encoding) takes about 0.84 seconds on this laptop. While it ran, the rest of the engine (camera reader, pose tracking and both video feeds) had to wait.
- **The Solution:** face encoding now runs in **2 separate helper processes** (new file `Gesture Engine/face_encoder_pool.py`). The engine sends them a small crop of the face and keeps running. Encoding new members' registration photos also goes through the helpers.
  - The helpers give exactly the same result as before, so recognition accuracy is unchanged.
  - Two people can now be recognized at the same time instead of one after the other.
  - If a helper crashes it is restarted automatically. If the helpers cannot start, the engine falls back to the old way.
  - New setting in `Gesture Engine/.env`: `FACE_ENCODER_PROCESSES` (default 2; 0 = old behaviour). Use 1 if the laptop struggles.
- **Result (live webcam, face in view):**

  | | Before | After |
  |---|---|---|
  | Camera frame rate | 6–9 fps | 15 fps |
  | Longest freeze | ~0.9 s | 0.09 s |
  | Freezes over 0.2 s (10–12 s test) | 7–8 | 0 |

- **CCTV:** the same fix applies to every camera source, so the CCTVs also stop freezing. Not tested on the CCTVs themselves (they were not reachable).
- **Limits that remain:**
  - The laptop webcam itself only gives 15 fps at 640×480; the room was very dark during testing, and more light usually brings it to 30 fps.
  - A name still takes a couple of seconds to appear (each check takes ~0.85 s and 3 must agree). The video stays smooth while it waits.
  - `CAMERA_SOURCE=cctv_2` in `Gesture Engine/.env` makes the engine try the unreachable CCTV first. Set it to `webcam` while the CCTVs are away.

---

### 20. Gesture Monitor: Coach Members Were Not Monitored After Their Plan Was Deleted
- **The Problem:** the Gesture Monitor showed no skeleton for a member with an active "With Coach" subscription.
- **The Cause:** the "has an active coach subscription" rule only looked at the plan in the Plans list. That member's plan had been deleted from the Plans page, so the rule treated them as a normal member.
- **The Solution:** when a subscription's plan no longer exists, the rule now uses the plan name saved on the subscription (anything containing "With Coach"). Changed in `backend/app/Models/Member/Membership.php` (`scopeActiveWithCoach`). Attendance is not affected.
- **Data problems found (not fixed, need an admin):**
  - One member with a valid "Monthly With Coach" subscription has a face enrollment where no face could be found in any view. Their face must be re-captured.
  - 8 active subscriptions point at plans that were deleted (one "With Coach", seven "Monthly"). Deleting a plan that members still use leaves these broken links. A possible follow-up: refuse to delete a plan while active subscriptions use it.
- **Tests:** 1 new backend test (a coach subscription stays eligible after its plan is deleted; a normal one does not).

---

### 21. Gesture Monitor: Shows Why a Recognized Member Is Not Monitored
- **The Problem:** a recognized member without a coach subscription (for example on the Annual plan) got nothing drawn at all on the Gesture Monitor, so it looked like the camera could not identify them. Testing showed the face was in fact recognized (match distance about 0.34, the limit is 0.50).
- **The Solution:** these members now get a small grey tag: **"NAME - no coach plan"**. Unrecognized people still show "Identifying...". Nothing else changes for them: no skeleton, no exercise check and no workout log. Only members with a With Coach subscription are monitored, as described in item 14.
- **To see the skeleton on a member:** give them a With Coach subscription, assign a workout for today (otherwise the skeleton shows "NO PLAN TODAY"), and make sure the whole body is visible in good light.

---

### 22. Program Monitoring: Repetition Counting, Report Tab and Body Type
> Needs `php artisan migrate` in `backend` (two new migrations) and a restart of the Python engine. Back up the database first.

- **The Problem:** the approved paper (Chapters 1 and 3) promises three things the system did not have: the Gesture Monitor counts completed repetitions, Reports include a program monitoring report, and registration records the member's body type.
- **The Solution:**
  1. **Repetition counting** (new file `Gesture Engine/rep_counter.py`). For four selected exercises the camera counts each full bend-and-straighten of one joint: the knee for **Squat**, the elbow for **Push Up** and **Curl**, the hip for **Sit Up**. Once the camera has confirmed the assigned exercise, the Gesture Monitor shows a live line such as `SQUAT REPS: 7 / 30 (SET 1 OF 3)`, and the task is verified only when the target sets × reps has been counted. Other exercises are verified as before, as soon as the camera recognizes them.
     - The count is saved to Laravel every few seconds while the member works, so the coach sees progress even if the member stops early. A saved count never goes down.
     - The count follows the member, not the camera track: a member who steps out of view, or rests out of frame between sets, resumes from their count. After an engine restart, counting resumes from the saved count.
     - **Setting:** `REP_EXERCISES` in `Gesture Engine/.env` chooses which exercises are counted (default: all four). Put the gym owner's approved list here.
     - **Limits:** the counted joint must be visible (side or front view). It counts movements; it does not check form or depth. The angle limits are in `rep_counter.py` and may need tuning on the gym camera. Not yet tested with a real person on camera, only with simulated poses.
  2. **Program Monitoring tab in Reports.** Columns: Date, Member Details, Exercise, Target, Reps Counted, Status (Pending, Missed, Verified or Detected) and Verified By (Camera (AI) or Coach, with the time). Figures: Assigned Tasks, Verified by Camera, Verified by Coach, Completion Rate. CSV export and print work like the other tabs.
  3. **Body type at registration:** Ectomorph, Mesomorph or Endomorph (optional) in the Body measurements step of the member form, shown in the member profile's Body Metrics.
  4. **Smaller changes:** the member profile's Workout Logs show "N reps counted by camera" and whether a task was verified by the camera or the coach; the Gesture Monitor's live log shows the counted reps.
- **Database changes (no new tables):**
  - `workout_logs`: 3 new columns, `counted_reps` (smallint, nullable), `verified_by` (varchar 10, nullable: `ai` or `coach`) and `verified_at` (timestamp, nullable). Tasks verified before this change have no `verified_by` and show "Not recorded" in the report.
  - `members`: 1 new column, `body_type` (varchar 20, nullable).
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** **Updated.** See "Diagram changes for item 22" at the end of this file.
- **Tests:** 16 new engine tests (repetition counter) and 5 new backend tests (progress and completion, coach verification, report tab, body type).

---

### Summary for November 16
- **Database changes:** items 18–21 none; item 22 adds 4 columns (see item 22). Run `php artisan migrate`.
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** updated for item 22 only.
- **Files changed:** `Gesture Engine/gesture_engine.py`, `Gesture Engine/face_enrollment.py`, `Gesture Engine/monitoring.py`, `Gesture Engine/.env.example`, `frontend/src/pages/SecurityMonitor.jsx`, `frontend/src/pages/Reports.jsx`, `frontend/src/features/members/components/MemberFormModal.jsx`, `frontend/src/features/members/components/MemberProfileModal.jsx`, `frontend/src/features/members/hooks/useMembers.js`, `frontend/src/services/memberService.js`, `backend/app/Models/Member/Member.php`, `backend/app/Models/Member/Membership.php`, `backend/app/Models/Tracking/WorkoutLog.php`, `backend/app/Http/Controllers/AI/AiBridgeController.php`, `backend/app/Http/Controllers/Admin/ReportController.php`, `backend/app/Http/Controllers/Member/MemberController.php`, `backend/app/Http/Controllers/Tracking/WorkoutController.php`, plus tests.
- **New files:** `Gesture Engine/face_encoder_pool.py`, `Gesture Engine/rep_counter.py`, `Gesture Engine/tests/test_face_encoder_pool.py`, `Gesture Engine/tests/test_rep_counter.py`, `backend/database/migrations/2026_11_16_000001_add_rep_counting_to_workout_logs_table.php`, `backend/database/migrations/2026_11_16_000002_add_body_type_to_members_table.php`, `backend/tests/Feature/MemberBodyTypeTest.php`.
- **Tests:** engine 86 tests pass (25 new today). Backend: 80 pass (6 new today). 2 older `SecurityTest` tests fail on this laptop because PHP's GD image extension is not installed. They fail the same way without these changes.


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
| 1 | **Removed `auto_renew` from `memberships` entity and Data Dictionary** in both Physical and Logical ERDs | Muscle Bros Gym does not support automated recurring credit card billing; renewals are purely manual at the desk via Cash/GCash/Maya. Removing prevents defense panel questions on unimplemented payment gateways. |

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

## Diagram changes for item 22 (Program Monitoring)

File: `Chapter4_Diagrams (2).md`.

| # | Figure | Part | Change | Why |
|---|---|---|---|---|
| 1 | 4.9 Logical ERD | MEMBER | **New attribute:** `body_type` (text) | Registration records the body type for program assignment |
| 2 | 4.9 Logical ERD | WORKOUT_LOG | **New attributes:** `counted_reps` (number), `verified_by` (text), `verified_at` (datetime) | Repetitions counted by the camera, and who verified the task and when |
| 3 | 4.10 Physical ERD | `members` | **New column:** `body_type` varchar(20), nullable, after `weight` | Same as logical |
| 4 | 4.10 Physical ERD | `workout_logs` | **New columns:** `counted_reps` smallint nullable after `reps`; `verified_by` varchar(10) nullable and `verified_at` timestamp nullable after `gesture_class` | Same as logical |

**Not drawn (no new process):** repetition counting happens inside the existing "Gesture-based program monitoring" process, and the camera's progress updates use the same "log workout" data flow. If the team wants them shown: Figure 4.3 and 4.6, Reports: four report types (Payment Transactions, Membership Status, Attendance, Program Monitoring) instead of three.

---

## Changes — November 17, 2026

> No database changes in this part, so no migration. Restart nothing: the new "Renew" endpoint is picked up by Laravel on the next request.

### 23. Packages Page: Renew, Clearer Wording and a Training Plan Shortcut (Phase 1)
- **The Problems found in review:** staff could not tell where to assign a Coach's Training Plan (it is in a member's profile, three clicks away on a different page); there was no Renew button even though the page asks staff to remind members to renew; the page opened on the calendar instead of the subscriber list; the same ideas had five names (Packages, Subscriptions, Subscribers, Plans, Types); the plan screen did not warn that only With Coach members are tracked by the camera, lost edits silently when closed, and used tiny unlabeled "+" and "X" buttons.
- **The Solution:**
  1. **Renew button on every subscription** (primary on expired or ending-in-7-days rows). A short dialog shows the new dates and the amount before saving:
     - *Still active:* the same package is **extended from its current end date**, so the member keeps every paid day (new transaction type "Subscription Renewal", shown as "… Package Payment + Renewed").
     - *Already expired:* a **new subscription starts today** (normal "Subscription Payment"; the member becomes Active, with a fresh month before the inactivity rule applies).
     - The same loyalty discount as "Subscribe a member" applies, only when the previous subscription has ended. A running subscription can only be renewed with the same package (use Edit to upgrade). If the old package was deleted, staff must choose a package.
     - Renewal payments made while still active are **not counted as upgrade credit**, so an early renewal cannot make a later upgrade cheaper than it should be.
  2. **Training plan shortcut.** With Coach rows on Packages, and coach members in Member Registration, get a "Training plan →" link that opens the member's profile directly on the plan. The tab is now named "Training plan". Profiles still open on Workout Logs when opened normally.
  3. **Training plan screen:**
     - a yellow note when the member is not on an active With Coach package (the camera does not track them, so each task needs the coach's Verify);
     - the days show their real dates ("Mon Nov 17", "Today", and how many exercises each day has), and the list says which day exercises are being added to;
     - "Add" and "Remove" buttons with words, larger text, "Reps per set", and "Camera checks this" / "Coach confirms it by hand" instead of "AI tracks" / "Manual verification";
     - "Not saved yet" / "All changes saved", the Save button is off until something changes, and closing the profile with unsaved changes asks first.
  4. **One vocabulary:** a *package* is what you sell, a *subscription* is a member's purchase. "Add subscriber" became "Subscribe a member", "Subscription type" became "Package", "Manage packages" became "Packages & prices", and the tabs are "Subscriptions" and "Calendar". The page now opens on **Subscriptions** (it used to open on Calendar).
  5. **Subscribe a member:** shows a summary (package, valid dates, amount to receive), says the reference number is optional, and uses plain wording for the loyalty discount.
  6. **Status and filter fixes:** a Cancelled subscription is no longer shown as "Expired"; the package filter lists the packages that exist.
- **Known limit:** upgrading a subscription still restarts its period from today (existing rule), so upgrading right after an early renewal drops the extra renewed time. Rare; flagged for the owner.
- **Not yet done (next parts of the plan):** Phase 2 (Subscriptions / Calendar / Price list tabs, plan screen redesign with a "camera-checked only" filter and copy-to-other-days, safer package delete) and Phase 3 (coach notes saved on the server; they are still stored in the browser only).
- **Tests:** 9 new backend tests (`MembershipRenewalTest`: extend, restart, different package, deleted package, deleted member, upgrade credit, reports). Backend 89 pass; the 2 older `SecurityTest` tests still need PHP's GD extension. The new screens were render-checked with sample data, but not yet clicked through in a browser.
- **Re-test:** SBT-004 (Packages) in `TestCase.md` uses the old button names ("Add subscriber", "Manage Packages") and has no Renew step; update it after the owner has tried the new screens.

---

### 24. Packages Page: Price List Tab, Safer Package Delete and Easier Training Plans (Phase 2)
- **The Problems found in review:** package prices were managed in a popup that could open two more popups, with edit/view/delete hidden behind a "⋮" menu of three unlabeled icons and two different Save buttons; deleting a package that members were still on left their subscriptions without a package (and the page hid the error); the calendar did not say that clicking a day adds an event, and "coach events" (group classes) was easily confused with a member's coach training plan; the training plan screen had no way to find the exercises the camera can check, no overview, and each day had to be built by hand.
- **The Solution:**
  1. **Price list tab.** The page now has three tabs: **Subscriptions | Calendar | Price list**. The Price list shows every package with its length, price and **how many members are subscribed to it now**, with visible **Edit** and **Delete** buttons (no menus). "New package" and "Edit" use **one form** with one Save button. The old "Packages & prices" popup is gone, and so is the separate "Save updated prices" step.
  2. **A package in use cannot be deleted.** Both the screen and the server refuse while members still have a running subscription to it, and say how many ("“Monthly” cannot be deleted: 2 members are still subscribed to it…"). Once those subscriptions have ended the package can be deleted, and the confirmation says how many earlier subscriptions used it (they keep their record). Delete errors are now shown instead of being swallowed.
  3. **Calendar.** A "Show" switch (**Everything / Subscriptions / Classes & events**) above the calendar, and a hint: "Click an empty day to add a class or event. Click an event to see its details." The detailed category filters are still there. "Coach events" is now **"Classes & events"** everywhere it is shown (Packages, Dashboard, calendar popups, the event form), so it no longer sounds like the member's training plan.
  4. **Training plan screen:**
     - a checkbox **"Only exercises the camera can check"** in the exercise list;
     - a summary line: "12 exercises planned, 5 checked by the camera";
     - **"Copy to other days"**: copies the open day's exercises (with their sets and reps) to the days you pick, skipping ones already there.
- **Tests:** 6 new backend tests (`PlanDeletionTest`: blocked while running, ends-today counts as running, allowed once ended, unused package, older records matched by name, other packages unaffected). Backend 95 pass; the 2 older `SecurityTest` tests still need PHP's GD extension. The new screens were render-checked with sample data, but not yet clicked through in a browser.
- **Not yet done (Phase 3):** coach notes saved on the server (still stored in the browser only).

---

### 25. Login: the Email Verification Step Was Removed
- **What changed:** logging in is now **email and password only**. After a correct password the admin goes straight to the dashboard; no 6-digit code is emailed or asked for. The login screen no longer shows the code box, its label, placeholder or hint, and the footer line "Tagoloan Community College Capstone" was removed (the footer now reads "Muscle Bros Gym v1.0").
- **Kept:** the **password-reset PIN** ("Forgot password?") works exactly as before, including the 5-attempt limit and the local "show the PIN on screen" mode for development. Wrong-password protection also stays: the login is limited to 10 tries per minute per computer.
- **Backend:** `POST /api/auth/login` now returns the session token directly. `POST /api/auth/login/verify` no longer exists. `AuthController` lost `verifyLogin`, `sendVerificationCode` and `maskEmail`.
- **Why it matters for the paper:** Chapter 3 lists multi-factor authentication as not included, so this also brings the system back in line with the approved scope. The owner and adviser had asked for the PIN earlier, so confirm they agree it is removed.
- **Side effects:**
  - Sending the login PIN no longer depends on email, so logging in works even when SMTP or the internet is down. This removes the demo risk noted in the alignment review.
  - The table `auth_verification_codes` is now unused. It was left in the database (no migration) and is not drawn in the ERD, like the other unused tables.
  - Login security now rests on the password alone, so use a strong admin password.
- **Database changes:** **None.**
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** **Updated**, see below.
- **Tests:** 6 new backend tests (`AdminLoginTest`: signs in without a code and without sending email, the token opens the admin area, wrong password and unknown email are refused with no token, the old verify route is gone, the password-reset PIN still works). Backend 101 pass; the 2 older `SecurityTest` tests still need PHP's GD extension.
- **Re-test:** SBT-001 and IT-001 in `TestCase.md` still describe the login PIN; update and re-run them.
- **Older documents still describing the login PIN:** updated later the same day, see item 26. Only `ToDoList.md` was left as it was.

**Diagram changes for item 25** (`Chapter4_Diagrams (2).md`):

| # | Figure | Part | Change | Why |
|---|---|---|---|---|
| 1 | 4.3 System Process Flow | Login | **Removed** "Enter the 6-digit PIN", "PIN correct?" and "Show PIN error"; "Email and password correct?" Yes now goes to "Dashboard" | No login PIN |
| 2 | 4.4 Context Level Diagram | Flow F1 / F12 | **Text changed:** F1 "Email, password and login PIN" → "Email and password"; F12 "Login PIN and password-reset PIN" → "Password-reset PIN" | Only the reset PIN is emailed |
| 3 | 4.5 Data Flow Diagram | 1.0 Login | **Label changed:** "Email, password, PIN" → "Email, password". **Removed** store D9 `auth_verification_codes` and its "Login PIN" flow; `personal_access_tokens` renumbered D10 → D9 | No login PIN |
| 4 | 4.6 Use Case (Admin) | Log In | **Removed** the use case "Verify 6-Digit PIN" and its «include» arrow | No login PIN |
| 5 | 4.9 Logical ERD | LOGIN_PIN | **Removed** the entity and its "ADMIN verifies with LOGIN_PIN" line | Table unused |
| 6 | 4.10 Physical ERD | `auth_verification_codes` | **Removed** the table and its line to `admins`; the "on delete" note and the "not drawn" list were updated | Table unused |

---

### Summary for November 17 (items 23, 24 and 25)
- **Database changes:** **None.** No new tables and no new columns. The only new stored value is the transaction type "Subscription Renewal", which uses the existing `transactions.type` column.
- **New API route:** `POST /api/memberships/{id}/renew` (needs the admin login; body: `payment_method`, optional `plan_id`, `reference_number`, `amount`).
- **Chapter 4 diagrams (`Chapter4_Diagrams (2).md`):** **Not changed**, because there is no database change. If the team wants the new function drawn, add a "Renew Subscription" use case to Figure 4.6 (the process flow in Figure 4.3, Module 4, already has a renewal payment step).
- **Files changed:**
  - Backend: `backend/app/Http/Controllers/Member/MembershipController.php` (renew, and renewals excluded from upgrade credit), `backend/app/Http/Controllers/Member/TransactionController.php` and `backend/app/Http/Controllers/Admin/ReportController.php` ("+ Renewed" label), `backend/routes/api.php`.
  - Frontend: `frontend/src/pages/Subscriptions.jsx`, `frontend/src/pages/Members.jsx`, `frontend/src/features/subscriptions/components/SubscriptionsTable.jsx`, `frontend/src/features/subscriptions/components/SubscriptionFormModal.jsx`, `frontend/src/features/subscriptions/hooks/useSubscriptions.js`, `frontend/src/features/members/components/MemberTable.jsx`, `frontend/src/features/members/components/MemberProfileModal.jsx`, `frontend/src/features/transactions/hooks/useTransactions.js`, `frontend/src/utils/packageDisplay.js`.
- **New files:** `frontend/src/features/subscriptions/components/RenewSubscriptionModal.jsx`, `frontend/src/features/subscriptions/pricing.js` (the loyalty-discount rule and date helpers shared by the Subscribe and Renew screens), `backend/tests/Feature/MembershipRenewalTest.php`.
- **Tests:** backend 89 pass (9 new). The 2 older `SecurityTest` tests still fail on this laptop because PHP's GD image extension is not installed; they fail the same way without these changes. The frontend builds, and the changed screens were render-checked with sample data but not yet clicked through in a browser.
- **Phase 2 (item 24):** new files `frontend/src/features/subscriptions/components/PriceListView.jsx`, `frontend/src/features/subscriptions/components/PackageFormModal.jsx`, `backend/tests/Feature/PlanDeletionTest.php`; removed `frontend/src/features/subscriptions/components/PricingCatalogModal.jsx` (replaced by the Price list tab); changed `backend/app/Http/Controllers/Admin/PlanController.php` (delete guard), `frontend/src/pages/Subscriptions.jsx`, `frontend/src/features/subscriptions/hooks/useSubscriptions.js`, `frontend/src/features/subscriptions/pricing.js`, `frontend/src/features/subscriptions/components/SubscriptionsCalendarView.jsx`, `frontend/src/features/subscriptions/components/CoachEventModal.jsx`, `frontend/src/features/members/components/MemberProfileModal.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/components/ui/CalendarHoverPopover.jsx`, `frontend/src/components/ui/MobileCalendarDaySheet.jsx`. Still no database changes. Backend now 95 pass.
- **Open decisions for the owner:** (1) the loyalty discount is only given when the previous subscription has ended, so an early renewal costs full price; (2) renewing a lapsed member starts the new subscription today, not at the old end date.

---

### 26. Documentation Aligned With the System as Built

**What was done:** the system was checked against its code and database, and the documents were updated so they describe what the system really does on November 17, 2026. No program code and no database were changed in this item.

**What the documents now say (the main differences from the older text):**
- Login: email and password only; no verification code and no `auth_verification_codes` table (the password-reset PIN stays).
- Registration: address, profile photo, **body type**, and the member's **consent** to face enrollment with its date; four face views (front, chin down, left, right).
- Attendance: face rules (distance 0.50, 3 of 6 agreeing checks), **manual check-in** with a reason, RENEW flag, the saved check-in details, Inactive members set back to Active, and the retry queue when Laravel is down.
- Program monitoring: 7-day **training plan**, only members with an **active With Coach subscription** are tracked, **repetition counting** for squat, push-up, curl and sit-up, progress saved until the target is reached, coach verification by hand.
- Packages: **Renew**, upgrade balance, the **Price list** tab, and the delete guard; "Coach events" are now "Classes and events".
- Reports: four types (Payments, Memberships, Attendance, Program Monitoring).
- Database: 12 tables in use; `memberships.plan_id` has **no foreign key** (the application keeps the link); unused tables are listed as not drawn.

**Documents updated (all in this repository):**
- `Updated Current Plan For Development/Chapter4_Diagrams (2).md` (Figures 4.3 to 4.10).
- `Correct_Diagrams/` files 1 to 6, including 3A and 3B (the detailed data flow diagrams, now with D1 to D13).
- `DOCUMENTATION/Context Level Diagram`, `Data Flow Diagram`, `System Process Flow Diagram`, `USECASE DIAGRAM`, `Logical Entity-Relationship Diagram`, `Physical Entity-Relationship Diagram`.
- `DOCUMENTATION/Product Requirements Documents/`: `Database Documentation` (v2.0), `User/technical documentation` (v2.0), `Architecture` (v2.0) and `System diagrams` (v2.0).
- `README.md`, `Gesture Engine/README.md`, and `DOCUMENTATION/Installation Process/Frontend_Installation.md`.
- All Mermaid diagrams in these files were checked and parse; the physical ERD was compared with the real database tables and columns.

**Left as they were on purpose:**
- `DOCUMENTATION/Product Requirements Documents/Testing documentation/Testing Documentation.md`: it contains results that were not measured on this system (for example the face accuracy, response time and frame-rate figures). They must be replaced with real results after the formal testing, not edited by hand.
- `DOCUMENTATION/TestCase.md`: SBT-001, SBT-004 and IT-001 carry "re-run needed" notes. Update their steps and run them again after the owner has tried the new screens.
- `DOCUMENTATION/Product Requirements Documents/Overview/Overview.md` (already correct), `DOCUMENTATION/SetUpCCTV.md`, the other Installation guides, and `ToDoList.md`.
- Owner-requested extra features were not changed.

**Things the team should know:**
- `memberships.auto_renew` still exists in the database and the ERD, although the system has no automatic renewal; remove it later if the adviser asks.
- The table `auth_verification_codes` still exists in the database but is unused.
- 8 subscriptions in the current database point to packages that were deleted before the delete guard existed; they keep their package name.
- Phase 3 (coach notes saved on the server) is not built yet; until then the training-plan routine is still kept in the browser, and the documents say so.
---

### 27. No Refunds: Subscriptions Are Paused and Resumed Instead (November 25)
- **Why:** the new client, Muscle Bros, does not give refunds. When a member has to stop for a while (injury, travel), the subscription is paused so they do not lose the days they paid for.
- **How it works:**
  1. On **Packages → Subscriptions**, a subscription that is running today has a **Pause** button. Pausing starts today and keeps the days left (for example "25 days kept · since Nov 25"). The row shows a **Paused** badge, and the status filter has a **Paused** count.
  2. A paused row shows **Resume** instead of Renew and Edit. Resuming moves the end date later by the number of days spent paused. Example: ends Dec 20, paused Dec 1, resumed Dec 11, so it now ends Dec 30. The confirm dialog shows the new end date before saving.
  3. There is **no limit** on how often or how long a subscription is paused. Every pause is kept in the new table `membership_pauses` (paused on, resumed on, days, which admin).
  4. While paused, the member cannot get a **New Sale** or **Renew** until the subscription is resumed; paused members get no camera workout tasks; they are **not** set to Inactive for staying away; a face check-in is labeled "Paused"; the dashboard does not count them as "Running right now" or warn about "no valid subscription"; a package with paused subscribers cannot be deleted; Reports show a "Total Paused" count. Resuming sets the member back to Active.
- **Refund removed completely:** the Refund button, the refund API (`POST /transactions/{id}/refund`), the "Refunds" filter and stat cards, and the refund column in the printed report. "Net revenue" is now **Total revenue** (there were 0 refunds in the database, so no history was lost).
- **Database:** new migration `2026_11_26_000001_add_subscription_pauses` adds `memberships.paused_at` and the `membership_pauses` table. A paused subscription has status "Paused".
- **Tests:** new `MembershipPauseTest` (6 tests: pause and resume, pausing twice, only running subscriptions, New Sale and Renew blocked, inactivity rule and check-in label, member reactivated on resume). `TransactionRefundTest` was renamed `TransactionRulesTest`, and its refund test now checks that refunding is gone. Backend: 115 pass; the 2 older `SecurityTest` tests still need PHP's GD extension. Pause and resume were also clicked through in the browser, in light and dark mode.
- **Documents to update later:** the ERDs and the data dictionary (new table and column), the use case and process flow diagrams (Refund becomes Pause / Resume), and `TestCase.md` (any refund steps).
