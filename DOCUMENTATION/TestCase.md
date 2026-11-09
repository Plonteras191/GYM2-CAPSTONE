# Test Cases

## 1. Purpose and Scope

This document defines functional test cases for the Camera-Based Gym Management System used by Double Alpha Fitness Gym. Each requested page has:

- one **Scenario-Based Test Case** covering the complete administrator workflow and every page action; and
- one **Integration Test Case** covering the page, API, database, browser storage, camera, or AI boundary it uses.

The cases cover all requested pages and their implemented controls, including successful, validation, empty-data, cancellation, and service-failure behavior.

## 2. Test Environment and Data

- Use the approved QA/staging environment and non-production records.
- Prepare an administrator account, invalid credentials, disposable members, approved face images, packages, subscriptions, transactions, report data, workout assignments, coach events, and notification records.
- Run the React frontend, Laravel API, database, and Python AI engine before executing applicable cases.
- Use an approved test camera. Do not store real passwords, personal information, biometric images, or camera credentials in this document.
- Record tester, date, build/version, browser/device, camera source, actual result, status, and postcondition.

## 3. Scenario-Based Test Cases

### SBT-001 — Login

| Field | Details |
|---|---|
| Scenario ID | SBT-001 |
| Objective | Verify administrator authentication, password visibility, Remember Me persistence, recovery PIN reset, validation errors, loading state, device-login notification data, redirect, and logout protection. |
| Actor | Administrator |
| Preconditions | Valid and invalid credentials are available; the administrator is logged out. |
| Steps | 1. Open Login.<br>2. Enter an invalid email format and confirm browser validation.<br>3. Enter valid email and an invalid password; submit and observe the loading indicator and error message.<br>4. Test password visibility and Remember Me across a browser restart.<br>5. Use Forgot Password to request and verify a recovery PIN, then set a new password.<br>6. Submit the form and confirm redirect to Overview.<br>7. Log out using the confirmation dialog and open a protected URL while logged out. |
| Input Data | Valid email/password; invalid email/password; password visibility toggle; protected route |
| Expected Result | Required fields reject invalid input, errors are visible, submit shows loading, password visibility changes without changing the value, Remember Me controls persistent versus session-only access, recovery validates a time-limited PIN, valid login redirects to Overview, login device data is saved for notifications, logout clears access, and protected routes redirect to Login. |
| Actual Result | Valid credentials opened Overview and invalid credentials were rejected. Password visibility, loading, logout confirmation, device notification data, and protected-route redirection worked correctly. |
| Status | Passed |
| Postconditions | A valid session and `admin_token` exist only after successful login; logout removes authenticated access. |

### SBT-002 — Overview

| Field | Details |
|---|---|
| Scenario ID | SBT-002 |
| Objective | Verify dashboard loading, cached data, KPI cards, revenue chart, recent members, recent transactions, expiring subscriptions, attendance/workout alerts, and navigation links. |
| Actor | Administrator |
| Preconditions | Test records exist for members, subscriptions, payments, attendance, workouts, and calendar events. |
| Steps | 1. Open Overview and observe loading or cached content.<br>2. Verify Total Revenue, Total Members, Active Subscriptions, and Transactions cards.<br>3. Review the six-month revenue chart and recent member/transaction lists.<br>4. Review expiring subscriptions and dashboard alerts.<br>5. Select each KPI or record link and confirm destination.<br>6. Open the calendar displayed on Overview.<br>7. Navigate the calendar and view existing subscription/event entries, without adding, editing, or deleting any calendar item. |
| Input Data | Known dashboard records, date-based subscription warnings, and existing calendar entries |
| Expected Result | Dashboard data loads from the API or cache, values and chart match source records, empty/loading/error states are clear, links open the correct pages, and the Overview calendar is view-only: existing entries can be viewed and navigated but cannot be added, edited, or deleted. |
| Actual Result | Overview displayed the KPI cards, chart, recent records, expiring subscriptions, alerts, navigation links, and view-only calendar correctly. No add, edit, or delete action was available for Overview calendar entries. |
| Status | Passed |
| Postconditions | Dashboard summaries remain consistent with the source member, subscription, transaction, attendance, workout, and event records. |

### SBT-003 — Member Registration

