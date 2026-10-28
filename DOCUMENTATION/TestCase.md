# System Test Cases

## 1. Purpose and Scope

This document defines functional test cases for the Camera-Based Gym Management System for Double Alpha Fitness Gym. The cases cover administrator access, dashboard, members, biometric attendance, packages and subscriptions, coach events, transactions, reports, workout monitoring, and administrator profile settings.

The test-case columns follow the supplied sample document: **TestCaseID**, **TestScenario**, **Test_Steps**, **TestData**, **ExpectedResults**, **ActualResults**, and **Status**.

## 2. Test Notes

- Execute these cases in the team's approved test environment using authorized test accounts and non-production data.
- Prepare an administrator account, sample members, package plans, subscriptions, transactions, and camera/AI services as needed for each scenario.
- Do not put real passwords, personal information, or biometric images in this document. Use test records and approved test images.
- The **ActualResults** and **Status** columns are intentionally marked **Not Run**. Record observed results and change the status only after executing each case.
- For camera and AI scenarios, confirm that the relevant camera and AI service are available before running the case. An unavailable service should be recorded as a blocker, not as a pass.
- In the steps below, “admin” means an authenticated Gym Owner/Coach administrator.

## 3. Functional Test Cases

### 3.1 Authentication and Dashboard

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC001 | Log in with valid administrator credentials | 1. Open the login page.<br>2. Enter a valid administrator email and password.<br>3. Select **Log In**. | Valid authorized test administrator account | Authentication succeeds and the administrator is taken to the Overview dashboard. | Not Run | Not Run |
| TC002 | Reject invalid administrator credentials | 1. Open the login page.<br>2. Enter an unregistered email or incorrect password.<br>3. Select **Log In**. | Email: `invalid@example.test`<br>Password: incorrect test value | Login is rejected, a clear error is shown, and protected pages are not opened. | Not Run | Not Run |
| TC003 | Require login fields | 1. Open the login page.<br>2. Leave the email and/or password blank.<br>3. Select **Log In**. | Blank email and/or password | The form does not authenticate and indicates the required input. | Not Run | Not Run |
| TC004 | Block protected pages after logout | 1. Log in as an admin.<br>2. Select **Log Out**.<br>3. Enter a protected page URL, such as `/members`. | Authenticated test account | The session ends and the user is redirected to login or otherwise prevented from viewing protected content. | Not Run | Not Run |
| TC005 | Display dashboard information | 1. Log in.<br>2. Open **Overview**.<br>3. Compare the displayed KPI cards, recent attendance/activity, and notifications with prepared test records. | Existing test members, attendance, subscriptions, and events | Dashboard data loads and reflects the records available for the test environment. | Not Run | Not Run |
| TC006 | Open dashboard notifications | 1. Open **Overview**.<br>2. Open the notification control.<br>3. Review displayed notices. | Test data containing at least one applicable notification, if available | Applicable notifications are displayed with relevant member/event/task context; no unrelated test record is shown. | Not Run | Not Run |

### 3.2 Member Directory and Member Profile

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC007 | Register a member with valid information | 1. Open **Member Registration**.<br>2. Select **Add New Member**.<br>3. Enter valid member information and optional measurements.<br>4. Add an approved test profile/face image if required for the scenario.<br>5. Save the member. | Unique test first and last name; valid test contact details; height and weight within accepted ranges | The member is saved, appears in the directory, and the system shows a success confirmation. BMI is calculated when measurements are supplied. | Not Run | Not Run |
| TC008 | Reject incomplete member registration | 1. Open **Add New Member**.<br>2. Leave a required field blank or enter invalid data.<br>3. Attempt to save. | Missing required name or malformed field value | The form/API rejects invalid input, explains the validation issue, and does not create a partial member record. | Not Run | Not Run |
| TC009 | Search for a member | 1. Open **Member Registration**.<br>2. Enter a known test member name in search.<br>3. Review the results. | Name of a seeded test member | Matching member records are displayed; non-matching records are excluded. | Not Run | Not Run |
| TC010 | View a member profile and history | 1. Find a test member in the directory.<br>2. Open the member profile.<br>3. Review profile details, attendance history, and workout information. | Member with prepared attendance/workout records | The profile shows the selected member's information and corresponding available records. | Not Run | Not Run |
| TC011 | Update a member profile | 1. Open a member profile.<br>2. Select **Edit Member Profile**.<br>3. Change a non-unique field such as phone or address.<br>4. Save and reopen the profile. | Existing test member; updated test contact value | The update is saved and displayed in the member profile and directory. | Not Run | Not Run |
| TC012 | Delete a member | 1. Open the member directory.<br>2. Choose delete for a designated disposable test member.<br>3. Confirm the action.<br>4. Search for the member again. | Disposable test member with no production data | The member is deleted or removed according to system behavior, a success confirmation is shown, and the deleted record is no longer listed. | Not Run | Not Run |

