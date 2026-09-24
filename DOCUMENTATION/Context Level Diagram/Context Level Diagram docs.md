4.2-B Context Level Diagram

A Context Level Diagram (CLD) is a high-level representation of the system that shows its interaction with external entities. It presents the system as a single process (Process 0) and illustrates the flow of information between the system and its users or connected devices. The diagram establishes the operational boundaries of the system by defining the exchange of incoming and outgoing data between external actors and the IoT-Based Gym Management System.

Figure 4.2 below shows the Context Level Diagram of the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym.

[Insert Figure 4.2 Here]

Figure 4.2. Context Level Diagram for IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym.

The diagram provides an overview of the interaction between the system and its three external entities: the Gym Owner / Administrator, the Gym Member, and the Camera / Webcam (IoT Device). 

The process begins with the Gym Owner / Administrator, who serves as the primary system operator. The administrator inputs administrative credentials, member registration details—including personal information, contact details, and anthropometric data (height, weight, and body type)—facial enrollment capture commands, membership plan configurations, exercise task assignments, payment details (Cash, GCash, or Maya), and report filter parameters. In return, the system provides the administrator with authentication confirmation, real-time dashboard analytics, member profiles, facial attendance logs, unrecognized member alerts, membership expiration warnings, workout repetition results, payment transaction history, and exportable system reports (PDF and CSV).

The Gym Member participates as a physical actor without requiring direct software login credentials. During registration, the member provides personal, contact, and anthropometric details, and poses for facial data enrollment. During regular gym visits, the member faces the entrance camera for facial recognition check-in, performs assigned exercises in front of the gesture monitoring camera, and submits membership payments. In return, the system provides the member with immediate visual attendance confirmation, membership status and renewal notices, real-time exercise repetition feedback on screen, and an official payment receipt.

Meanwhile, the Camera / Webcam operates as an automated IoT vision device. It continuously captures optical feeds and transmits live video frames to the system, specifically delivering facial image frames for attendance identification at the entrance and body movement frames for skeletal pose tracking and repetition counting at the workout area.

All processed information—including member profiles, facial biometric encodings, attendance logs, subscription records, payment ledgers, and workout progress—is stored within a centralized MySQL database. This integrated data flow eliminates the gym's previous manual problems, replacing vulnerable paper logbooks, missed membership renewals, unrecorded exercise repetitions, and loose payment slips with a synchronized, real-time digital system.

This Context Level Diagram directly supports Specific Objective (b) of the study by establishing the baseline system architecture. It serves as the foundation for the Level 1 Data Flow Diagram (Section 4.2-C), where this overall process is decomposed into the system's six operational modules.
