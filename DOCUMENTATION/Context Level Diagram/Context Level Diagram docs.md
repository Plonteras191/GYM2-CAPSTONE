# 4.2-B Context Level Diagram

A Context Level Diagram shows the system as a single process (Process 0) and the information exchanged with the people and devices outside it. It sets the boundary of the **IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros Gym**.

> **Updated November 17, 2026** to match the system as built. The diagram is the same one as in `Updated Current Plan For Development/Chapter4_Diagrams (2).md`.

Figure 4.4 shows the Context Level Diagram. It has four external entities: the Gym Owner / Administrator, the Gym Member, the Camera (CCTV, phone camera or webcam) and the Email Server.

[Insert Figure 4.4 Here]

**Figure 4.4.** Context Level Diagram for the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring.

The **Gym Owner / Administrator** is the only operator; the owner and the coach share one login. The administrator sends an email and password, member details with body type, face capture and consent, packages, subscriptions and renewals, classes and events, payments and refunds, training plans, manual verifications, manual check-ins, report dates and camera choices. In return the system shows the dashboard, notifications, member and payment records, live camera feeds, today's attendance, the status and counted repetitions of workout tasks, and reports that can be exported as CSV or printed.

The **Gym Member** takes part in person and has no login. During registration the member gives personal details, agrees to face enrollment and poses for the face capture; payments are made through the administrator, who prints the receipt.

The **Camera** supplies live video of faces at the entrance and of body movement at the workout area. The same feed is used for face recognition and for pose tracking and repetition counting.

The **Email Server** receives one message type from the system: the password-reset PIN.

All processed information (members, face photos and their consent dates, attendance, subscriptions, payments, classes and events, training plans and workout results) is stored in one MySQL database. This diagram is the baseline for the Level 1 Data Flow Diagram (Section 4.2-C), which breaks Process 0 into eight processes.