### 3.3 Packages, Subscriptions, and Coach Events

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC013 | Create a package plan | 1. Open **Packages** and select **Manage Packages**.<br>2. Select **New Package**.<br>3. Enter a unique name, valid price, duration, and package category.<br>4. Save. | Name: `QA Monthly Plan`<br>Positive price and duration; test category | The plan is saved and appears in Manage Packages and the relevant package selector. | Not Run | Not Run |
| TC014 | Reject invalid package data | 1. Open **New Package**.<br>2. Enter a blank name, invalid/negative price, or invalid duration.<br>3. Attempt to save. | Blank name or negative/non-numeric price | Invalid plan data is rejected with validation feedback and is not added to the package list. | Not Run | Not Run |
| TC015 | Update a package plan | 1. Open **Manage Packages**.<br>2. Choose **Edit** for a disposable test plan.<br>3. Change its name or price and save.<br>4. Reopen the plan. | Existing QA plan; changed test price/name | The updated values are saved and shown consistently in the package list and selectors. | Not Run | Not Run |
| TC016 | Assign a subscription to a member | 1. Open **Subscriptions**.<br>2. Select **Add Subscription**.<br>3. Select a test member and eligible subscription plan.<br>4. Enter payment method and start date.<br>5. Save. | Existing test member; eligible subscription plan; valid date | A subscription is saved for the selected member and plan; its end date is calculated from the plan duration and it appears in the subscription list/calendar as applicable. | Not Run | Not Run |
| TC017 | Reject subscription without required selections | 1. Open **Add Subscription**.<br>2. Leave the member or plan unselected, or omit another required value.<br>3. Attempt to save. | Missing member or plan selection | The subscription is not saved and the required input is identified. | Not Run | Not Run |
| TC018 | Edit a subscription | 1. Find a disposable test subscription.<br>2. Open its edit action.<br>3. Change an allowed field and save.<br>4. Reopen the subscription. | Existing QA subscription and valid updated value | The subscription change is saved and displayed for the correct member. | Not Run | Not Run |
| TC019 | Filter subscriptions by category/status | 1. Open the subscription list or calendar.<br>2. Apply an available filter.<br>3. Compare results with seeded test records. | Test subscriptions across available categories/statuses | Only records matching the selected filter are shown; clearing the filter restores the applicable set. | Not Run | Not Run |
| TC020 | Schedule a coach event | 1. Open **Packages** and the Coach Events calendar.<br>2. Select **Schedule Coach Event**.<br>3. Enter a title, category, date/time, and other required details.<br>4. Save. | QA event title; valid upcoming date/time; existing category | The event is saved and shown on the correct calendar date with its selected category/color. | Not Run | Not Run |
| TC021 | Reject an incomplete coach event | 1. Open **Schedule Coach Event**.<br>2. Leave the required title or date/time blank.<br>3. Attempt to save. | Missing required event field | The event is not saved and validation feedback is shown. | Not Run | Not Run |
| TC022 | Edit and delete a coach event | 1. Create a disposable QA event.<br>2. Edit its title or date and save.<br>3. Confirm the updated event is shown.<br>4. Delete the QA event and confirm. | Disposable QA event | Event changes persist; after confirmed deletion, the event is removed from the calendar/list. | Not Run | Not Run |
| TC023 | Rename a coach-event category | 1. Open the event category selector/history.<br>2. Edit a disposable test category name.<br>3. Save and inspect events using that category. | QA category and new unique category name | The category name is updated and remains selectable; related event labeling follows the application's category update behavior. | Not Run | Not Run |