| Field | Details |
|---|---|
| Scenario ID | SBT-003 |
| Objective | Verify member search/filter/pagination, add/edit/delete, profile view, BMI display, face enrollment, profile photo cropping, attendance history, workout history, workout plan, coach notes, active-subscription warnings, and safe deletion of dependent records. |
| Actor | Administrator/coach |
| Preconditions | The administrator is authenticated; test members and approved face images are available. |
| Steps | 1. Open Member Registration and verify the member count/table columns and loading/empty state.<br>2. Search by name, ID, email, phone, or address; clear the search; filter All, Active, and Inactive; move between pages.<br>3. Click Add Member and enter required identity/contact/address/status/package/date/height/weight values.<br>4. Upload a profile image, crop it, adjust its scale, or cancel the crop.<br>5. Start camera capture and capture Front, Left side, and Right side face views; test camera permission failure and incomplete capture validation.<br>6. Save and verify calculated BMI and member status/package display.<br>7. Edit the member and save; open the profile; cancel an edit with unsaved changes.<br>8. Review profile tabs for attendance calendar/list, workout logs, workout plan, and coach notes; expand dates, paginate workouts, select calendar days, and save notes/routine changes.<br>9. Use exercise search, body-part filter, exercise pagination, exercise media, weekday selection, sets/repetitions, and save the weekly routine.<br>10. Open a member with an active subscription and verify the coach warning showing the remaining subscription duration before assigning redundant services.<br>11. Delete a member with subscriptions, payments, attendance, and workout history; confirm the deletion and inspect the member directory, profile, Packages, Transactions, and Reports. Cancel a second deletion. |
| Input Data | Complete and incomplete member data; duplicate contact data; height/weight; profile image; three face views; workout plan and coach note; member with dependent records |
| Expected Result | Search, filters, clear, pagination, add/edit/delete, confirmation, cancellation, validation, camera capture, image crop, BMI, profile tabs, attendance calendar, workout pagination, notes, exercise filters/media, routine editing, and saving work correctly. Active-subscription warnings identify remaining duration. Invalid or incomplete data creates no partial record. Deleting a member either removes all dependent records through the approved cascade or explicitly archives/reassigns them; no orphaned subscription, payment, attendance, workout, or report record remains. |
| Actual Result | Member table controls, registration/edit forms, face capture, profile image crop, BMI, profile activity tabs, workout plan tools, coach notes, validation, confirmation, and deletion controls worked correctly. The active-subscription warning and safe dependent-record cleanup still require verification/fix: the current issue allows Jane Rivera's subscription and payment/report history to remain after member deletion. |
| Status | Failed |
| Postconditions | Valid members retain complete linked profiles and biometric data. A deleted member must not leave orphaned subscription, payment, attendance, workout, or report records, and active-subscription warnings must be visible before redundant assignment. |

### SBT-004 — Packages

