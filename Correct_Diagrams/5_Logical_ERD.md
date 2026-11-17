# 5. Logical Entity-Relationship Diagram

[Back to the list of diagrams](../Correct_Diagrams.md)

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

```mermaid
erDiagram
    ADMIN {
        text name
        text email
        text password
        text logo
    }
    PASSWORD_RESET_PIN {
        text pin
        datetime expires_at
        number attempts
        datetime verified_at
    }
    MEMBER {
        text first_name
        text last_name
        text email
        text phone
        text address
        date date_of_birth
        number height
        number weight
        text body_type
        text status
        datetime status_updated_at
        text current_plan
        image profile_photo
        image face_photo
        datetime biometric_consent_at
    }
    PACKAGE_CATEGORY {
        text name
        text color
    }
    PLAN {
        text name
        number price
        number duration_days
        text category
        text color
    }
    MEMBERSHIP {
        text plan_type
        date start_date
        date end_date
        text status
        text payment_method
        text notes
    }
    TRANSACTION {
        text transaction_id
        date transaction_date
        text type
        text description
        number amount
        text payment_method
        text reference_number
        text status
    }
    ATTENDANCE {
        date date
        time time_in
        text member_name
        text method
        text camera
        number match_distance
        text subscription_status
        text plan_name
        boolean reactivated
        text recorded_by
        text reason
    }
    WORKOUT_LOG {
        text exercise
        date date
        number sets
        number reps
        number counted_reps
        text gesture_class
        text verified_by
        datetime verified_at
    }
    COACH_EVENT_CATEGORY {
        text name
        text color
    }
    COACH_EVENT {
        text title
        text description
        date start_date
        date end_date
        time start_time
        time end_time
        text location
    }

    ADMIN ||--o{ PASSWORD_RESET_PIN : "resets password with"
    MEMBER ||--o{ MEMBERSHIP : "subscribes to"
    PLAN ||--o{ MEMBERSHIP : "is sold as"
    PACKAGE_CATEGORY |o--o{ PLAN : "groups"
    MEMBERSHIP ||--o{ TRANSACTION : "is paid by"
    MEMBER |o--o{ TRANSACTION : "pays"
    MEMBER |o--o{ ATTENDANCE : "checks in"
    MEMBER ||--o{ WORKOUT_LOG : "is assigned"
    COACH_EVENT_CATEGORY ||--o{ COACH_EVENT : "classifies"
```
