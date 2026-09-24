# 4.2-E Logical Entity-Relationship Diagram

This section presents the **Logical Entity-Relationship Diagram (ERD)** for the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym**.

---

## 1. Logical Entity-Relationship Diagram (PRESENT)

```mermaid
flowchart TD
    %% Entity Definitions with Logical Business Attributes
    Admin["ADMIN\n- name\n- email\n- password"]
    
    Member["MEMBER\n- first_name\n- last_name\n- email\n- phone\n- address\n- dob\n- height\n- weight\n- status"]
    
    FaceEncoding["FACE_ENCODING\n- encoding_blob\n- enrolled_at"]
    
    Plan["PLAN\n- name\n- price\n- duration_days"]
    
    Membership["MEMBERSHIP\n- plan_type\n- start_date\n- end_date\n- status\n- payment_method\n- auto_renew"]
    
    Transaction["TRANSACTION\n- transaction_id\n- transaction_date\n- amount\n- payment_method\n- reference_number\n- status"]
    
    Attendance["ATTENDANCE\n- date\n- time_in"]
    
    WorkoutLog["WORKOUT_LOG\n- exercise_name\n- date"]
    
    Exercise["EXERCISE\n- exercise_id\n- name\n- category\n- body_part\n- gif_path"]

    %% Relationship Diamonds (Chen / Crow's Foot Hybrid Notation)
    Rel_Admin_Member{"Manages"}
    Rel_Admin_Plan{"Configures"}
    Rel_Member_Face{"Enrolls"}
    Rel_Member_Membership{"Avails"}
    Rel_Plan_Membership{"Classifies"}
    Rel_Membership_Txn{"Generates"}
    Rel_Member_Txn{"Remits"}
    Rel_Member_Attendance{"Records"}
    Rel_Member_Workout{"Logs"}
    Rel_Exercise_Workout{"Prescribes"}

    %% Administrative Management Flows
    Admin ---|1| Rel_Admin_Member
    Rel_Admin_Member ---|1..N| Member
    
    Admin ---|1| Rel_Admin_Plan
    Rel_Admin_Plan ---|1..N| Plan

    %% Member Core Relational Links
    Member ---|1| Rel_Member_Face
    Rel_Member_Face ---|1..1| FaceEncoding

    Member ---|1| Rel_Member_Membership
    Rel_Member_Membership ---|1..N| Membership

    Plan ---|1| Rel_Plan_Membership
    Rel_Plan_Membership ---|1..N| Membership

    Membership ---|1| Rel_Membership_Txn
    Rel_Membership_Txn ---|1..N| Transaction

    Member ---|1| Rel_Member_Txn
    Rel_Member_Txn ---|1..N| Transaction

    %% Member Tracking & IoT Activities
    Member ---|1| Rel_Member_Attendance
    Rel_Member_Attendance ---|1..N| Attendance

    Member ---|1| Rel_Member_Workout
    Rel_Member_Workout ---|1..N| WorkoutLog

    Exercise ---|1| Rel_Exercise_Workout
    Rel_Exercise_Workout ---|1..N| WorkoutLog
```

**Figure 4.4.** Logical Entity-Relationship Diagram for Double Alpha Fitness Gym.

---

## 2. Logical Entity and Relationship Matrix

The table below summarizes the logical business entities, their key attributes, and their relational cardinalities:

| Entity Name | Description | Key Business Attributes | Related Entities & Cardinality |
|---|---|---|---|
| **ADMIN** | System operator account managing gym operations. | `name`, `email`, `password` | **1 : N** with `MEMBER` (Manages)<br>**1 : N** with `PLAN` (Configures) |
| **MEMBER** | Gym patron registered in the fitness center. | `first_name`, `last_name`, `email`, `phone`, `address`, `dob`, `height`, `weight`, `status` | **1 : 1** with `FACE_ENCODING` (Enrolls)<br>**1 : N** with `MEMBERSHIP` (Avails)<br>**1 : N** with `TRANSACTION` (Remits)<br>**1 : N** with `ATTENDANCE` (Records)<br>**1 : N** with `WORKOUT_LOG` (Logs) |
| **FACE_ENCODING** | 128-dimensional biometric facial embedding vectors. | `encoding_blob`, `enrolled_at` | **1 : 1** with `MEMBER` (Owned by) |
| **PLAN** | Gym pricing catalog defining plan duration and rates. | `name`, `price`, `duration_days` | **1 : N** with `MEMBERSHIP` (Classifies) |
| **MEMBERSHIP** | Subscription periods assigned to or renewed by a member. | `plan_type`, `start_date`, `end_date`, `status`, `payment_method`, `auto_renew` | **N : 1** with `MEMBER`<br>**N : 1** with `PLAN`<br>**1 : N** with `TRANSACTION` (Generates) |
| **TRANSACTION** | Financial transaction ledger for cash and e-wallet payments. | `transaction_id`, `transaction_date`, `amount`, `payment_method`, `reference_number`, `status` | **N : 1** with `MEMBER`<br>**N : 1** with `MEMBERSHIP` (Bound to subscription period) |
| **ATTENDANCE** | Touchless facial recognition check-in logs. | `date`, `time_in` | **N : 1** with `MEMBER` |
| **WORKOUT_LOG** | AI gesture-detected and coach-verified workout entries. | `exercise_name`, `date` | **N : 1** with `MEMBER`<br>**N : 1** with `EXERCISE` |
| **EXERCISE** | Pre-loaded workout library with GIF demonstration media. | `exercise_id`, `name`, `category`, `body_part`, `gif_path` | **1 : N** with `WORKOUT_LOG` (Prescribes) |

---

> [!NOTE]
> The complete narrative explanation complying with the **INTRODUCE $\rightarrow$ PRESENT $\rightarrow$ EXPLAIN $\rightarrow$ INTERPRET $\rightarrow$ CONNECT** format is located in the companion documentation file:  
> 📄 **[Logical Entity-Relationship Diagram docs.md](./Logical%20Entity-Relationship%20Diagram%20docs.md)**