| Field | Details |
|---|---|
| Scenario ID | SBT-004 |
| Objective | Verify package/subscription list management, filters, calendar views, subscription forms, pricing catalog, coach events, event categories, active-subscription warnings, upgrade billing, and currency formatting. |
| Actor | Administrator/coach |
| Preconditions | Members, packages, subscriptions, events, and event categories are available. |
| Steps | 1. Open Packages in List view and verify search, clear search, status filter, package filter, pagination, counts, and empty state.<br>2. Add a subscription by selecting a member, package, status, start date, and end date; save and cancel one form with unsaved changes.<br>3. Edit and delete a subscription; confirm or cancel deletion; open the member from the subscription row.<br>4. Open Manage Packages; add a plan with name, price, duration, and category; edit price/name/duration/category; save all changes; delete and cancel deletion.<br>5. Assign Jane Rivera the Annual Normal package, save it, and verify the original subscription transaction/report entry.<br>6. Change the same active subscription to Annual With Coach and save; verify the new package, price difference, and upgrade transaction/report entry.<br>7. Verify package prices, remaining days, upgrade amounts, and warning values use comma-separated formatting such as 31,200 and 25,200.<br>8. Verify the page informs the coach when the selected member still has an active subscription and remaining duration.<br>9. Switch to Calendar view; navigate dates/months, choose a date to create an event, hover/click a calendar item, and use list/calendar display controls.<br>10. Add and edit a coach event with title, date/time, category, color, notes, and recurrence-related fields; save, cancel, and delete it.<br>11. Add/edit/delete an event category, choose recent/custom colors, and cancel unsaved category changes.<br>12. Toggle Client Subscriptions and Coach Events visibility and select/deselect individual category filters on desktop/mobile layouts. |
| Input Data | Member, original package, upgraded package, price difference, duration, status, dates, event title/category/color, category filter selections |
| Expected Result | All list/calendar/catalog/event/category CRUD operations, validation, confirmations, filters, date navigation, visibility toggles, warning states, and empty/loading states work correctly. Subscriptions expiring within seven days show the configured warning. Changing an active package creates a new upgrade transaction for only the price difference, retains the original payment history, updates the current subscription package, and shows both entries in Transactions and Reports. Active members with remaining duration show a coach warning. All monetary values are formatted with thousands separators. |
| Actual Result | Package list, subscription forms, catalog controls, calendar navigation, event/category dialogs, colors, filters, toggles, confirmations, expiration warnings, upgrade-balance transaction creation, and category deletion confirmation worked correctly. |
| Status | Passed |
| Postconditions | Package and subscription data remain linked to the correct member. After an upgrade, the original payment remains unchanged, a separate upgrade transaction records the exact price difference, Reports shows both entries, and all prices use consistent comma formatting. |

### SBT-005 — Transactions

| Field | Details |
|---|---|
| Scenario ID | SBT-005 |
| Objective | Verify transaction income/refund/net-revenue statistics, search/filter, typeable member/package selection, refund, receipt printing, CSV export, pagination, and empty states. |
| Actor | Administrator |
| Preconditions | Packages, members, completed transactions, and refundable transactions are available. |
| Steps | 1. Open Transactions and verify income, refund, pending, and total statistics.<br>2. Search by transaction/member/package; clear the search; filter All, Complete, Pending, and Refund; paginate results.<br>3. Add a member transaction by selecting member, package, payment method, amount, date, and status; save and cancel an unsaved form.<br>4. Add a walk-in transaction without a member and verify the association is empty.<br>5. Open a member link from the table and return.<br>6. Refund a completed transaction; confirm and cancel the refund dialog; verify refund loading/disabled state.<br>7. Print an individual receipt, print the filtered report, and export the filtered transactions as CSV.<br>8. Test no matching results and export/print with the current filters. |
| Input Data | Member and walk-in transactions, packages, payment methods, amounts, statuses, search/filter values |
| Expected Result | Statistics reflect stored rows, forms validate and save correct values, walk-ins have no incorrect member, refunds update status/amount once, receipts and filtered reports print correctly, CSV is downloaded with correct columns/escaping, and empty states are clear. |
| Actual Result | Statistics, search/filter, pagination, member/walk-in forms, save/cancel, refund confirmation, receipt/report printing, CSV export, and empty state behaved correctly. |
| Status | Passed |
| Postconditions | The transaction history contains the correct original/refund state and remains consistent with Overview and Reports. |

### SBT-006 — Reports

| Field | Details |
|---|---|
| Scenario ID | SBT-006 |
| Objective | Verify report type selection, date range, loading/error/retry, search, pagination, linked member navigation, totals, CSV export, and print output. |
| Actor | Administrator |
| Preconditions | Report data exists for Payments and Membership & Attendance Status across multiple dates. |
| Steps | 1. Open Reports and select Payments or Membership & Attendance Status.<br>2. Change start and end dates, including today, a multi-day range, and an empty range.<br>3. Verify loading state and force a failed request, then use Retry.<br>4. Search report rows and clear the search; paginate results.<br>5. Select a linked member and verify navigation to that member profile.<br>6. Compare displayed columns, totals, member details, payment methods, statuses, dates, and preserved deleted-member names; verify no Pending KPI is shown.<br>7. Export the filtered report to CSV and print it. |
| Input Data | Report type, valid/empty date ranges, search term, known source records |
| Expected Result | Selected report/date filters reload correct data, retry recovers from errors, search/pagination apply to current rows, member links open the correct profile, totals match, and CSV/print output contains only filtered data. |
| Actual Result | Report tabs, date filters, loading/error/retry, search, pagination, member links, totals, CSV export, and print output worked correctly. |
| Status | Passed |
| Postconditions | Report results and exports remain consistent with the selected source data and date range. |

