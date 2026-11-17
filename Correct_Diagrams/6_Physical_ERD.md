# 6. Physical Entity-Relationship Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

```mermaid
erDiagram
    admins {
        bigint id PK
        varchar name
        varchar email UK
        varchar password
        varchar logo_path "nullable"
        timestamp created_at
        timestamp updated_at
    }
    password_reset_pins {
        bigint id PK
        varchar email
        varchar pin_hash
        tinyint attempts
        timestamp expires_at
        timestamp verified_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    personal_access_tokens {
        bigint id PK
        varchar tokenable_type
        bigint tokenable_id
        text name
        varchar token UK
        text abilities "nullable"
        timestamp last_used_at "nullable"
        timestamp expires_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    members {
        bigint id PK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar phone
        varchar plan
        varchar status
        timestamp status_updated_at "nullable"
        longtext enrolled_face_id "nullable, face photo path"
        timestamp biometric_consent_at "nullable"
        varchar profile_pic "nullable"
        date dob "nullable"
        decimal height "nullable"
        decimal weight "nullable"
        varchar body_type "nullable, Ectomorph/Mesomorph/Endomorph"
        text address "nullable"
        timestamp created_at
        timestamp updated_at
    }
    package_categories {
        bigint id PK
        varchar name UK
        varchar color
        timestamp created_at
        timestamp updated_at
    }
    plans {
        bigint id PK
        varchar name
        decimal price
        int duration_days
        varchar category
        varchar category_detail "nullable"
        varchar color "nullable"
        timestamp created_at
        timestamp updated_at
    }
    memberships {
        bigint id PK
        bigint member_id FK "nullable"
        varchar member_name_snapshot "nullable"
        varchar member_email_snapshot "nullable"
        varchar member_profile_pic_snapshot "nullable"
        bigint plan_id "nullable, no FK"
        varchar plan_type
        date start_date
        date end_date
        varchar status
        boolean auto_renew
        varchar payment_method
        varchar color
        text notes "nullable"
        timestamp created_at
        timestamp updated_at
    }
    transactions {
        bigint id PK
        varchar transaction_id UK
        date transaction_date
        bigint member_id FK "nullable"
        varchar member_name_snapshot "nullable"
        varchar member_email_snapshot "nullable"
        varchar member_profile_pic_snapshot "nullable"
        bigint membership_id FK "nullable"
        varchar type
        varchar description "nullable"
        varchar payment_method
        decimal amount
        varchar status
        varchar reference_number "nullable"
        varchar package_name_snapshot "nullable"
        varchar package_category_snapshot "nullable"
        timestamp created_at
        timestamp updated_at
    }
    attendances {
        bigint id PK
        bigint member_id FK "nullable, unique with date"
        varchar member_name_snapshot "nullable"
        date date "unique with member_id"
        time time_in
        varchar source "face or manual"
        varchar camera_source "nullable"
        decimal match_distance "nullable"
        varchar subscription_status "nullable"
        varchar plan_snapshot "nullable"
        boolean reactivated
        bigint recorded_by_admin_id "nullable, no FK"
        varchar reason "nullable"
        timestamp created_at
        timestamp updated_at
    }
    workout_logs {
        bigint id PK
        bigint member_id FK
        varchar exercise
        date date
        smallint sets "nullable"
        smallint reps "nullable"
        smallint counted_reps "nullable, counted by the camera"
        varchar gesture_class "nullable"
        varchar verified_by "nullable, ai or coach"
        timestamp verified_at "nullable"
        timestamp created_at
        timestamp updated_at
    }
    coach_event_categories {
        bigint id PK
        varchar name UK
        varchar color
        timestamp created_at
        timestamp updated_at
    }
    coach_events {
        bigint id PK
        bigint category_id FK
        varchar title
        text description "nullable"
        date start_date
        date end_date
        time start_time
        time end_time
        varchar location
        timestamp created_at
        timestamp updated_at
    }

    admins ||..o{ personal_access_tokens : "tokenable_id (no FK)"
    admins ||..o{ password_reset_pins : "email (no FK)"
    members |o--o{ memberships : "member_id"
    plans |o..o{ memberships : "plan_id (no FK)"
    package_categories |o..o{ plans : "category_detail = name (no FK)"
    members |o--o{ transactions : "member_id"
    memberships |o--o{ transactions : "membership_id"
    members |o--o{ attendances : "member_id"
    members ||--o{ workout_logs : "member_id"
    coach_event_categories ||--o{ coach_events : "category_id"
```

Decimal sizes: `members.height` and `members.weight` are DECIMAL(5,2), `plans.price` is DECIMAL(9,2), `transactions.amount` is DECIMAL(10,2).

On delete: `workout_logs` are deleted with the member; `attendances.member_id`, `memberships.member_id`, `transactions.member_id` and `transactions.membership_id` are set to null; `coach_events.category_id` is restricted (a category with events cannot be deleted).

`memberships.plan_id` has no foreign key in the database (checked with `SHOW CREATE TABLE memberships;`). The application refuses to delete a package while a running subscription uses it, and an ended subscription keeps its package name in `plan_type`.

Not drawn because the application does not use them: `face_encodings`, `payments`, `exercise_sessions`, `gesture_logs`, `exercises`, `auth_verification_codes` (the login PIN was removed), `users`, and Laravel's own tables (`sessions`, `cache`, `jobs` and similar).
