# Chapters 1–3 Alignment Review

Double Alpha Fitness Gym Management System

This review compares `chapter_123.docx` with the actual system in the GYM2-CAPSTONE repository (backend, frontend and Gesture Engine, `main` branch). It lists:

- **Overstated:** the chapter promises something the system does not do.
- **Missing:** the system does something the chapter never mentions.
- **Other:** wording, numbering and reference problems.

Each item gives the location, the text to search for in Word, what is wrong, and suggested replacement text.

---

## Decide these first

Four claims appear in many places across all three chapters. Decide each one before editing, because the answer changes every item that mentions it.

| Claim in the chapters | What the system does | Option A: change the chapters | Option B: change the system |
|---|---|---|---|
| The system **counts completed repetitions** | It recognizes which exercise is being done and marks the assigned task as verified. Sets and reps are only targets typed by the coach. | Replace "count completed repetitions" with "recognize the assigned exercise and verify the task". | Build and test rep counting before the defense. |
| The system **records body type** (Ectomorph, Mesomorph, Endomorph) | No body type field exists anywhere. | Remove body type. Keep height, weight and date of birth. | Add a body type field to the member form and database. |
| The system generates **program monitoring reports** | Reports has two types: Payment Transactions, and Membership & Attendance Status. Workout history is shown only in each member's profile. | Say workout history is viewed per member, and drop the program monitoring report. | Add a Program Monitoring report type. |
| **Confirming a payment updates the membership** | Creating or upgrading a subscription creates the payment. Recording a payment on the Transactions page does not touch the subscription. | Describe it the way the system works. | Change the payment flow. |

**Recommendation:** with the defense close, take Option A for all four. Rep counting in particular would need building, training and accuracy testing. The rest of this file assumes Option A. If you choose Option B for any row, skip the items for that row and build the feature instead.

---

## Chapter 1 — Background of the Study

### Overstated

**1.1 Project Context, paragraph 4**
- **Find:** "It will detect body landmarks, recognize defined movement patterns, and count completed repetitions"
- **Problem:** no repetition counting.
- **Replace with:** "It will detect body landmarks, recognize the assigned exercise from the member's body pose, and verify the coach-assigned workout task when the exercise is recognized."

**1.2 Purpose and Description, paragraph 1**
- **Find:** "recognize defined movement patterns, and count completed repetitions"
- **Replace with:** "recognize the assigned exercise, and verify the member's workout task"

**1.3 Purpose and Description, paragraph 1**
- **Find:** "Once a payment is confirmed by the gym owner or authorized admin, the system will immediately update the payment status, transaction record, payment history, and related membership information."
- **Problem:** there is no confirm step. When the admin creates or upgrades a subscription, the system creates the payment record automatically. A payment recorded on the Transactions page does not change any subscription.
- **Replace with:** "When the admin creates or upgrades a member's subscription, the system automatically records the corresponding payment transaction and updates the member's plan and status. The admin can also record walk-in and package payments, print receipts and process refunds."

**1.4 Purpose and Description, paragraph 2**
- **Find:** "selected exercise repetition tracking" and "admin-assisted payment confirmation"
- **Replace with:** "selected exercise task verification" and "admin-assisted payment recording"

**1.5 Conceptual Framework (Figure 1.0, the IPO diagram)**
- **Input box:** remove "Body Type".
- **Output box:** remove "Program Monitoring Reports". Replace it with "Workout Plans and Verified Workout History".
- **Process box:** add "Subscription Management". The system manages subscriptions separately from packages: create, upgrade, expire.

**1.6 Conceptual Framework, text**
- **Find:** "anthropometric data, and body type" and "together with body type, is collected to support the coach"
- **Replace with:** "anthropometric data (height and weight) and date of birth" and "is collected to support the coach"
- **Find:** "program monitoring reports"
- **Replace with:** "workout history"

**1.7 Objectives, (c) a. Member Registration Module**
- **Find:** "and records body type for program assignment and monitoring"
- **Replace with:** "and captures the member's face from three angles (front, left and right) for enrollment"

**1.8 Objectives, (c) b. Program Monitoring Module**
- Add what it really does: "allows the coach to build a 7-day workout plan with exercises, dates, sets and reps; recognizes 12 supported exercises through the camera; automatically verifies assigned tasks for members with an active With Coach package; and allows the coach to verify tasks manually."

**1.9 Objectives, (c) f. Reports Module**
- **Find:** "attendance, program monitoring, membership status, and payment transaction records"
- **Replace with:** "payment transaction reports and membership and attendance status reports, exportable as CSV or printable from the browser"