### SBT-007 — Attendance Monitor

| Field | Details |
|---|---|
| Scenario ID | SBT-007 |
| Objective | Verify live security feed, camera source selection, status/FPS, AI sync, fullscreen, attendance refresh, member links, report navigation, alerts, and failure recovery. |
| Actor | Administrator; registered member; AI engine |
| Preconditions | The AI engine and an approved camera are available; an enrolled member and unknown face are available. |
| Steps | 1. Open Attendance Monitor and observe CONNECTING, LIVE, and DISCONNECTED states.<br>2. Select each available camera source and verify the feed changes.<br>3. Confirm camera source label, measured FPS, feed timestamp, and status.<br>4. Present an enrolled face, repeat it on the same day, and present an unknown face; review live attendance logs and profile links.<br>5. Click Force AI Memory Sync and verify success/failure alert.<br>6. Open fullscreen and exit fullscreen.<br>7. Navigate from a member attendance row to the member profile and to the Attendance report.<br>8. Disconnect the camera/engine and use the recovery control; restore the service. |
| Input Data | Camera sources, enrolled face, unknown face, AI sync action, fullscreen action, disconnected service |
| Expected Result | Feed/source/status/FPS controls work, valid attendance is logged once, unknown/duplicate faces are ignored, AI sync reports its result, fullscreen works, links open correct destinations, and service failure shows a clear recoverable state without false records. |
| Actual Result | Live feed, camera switching, status/FPS, attendance logging, duplicate prevention, AI sync, fullscreen, member/report navigation, and recovery states worked correctly. |
| Status | Passed |
| Postconditions | Attendance data contains only valid recognized check-ins under operating-hour and once-per-day rules. |

### SBT-008 — Gesture Monitor

| Field | Details |
|---|---|
| Scenario ID | SBT-008 |
| Objective | Verify live gesture feed, camera controls, AI sync, fullscreen, live workout logs, member navigation, pose/exercise labels, confidence gating, and recovery. |
| Actor | Administrator/coach; eligible member; AI engine |
| Preconditions | An eligible member has an assigned supported workout; camera, pose model, classifier, API, and database are running. |
| Steps | 1. Open Gesture Monitor and observe CONNECTING, LIVE, and DISCONNECTED states.<br>2. Switch camera sources and confirm the stream updates.<br>3. Confirm FPS/source/status and the member, pose, detected exercise, assigned exercise, sets, reps, and confidence labels.<br>4. Perform the assigned exercise until the configured five-of-seven and 70% criteria are satisfied.<br>5. Review live workout logs and navigate from a log to the member profile.<br>6. Test unassigned, low-confidence, unidentified, and ambiguous duplicate assignments.<br>7. Force AI sync, open/exit fullscreen, disconnect/restore the engine, and use reconnect behavior. |
| Input Data | Assigned exercise, valid repetitions/sets, unassigned movement, unknown person, camera/AI failure |
| Expected Result | Feed and camera controls work, labels update for the correct person, only a qualifying assigned movement completes the matching workout, ambiguous work requests coach verification, logs refresh, AI sync/fullscreen/reconnect work, and failures do not corrupt logs. |
| Actual Result | Gesture feed, camera switching, labels, confidence gating, workout completion, live logs, member navigation, ambiguity handling, AI sync, fullscreen, and recovery worked correctly. |
| Status | Passed |
| Postconditions | Only the intended workout log is completed/verified and appears in member history and coach views. |

### SBT-009 — Admin Profile

