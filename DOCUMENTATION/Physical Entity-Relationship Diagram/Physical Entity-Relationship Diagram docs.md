# 4.2-F Physical Entity-Relationship / Database Diagram

This section presents the **Physical Entity-Relationship Diagram (Database Diagram)** for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym**.

---

## 1. Introduction (INTRODUCE)

A **Physical Entity-Relationship Diagram (Physical ERD)** translates the conceptual data model into an implementation-level schema tailored to a specific database management system—in this project, **MySQL**. While the logical ERD defines what data the business requires, the physical ERD defines how that data is physically stored, indexed, and constrained.

The primary purpose of the Physical ERD is to ensure **data integrity, eliminate undesirable data redundancy, and maintain strict referential consistency** among related records. By enforcing primary keys, foreign key constraints (such as cascade and null-on-delete rules), data types, and performance indexes, the database guarantees that records remain accurate and audit-ready across all administrative, biometric, and financial operations.

---

## 2. Presentation of the Diagram (PRESENT)

Figure 4.5 below illustrates the Physical Entity-Relationship Diagram of the IoT-Based Gym Management System for Double Alpha Fitness Gym. It presents the physical tables, column data types, key constraints, and relational cardinalities implemented through Laravel database migrations.

[Insert Figure 4.5 Here]

**Figure 4.5.** Physical Entity-Relationship Diagram for Double Alpha Fitness Gym.

---

## 3. Detailed Discussion of Tables, Fields, and Relationships (EXPLAIN)

The physical database structure is organized into **nine interconnected relational tables**:

### A. User Management and Membership Core
1. **`admins`:** Stores system administrator credentials (`id`, `name`, `email`, `password`, `created_at`, `updated_at`). The `email` column enforces unique indexing, while the password stores 60-character bcrypt cryptographic hashes for secure session authentication.
2. **`members`:** Serves as the central entity table. In addition to contact demographics (`first_name`, `last_name`, `phone`, `email`, `address`), it incorporates anthropometric columns (`height` and `weight` as `DECIMAL(5,2)` and `dob` as `DATE`) to support the coach's fitness program assignments. The `enrolled_face_id` column stores a reference link to the member's biometric photo.
3. **`plans`:** Contains the gym's pricing packages (`id`, `name`, `price`, `duration_days`). It is populated with standard tiers (Daily, Monthly, Annual, With Coach), establishing clear duration standards for membership expirations.
4. **`memberships`:** Manages subscription validity windows. It links a member to a plan via foreign keys (`member_id` referencing `members.id` with `ON DELETE CASCADE`, and `plan_id` referencing `plans.id` with `ON DELETE SET NULL`). It records `start_date`, `end_date`, `status` (Active or Expired), and `payment_method`.

---

### B. Biometric and IoT Vision Tables
5. **`face_encodings`:** Dedicated to biometric facial embeddings. It links to `members.id` with cascade deletion and stores the 128-dimensional floating point embedding vector in `encoding_blob` (`LONGTEXT`). This isolates heavy biometric lookups from standard demographic queries.
6. **`attendances`:** Captures automated entrance check-in timestamps. Each row stores `member_id`, `date`, and `time_in`. A foreign key cascades deletions if a member profile is purged.
7. **`workout_logs`:** Tracks exercise sessions executed by members. It links `member_id` to the assigned or recognized `exercise` name and execution `date`.
8. **`exercises`:** A reference dictionary storing 1,300+ categorized exercises. Each record contains a standardized 4-digit `exercise_id` (e.g. "0001"), title `name`, target `body_part`, equipment requirements, and `gif_path` pointing directly to frontend video demonstration media.

---

### C. Financial Tracking and Audit Trail
9. **`transactions`:** Maintains the financial ledger for all gym payments. It stores a unique formatted code `transaction_id` (e.g., "TXN-001"), `transaction_date`, `amount`, `payment_method` (Cash, GCash, Maya), and `reference_number`. It maintains two foreign keys: `member_id` (nullable for walk-ins) and `membership_id` referencing `memberships.id`. Binding each transaction directly to a membership period ensures that renewed members' past receipts permanently reflect their original subscription dates.

---

## 4. Analytical Interpretation and Performance Indexing (INTERPRET)

Observation of the physical schema reveals how the database design resolves operational risks and supports high-concurrency gym environments:
* **Enforced Referential Integrity:** Cascade constraints (`ON DELETE CASCADE`) on `attendances`, `face_encodings`, and `workout_logs` prevent orphaned biometric data if a member profile is deleted, while `ON DELETE SET NULL` on `transactions` preserves financial audit history even if a subscriber record is archived.
* **B-Tree Performance Optimization:** As defined in migration `2026_09_11_000000_add_performance_indexes.php`, explicit B-Tree database indexes are placed on frequently filtered columns:
  - `transactions`: `(transaction_date)`, `(member_id)`, `(status)`
  - `memberships`: `(status)`, `(member_id)`, `(end_date)`, `(created_at)`
  - `attendances`: `(date)`, `(member_id)`
  - `members`: `(status)`, `(created_at)`
  These indexes replace slow $O(n)$ full table scans with fast $O(\log n)$ binary tree lookups, ensuring sub-second response times during peak check-in hours and fast PDF report generation.

---

## 5. Connection to Development and Deployment Phases (CONNECT)

This Physical Entity-Relationship Diagram directly fulfills **Specific Objective (b)** and concludes the system modeling activities of the System Design Phase. The tables, fields, and constraints documented in this section serve as the direct foundation for:
* **Section 4.3 (System Development Phase):** Where Laravel Eloquent models, API controllers, and database migrations are compiled.
* **Section 4.4 (System Testing Phase):** Where database integrity test cases verify that primary/foreign key constraints, duplicate prevention rules, and transaction rollbacks function properly under load.
