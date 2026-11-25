4.2-D Use Case Diagrams

The use case diagrams show what each actor can do with the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Muscle Bros Gym. They were updated on November 17, 2026 to match the system as built. The full specification, with every diagram, is in `usecase.md`; the diagrams are the same as Figures 4.6, 4.7 and 4.8 in `Chapter4_Diagrams (2).md`.

There are three actors. The **Gym Owner / Coach (Admin)** is the only person who logs in; the owner and the coach share one login (email and password). The admin logs in, views the dashboard and notifications, registers members with body type and face capture (with recorded consent), manages packages and prices, subscribes, upgrades and renews members, keeps a calendar of classes and events, records payments and refunds, builds 7-day training plans, verifies tasks by hand, views the attendance and gesture monitors, makes manual check-ins, switches the camera, generates four kinds of report, and manages the account.

The **Camera / Gesture Engine** streams live video, loads the enrolled faces and the day's plans, detects and matches faces and sends attendance (saving and retrying when Laravel is unreachable), detects body pose, classifies the exercise, counts repetitions for squat, push-up, curl and sit-up, and sends progress and verification.

The **Gym Member** takes part in person: gives personal details, agrees to face enrollment and poses for the face capture, pays or renews through the admin, faces the entrance camera, and exercises in view of the gesture camera. Members have no web login.

Included behaviors: Log In includes Validate Email and Password; Add Member includes Capture Face, which includes Record Face Consent; subscriptions, upgrades and renewals include Create Payment Transaction. Optional behaviors: Reset Password by PIN, Set Member Status, Delete Package (refused while members are subscribed), Print Receipt, Check In Member Manually and Export CSV or Print.

Excluded from the approved scope: a payment gateway, a native mobile application, medical diagnosis, multi-factor authentication, posture correction, wearable sensors and continuous video recording.
