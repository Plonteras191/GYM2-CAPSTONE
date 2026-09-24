# 4.2-A System Process Flow Diagram

This section presents the updated System Process Flow Diagram for the Camera-Based Gym Management System for Double Alpha Fitness Gym. The diagram was developed from the requirements gathering and analysis phase, which incorporated findings from interviews with the gym owner, staff observations, and the evaluation of existing paper-based gym records. 

It illustrates the end-to-end operational flow executed by the System Administrator (Gym Owner / Authorized Staff), spanning initial authentication, routine multi-module gym operations, automated decision branches, and secure session termination.

---

## 1. System Process Flow Diagram (Mermaid Render)

```mermaid
flowchart TD
    Start([Start]) --> Login["Login (Administrator)"]
    Login --> Credentials["Enter Username and Password"]
    Credentials --> ValidAuth{"Valid\nCredentials?"}
    
    ValidAuth -- "No" --> LoginError["Display Login Error"]
    LoginError --> Credentials
    
    ValidAuth -- "Yes" --> Dashboard["Administrator Dashboard"]
    Dashboard --> SelectFunc["Select Function"]
    
    %% Six Primary Functional Modules
    SelectFunc --> M1["1. Member Registration"]
    SelectFunc --> M2["2. Attendance Monitoring"]
    SelectFunc --> M3["3. Program Monitoring"]
    SelectFunc --> M4["4. Subscription Management"]
    SelectFunc --> M5["5. Payment Transaction"]
    SelectFunc --> M6["6. Reports"]
    
    %% Module 1: Member Registration (Fix 1 Applied)
    M1 --> M1_1["Enter Member Information\n(Personal info, contact details,\nheight, weight, body type)"]
    M1_1 --> M1_2["Capture / Register Facial Data"]
    M1_2 --> M1_3["Save Member Information"]
    
    %% Module 2: Attendance Monitoring
    M2 --> M2_1["Camera Captures Member Face"]
    M2_1 --> M2_2["Facial Recognition Analysis"]
    M2_2 --> M2_Check{"Member\nRecognized?"}
    M2_Check -- "No" --> M2_Fail["Display Unrecognized Member Alert"]
    M2_Check -- "Yes" --> M2_3["Record Attendance Entry"]
    M2_3 --> M2_4["Save Date, Time, and Status"]
    
    %% Module 3: Program Monitoring (Fix 2 & Fix 3 Applied)
    M3 --> M3_1["Select Registered Member"]
    M3_1 --> M3_2["Assign Exercise Task\n(from Approved Scope)"]
    M3_2 --> M3_3["Camera Captures Exercise Movement"]
    M3_3 --> M3_4["Pose Landmark & Movement Recognition"]
    M3_4 --> M3_Check{"Exercise\nDetected?"}
    M3_Check -- "No" --> M3_Fail["Display 'Adjust Position in Camera View'"]
    M3_Check -- "Yes" --> M3_5["Monitor Exercise Execution"]
    M3_5 --> M3_6["Count Repetitions / Track Form"]
    M3_6 --> M3_7["Save Monitoring Results"]
    
    %% Module 4: Subscription Management
    M4 --> M4_1["View Member Subscriptions"]
    M4_1 --> M4_2["Check Membership Status"]
    M4_2 --> M4_Check{"Active or\nExpired?"}
    M4_Check -- "Active" --> M4_Active["Display Membership Status"]
    M4_Check -- "Expired" --> M4_Renew["Process Membership Renewal"]
    M4_Renew --> M4_Update["Update Membership Record"]
    
    %% Module 5: Payment Transaction (Fix 4 & Fix 5 Applied)
    M5 --> M5_1["Select Member"]
    M5_1 --> M5_2["Select Linked Membership Plan"]
    M5_2 --> M5_3["Enter Payment Details\n(Amount, Reference No.)"]
    M5_3 --> M5_4["Select Payment Method\n(Cash / GCash / Maya)"]
    M5_4 --> M5_5["Record Payment Transaction"]
    M5_5 --> M5_6["Update Payment History"]
    M5_6 --> M5_7["Activate / Update\nMembership Subscription"]
    
    %% Module 6: Reports
    M6 --> M6_1["Select Report Category:\n• Attendance Report\n• Membership Report\n• Program Monitoring Report\n• Payment Report"]
    M6_1 --> M6_2["Generate Filtered Report"]
    M6_2 --> M6_3["Display & Export Report"]
    
    %% Return / Merge Paths to Session Decision
    M1_3 --> LogoutCheck
    M2_4 --> LogoutCheck
    M2_Fail --> LogoutCheck
    M3_7 --> LogoutCheck
    M3_Fail --> LogoutCheck
    M4_Active --> LogoutCheck
    M4_Update --> LogoutCheck
    M5_7 --> LogoutCheck
    M6_3 --> LogoutCheck
    
    %% Session Control
    LogoutCheck{"Logout?"}
    LogoutCheck -- "No" --> ReturnDash["Return to Dashboard"]
    ReturnDash --> Dashboard
    
    LogoutCheck -- "Yes" --> LogoutAction["Perform Logout"]
    LogoutAction --> EndNode([End])
```

