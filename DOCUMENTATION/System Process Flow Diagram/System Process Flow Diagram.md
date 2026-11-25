4.2-A System Process Flow Diagram

This section presents the system process flow diagram for the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros Gym. The diagram was created from the information gathered in the requirements gathering phase and updated to match the system as built (November 17, 2026). It shows the sequence of activities the Gym Owner or Admin performs from logging in to logging out, and the decisions the system makes at key points.

Figure 4.3. System Process Flow Diagram for the Administrator.

The flow begins when the administrator opens the system and enters an email and password. If they are not correct, an error is shown and the administrator tries again. A forgotten password is recovered by asking for a PIN sent by email and choosing a new password. There is no verification code at login. After a correct login the administrator reaches the Dashboard.

From the dashboard the administrator can open six modules:

1. Member Registration. The administrator enters name, contact details, address, date of birth, height, weight and body type (Ectomorph, Mesomorph or Endomorph), optionally adds a profile photo, records that the member agrees to face enrollment (the date of consent is saved), and captures the face in four views (front, chin down, left and right). The member record and face photo are then saved.
2. Attendance Monitoring. The camera captures the member's face and the system looks for a match. A recognized member is checked in only inside gym hours (9:00 AM to 9:30 PM) and once per day. The check-in saves the time, how it was made, the camera and the subscription status; an expired subscription is flagged RENEW on the live feed, and an Inactive member is set back to Active. A face that is not recognized shows "Unknown", and the administrator can check the member in manually by choosing the member and typing a reason.
3. Program Monitoring. In the member's Training plan the administrator builds a 7-day plan (exercise, date, sets, reps). Only members with an active With Coach subscription are tracked by the camera; for others the coach verifies tasks by hand. When the camera recognizes the assigned exercise, a task is verified. For squat, push-up, curl and sit-up the camera first counts repetitions and saves the progress until the target sets × reps is reached.
4. Packages and Subscriptions. The administrator subscribes a member to a package, or upgrades a running subscription to a higher-priced package and pays the balance. Renew extends a running subscription from its end date, or starts a new one today if it has ended. The Price list creates, edits and deletes packages; deleting a package that members are subscribed to is refused. The Calendar holds classes and events. Every subscription, renewal or upgrade creates its payment record automatically.
5. Payment Transactions. The administrator records a payment (package, member or walk-in guest, amount, reference number, Cash, GCash or Maya), and prints the receipt. Payments are never refunded; a subscription is paused and resumed instead.
6. Reports. The administrator chooses Payments, Memberships, Attendance or Program Monitoring, sets the dates, views the report, and exports a CSV file or prints it.

After any activity the administrator may return to the dashboard or log out.

This process flow shows that the main gym operations, from member registration to reports, are handled in one digital system. Recording attendance in a logbook, checking membership expiration by hand, writing receipts and watching members exercise are replaced by automatic steps, and the decision points (login check, face match, gym hours, With Coach eligibility, repetitions reached, package in use) verify information before any record is saved.

The flow addresses the problems found during requirements gathering: manual attendance recording, delayed membership renewal, inconsistent payment records, and no organized program monitoring. Each module corresponds to the functional modules in Section 4.1-C and is detailed in the use case diagrams of Section 4.2-D.