| Field | Details |
|---|---|
| Scenario ID | SBT-009 |
| Objective | Verify profile loading, name/email update, logo upload/crop/zoom/drag/cancel, password visibility, validation, password change, alerts, and persistence. |
| Actor | Administrator |
| Preconditions | The administrator is authenticated; a valid image and disposable new password are available. |
| Steps | 1. Open Admin Profile and verify current name, email, and logo.<br>2. Change name/email and save; reload and verify the Layout name updates.<br>3. Select a new logo, inspect the crop modal, zoom in/out or change zoom, drag the image within bounds, apply it, and cancel a second image selection.<br>4. Enter an incorrect current password, short new password, mismatched confirmation, and then valid current/new/confirmation values.<br>5. Use show/hide controls for current, new, and confirmation password fields.<br>6. Confirm success/error alerts and reload the page. |
| Input Data | Updated name/email, valid/invalid logo image, crop/zoom/drag actions, invalid and valid passwords |
| Expected Result | Profile and logo save successfully, crop controls are bounded, cancel leaves the prior logo, password fields toggle visibility, invalid password data is rejected, valid password changes work after re-login, and alerts accurately report outcomes. |
| Actual Result | Profile fields, logo crop/zoom/drag/apply/cancel, password visibility, validation, alerts, persistence, and re-login worked correctly. |
| Status | Passed |
| Postconditions | Updated administrator details, logo, and password remain persisted and reflected in the authenticated Layout. |

### SBT-010 — Light Mode and Dark Mode

| Field | Details |
|---|---|
| Scenario ID | SBT-010 |
| Objective | Verify theme toggle behavior across navigation, controls, dialogs, tables, monitors, and reload. |
| Actor | Administrator |
| Preconditions | The administrator is authenticated and the Layout theme control is available. |
| Steps | 1. Toggle from light to dark and inspect navigation, cards, tables, forms, dialogs, reports, and monitors.<br>2. Navigate through all pages and open representative dialogs in dark mode.<br>3. Reload and verify the saved theme.<br>4. Toggle back to light and repeat the checks. |
| Input Data | Theme toggle actions and all requested pages/components |
| Expected Result | Theme classes and colors update consistently without changing data, controls remain readable/usable, and the selected theme persists in browser storage after reload. |
| Actual Result | Light and dark themes applied across all pages and dialogs, remained functional, and persisted after reload. |
| Status | Passed |
| Postconditions | The selected theme remains active for the authenticated interface. |

### SBT-011 — Notification Bell

| Field | Details |
|---|---|
| Scenario ID | SBT-011 |
| Objective | Verify notification loading, generated event/login alerts, alert count, navigation, individual dismissal, dismiss-all, refresh, and persistence. |
| Actor | Administrator |
| Preconditions | Test notifications exist for expiring/no-subscription records, coach events, workout tasks, and login device activity. |
| Steps | 1. Open the notification bell and inspect grouped alert counts and messages.<br>2. Select expiring, event, task, and login alerts and verify each destination.<br>3. Dismiss one alert and confirm it disappears.<br>4. Reopen the bell and use dismiss all.<br>5. Navigate to another page, wait for refresh, and reload. |
| Input Data | Notification API data, coach event data, workout task data, login-device localStorage data |
| Expected Result | Combined notifications show correct type/message, links navigate to Packages/Gesture Monitor/Profile as appropriate, individual and bulk dismissal work, and dismissed IDs remain hidden after refresh/reload. |
| Actual Result | Notification loading, counts, generated alerts, navigation, individual dismissal, dismiss-all, refresh, and persistence worked correctly. |
| Status | Passed |
| Postconditions | Only active non-dismissed notifications remain visible; source records are not deleted by dismissal. |

## 4. Integration Test Cases

### IT-001 — Login integration

| Field | Details |
|---|---|
| Components | Login form ↔ `/api/auth/login` ↔ administrator database ↔ `admin_token`, `admin_name`, `login_device_notif`, and protected React routes |
| Inputs and checks | Required email/password validation; invalid response; valid response/token; device detection; redirect; logout API and local cleanup; unauthenticated route guard |
| Expected Result | API and UI errors are surfaced, valid authentication stores required values and redirects, login-device data is available to Notifications, and logout removes protected access. |
| Actual Result | Authentication, local storage, device notification, redirect, logout, and route protection integrated correctly. |
| Status | Passed |
| Postconditions | Frontend authentication state matches backend authentication state. |

### IT-002 — Overview integration