**1.10 Scope and Limitation, paragraph 2**
- **Find:** "and body type. Anthropometric data and body type will be used as reference information"
- **Replace with:** ". Anthropometric data will be used as reference information"
- **Find:** "It will monitor exercise movements and count repetitions based on recognized movement patterns"
- **Replace with:** "It will recognize the assigned exercise from the member's body pose and verify the assigned workout task"
- **Find:** "program monitoring reports"
- **Remove it.**

**1.11 Scope and Limitation, paragraph 3**
- **Find:** "Advanced security features such as multi-factor authentication and penetration testing are not included"
- **Problem:** the system already asks for a 6-digit PIN after the password. A panelist may call that two-step verification and ask why you say it is excluded.
- **Replace with:** "The system uses email and password login followed by a 6-digit verification PIN. Advanced security features such as SMS or authenticator-app multi-factor authentication and penetration testing are not included due to limited time and resources (Allafi & Darem, 2025)."

**1.12 Scope and Limitation, add limitations the system really has**
- Facial recognition attendance only logs between 9:00 AM and 9:30 PM, once per member per day.
- Camera verification of workouts only covers 12 exercises: burpee, crunch, curl, deadlift, high knee, lunge, mountain climber, plank, push up, Russian twist, sit up and squat. Other exercises are verified manually by the coach.
- Camera verification only applies to members with an active With Coach package.
- The Gesture Engine reads one camera at a time. The admin switches between CCTV, phone camera and webcam.
- The Gesture Engine must run on the same computer as the Laravel backend, because it reads the enrolled face photos from the backend's folder.
- **Replace "body type" in this paragraph:** "automatic fitness recommendations based on anthropometric data or body type" becomes "automatic fitness recommendations based on anthropometric data".

**1.13 Definition of Terms**

| Term | Problem | Fix |
|---|---|---|
| Centralized Database | Says it stores "reports". Reports are generated on demand, not stored. | Remove "and reports". |
| Database | Same. | Remove "and reports". |
| Gesture-Based Program Monitoring | "count completed repetitions" | "recognize the assigned exercise and verify the member's workout task" |
| Movement Pattern | "count repetitions" | "recognize selected exercises" |
| Program Monitoring | "completed repetitions" | "verified workout tasks" |
| Report Generation | Lists "program monitoring reports" and "system logs". Neither exists. | "payment transaction reports and membership and attendance status reports" |
| Membership | "renewal" | Fine, but note that renewal means creating a new subscription. |
| Authentication | Doesn't mention the PIN. | Add: "using email, password and a 6-digit verification PIN". |

### Missing (the system has it, Chapter 1 doesn't mention it)

Add the important ones to Purpose and Description or Scope:

- **Two-step login:** email and password, then a 6-digit PIN. Also password reset by PIN.
- **Refunds:** refunding a payment creates a negative transaction and marks the original as Refunded.
- **Subscription upgrade:** moving to a higher-priced package charges only the difference.
- **Package categories:** Normal, With Coach, Walk-In, and custom categories.
- **Coach events calendar:** classes and events with categories and colors.
- **Dashboard and notifications:**
  - Revenue, member and subscription totals.
  - A 6-month sales chart.
  - Alerts for subscriptions expiring within 7 days, members with no subscription, and unverified workout tasks.
- **Automatic member status:** a member becomes Inactive after one month without attendance.
- **History is kept when a member is deleted:** payments and subscriptions keep the member's name, email and photo.
- **Multi-person tracking:** the camera can track several people at once and links each body to the recognized face.
- **Exercise catalog:** the coach picks from 1,324 exercises, filtered by body part.

**Terms to add to the Definition of Terms:** Verification PIN, Sanctum Token, Flask, OpenCV, MediaPipe, Random Forest Classifier, RTSP, With Coach Package, Walk-In Guest.

---

## Chapter 2 — Review of Related Literature and Studies

Chapter 2 mainly describes other people's work, so most of it is fine. The problems are the sentences that describe **your** system.

### Overstated

**2.1 Sim et al. (2024) paragraph**
- **Find:** "to identify selected exercise movements and count completed repetitions"
- **Replace with:** "to identify selected exercise movements and verify assigned workout tasks"
- **Worth adding:** Sim et al. used a Multi-Layer Perceptron. Your system uses a Random Forest classifier on 33 MediaPipe body landmarks. One sentence comparing the two shows the panel you understand your own model.

**2.2 Ko et al. (2024) paragraph**
- **Find:** "to identify selected exercise movements and count completed repetitions"
- **Replace with:** the same wording as 2.1.

**2.3 Chen and Yang (2020) paragraph**
- **Find:** "for selected exercise recognition and repetition counting"
- **Replace with:** "for selected exercise recognition and workout task verification"

**2.4 Czekaj et al. (2024) paragraph**
- This study is about repetition counting. Keep it, but don't claim your system does the same. Its last sentence is fine as written.

