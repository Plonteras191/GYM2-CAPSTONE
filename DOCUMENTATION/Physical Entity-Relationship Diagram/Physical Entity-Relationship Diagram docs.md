# 4.2-F Physical Entity-Relationship / Database Diagram

This section presents the **Physical Entity-Relationship Diagram (Database Diagram)** for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros.ph Fitness Gym**.

> **Updated November 17, 2026** to match the database and the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

---

## 1. Introduction (INTRODUCE)

A **Physical Entity-Relationship Diagram (Physical ERD)** translates the logical data model into the schema of a specific database management system, here **MySQL**. The logical ERD says what data the business needs; the physical ERD says how it is stored, keyed and constrained.

Its purpose is **data integrity and referential consistency**: primary keys, foreign keys with set-to-empty or cascade rules, unique rules, data types and indexes keep the records accurate and auditable across the member, attendance, subscription, payment and workout functions.

---

## 2. Presentation of the Diagram (PRESENT)

Figure 4.10 illustrates the Physical Entity-Relationship Diagram of the system. It shows the 13 tables the application uses, their columns and types, their keys and their relationships, as created by the Laravel migrations.

[Insert Figure 4.10 Here]

**Figure 4.10.** Physical Entity-Relationship Diagram for Muscle Bros.ph Fitness Gym.

---

## 3. Detailed Discussion of Tables, Fields, and Relationships (EXPLAIN)

The physical database is organized into **thirteen tables**.

### A. Accounts and Members
1. **`admins`:** the administrator account (`name`, `email`, `password`, `logo_path`). The email is unique and the password is stored as a bcrypt hash. The gym owner and the coach share this account.
2. **`password_reset_pins`:** one emailed PIN per administrator email (`pin_hash`, `attempts`, `expires_at`, `verified_at`). A PIN lasts 10 minutes and allows 5 wrong tries. It is linked to `admins` by email, without a foreign key.
3. **`personal_access_tokens`:** the Laravel Sanctum login tokens, created at login and deleted at logout.
4. **`members`:** the central table: contact details (`first_name`, `last_name`, `email`, `phone`, `address`), body measurements (`dob`, `height`, `weight` as DECIMAL(5,2), and `body_type`), `status` (Active or Inactive) with `status_updated_at`, and the face reference `enrolled_face_id` (the path of a private image file) with `biometric_consent_at`, the date the member agreed to face enrollment.

### B. Packages and Subscriptions
5. **`plans`:** the packages the gym sells (`name`, `price` DECIMAL(9,2), `duration_days`, `category`, `color`). The `category` (normal, with_coach, walk_in) decides what a package unlocks: a With Coach package makes the member eligible for the training plan and camera tracking.
6. **`package_categories`:** names and colours of older custom categories.
7. **`memberships`:** a member's subscription (`start_date`, `end_date`, `status`, `payment_method`). `member_id` is a foreign key set to empty when the member is deleted. `plan_id` has no foreign key; the subscription also keeps the package name (`plan_type`) and the member's name, email and picture as they were, so history is still readable after a deletion. A renewal of a running subscription moves `end_date` forward. `status` can be Paused, with `paused_at` holding the day the pause started.

### C. Attendance and Program Monitoring
8. **`attendances`:** one check-in per member per day (unique on `member_id` and `date`). It records how the check-in was made (`source`: face or manual), the camera, the face match distance, and what was true that day (`subscription_status`, `plan_snapshot`), plus whether it set an Inactive member back to Active. A manual check-in also keeps the administrator and the reason. The member is a foreign key set to empty on deletion, so attendance history survives.
9. **`workout_logs`:** the training plan and its results. A task is created with the exercise name prefixed "ASSIGNED: ", with `sets` and `reps` targets and the camera class `gesture_class`. When it is verified, `counted_reps` holds the repetitions the camera counted, and `verified_by` (ai or coach) and `verified_at` say who verified it and when. The member is a foreign key, and the logs are deleted with the member.

### D. Classes and Events
10. **`coach_event_categories`** and 11. **`coach_events`:** classes and events (title, dates, times, location) grouped by a category with a colour. A category cannot be deleted while events use it.

### E. Financial Audit Trail
12. **`transactions`:** the payment ledger: a unique receipt code `transaction_id` (for example TXN-001), `transaction_date`, `type` (subscription payment, upgrade, renewal, walk-in), `amount` DECIMAL(10,2), `payment_method` (Cash, GCash, Maya) and `reference_number`. It has two optional foreign keys, `member_id` (empty for a walk-in guest) and `membership_id`, plus snapshots of the member and package, so receipts and reports keep their original details.
13. **`membership_pauses`:** one row per pause of a subscription (`paused_on`, `resumed_on`, `days`, `paused_by_admin_id`, `resumed_by_admin_id`), with `membership_id` as a foreign key deleted together with the subscription. The gym gives no refunds: a subscription is paused instead, and on resume the paused days are added to `memberships.end_date`.

---

## 4. Analytical Interpretation and Indexing (INTERPRET)

* **Integrity that matches the business:** history is protected by set-to-empty rules plus snapshots: deleting a member keeps their attendance and payments (with the name), while their workout plan goes with them.
* **The one missing foreign key:** `memberships.plan_id` has none. The application protects the link instead: a package is not deleted while members are subscribed to it, and an ended subscription keeps its package name.
* **Indexes** on the columns the screens filter by: `members` (`status`, `created_at`); `memberships` (`status`, `member_id`, `end_date`, `created_at`); `transactions` (`transaction_date`, `member_id`, `membership_id`, `status`); `attendances` (`date`, `member_id`); `workout_logs` (`member_id`); `coach_events` (`category_id`). They keep lists and reports fast.

---

## 5. Connection to Development and Deployment Phases (CONNECT)

This diagram fulfills **Specific Objective (b)** and closes the system-modeling activities of the design phase. The tables, fields and constraints are the foundation for the Laravel models, controllers and migrations built in development, and for the database test cases (unique check-in per day, deletion rules, pause and renewal records) in testing.