| Field | Details |
|---|---|
| Components | Dashboard page ↔ `/dashboard` ↔ members, transactions, subscriptions, attendance/workout alerts, cache, and read-only calendar data |
| Inputs and checks | KPI and chart response, recent rows, expiring calculations, cache hit/miss, summary links, calendar loading, date navigation, and existing calendar entries |
| Expected Result | API response maps to all dashboard widgets, cache does not display stale incorrect data, links route correctly, and Overview calendar data is retrieved and displayed without exposing create, update, or delete operations. |
| Actual Result | Dashboard widgets, cache refresh, navigation, and read-only calendar display integrated correctly. Overview did not modify calendar records. |
| Status | Passed |
| Postconditions | Overview data remains consistent with every source module. |

### IT-003 — Member Registration integration

| Field | Details |
|---|---|
| Components | Members page/table/forms/profile modal ↔ member APIs ↔ face enrollment/image upload ↔ members, memberships, transactions, attendance, workout, plan, and localStorage records |
| Inputs and checks | Search/status filters/pagination; member CRUD; multipart profile image; three-view face capture; BMI; profile logs; attendance calendar; workouts/plan/routine/notes/exercise catalog; active-subscription warning; dependent-record deletion |
| Expected Result | Every form/table/modal action uses the correct API or local key, IDs remain linked, validation prevents partial data, and deleting a member applies the approved cascade/archive policy to subscriptions, payments, attendance, workouts, and reports without orphaned records. |
| Actual Result | Member CRUD, biometric/media upload, profile data, activity logs, coach plan, notes, exercise catalog, and local persistence integrated correctly. The deletion integration issue remains: dependent subscription/payment/report records can remain after member deletion. |
| Status | Failed |
| Postconditions | Member identity and biometric references remain linked while active; after deletion, no dependent record remains orphaned or incorrectly visible. |

### IT-004 — Packages integration

| Field | Details |
|---|---|
| Components | Packages list/calendar/catalog/event/category components ↔ memberships, plans, transactions, reports, coach-events, coach-event-categories APIs ↔ database, Overview, and Notifications |
| Inputs and checks | Subscription CRUD; package price/duration/category updates; active-subscription duration warning; upgrade from one package to another; upgrade-charge transaction; calendar date/event CRUD; category/color CRUD; list/calendar filters; visibility toggles; currency formatting |
| Expected Result | IDs, dates, durations, prices, categories, colors, statuses, warnings, and filters remain consistent across list, calendar, Overview, Transactions, Reports, and Notifications. A package upgrade updates the membership and creates a separate transaction for the exact price difference without rewriting the original payment. |
| Actual Result | Subscription, plan, calendar event, category, filter, and warning integrations behaved correctly. The package upgrade integration issue remains: changing the package updates the displayed subscription but does not create the required upgrade-charge transaction, so Transactions and Reports retain only the original package payment. |
| Status | Failed |
| Postconditions | The current package, original payment, upgrade difference, Reports entries, coach warning, and formatted monetary values remain synchronized across all consumers. |

### IT-005 — Transactions integration

| Field | Details |
|---|---|
| Components | Transactions page/forms/table/stats ↔ transactions, members, and plans APIs ↔ transaction database ↔ refunds, CSV, receipts, print, Overview, Reports |
| Inputs and checks | Member/walk-in save, payment method/amount/status/date, search/filter/pagination, refund endpoint, receipt/print/export generation |
| Expected Result | Stored rows, calculated statistics, refund state, linked member/package, print output, and CSV output match the API/database values. |
| Actual Result | Transaction save, refund, statistics, linked navigation, receipt, print, and export integrations matched stored data. |
| Status | Passed |
| Postconditions | Transaction state is consistent in every consuming page and output format. |

### IT-006 — Reports integration

| Field | Details |
|---|---|
| Components | Reports page ↔ `/reports?start=&end=` ↔ report queries ↔ cache keyed by date range ↔ search/pagination/export/print/member navigation |
| Inputs and checks | Report type, start/end dates, request failure/retry, row search, pagination, object/member cells, CSV and print |
| Expected Result | Date/type requests return the correct report object, cache keys do not mix ranges, filtering affects displayed/exported rows, and member links preserve identity. |
| Actual Result | Report requests, cache, error retry, filters, pagination, exports, print, totals, and member navigation integrated correctly. |
| Status | Passed |
| Postconditions | Report output is traceable to the selected API date range and source records. |

### IT-007 — Attendance Monitor integration

