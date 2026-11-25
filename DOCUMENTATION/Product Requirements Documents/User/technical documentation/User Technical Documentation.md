# User & Technical Documentation Manual

**Product Name:** IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Muscle Bros Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Document Version:** 2.0  
**Date:** November 17, 2026  
**Describes:** the system as built on this date. Earlier versions of this manual (September 2026) described features that were never built; they were removed.

---

## 1. Document Purpose & Audience

This manual combines **user guides** for the gym owner and coaches with **technical notes** for whoever installs and maintains the system.

1. **Gym Owner / Admin and Coach:** the owner and the coach use the same single administrator login. Daily use: registering members, subscriptions and renewals, payments, attendance, training plans, workout monitoring and reports.
2. **Gym Members:** members do not log in. They give their details, agree to face enrollment, pose for face capture, and then simply walk past the camera.
3. **Developers & technicians:** installation, configuration, cameras and troubleshooting.

---

# PART A: USER GUIDE

## 2. Logging In

1. Open the system in a browser (for example `http://localhost:5173`).
2. Enter the administrator **email and password** and press **Login**. There is no verification code. Tick **Remember me** to stay signed in on that computer.
3. **Forgot password?** Enter the administrator email. A 6-digit PIN is emailed to it (valid 10 minutes, 5 wrong tries allowed). Enter the PIN and choose a new password (at least 8 characters).

The left menu has: **Overview, Member Registration, Packages, Transactions, Reports, Attendance Monitor, Gesture Monitor**, and the account page (name, email, system logo, password). The bell shows alerts: subscriptions ending soon, classes and events coming up, and a note of the last sign-in.

## 3. Overview (Dashboard)

Shows today's check-ins (with a chart per hour), subscriptions ending this week, recent payments, new members, monthly income, classes and events coming up this week, and a calendar of subscriptions and events.

## 4. Member Registration

1. **Member Registration > Register a member.** The form has three steps:
   * **Photos:** an optional profile photo (can be cropped) and the **face capture**: four views, front, chin down, slight left, slight right. Tick the **consent box**; a face is not saved without it, and the date of consent is recorded (Data Privacy Act of 2012).
   * **Personal details:** first and last name, email, phone, address. When editing, **Member status** (Active or Inactive) can be set by hand.
   * **Body measurements (optional):** date of birth, height, weight, and **body type** (Ectomorph, Mesomorph or Endomorph). The body mass index is worked out from height and weight.
2. **Save.** A new member is Active.
3. The list can be searched (name, email, phone) and filtered by Active or Inactive. Open a member (eye icon, or the name) to see the **profile**: contact and body details, **Coach Notes**, and three tabs: **Workout Logs**, **Attendance Calendar** and **Training plan** (see section 8).

A member who is not recognized by the camera for one month is set to **Inactive** automatically. A check-in, a renewal, or the admin sets them back to **Active**.

## 5. Attendance Monitor

1. Open **Attendance Monitor**. The camera feed shows a green box and name for recognized members and a red "Unknown" box otherwise. Use the camera selector to switch between CCTV 1, 2, 3, the phone camera and the webcam.
2. **A check-in is recorded automatically** when several face checks agree on the same member. Rules: only between **9:00 AM and 9:30 PM** (set in `GYM_OPEN_TIME` and `GYM_CLOSE_TIME`), and **once per member per day**. The list on the right shows today's check-ins, each with badges: *Active*, *Expired*, *No Sub*, *Returned* (was Inactive), *Manual*.
3. A member whose subscription has **expired** gets an **orange box and "RENEW"** on the feed. They are still checked in.
4. **Manual check-in:** if the camera cannot recognize a member (mask, lighting, camera off), press the person-plus button, choose the member and type a reason. The same rules apply, and the record shows "Manual" with the reason.
5. **Force AI Memory Sync** reloads the enrolled faces at once. The engine also does this by itself every minute, so a newly registered member is recognized without pressing it.
6. **Full Log** opens the Attendance tab of Reports.

### 5.1 Attendance page (every subscriber)
Open **Attendance** in the sidebar to see every member with a subscription, without opening each profile.

