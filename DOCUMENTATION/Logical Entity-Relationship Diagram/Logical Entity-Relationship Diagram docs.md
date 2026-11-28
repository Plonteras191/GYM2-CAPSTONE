# 4.2-E Logical Entity-Relationship Diagram

This section presents the **Logical Entity-Relationship Diagram (ERD)** for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros.ph Fitness Gym**.

> **Updated November 17, 2026** to match the database and the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

---

## 1. Introduction (INTRODUCE)

A **Logical ERD** is a blueprint of the data an organization needs, independent of how a database stores it. It names the business entities, their attributes and how they are connected.

This section shows that the information architecture satisfies the needs of Muscle Bros.ph Fitness Gym identified in Chapter 1. By modeling members, subscriptions, payments, attendance and workout logs, it makes sure every module has the data it needs.

---

## 2. Presentation of the Diagram (PRESENT)

Figure 4.9 illustrates the Logical Entity-Relationship Diagram for Muscle Bros.ph Fitness Gym.

*(Refer to Figure 4.9 in [Logical Entity-Relationship Diagram.md](./Logical%20Entity-Relationship%20Diagram.md))*

**Figure 4.9.** Logical Entity-Relationship Diagram for Muscle Bros.ph Fitness Gym.

---

## 3. Detailed Discussion of Entities and Relationships (EXPLAIN)

The logical model has **eleven entities** that support member management, attendance, subscriptions, payments and program monitoring.

### A. Accounts and Members
1. **ADMIN:** the system operator, shared by the gym owner and the coach (`name`, `email`, `password`, `logo`). The admin can reset the password with a **PASSWORD_RESET_PIN** (**1 : N**), an emailed PIN with an expiry and a limited number of attempts.
2. **MEMBER:** the gym patron and the center of the model: demographics (`first_name`, `last_name`, `phone`, `email`, `address`), body measurements (`date_of_birth`, `height`, `weight`, `body_type`), `status` (Active or Inactive), the face photo reference and the date of consent for face enrollment (`biometric_consent_at`).

### B. Packages and Subscriptions
3. **PLAN:** a package the gym sells (`name`, `price`, `duration_days`, `category`, `color`). A **With Coach** package makes a member eligible for the training plan and camera tracking. A plan has many memberships (**1 : N**). **PACKAGE_CATEGORY** is an optional, older grouping of plans.
4. **MEMBERSHIP:** a member's subscription to a package for a period (`start_date`, `end_date`, `status`, `paused_at`, `payment_method`). It is **N : 1** with **MEMBER** and with **PLAN**, and **1 : N** with **TRANSACTION** and with **MEMBERSHIP_PAUSE**.
   * **MEMBERSHIP_PAUSE:** one pause of a subscription (`paused_on`, `resumed_on`, `days`, who paused and resumed it). The gym gives no refunds: a subscription is paused instead, and on resume the paused days are added to its end date.

### C. Attendance and Program Monitoring
5. **ATTENDANCE:** a check-in, at most one per member per day. It records how it was made (face or manual), the camera, the match distance, and the plan and subscription status on that day. It is **N : 1** with **MEMBER**, and stays when the member is deleted.
6. **WORKOUT_LOG:** a training-plan task and its result: the `exercise`, `date`, the target `sets` and `reps`, the repetitions the camera counted (`counted_reps`), the camera class, and who verified the task (`verified_by`) and when. It is **N : 1** with **MEMBER**.

### D. Classes and Events
7. **COACH_EVENT_CATEGORY** and 8. **COACH_EVENT:** classes and events on the calendar. A category classifies many events (**1 : N**).

### E. Financial Audit Entity
9. **TRANSACTION:** a payment, upgrade or renewal (payments are never refunded) (`transaction_id`, `transaction_date`, `type`, `amount`, `payment_method`, `reference_number`, `status`). It is **N : 1** with **MEMBER** (none for a walk-in guest) and with **MEMBERSHIP**, so each receipt stays tied to the exact subscription period.

---

## 4. Analytical Interpretation (INTERPRET)

* **Price list apart from the purchase:** separating **PLAN** (what is sold) from **MEMBERSHIP** (what a member bought) and tying both to **TRANSACTION** removes the old problem of receipts showing wrong renewal dates.
* **History survives deletions:** attendance, subscriptions and payments keep the member's name, so reports stay complete after a member is deleted.
* **Biometric privacy:** the face is kept as a private image file with a recorded consent date, not as a field in the member's public profile.
* **Eligibility by package:** the With Coach category on **PLAN** decides who the Gesture Monitor tracks and counts, which links the sales data to program monitoring.

---

## 5. Connection to Objectives and Physical Database Design (CONNECT)

This Logical ERD fulfills **Specific Objective (b)** by showing the relationships behind the system. It is the baseline for **Section 4.2-F (Physical Entity-Relationship / Database Diagram)**, where these entities become MySQL tables with keys, types and indexes.