### 3.4 Transactions, Refunds, and Exports

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC024 | Record a subscription transaction | 1. Open **Transactions**.<br>2. Select **Record Transaction**.<br>3. Select a test member and subscription package.<br>4. Enter a valid amount, payment method, and optional reference/description.<br>5. Save. | Test member; subscription plan; positive amount; Cash or other available method | A transaction is created with a transaction ID, current date when not supplied, completed status, selected member/package, and payment details. | Not Run | Not Run |
| TC025 | Record a walk-in transaction without a member | 1. Open **Record New Transaction**.<br>2. Select a walk-in package.<br>3. Leave member unselected if optional for this package.<br>4. Enter a valid amount and payment method; save. | Walk-In package; no member; positive amount | A completed Walk-In transaction is recorded and displayed with the walk-in guest label. | Not Run | Not Run |
| TC026 | Reject a transaction without a package or valid amount | 1. Open **Record New Transaction**.<br>2. Do not select a package, or enter a non-numeric/invalid amount.<br>3. Attempt to save. | Missing package or invalid amount | The transaction is not recorded; the form or server presents validation feedback. | Not Run | Not Run |
| TC027 | Refund an eligible transaction | 1. Find a positive, completed transaction that has not been refunded.<br>2. Select **Refund** and confirm.<br>3. Review the original and new transaction records. | Eligible QA transaction | The original transaction is marked refunded and a separate completed refund record with a negative amount is created. | Not Run | Not Run |
| TC028 | Reject refund of an ineligible transaction | 1. Find a refunded, pending, refund-type, or non-positive transaction.<br>2. Attempt to refund it. | Ineligible QA transaction | The refund is rejected; no additional refund record is created. | Not Run | Not Run |
| TC029 | Filter and search transactions | 1. Open **Transactions**.<br>2. Choose each applicable type filter and search for a known test member or transaction ID.<br>3. Clear the filters. | Seeded subscription, walk-in, refund transactions and known member/ID | The table displays only records matching the active filter/search; clearing them restores the complete applicable list. | Not Run | Not Run |
| TC030 | Export filtered transactions as CSV | 1. Apply a transaction filter and search term.<br>2. Select **Export CSV**.<br>3. Open the downloaded file in a spreadsheet or text editor. | Test record containing a comma, quotation mark, or newline in a text field if available | A readable CSV downloads with column headings and rows matching all active filters/search, with text fields correctly escaped. | Not Run | Not Run |
| TC031 | Print all matching transactions | 1. Apply a filter/search if desired.<br>2. Select **Print All**.<br>3. Inspect the print preview and cancel printing. | Several test transactions across pages | Print preview contains all records matching the filters, not only the current pagination page, and the displayed totals correspond to the included records. | Not Run | Not Run |

### 3.5 Reports

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC032 | Generate a report for a selected date range | 1. Open **Reports**.<br>2. Select a report type.<br>3. Enter a start and end date that include known test records.<br>4. Review the report table and KPI summary. | Report type: Payments, Memberships, or Attendance; range containing seeded records | The report displays the selected type and records for the requested date range with corresponding summary values. | Not Run | Not Run |
| TC033 | Generate an empty report range | 1. Select a report type.<br>2. Choose a date range with no matching test records.<br>3. Review the page. | Date range without records | The page shows an empty/no-records state without displaying unrelated records or crashing. | Not Run | Not Run |
| TC034 | Search within a report | 1. Open a report containing multiple test records.<br>2. Enter a unique test member/name or value in the report search field.<br>3. Review the rows and count. | Search phrase matching one seeded row | Only matching report rows are shown and the displayed row count updates. | Not Run | Not Run |
| TC035 | Export a filtered report as CSV | 1. Choose a report type and date range.<br>2. Enter a search term if applicable.<br>3. Select **Export CSV**.<br>4. Open the downloaded CSV. | Date range and search matching known test rows | The CSV has column headings and contains the matching report rows, with special characters escaped correctly. | Not Run | Not Run |
| TC036 | Print a report | 1. Choose a report type and date range.<br>2. Apply a search term if desired.<br>3. Select **Print All**.<br>4. Inspect print preview and cancel. | Report with more than one page of matching data if available | Print preview displays the selected report title, date range, summary, and all matching rows across pages. | Not Run | Not Run |