* **Cards:** checked in today, visits this week, **not seen in 7+ days** (Active subscribers to check on; click it to filter), and paused subscriptions.
* **List:** each subscriber's package and status (Active, Paused, Expired) with days left or days kept; **this week** as Mon to Sun boxes (cyan = came); the **last visit** (red after 7 days away); visits this month; and, for With Coach members, this week's coach tasks done, with missed tasks.
* **Search, filter and sort:** search by name or member ID; filter All, Active, Not seen 7+ days, Paused or Expired; sort by longest absent, most recent visit, most visits or name.
* **Click a member** to open a window like the member profile: the summary and **Manual check-in**, **Profile** and **Training plan** buttons on the left, and tabs for the **Attendance Calendar**, the **Check-ins** history and the **Coach plan** (this week, day by day).
* Walk-in and daily passes are not listed.

## 6. Packages

The page has three tabs: **Subscriptions**, **Calendar** and **Price list**.

* A **package** is what the gym sells (for example Monthly). A **subscription** is a member's purchase of a package.
* **Subscriptions tab.** Search by name or member ID and filter by status and package. **Subscribe a member** chooses the member, the package, the payment method (Cash, GCash or Maya) and an optional reference number; the end date and the amount are worked out and shown in a summary. Returning members get a loyalty discount of ₱20 per earlier subscription on packages above ₱300, never below ₱300. Saving also records the payment in Transactions.
  * **Renew** (on every row; highlighted once a subscription has ended or ends within 7 days): a dialog shows the new dates and the amount before saving. A subscription that is **still running** is extended from its current end date, so no paid days are lost. One that **has ended** starts again **today**. A running subscription can only be renewed with the same package.
  * **Edit > choose a higher-priced package** upgrades a running subscription; only the remaining balance is charged.
  * **Training plan ->** appears under With Coach subscriptions and opens the member's training plan.
  * **Pause** (on a running subscription): the gym gives no refunds, so a member who must stop for a while is paused instead. The days left are kept (for example "25 days kept"). **Resume** sets it back to Active and moves the end date later by the days spent paused; the dialog shows the new end date first. While paused, the member cannot get a new sale or a renewal, the camera gives no workout tasks, and the member is not set to Inactive for staying away.
* **Calendar tab.** Subscriptions and **classes and events**. Use the **Show** switch (Everything, Subscriptions, Classes & events). **Click an empty day to add a class or event** (title, category, dates, times, location, colour). Click an event to see it.
* **Price list tab.** Every package with its length, price and how many members are subscribed now. **New package** and **Edit** use the same form (name, category, length in days, price, colour). The categories are Normal, With Coach and Walk-In; **With Coach** unlocks the training plan and camera tracking. **Delete** is refused while members are still subscribed to the package; once those subscriptions have ended, it can be deleted and ended subscriptions keep their record.

Status colours: **Active**, **Paused**, **Expired**, and **Cancelled**.

## 7. Transactions and Reports

* **Transactions > Record a payment:** package, member (leave empty for a walk-in guest), amount, payment method (Cash, GCash, Maya) and reference number. Payments for subscriptions and renewals are recorded automatically. A payment cannot be edited, deleted or refunded; its **receipt** can be printed, and **Print All** prints the list. The cards show **total revenue** and the number of payments.
* **Reports** has four tabs. Choose dates (or Today, Last 7 days, This month), search the table, then **Export CSV** or **Print report**.
  * **Payments:** total income and number of payments.
  * **Memberships:** new signups, active, paused, expired, check-ins.
  * **Attendance:** total check-ins, unique members, average daily visits, busiest hour; each row shows the plan and subscription status on the day, whether the check-in was by face or manual, and the camera.
  * **Program Monitoring:** assigned tasks, verified by camera, verified by coach, completion rate; each row shows the exercise, target sets and reps, **repetitions counted**, status (Pending, Missed, Verified or Detected) and who verified it.

## 8. Training Plans and the Gesture Monitor

### 8.1 Building a training plan
1. Open the plan from **Packages** (Training plan link on a With Coach row), from **Member Registration** (same link), or from the profile's **Training plan** tab.
2. Search the exercise list (by name, muscle or equipment) or filter by body part. Tick **Only exercises the camera can check** to see just those. Press **Add** to put an exercise on the day shown at the top of the list ("Adding to Monday, Nov 17").
3. For each exercise set the **Sets** and **Reps per set**. A day can be copied to other days with **Copy to other days**. The summary line shows how many exercises are planned and how many the camera will check.
4. The seven day tabs show real dates; a saved plan covers **the next 7 days, starting today**. Press **Save plan** (the button is active only when something changed, and a note says "Not saved yet").
5. If the member is **not on an active With Coach package**, a yellow note explains that the camera will not track them and the coach must confirm each task.