**2.5 Synthesis, paragraph 1**
- **Find:** "can support the monitoring of selected workout movements and repetition counting"
- **Replace with:** "can support the recognition of selected workout movements"

**2.6 Adekola et al. (2023) paragraph**
- **Find:** "which aims to prevent attendance fraud"
- **Problem:** be ready to defend this. The system rejects unclear face matches: a match must be close enough, and clearly better than the second-best face. If you keep "prevent", the panel may ask how it stops someone holding up a photo. The system has no liveness check.
- **Safer:** "which aims to reduce proxy attendance".

### Other

**2.7 Citation year mismatch**
- In-text: "Valenzuela et al. (2025)". Reference list: "(2026)". Make them match.

**2.8 Reference not cited**
- "GeeksforGeeks. (2022, October 6). Difference between unit, functional, acceptance, and integration tests" is in the reference list but never cited in the text. Cite it in Chapter 3 Testing, or remove it.

---

## Chapter 3 — Research Methodology

### Overstated

**3.1 Requirements and Analysis**
- **Find:** "gesture-based program monitoring to record selected exercise movements and repetitions"
- **Replace with:** "gesture-based program monitoring to recognize selected exercise movements and verify assigned workout tasks"
- **Find:** "basic authentication"
- **Replace with:** "password and PIN-based authentication"
- **Find:** "identify the needed facial data enrollment process and basic accuracy target"
- **Problem:** no accuracy target is stated anywhere, and the panel will ask for it.
- **Fix:** state the target, for example "at least 85% correct identification under gym lighting", and report the measured result in Chapter 4.

**3.2 System Design, paragraph 2: ERD tables**
- **Find:** "admin accounts, members, attendance records, packages, memberships, payments, program records, facial recognition data, gesture monitoring records, and reports"
- **Problem:** there is no table for facial recognition data, gesture monitoring records or reports. Face photos are stored as image files.
- **Replace with:** "admins, members, plans (packages), package categories, memberships, transactions, attendances, workout logs, coach events and coach event categories, plus tables for login verification PINs, password-reset PINs and session tokens"

**3.3 System Design, paragraph 2: DFD**
- **Find:** "facial recognition data, gesture monitoring data"
- **Replace with:** "face photos used for recognition, workout task results"

**3.4 System Design, paragraph 3, and Figure 3.0 (System Architecture)**
- The text says four layers. The figure shows three labelled layers plus an unlabelled CCTV box. Label the CCTV box "IoT / Device Integration Layer".
- The figure puts Python inside the Laravel application. In the real system, Python is a separate Flask service (port 5000). It:
  - reads the camera itself;
  - streams the live video straight to the browser;
  - talks to Laravel through the `/api/ai/...` routes, protected by a shared token.
- **Suggested addition to the text:** "The Python Gesture Engine runs as a separate Flask service. It receives the camera feed, streams the annotated live video to the admin's browser, and sends attendance and workout verification results to the Laravel API using a shared engine token."
- **Find:** "send the results to the Laravel backend through an API or controlled backend integration"
- **Replace with:** "send the results to the Laravel backend through its REST API"

**3.5 Development, paragraph 3**
- **Find:** "identify selected exercise movements, and count completed repetitions based on the approved scope of the study"
- **Replace with:** "classify the exercise using a trained Random Forest model, and verify the member's assigned task when the exercise is recognized in at least 5 of the last 7 predictions with at least 70% confidence"
- **Find:** "facial recognition data, gesture monitoring data, and reports, will be stored in the centralized MySQL database"
- **Replace with:** "and workout logs will be stored in the centralized MySQL database, while enrolled face photos are stored as image files on the server"

**3.6 Development, tools paragraph**
- **Find:** "Python libraries for facial recognition and gesture processing may be used"
- **Problem:** it is vague. The panel will ask which libraries.
- **Replace with:** "The Gesture Engine uses Python with OpenCV for video capture, the face_recognition library (dlib) for face matching, MediaPipe Pose Landmarker for body landmarks, scikit-learn (Random Forest) for exercise classification, and Flask for the video streams and control endpoints."
- **Also add:** Recharts for the dashboard charts and FullCalendar for the subscription and events calendar.

**3.7 Development, expected output**
- **Find:** "monitor selected exercise movements and repetitions"
- **Replace with:** "monitor selected exercise movements and verify assigned workout tasks"

**3.8 Architecture text (after Figure 3.0)**
- **Find:** "facial recognition data, gesture monitoring data, program records, and reports" (Data Layer paragraph)
- **Replace with:** "workout logs, coach events, and face photo references"

