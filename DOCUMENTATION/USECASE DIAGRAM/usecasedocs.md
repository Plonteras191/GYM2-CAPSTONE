4.2-D Use Case Diagram

This section presents the Use Case Diagrams for the Camera-Based Gym Management System for Double Alpha Fitness Gym. The use case diagrams were created based on the information gathered during the requirements gathering phase, which included an interview with the gym owner and observation of the gym's current manual processes. The diagrams show how each actor interacts with the system and what functions they are able to perform. The three actors identified in the system are the Gym Owner or Admin, the Security Camera or AI Vision Engine, and the Gym Member. Each actor has a separate diagram to clearly show their role and the functions connected to them.

---

Figure 4.1 Use Case Diagram for the Gym Owner / Admin

The first use case diagram shows the functions that the Gym Owner or Admin can perform in the system. As the main user of the system, the admin is responsible for managing all records and operations through the web-based interface.

Figure 4.1 shows the Use Case Diagram for the Gym Owner or Admin. It presents how the admin logs into the system, views the dashboard, and manages all gym records. The admin can add new members, view the list of members, update member information, and deactivate a member's account when needed. During registration, the admin also enrolls the member's facial photo so the camera can recognize them later for attendance.

When it comes to membership, the admin can create membership plans, assign a plan to a member, monitor when memberships are about to expire, and renew or update subscriptions. For payments, the admin records each transaction — whether the member paid in cash, through GCash, or through Maya — and can print a receipt for the member. The admin can also assign specific exercises to members and manually check if those exercises were completed. The admin can view the live camera feed and switch between the entrance camera and the exercise monitoring camera. For records and summaries, the admin can generate reports for attendance, program monitoring, membership status, and payment transactions. Lastly, the admin can update their own profile details, change their password, and update their profile photo.

This diagram shows that the proposed system gives the gym owner full digital control over all gym operations, removing the need for manual logbooks, paper-based membership records, handwritten receipts, and phone-based program monitoring. This directly responds to the problems identified during requirements gathering, where manual and non-integrated processes were found to cause delays, missing information, and inconsistent records at Double Alpha Fitness Gym. The use cases shown in this diagram correspond to the functional requirements gathered in Section 4.1-C and address the general objective of designing and developing a Camera-Based Gym Management System that improves attendance tracking, membership management, program monitoring, and payment recording.

---

Figure 4.2 Use Case Diagram for the Security Camera / AI Vision Engine

The second use case diagram shows the functions performed by the Security Camera and AI Vision Engine. Unlike the admin, the camera system does not require a user to operate it manually. It works on its own to support two major system functions: attendance monitoring and exercise tracking.

Figure 4.2 shows the Use Case Diagram for the Security Camera or AI Vision Engine. It presents how the camera system works automatically to detect faces and monitor exercise movements. For attendance, the camera captures the face of a member who walks in front of it. The system finds the face in the image, reads the facial features, and compares them with the saved facial photos of registered members. If the face matches a registered member, the system automatically records their attendance with the correct date and time. If the face does not match anyone in the system, no attendance record is created and no entry is logged.

For exercise monitoring, the camera detects the body of the member who is exercising. The system identifies the position of body parts such as the shoulders, elbows, knees, and ankles. It then determines what exercise the member is performing and counts how many times the movement is completed. Once the exercise is detected and the required repetitions are reached, the system saves the workout record and sends it to the backend for storage. The camera system also streams a live video feed to the admin's screen and can switch between different camera sources when the admin requests it.

This diagram shows that the camera and AI system can carry out attendance recording and exercise monitoring automatically, without needing the admin to check every member individually. This directly addresses two major problems found during requirements gathering: first, the problem of missed or incorrect attendance entries caused by manual logbook recording; and second, the difficulty of monitoring multiple members exercising at the same time. These automated functions support the study's objective of developing a Facial Recognition Attendance Module and a Gesture-Based Program Monitoring Module as part of the complete system.

---

Figure 4.3 Use Case Diagram for the Gym Member

The third use case diagram shows the role of the Gym Member in the system. Unlike the Admin, gym members do not have a login account and do not access the web system directly. All of their interactions with the system happen physically inside the gym, through the camera terminals and with the help of the admin.

Figure 4.3 shows the Use Case Diagram for the Gym Member. It presents the role of the gym member during registration, attendance, exercise monitoring, and payment. During registration, the member provides their personal information to the admin, such as their name, contact number, and gender. The member also gets their height and weight measured, and the admin selects their body type. The member then faces the camera or provides a clear front-facing photo so the system can save their facial data for attendance tracking.

When a member enters the gym, they simply face the entrance camera. The camera recognizes their face and automatically records their attendance. The member does not need to sign a logbook or press any button. During an exercise session, the admin assigns a specific exercise to the member. The member then performs that exercise in front of the gesture monitoring camera. The camera tracks their movements and counts the repetitions automatically, so the member does not need to record anything themselves. For payment, the member gives their payment to the admin — whether in cash, through GCash, or through Maya. The admin records it in the system and provides a receipt.

This diagram shows that the system was designed so that gym members do not need to learn how to use any software. Their participation is simple and physical — they show up, face the camera, exercise, and pay as they normally would. This approach ensures that the system does not create any additional difficulty for members while still improving the accuracy and organization of their records. The member's use cases are connected to the registration, attendance, program monitoring, and payment functional requirements identified in Section 4.1-C, and support the study's goal of improving gym operations without adding burden to the members themselves.