Coach notes in the profile are saved in the browser on this computer only.

### 8.2 What the camera does
Only members with an **active With Coach subscription** are monitored. For them the Gesture Monitor draws the skeleton, name and the assigned exercise. Everyone else gets a small grey tag ("Identifying..." or "<name> - no coach plan").

* The camera recognizes 12 exercises. When it confirms the assigned exercise (at least 5 of the last 7 checks and 70% confidence), a task is **verified**.
* For **squat, push-up, curl and sit-up** the camera also **counts repetitions** from the bend of the knee, elbow or hip. The overlay shows `SQUAT REPS: 7 / 30 (SET 1 OF 3)`, the count is saved every few seconds, and the task is verified only when the target sets × reps is reached. A member who steps out of view keeps their count.
* The camera counts movements; it does not judge form. The whole body (and the counted joint) must be visible, in good light.

### 8.3 Verifying a task by hand
If the camera cannot check a task (not a camera exercise, the member is not on a With Coach package, or the picture is poor): open the member's profile > **Workout Logs**, open the day, and press **VERIFY** on the task. This is available only for a member who has checked in today (the button shows a lock otherwise). The log then shows "by coach"; camera-verified tasks show "by camera" and the repetitions counted.

## 9. Account
**Account page:** change the administrator name and email, the **system logo** (shown in the app and on printouts), and the password.

---

# PART B: TECHNICAL NOTES

## 10. Requirements

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| CPU | 6 cores (for example Ryzen 5) | 8+ cores |
| RAM | 8 GB | 16 GB |
| Cameras | one USB webcam | IP CCTV (Hikvision or Reolink); use a 1080p stream, not 4K |
| Network | LAN | wired Ethernet / PoE for CCTV |

| Software | Version |
| :--- | :--- |
| PHP / Composer | 8.2+ / 2.6+ |
| Node.js | 20 LTS or newer |
| MySQL | 8.0+ (the backend defaults to SQLite until `DB_*` is set) |
| Python | 3.10 |

The Python engine needs `opencv-python`, `mediapipe`, `face_recognition` (dlib), `scikit-learn`, `Flask` and `requests` (see `Gesture Engine/requirements.txt`). On Windows use a prebuilt dlib; building dlib from source needs Visual Studio build tools.

## 11. Installation

1. **Database:** create an empty MySQL database (any name) and set `DB_CONNECTION=mysql`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `backend/.env`.
2. **Backend** (`backend` folder): `composer install`, copy `.env.example` to `.env`, `php artisan key:generate`, `php artisan migrate --seed`, `php artisan serve` (port 8000).
   * Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding; otherwise a random password is generated and printed once.
   * Set `AI_ENGINE_TOKEN` to a long random string (the engine reads it from `backend/.env` on the same computer).
   * Set `MAIL_MAILER=smtp` and the SMTP settings so the password-reset PIN is emailed. For development only, `AUTH_VERIFICATION_MODE=display_pin` shows the reset PIN on screen.
   * Optional: `GYM_OPEN_TIME` and `GYM_CLOSE_TIME` (default 09:00 to 21:30).
   * After upgrading from an older version run `php artisan migrate` and, once, `php artisan faces:secure` (moves old face photos to private storage). `php artisan schedule:work` is optional (the Inactive rule also runs once a day when pages are opened).
3. **Frontend** (`frontend` folder): `npm install`, then `npm run dev` (port 5173). Set `VITE_AI_URL` if the engine is not on the same computer.
4. **Gesture Engine** (`Gesture Engine` folder): create a virtual environment, `pip install -r requirements.txt`, copy `.env.example` to `.env`, then `python main.py` (port 5000). Keep the camera URLs and passwords only in `.env`; never commit them.

## 12. Gesture Engine settings (`Gesture Engine/.env`)