**3.9 Testing and Evaluation**
- **Find:** "and completed repetitions are counted correctly"
- **Replace with:** "and the matching assigned task is verified correctly"
- **Find:** "and exercise repetition results"
- **Replace with:** "and workout verification results"
- **Find:** "payment confirmation" (scenario list)
- **Replace with:** "payment recording and refunds"
- **Consistency:** Chapter 3 says Scenario Testing and Integration Testing only. Your Chapter 4 says unit, integration, system and pilot testing. The repository also has automated tests:
  - 11 Laravel feature tests: security, access control, refunds, upgrades, workout plans, inactivity, PIN limits and more.
  - 2 Python tests.
- Make Chapter 3 and Chapter 4 list the same testing types, and mention the automated tests. They are evidence for the panel.

**3.10 Deployment**
- **Find:** "Laravel's scheduler for membership expiration checks"
- **Problem:** the system has no scheduled task. Expired subscriptions are shown as Expired when the page loads; the stored status is not updated automatically.
- **Fix:** remove this tool. Or add a scheduled command in the system that marks expired subscriptions (see "System issues" below).
- **Find:** "facial recognition data, gesture monitoring data, program records, and reports" (tables to create)
- **Replace with:** the table list from 3.2.
- **Find:** "a webcam or USB camera will be installed"
- **Replace with:** "a CCTV camera (RTSP), phone camera or USB webcam will be installed. The admin switches between sources from the monitor pages."
- **Add:** "The Gesture Engine must run on the same computer as the Laravel backend because it reads the enrolled face photos from the backend's storage folder."
- **Find:** "User documentation will include a quick guide for members"
- **Note:** members never use the software directly. Check whether this guide exists; if not, remove it.

**3.11 Maintenance**
- **Find:** "adjust selected exercise movement rules"
- **Problem:** the system uses a trained model, not rules.
- **Replace with:** "collect more training samples and retrain the exercise classification model"
- **Find:** "multi-factor authentication" in the future-work list
- **Replace with:** "SMS or authenticator-app multi-factor authentication"

### Missing

- Chapter 3 never names the exercise model (Random Forest), the confidence rule (5 of 7 predictions at 70% or more), or the face match rule (distance below 0.50, with a clear gap to the second-best match). These are the questions a panel is most likely to ask. Add one short paragraph to Development.
- The With Coach rule: only members with an active With Coach package get camera verification. Add this to Development.
- The three-angle face capture during registration: front, left and right.

### Other

**3.12 Figure numbering**
- Chapter 3 uses "Figure 2.0" (Modified Waterfall) and "Figure 3.0" (Architecture). Chapter 4 uses 4.1, 4.3 and so on.
- **Suggested:** Figure 3.1 and Figure 3.2 in Chapter 3. Check with your adviser's format.

---

## Whole document

- **Title page:** says "A Capstone Project PROPOSAL" and "MAY 2026". For the final defense this probably needs the final wording and date. Check with your adviser.
- **Tense:** Chapters 1–3 are written in future tense ("will"). If this is the final manuscript, ask your adviser whether to change to past tense now that the system is built.
- **System name:** the title says "IoT-Based". Chapter 4 also says "Camera-Based" in many places. Use one name everywhere.
- **"IoT" label:** the only devices are cameras on the local network. A panelist may ask what makes it IoT. Have a one-sentence answer ready, for example: "Network cameras (CCTV and phone cameras over RTSP) feed a processing service that sends results to the server automatically."

---

## System issues the panel may notice

These are in the code, not the chapters, but they could come up in a demo.

1. **"Active Subs" count can be wrong.** A subscription stays stored as Active after its end date. The Packages page shows it as Expired, but the dashboard's "Active Subs" card and the Reports "Total Active" count include it. **Fix:** add a scheduled command that marks ended subscriptions as Expired. That would also make the Chapter 3 "Laravel scheduler" claim true.
2. **Small training dataset.** The exercise model was trained on only 167 samples for 12 exercises (6 to 29 each). If you claim an accuracy figure, test it on new recordings with the real gym camera, and be ready to show the result.
3. **No liveness check.** Holding up a photo of a member may be recognized. Mention this as a limitation rather than wait for the panel to find it.
4. **Attendance has no time-out.** The code mentions a `time_out` field, but the database has no such column. Don't claim time-out tracking.

---

## Quick checklist

- [ ] Decide Option A or B for repetitions, body type, program report and payment flow.
- [ ] Chapter 1: items 1.1 to 1.13, then add the missing features.
- [ ] Chapter 2: items 2.1 to 2.8.
- [ ] Chapter 3: items 3.1 to 3.12, then add the missing details.
- [ ] Update Figure 1.0 (IPO) and Figure 3.0 (Architecture).
- [ ] Fix the Valenzuela year and the uncited GeeksforGeeks reference.
- [ ] Use one system name throughout.
- [ ] Prepare answers for the "System issues" above.