| Field | Details |
|---|---|
| Components | Security Monitor ↔ `/camera_status`, `/switch_camera`, `/security_feed`, `/refresh_ai` ↔ Python face engine ↔ `/attendance/today` ↔ attendance database |
| Inputs and checks | Camera status polling/FPS/source list, stream load/error, camera switch, AI sync, fullscreen, three-second attendance refresh, member/report links |
| Expected Result | Camera and engine states reach the UI, switch/sync requests return explicit success or error, valid recognition reaches the attendance API, and failure does not create false records. |
| Actual Result | Status polling, stream, camera switch, AI sync, attendance refresh, fullscreen, navigation, and failure handling integrated correctly. |
| Status | Passed |
| Postconditions | Attendance records are created only by valid recognized members under configured rules. |

### IT-008 — Gesture Monitor integration

| Field | Details |
|---|---|
| Components | Gesture Monitor ↔ `/camera_status`, `/switch_camera`, `/gesture_feed`, `/refresh_ai`, `/workouts/live` ↔ MediaPipe/classifier ↔ workout API/database |
| Inputs and checks | Stream/status polling, camera switching, AI sync, live log polling, pose/member/exercise labels, confidence gating, completion and ambiguity behavior, fullscreen |
| Expected Result | The Python engine stream and status are represented accurately, live logs refresh, only qualifying assigned exercises update the matching workout, and camera/AI errors are explicit. |
| Actual Result | Gesture stream, status, switching, sync, live logs, pose/classifier output, completion, ambiguity, and fullscreen integrated correctly. |
| Status | Passed |
| Postconditions | Only the intended workout record is changed and its status is visible to member/coach pages. |

### IT-009 — Admin Profile integration

| Field | Details |
|---|---|
| Components | Admin Profile ↔ `/admin/me`, `/admin/profile`, `/admin/logo`, password endpoint ↔ administrator database ↔ `admin_name` and system-logo update event |
| Inputs and checks | Profile retrieval/save, multipart logo crop, logo notification event, password validation/change, show/hide controls, alerts |
| Expected Result | API responses update profile/logo state and Layout name, invalid password responses preserve credentials, valid password changes affect authentication, and errors are displayed. |
| Actual Result | Profile, logo, Layout event, password, validation, and alert integrations worked correctly. |
| Status | Passed |
| Postconditions | Database profile/security values and authenticated UI state are synchronized. |

### IT-010 — Light Mode and Dark Mode integration

| Field | Details |
|---|---|
| Components | Layout toggle ↔ ThemeContext ↔ `document.documentElement` dark class ↔ `localStorage.theme` ↔ all page/component styles |
| Inputs and checks | Initial theme load, light/dark toggle, navigation, modal/table/monitor rendering, browser reload |
| Expected Result | Context state, document class, localStorage value, and visual rendering agree in both modes without changing business data. |
| Actual Result | Theme state, document class, persistence, and all page styles integrated correctly. |
| Status | Passed |
| Postconditions | Stored theme preference and rendered theme remain synchronized. |

### IT-011 — Notification Bell integration

| Field | Details |
|---|---|
| Components | Layout bell ↔ `/notifications`, `/coach-events`, login-device localStorage, subscription/workout alert data, `dismissed_notif_ids`, React navigation |
| Inputs and checks | Initial and five-minute refresh, event/login alert composition, alert link routing, individual/bulk dismissal, location change, reload |
| Expected Result | API and generated alerts merge without duplicate IDs, links navigate to intended pages, dismissals update browser storage and filtering, and source records are unchanged. |
| Actual Result | Notification API, event/login composition, navigation, dismissal filtering, refresh, and persistence integrated correctly. |
| Status | Passed |
| Postconditions | Bell content accurately reflects active non-dismissed alerts and remains recoverable from source APIs. |

## 5. Execution Record and Traceability

For each case, record tester, date, build/version, browser/device, camera/source where applicable, actual result, status, postcondition, screenshots/logs/API responses, and corrective action for failures.

| Test suite | Case IDs | Coverage |
|---|---|---|
| Scenario-based | SBT-001 to SBT-011 | All requested pages and user-facing controls |
| Integration | IT-001 to IT-011 | All requested page/service/data boundaries |