**Figure 4.1.** Updated System Process Flow Diagram for the Camera-Based Gym Management System for Double Alpha Fitness Gym.

---

## 2. Process Narrative (Chapter 4 Standard)

### A. Narrative Walkthrough (EXPLAIN)
The process flow begins when the administrator opens the gym management system and inputs their administrative username and password. The system checks the credentials against registered administrative accounts. If the credentials do not match, the system displays an authentication error message and prompts the administrator to re-enter their credentials. Once successfully authenticated, the system redirects the administrator to the main Administrator Dashboard.

From the dashboard, the administrator can navigate to any of the system's six operational modules:

1. **Member Registration Module:** The administrator inputs member profile details, contact information, and anthropometric data (height, weight, and body type classification: Ectomorph, Mesomorph, or Endomorph). The system then activates the camera to capture and enroll facial biometric data before storing the finalized member profile in the database.
2. **Attendance Monitoring Module:** The camera stream continuously detects members entering the gym facility. The facial recognition engine compares captured features against the enrolled biometric database. If a match is verified, the system automatically records the attendance event with a verified timestamp. If the face is not recognized, the system triggers an unrecognized member notice, preventing unauthorized attendance logging.
3. **Program Monitoring Module:** The administrator selects a registered member and assigns a specific workout task chosen strictly from the approved exercise scope. When the member performs the assigned workout, the camera and computer vision engine analyze body landmarks. If landmark visibility is obscured or the exercise cannot be detected, the system prompts the member to adjust their position within the camera frame. When recognized correctly, the system tracks movement form, increments repetition counts in real time, and logs the finalized workout session data.
4. **Subscription Management Module:** The administrator checks the membership status of members. If the subscription is active, the valid status and remaining plan validity are presented. If the subscription is expired, the administrator initiates a renewal workflow and updates the active subscription validity.
5. **Payment Transaction Module:** The administrator selects the member, links the specific membership plan, enters the transaction amount and reference details, and specifies the payment channel (Cash, GCash, or Maya). After saving the payment, the transaction is added to the historical ledger, and the system automatically activates or extends the member's subscription status.
6. **Reports Module:** The administrator selects among attendance, membership, program monitoring, and payment transaction reports. The system aggregates the corresponding data based on date ranges or filters, and displays the structured summary for operational review or export.

Following the completion of any module activity, the administrator is presented with a session check. The administrator may either return to the main dashboard to execute additional tasks or log out to safely terminate the session.

### B. Meaning and Operational Impact (INTERPRET)
The updated process flow demonstrates the transition of Double Alpha Fitness Gym from disjointed manual operations into a cohesive, automated system. Critical manual bottlenecks—such as manual sign-in sheets, visual inspection of workout repetitions, physical verification of renewal dates, and paper receipts—are replaced by automated validation rules. Every decision diamond (credential check, facial recognition match, pose detection verification, and membership validity check) ensures data integrity before records are updated.

### C. Alignment with Study Objectives (CONNECT)
This flow aligns directly with the general and specific objectives stated in Chapter 1 of the study. Specifically, it operationalizes:
- **Biometric Attendance Tracking:** Ensuring touchless, verified logging without buddy punching.
- **Computer-Vision-Assisted Program Monitoring:** Providing structured exercise assignment and repetition counting.
- **Automated Membership and Subscription Tracking:** Eliminating manual calculation of expiration dates.
- **Accurate Multi-Channel Payment Recording:** Supporting modern digital payment recording (GCash/Maya) alongside cash while immediately linking revenue to active memberships.

---

## 3. Summary of Applied Fixes (Audit Trail)

| # | Fix Item | Module Affected | Previous Flaw | Applied Correction |
|---|---|---|---|---|
| **1** | Anthropometric Data Label | Module 1: Registration | Labeled ambiguously as `"bodydata"` | Changed to `"personal info, contact details, height, weight, body type"` |
| **2** | Exercise Task Assignment | Module 3: Program Monitoring | Jumped straight to camera capture without member or exercise selection | Added `"Select Registered Member"` and `"Assign Exercise Task (from Approved Scope)"` before camera capture |
| **3** | Exercise Recognition Decision | Module 3: Program Monitoring | Assumed 100% immediate detection without alternative feedback branch | Added decision diamond `"Exercise Detected?"` with `"No"` leading to `"Display 'Adjust Position in Camera View'"` |
| **4** | Membership Plan Selection | Module 5: Payment Transaction | Jumped from member selection directly to payment entry without plan context | Added `"Select Linked Membership Plan"` before entering payment amounts |
| **5** | Subscription Status Activation | Module 5: Payment Transaction | Ended at transaction history without updating member access status | Added `"Activate / Update Membership Subscription"` after transaction recording |
| **6** | Academic Narrative Compliance | Post-Diagram Documentation | Missing structured narrative required by Capstone Guidelines | Integrated complete INTRODUCE → PRESENT → EXPLAIN → INTERPRET → CONNECT academic sections |