### 3.6 Attendance and Camera Recognition

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC037 | Record attendance for a recognized member | 1. Confirm the AI service and entrance camera are running.<br>2. Use an enrolled test member's approved face image in front of the camera.<br>3. Review the Security Monitor and member attendance history. | Enrolled test member; working camera and AI service | The recognized member is identified and an attendance entry with the current date/time is recorded and displayed. | Not Run | Not Run |
| TC038 | Do not record attendance for an unknown face | 1. Confirm the camera and AI service are running.<br>2. Present an approved test face that is not enrolled.<br>3. Review attendance records. | Non-enrolled test face | The face is treated as unknown and no attendance record is created for any member. | Not Run | Not Run |
| TC039 | Suppress duplicate attendance within cooldown | 1. Record attendance for an enrolled test member.<br>2. Present the same member again within the configured cooldown period.<br>3. Review today's attendance. | Same enrolled member; second recognition within 15 minutes | The repeat recognition does not create a duplicate attendance record during the cooldown period. | Not Run | Not Run |
| TC040 | Handle an unavailable camera source | 1. Open **Security Monitor** or **Gesture Monitor**.<br>2. Make the selected test camera unavailable.<br>3. Observe the page and camera status. | Disconnected test webcam or unavailable test CCTV stream | The page remains usable and shows an unavailable/standby status instead of crashing. | Not Run | Not Run |

### 3.7 Workout Plans, AI Monitoring, and Administrator Profile

| TestCaseID | TestScenario | Test_Steps | TestData | ExpectedResults | ActualResults | Status |
|---|---|---|---|---|---|---|
| TC041 | Assign a workout task to a member | 1. Open the member profile or workout assignment view.<br>2. Select a registered test member and an exercise.<br>3. Set valid sets/repetitions and a permitted date.<br>4. Save the plan. | Test member; supported exercise; sets 1–99; reps 1–999; date today through the next six days | The task is saved for the selected member and appears on the assigned date in the coach training plan. | Not Run | Not Run |
| TC042 | Reject invalid workout task values | 1. Attempt to assign a task with zero/negative sets or reps, unsupported exercise class, or a date outside the permitted range.<br>2. Save. | Invalid set/repetition count or invalid date | Invalid task data is rejected and no invalid task is stored. | Not Run | Not Run |
| TC043 | Prevent duplicate same-day workout task | 1. Assign an exercise to a member for today.<br>2. Assign the same exercise to the same member for today again.<br>3. Review that day's plan. | Same member, exercise, and date | The system prevents duplicate task rows or updates the existing task according to its duplicate-handling behavior. | Not Run | Not Run |
| TC044 | Manually verify a workout log | 1. Open a member profile with an unverified workout log.<br>2. Select its manual verification action.<br>3. Confirm and refresh the log. | Pending test workout log | The selected workout is marked verified/completed and the updated status persists after refresh. | Not Run | Not Run |
| TC045 | Verify an AI-detected workout completion | 1. Confirm the Gesture Monitor, camera, and AI model are running.<br>2. Assign a supported exercise to a test member eligible for AI monitoring.<br>3. Perform the exercise within camera view until the configured completion criteria are met.<br>4. Review the workout log. | Eligible test member; assigned supported exercise; working camera/AI services | A completed workout is logged and matched to the assigned task; incomplete movements do not count as a completed task. | Not Run | Not Run |
| TC046 | Update administrator profile details | 1. Open **Profile**.<br>2. Change a permitted profile field.<br>3. Save and reload the page. | Authorized admin; non-sensitive test profile value | The profile update is saved and displayed after reload. | Not Run | Not Run |
| TC047 | Reject an incorrect current password when changing password | 1. Open **Profile** security settings.<br>2. Enter an incorrect current password and a valid-format new password.<br>3. Submit the change. | Incorrect current password; test-only new password | The password change is rejected and the existing password remains valid. | Not Run | Not Run |
| TC048 | Change administrator password with valid inputs | 1. Open **Profile** security settings.<br>2. Enter the correct current password and matching valid new password/confirmation.<br>3. Submit.<br>4. Log out and log in using the new password. | Authorized test account; test-only new password meeting configured rules | The password is updated; the new password authenticates successfully and the former password no longer authenticates. | Not Run | Not Run |

## 4. Test Result Recording

For each test case, replace **ActualResults** with the observed behavior and update **Status** to one of the following:

- **Passed** — actual behavior matches the expected result.
- **Failed** — actual behavior differs from the expected result; include evidence and create a defect report.
- **Blocked** — the case could not be executed because a required dependency, account, camera, AI service, or test data was unavailable.
- **Not Run** — execution has not started.

Record the tester, execution date, build/version, and supporting evidence in the team's test execution record. Do not mark a case as passed based only on the expected behavior written here.