| Setting | Meaning |
| :--- | :--- |
| `CAMERA_SOURCE` | Camera used at start: `cctv`, `cctv_2`, `cctv_3`, `webcam`, `phone` |
| `CCTV_URL`, `CCTV_2_URL`, `CCTV_3_URL`, `PHONE_CAMERA_URL`, `WEBCAM_INDEX` | Camera addresses |
| `FACE_MATCH_THRESHOLD`, `FACE_MATCH_MARGIN`, `FACE_VOTES_REQUIRED` | How strictly faces are matched |
| `FACE_ENCODER_PROCESSES` | Helper processes for face recognition (default 2); stops the video freezing while a face is being recognized |
| `POSE_MODEL` | `full` (accurate) or `lite` (lighter) |
| `REP_EXERCISES` | Exercises whose repetitions are counted: `SQUAT`, `PUSH UP`, `CURL`, `SIT UP` |
| `LIVENESS_REQUIRED` | `true` checks in a member only after a blink (stops a printed photo; off by default, test it first) |

## 13. API Reference (summary)

All admin routes need the login token (`Authorization: Bearer <token>`). Engine routes need the header `X-AI-Engine-Token`.

| Area | Routes |
| :--- | :--- |
| Login | `POST /api/auth/login`; `POST /api/auth/logout`; `POST /api/auth/password-reset/request`, `/verify` and `/api/auth/password-reset` |
| Account | `GET /api/admin/me`; `POST /api/admin/profile`, `/password`, `/logo` |
| Members | `GET/POST /api/members`; `PUT/DELETE /api/members/{id}` |
| Subscriptions | `GET/POST /api/memberships`; `PUT/DELETE /api/memberships/{id}`; `POST /api/memberships/{id}/renew`, `/pause` and `/resume` |
| Packages | `GET/POST /api/plans`; `PUT/DELETE /api/plans/{id}`; package categories under `/api/package-categories` |
| Classes and events | `/api/coach-events` and `/api/coach-event-categories` |
| Payments | `GET/POST /api/transactions` (payments are never edited, deleted or refunded) |
| Attendance | `GET /api/attendance/today`; `GET /api/attendance/subscribers` (Attendance page); `POST /api/attendance/manual`; `GET /api/members/{id}/attendance` |
| Training plans | `GET/POST /api/members/{id}/workout-plan`; `POST /api/members/{id}/assign-task`; `GET /api/members/{id}/workouts`; `PUT /api/workouts/{id}/manual-verify`; `GET /api/workouts/live` |
| Reports, dashboard | `GET /api/reports?start=&end=`; `GET /api/dashboard`; `GET /api/notifications` |
| Engine only | `GET /api/ai/members-faces`; `GET /api/ai/workout-plans`; `POST /api/ai/log-attendance`; `POST /api/ai/log-workout` (also carries `counted_reps` and `completed`) |

## 14. Camera Setup

* **RTSP:** set the camera address in `Gesture Engine/.env`, for example `CCTV_URL=rtsp://user:password@192.168.1.45:554/Streaming/Channels/101` (Hikvision) or `.../Preview_01_main` (Reolink). Use the 1080p stream; decoding 4K slows the engine on a laptop. See `DOCUMENTATION/SetUpCCTV.md`.
* **Placement:** cameras about 1.8 to 2.2 m high, tilted down 15° to 30°, even light, faces 1 to 3.5 m from the lens. A face under 40 px wide is not recognized ("Move closer").

## 15. Troubleshooting

| Problem | Likely cause | What to do |
| :--- | :--- | :--- |
| Face shows "Unknown" | Poor light, mask, not enrolled, or an enrollment with no face found | Improve light; re-capture the face; press Force AI Memory Sync; use a manual check-in meanwhile |
| Member recognized but nothing on the Gesture Monitor | Not on an active With Coach package, or no plan for today | Check the package; assign a plan |
| Video lags or freezes | 4K stream, weak CPU, or `FACE_ENCODER_PROCESSES=0` | Use a 1080p stream; keep `FACE_ENCODER_PROCESSES=2` (or 1) |
| Reports or pages show an error after an update | Migrations not run | `php artisan migrate` |
| Check-in refused | Outside gym hours, or already checked in today | Check the clock and the day's list |
| Password-reset email not received | SMTP not configured | Set `MAIL_*` in `backend/.env` and restart Laravel |
| Attendance missing after the server was off | The engine saves check-ins in `Gesture Engine/data/attendance_queue.jsonl` and re-sends them every 30 seconds | Start Laravel again; they are sent with their real time |

**Backup:** `mysqldump -u root -p <database> > backup.sql` (restore with `mysql -u root -p <database> < backup.sql`). Back up before every `php artisan migrate`.
