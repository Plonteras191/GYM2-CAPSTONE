Design and Development of an IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym

# Chapter 1

# BACKGROUND OF THE STUDY

## Project Context

The advancement of fitness and healthcare systems supports United Nations Sustainable Development Goal 3, which promotes good health and well-being. In this context, the proposed camera-based gym management system for Double Alpha Fitness Gym will use digital technologies to improve attendance, membership, and program monitoring. Information Technology can support automated attendance recording, organized membership management, and digital program monitoring while improving the accuracy and reliability of gym records (Rao, 2022). This system can provide benefits to the gym owner and registered members by reducing manual work and supporting more organized gym operations.

Double Alpha Fitness Gym, located in Natumolan, Tagoloan, Misamis Oriental, is a membership-based fitness facility that still uses mostly manual processes. Attendance is recorded through logbooks, membership data is kept using manual forms, program bookings are handled through phone calls, Facebook, or walk-in requests, and payment transactions are recorded manually for cash and digital payments. Manual gym record management can make member information difficult to organize, update, and retrieve (Khan et al., 2022). Digital membership systems can provide a more organized way to manage member registration, subscription records, and activity information (Purnawan & Sancoko, 2025). These separate processes may cause delays, missing information, inconsistent records, and additional work for the gym owner.

The operations of Double Alpha Fitness Gym are affected by manual and non-integrated processes. One major issue is manual attendance recording, which may result in missing entries, incorrect time records, and difficulty reviewing attendance history. Another issue is delayed membership renewal caused by the absence of an automated system for monitoring membership status, renewal dates, and expiration dates. The gym also lacks automated exercise performance monitoring. Coaches mainly depend on direct observation to monitor members’ exercise movements and completed repetitions. This may become difficult when several members are exercising at the same time. Automated exercise recognition can identify exercise activities and reduce the need for manual workout recording (Hussain et al., 2022). In addition, manual payment recording may lead to inconsistent records, misplaced information, and difficulty preparing transaction reports. These issues reduce operational efficiency and make daily gym management more difficult.

To address the identified issues, this study proposes the Design and Development of a IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym. During member registration, the system will capture and store facial data for identification. For attendance, the camera will capture the member’s face and compare it with the enrolled facial data. After successful recognition, the system will automatically record the attendance with the corresponding date and time. Facial recognition systems can support automatic identity checking and attendance recording through live camera input (Rao, 2022). The system will also include a centralized membership database for managing member profiles, membership status, renewals, and expiration dates. Digital

membership platforms support the organized storage and monitoring of membership information (Purnawan & Sancoko, 2025). The gesture-based program monitoring module will use camera input to monitor only selected exercises included in the approved scope of the study. It will detect body landmarks, recognize defined movement patterns, and count completed repetitions (Bazarevsky et al., 2020). The feature will not monitor every exercise or provide a complete evaluation of correct posture. The system will also include payment transaction recording and report generation. These components will be integrated into one responsive web-based platform with an admin interface, backend processing, camera input, and a centralized database.

# PURPOSE AND DESCRIPTION

The purpose of this capstone project is to design and develop a IoT-Based Gym Management System for Double Alpha Fitness Gym. The system is intended to improve attendance tracking, membership management, program monitoring, and payment transaction recording. Facial recognition will be used to identify registered members and automatically record their attendance with the corresponding date and time. The system will also include gesture-based program monitoring that uses camera input to monitor selected exercises, recognize defined movement patterns, and count completed repetitions. This feature will only support the exercises included in the approved scope of the study and will not provide a complete evaluation of correct posture. In addition, the system will record cash, GCash, and Maya transactions. Once a payment is confirmed by the gym owner or authorized admin, the system will immediately update the payment status, transaction record, payment history, and related membership information. The system is planned to be developed using ReactJS for the frontend, Laravel and PHP for the backend, Python for facial recognition and gesture processing, and MySQL for centralized data storage and management.

The primary beneficiaries of the system are the gym owner or authorized admin and the registered members of Double Alpha Fitness Gym. The gym owner or authorized admin is expected to benefit from updated access to attendance records, membership status, program monitoring data, payment transactions, and system reports. Since many of the gym’s current operations are managed manually, the proposed system aims to organize member registration, facial data enrollment, facial recognition attendance, membership renewal and expiration monitoring, selected exercise repetition tracking, payment transaction recording, and report generation. Registered members will participate in the system during registration, facial data enrollment, facial recognition attendance, selected exercise monitoring, membership renewal, and admin-assisted payment confirmation. The system aims to provide organized, updated, and accessible records that can support faster monitoring and better decision-making. Its overall goal is to improve the accuracy, consistency, automation, and efficiency of gym-related operations.

## Conceptual Framework

## Figure 1.0 Input–Process–Output for the IoT-Based Gym Management System

This project adopts the Input–Process–Output (IPO) model to illustrate the flow of data and operational structure of the proposed IoT-Based Gym Management System. The system aims to improve traditional gym operations by reducing manual record-keeping and improving the management of attendance, membership, program monitoring, and payment transactions. Camera-based technologies can support automated attendance and exercise monitoring by using facial recognition and human movement detection (Rao, 2022). Through this model, the relationship between the data collected, the system processes, and the expected outputs is clearly presented.

The input phase consists of the data required for system operation, particularly for member registration, program assignment, and payment transaction recording. Under member registration, the system collects personal information, membership details, facial data enrollment, anthropometric data, and body type. The facial data enrollment is used as the member’s reference data for facial recognition attendance. The anthropometric data, such as height and weight, together with body type, is collected to support the coach in assigning a suitable fitness program after registration. Under program assignment, the system records the assigned fitness program given by the coach to the member. In addition, payment information is gathered, including payment method, amount, and transaction details. Digital gym and membership systems support the organized storage of member profiles, subscriptions, activity records, and related operational data (Purnawan & Sancoko, 2025).

In the process phase, the system performs several operations based on the collected data. These include member registration and data entry, facial recognition attendance, gesture-based program monitoring, package management, membership tracking, payment transaction recording, and data management with report generation. During attendance monitoring, the system uses the enrolled facial data to identify the registered member and record attendance with the corresponding date and time. During program monitoring, the system uses gesture-based monitoring to track exercise movements under the assigned fitness program. Camera-based human pose estimation can support the analysis of body movement in sports and physical exercise settings (Badiola-Bengoa & Mendez-Zorrilla, 2021).

The output phase presents the processed information in a structured and useful format. The system generates registered member profiles, attendance records and reports, program monitoring

reports, membership status reports, and payment transaction records. These outputs provide the gym owner or authorized admin with updated and accessible information that supports record management, monitoring, and decision-making in daily gym operations. Automated gym exercise recognition studies show that exercise data can be collected and processed to support workout monitoring and reduce manual workout recording (Hussain et al., 2022).

# OBJECTIVES OF THE STUDY

The general objective of the study is to design and develop a IoT-Based Gym Management System for Double Alpha Fitness Gym.

To achieve the general objective, the study will pursue the following specific objectives:

To gather data on gym operations, member registration, attendance tracking, package management, walk-in transactions, subscription records, program assignment, program monitoring, and payment transaction recording through interviews, observation, and document review (Dewi, 2022).

To design context diagrams, data flow diagrams, database structure, user interface design, and system architecture for the proposed IoT-Based Gym Management System using appropriate diagramming and design tools (Doyle, 2021).

To develop the following functions/modules:

Member Registration Module – captures and manages member information, including personal, anthropometric, and membership details, performs initial facial data enrollment, and records body type for program assignment and monitoring (Purnawan & Sancoko, 2025).

Program Monitoring Module – monitors selected exercise movements under the assigned fitness program using gesture-based recognition and records program monitoring results based on recognized movement patterns (Badiola-Bengoa & Mendez-Zorrilla, 2021; Bazarevsky et al., 2020).

Attendance Monitoring Module (Facial Recognition-Based) – identifies registered members using enrolled facial data and records their attendance with the corresponding date and time (Rao, 2022).

Package Management Module – manages available packages, prices, durations, and package types, including walk-in rates and membership plans (Purnawan & Sancoko, 2025).

Payment Transaction Module – records payment transactions such as cash, GCash, and Maya payments, generates payment records, and stores payment history (Kumar et al., 2022).

Reports Module – generates system reports including attendance, program monitoring, membership status, and payment transaction records (Nguyen et al., 2022).

To test the system using Scenario Testing and Integration Testing to verify the functionality of the developed modules and the communication between system components.

To evaluate the system based on performance, usability, reliability, and user satisfaction using evaluation forms and results from Scenario Testing and Integration Testing (ISO 25010, n.d.).

To deploy the system as a responsive web-based application accessible through desktop and mobile web browsers (Putra et al., 2025).

# SCOPE AND LIMITATION

This study focuses on the design and development of a IoT-Based Gym Management System for Double Alpha Fitness Gym located in Natumolan, Tagoloan, Misamis Oriental. The system is designed mainly for the gym owner or authorized admin, who will manage member registration, facial recognition attendance, membership records, program monitoring, payment transaction recording, and reports. Registered gym members will participate in the system through registration, facial data enrollment, facial recognition attendance, assigned fitness program monitoring, membership renewal, and admin-assisted payment recording.

The proposed system includes several main features. It uses facial recognition-based attendance monitoring to identify registered members using enrolled facial data and record attendance with the corresponding date and time (Rao, 2022). The system also includes a member registration module that stores personal information, membership details, facial data enrollment, anthropometric data such as height and weight, and body type. Anthropometric data and body type will be used as reference information for program assignment and monitoring. The program monitoring module will use gesture-based recognition to support the exercises included in the assigned fitness program. It will monitor exercise movements and count repetitions based on recognized movement patterns (Badiola-Bengoa & Mendez-Zorrilla, 2021). The system also includes package management for managing available gym packages, prices, durations, and package types, including walk-in rates and membership plans, while tracking membership status, renewals, and expirations (Purnawan & Sancoko, 2025). In addition, the payment transaction module will record cash, GCash, and Maya payments, generate payment records, and store payment history (Kumar et al., 2022). The reports module will generate attendance records, program monitoring reports, membership status reports, and payment transaction records. The system will be developed as a responsive web-based application using ReactJS, Laravel/PHP, Python, and MySQL (Putra et al., 2025).

Despite its features, the study has several limitations to keep the project manageable within its approved scope. The system is designed only for Double Alpha Fitness Gym and may require modification before it can be used in other fitness facilities. Facial recognition attendance depends on camera quality, lighting conditions, member face visibility, and the accuracy of enrolled facial data. Gesture-based program monitoring will support the exercises included in the assigned fitness program. However, it will not provide a complete evaluation of correct posture, exercise safety, or professional fitness form. The system will not provide medical diagnosis, health assessment, or automatic fitness recommendations based on anthropometric data or body type. The system does not include a native mobile application and will only be accessed through web browsers. Advanced

security features such as multi-factor authentication and penetration testing are not included due to limited time and resources (Allafi & Darem, 2025).

# DEFINITION OF TERMS

Admin. This refers to a person who manages and controls a system. In this study, the admin refers to the gym owner or authorized personnel who manages member registration, facial recognition attendance, membership records, program monitoring, payment transactions, and reports.

API. This refers to a set of rules that allows different software components to communicate with each other. In this study, it is used to connect the ReactJS frontend, Laravel backend, Python processing component, and MySQL database.

Application Layer. This refers to the part of a system that handles processing, business rules, and system functions. In this study, it refers to the backend layer that processes attendance, membership, program monitoring, payment transactions, and reports.

Attendance. This refers to the record of a person’s presence in a specific place or activity. In this study, it refers to the recorded presence of gym members through facial recognition with the corresponding date and time.

Authentication. This refers to the process of verifying the identity of a user before allowing access to a system. In this study, it is used to ensure that only the gym owner or authorized admin can access and manage the system.

Backend. This refers to the server-side part of a system that processes data and manages system logic. In this study, it refers to the Laravel and PHP-based part of the system that handles requests, records, and system operations.

Camera. This refers to a device used to capture images or video. In this study, it is used to capture facial data for attendance and body movement data for gesture-based program monitoring.

Centralized Database. This refers to a single database where system information is stored and managed. In this study, it is used to store admin accounts, member records, attendance logs, membership details, program monitoring data, payment transactions, and reports.

Client-Server Architecture. This refers to a system structure where the client sends requests and the server processes them. In this study, the admin web interface acts as the client, while the Laravel backend, Python processing component, and MySQL database handle processing and storage.

Computer Vision. This refers to a technology that allows a computer system to process and understand images or video. In this study, it is used to support facial recognition attendance and gesture-based program monitoring.

Cross-Platform Web-Based System. This refers to a web system that can be accessed through different devices using a browser. In this study, it means the owner or admin can access the system using a desktop, laptop, tablet, or mobile phone browser.

Data Layer. This refers to the part of a system responsible for storing and managing data.

In this study, it refers to the MySQL database layer that stores all system records.

Database. This refers to an organized collection of data stored and managed electronically. In this study, it is used to store member records, attendance logs, membership details, program monitoring data, payment transactions, and reports.

Device Input. This refers to data captured from physical devices connected to a system. In this study, it refers to camera input used for facial recognition attendance and gesture-based program monitoring.

Exercise Recognition. This refers to the process of identifying an exercise based on body movement patterns. In this study, it is used to identify selected exercises included in the approved scope of the program monitoring module.

Facial Data Enrollment. This refers to the process of capturing and storing a member’s facial data in the system. In this study, it is done during member registration so the system can later identify the member during attendance monitoring.

Facial Recognition. This refers to a technology used to identify or verify a person based on facial features. In this study, it is used to identify registered gym members and record their attendance.

Facial Recognition Attendance. This refers to an attendance method that uses facial recognition to identify a registered person. In this study, it is used to automatically record the attendance of gym members with the corresponding date and time.

Frontend. This refers to the user-facing part of a system that users interact with. In this study, it refers to the admin web interface developed using ReactJS.

Gesture-Based Program Monitoring. This refers to the monitoring of exercise movements based on body gestures or movement patterns. In this study, it is used to identify selected exercises and count completed repetitions under the member’s assigned fitness program.

Gym Management System. This refers to a software system used to manage gym-related operations and records. In this study, it refers to the proposed system that manages member registration, facial recognition attendance, membership monitoring, gesture-based program monitoring, payment transaction recording, and report generation.

Gym Member. This refers to a person registered in a fitness facility. In this study, it refers to a registered member of Double Alpha Fitness Gym who participates through registration, facial

data enrollment, facial recognition attendance, selected exercise monitoring, membership renewal, and admin-assisted payment recording.

Internet of Things. This refers to connected physical devices that collect, send, and exchange data through a network or the internet. In this study, it refers to the camera-based input connected to the system for attendance and program monitoring.

IoT Integration. This refers to the connection of physical devices to a digital system for data collection and processing. In this study, it refers to the integration of camera input with the system to support facial recognition attendance and gesture-based program monitoring.

Laravel. This refers to a PHP framework used for developing web-based applications. In this study, it is used to develop the backend logic, API services, and system processing functions.

Member Registration. This refers to the process of recording a person’s information to become part of an organization. In this study, it refers to the admin’s process of adding gym members, recording their membership information, and enrolling their facial data.

Membership. This refers to the status of being a registered member of an organization. In this study, it refers to the registration status, subscription details, renewal, and expiration records of gym members.

Membership Management. This refers to the process of handling membership records, status, and renewals. In this study, it is used to monitor active, expired, and renewed gym memberships.

Movement Pattern. This refers to the repeated body movement used to perform an exercise. In this study, it is used by the system to recognize selected exercises and count repetitions.

MySQL. This refers to a database management system used to store and manage data. In this study, it is used as the centralized database for storing all records of the gym management system.

Owner. This refers to the person who owns and manages an establishment. In this study, it refers to the owner of Double Alpha Fitness Gym who acts as the main user of the system.

Package Management. This refers to the process of organizing and maintaining available gym packages, including their types, rates, prices, and durations. In this study, it refers to the module used by the gym owner or authorized admin to manage walk-in rates and membership plans offered by Double Alpha Fitness Gym.

Payment Transaction. This refers to the process of recording payment-related information. In this study, it refers to the monitoring of gym membership payments, transaction dates, payment methods, payment status, and payment history.

PHP. This refers to a server-side scripting language used for web development. In this study, it is used together with Laravel to develop the backend functions of the system.

Pose Estimation. This refers to the process of detecting body points or body positions from images or video. In this study, it supports gesture-based program monitoring by helping the system recognize selected exercise movements.

Presentation Layer. This refers to the part of a system that provides the user interface. In this study, it refers to the admin web interface accessed by the owner or authorized admin through a web browser.

Program Monitoring. This refers to the process of observing and tracking participation in a program. In this study, it refers to monitoring selected exercise movements and completed repetitions under the member’s assigned fitness program.

Python. This refers to a programming language commonly used for automation, data processing, and artificial intelligence-related tasks. In this study, it is used to support facial recognition and gesture-based processing.

ReactJS. This refers to a JavaScript library used for building user interfaces. In this study, it is used to develop the responsive admin web interface of the gym management system.

Report Generation. This refers to the process of producing organized summaries from system records. In this study, it is used to generate attendance reports, membership reports, program monitoring reports, payment reports, and system logs.

REST API. This refers to a type of API that allows systems to communicate using web requests. In this study, it is used by the Laravel backend to process requests from the admin web interface and other system components.

# Chapter 2

# REVIEW OF RELATED LITERATURE AND STUDIES

Introduction

This chapter reviews published literature and previous studies that support and validate the statements discussed in Chapter 1. This review aims to provide both theoretical background and real-world evidence for the existing issues such as manual attendance recording, delayed membership monitoring, lack of automated exercise monitoring, and inconsistent payment transaction records. It also supports the recommended solution, which is a IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym. The chapter is arranged into four parts: Related Literature, which explains the ideas and technologies connected to the study; Related Studies, which reviews current systems and previous research similar to the proposed system and identifies their weaknesses; Synthesis, which combines the reviewed materials into a single argument that supports the development of the proposed system; and References, which provides all the sources cited throughout this chapter.

The sources reviewed in this chapter were selected based on how directly they relate to the issues identified in Chapter 1, the technologies used in the proposed system including face recognition attendance, camera-based exercise monitoring, membership record management, payment transaction recording, and web-based system tools, and how well their results reflect the daily operational challenges faced by Double Alpha Fitness Gym. Each source is analyzed not only for what it contributes but also for what it lacks, ensuring that the limitations found across different studies collectively justify the need for the proposed system.

## Related Literature

This part presents the main ideas and technologies that are connected to the study. The ideas covered include facial recognition-based attendance tracking, gesture-based program monitoring, gym membership administration, and payment transaction recording. The technologies covered include IoT-supported systems used in fitness centers, camera-based recognition, databases for managing member records, and web-based cross-platform access for real-time gym monitoring.

A Smart Attendance Management System (SAMS) is a technology designed to automate the process of recording and monitoring attendance using facial recognition technology. This system eliminates manual entry, reduces human error, and improves data accuracy while providing real-time reports for better record monitoring. The integration of facial recognition technology and automated databases enhances operational efficiency by preventing proxy attendance and simplifying attendance monitoring (Adekola et al., 2023). This concept is relevant to the present study because it supports the implementation of facial recognition-based attendance in the proposed IoT-Based Gym Management System, which aims to prevent attendance fraud, improve data accuracy, and reduce administrative workload at Double Alpha Fitness Gym.

Gym management systems are developed to replace manual processes and improve the efficiency of gym operations through digital technology. In manual systems, member information is recorded in physical logbooks and registers, making data sharing, monitoring, and management difficult. Manual record-keeping also provides limited security and increases the risk of data loss, errors, and mismanagement. In addition, searching for member information is time-consuming due to the lack of automated data handling. To address these problems, gym management software was introduced to computerize existing operations and reduce manual workload. The system improves data organization, accessibility, and operational efficiency through automated processes and digital record management (Khan et al., 2022). In relation to the present study, the proposed IoT-Based Gym Management System aims to replace manual attendance tracking and membership management with an automated and efficient digital platform for Double Alpha Fitness Gym.

Proper exercise form is important because incorrect movements can increase the risk of injury and make workouts less effective. Computer vision can help monitor a person's movements by analyzing body posture and motion through images or videos. However, recognizing workout form in an actual gym can be difficult because of different camera angles, gym equipment blocking parts of the body, lighting conditions, and differences in clothing. To address these challenges, the researchers developed a method that uses exercise movement patterns to improve workout form assessment. They also created the Fitness-AQA dataset, which includes three exercises: Back Squat, Barbell Row, and Overhead Press, with common workout errors identified by expert trainers. The results showed that the proposed method performed better than several existing 2D and 3D pose estimation methods. The study demonstrates that computer vision can be useful for analyzing exercise movements and identifying improper workout form (Parmar et al., 2022). This study is relevant to the present research because the proposed gym management system will use gesture-based monitoring to recognize and monitor members' exercise movements. However, the proposed system will extend this concept by integrating exercise monitoring with facial-recognition attendance and other gym management functions.

Exercise tracking systems are developed to support the monitoring and recognition of workout movements using camera-based technologies. A real-time digital exercise assistance system was developed using MediaPipe as the human pose estimation input and a Multi-Layer Perceptron model for exercise recognition. The system was designed to recognize simple exercises such as push-ups, pull-ups, and sit-ups based on pose estimation data. The study showed that MediaPipe-based exercise tracking can support accurate recognition of exercise movements and can be used as a basis for monitoring workout activities (Sim et al., 2024). In relation to the present study, the proposed IoT-Based Gym Management System will use gesture-based program monitoring to identify selected exercise movements and count completed repetitions at Double Alpha Fitness Gym. However, unlike complete posture correction systems, the proposed system will only focus on selected exercises included in the approved scope of the study.

Web-based gym management systems are developed to improve the monitoring and management of gym operations through digital platforms. The Evolve Fitness Gym Management System is a web-based platform that allows users to create and access accounts while providing features such as user login, dashboard access, schedule monitoring, payment tracking, and digital attendance monitoring. The study used the Waterfall Model as its software development approach, covering the phases of planning, analysis, design, development, testing, implementation, and maintenance. The system was developed using HTML, CSS, PHP, and database technologies, with XAMPP used for server and database management and Visual Studio for coding. The researchers also conducted client interviews to identify system requirements and gather feedback to improve the platform. The implemented system helped gym owners monitor members and manage transactions more efficiently while improving service quality (Cruz et al., 2024). In relation to the

present study, the proposed IoT-Based Gym Management System focuses on facial recognition attendance, membership management, payment transaction recording, program monitoring, and administrative reporting through a responsive web-based platform.

A gym management system is a software-based platform that helps administrators manage member records, membership plans, trainer schedules, attendance, and payment details in a centralized system. Traditional gym operations commonly rely on manual record-keeping, which is time-consuming and more prone to errors and data loss. To address these problems, the system provides a user-friendly interface that improves data accuracy, accessibility, and security. It also allows users to register, renew memberships, track fitness progress, receive automated notifications, and access digital receipts, while administrators can generate reports and monitor

overall gym performance. The system was developed using modern programming tools and database technologies to support real-time updates and smooth data management (Chaudhary, 2025). This study is relevant to the present study because it supports the development of an automated system that addresses manual record-keeping, attendance monitoring, data inconsistency, inefficient monitoring, and delays in membership and payment management at Double Alpha Fitness Gym.

AI-based posture correction systems are developed to improve exercise monitoring through real-time movement analysis. Traditional workout monitoring often relies on self-assessment or trainer observation, which may not consistently detect exercise movements during training sessions. To address this issue, AI posture correction systems use computer vision, pose estimation, and machine learning technologies to analyze body movements and classify exercise postures. A real-time AI posture correction service for powerlifting exercises such as the bench press, squat, and deadlift was developed using YOLOv5 and MediaPipe. The system collected three-dimensional joint coordinate data from multiple angles and used machine learning and deep learning models to classify exercise postures and provide corrective feedback in real time. The findings showed that pose estimation and machine learning can support exercise movement analysis in fitness environments (Ko et al., 2024). In relation to the present study, the proposed IoT-Based Gym Management System aims to use gesture-based program monitoring to identify selected exercise movements and count completed repetitions. Unlike full posture correction systems, the proposed system will not provide complete posture correction, safety evaluation, or professional fitness assessment.

IoT-based gym monitoring systems are developed to automate exercise tracking and improve the management of workout data in fitness environments. Traditional workout tracking often requires gym users to manually record exercises, equipment usage, and repetitions, which can be time-consuming and inconvenient. An IoT-based system used beacons with embedded inertial measurement units attached to gym equipment to automatically recognize and record exercise activities. The system integrated smartwatches, mobile applications, a cloud server, and a dashboard through Bluetooth and WiFi to provide real-time workout monitoring and data sharing for users and gym managers. The study showed that automated gym exercise monitoring can reduce manual workout logging and support smarter gym environments (Bian et al., 2023). In relation to the present study, the proposed IoT-Based Gym Management System also aims to reduce manual recording and improve workout monitoring. However, instead of using wearable devices or equipment-based sensors, the proposed system will use camera input for facial recognition attendance and gesture-based program monitoring.

## Related Studies

This part presents existing systems and previous research that are related to the proposed IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring. The studies covered include facial recognition attendance systems, sensor-based exercise recognition systems, exercise repetition counting systems, wearable-based gym activity recognition systems, and pose-based exercise monitoring systems. Each study is examined based on the system developed, the results produced, the limitations identified, and its relevance to the present study.

Balagtas et al. (2023) developed an attendance monitoring system that uses facial recognition to identify individuals and record their attendance. The system applied the Viola-Jones algorithm for face detection and Principal Component Analysis (PCA) for facial recognition. It was designed to detect multiple faces, match facial images, and store facial features in a database. The researchers also considered factors such as head rotation, image quality, and lighting conditions to improve the system's recognition performance. An alternative method of entering an identification number was also provided when the system failed to recognize a person's face after several attempts. The study demonstrated that facial recognition can reduce the time and effort required for traditional attendance monitoring. This study is related to the present research because the proposed gym management system will also use facial recognition to identify members and automatically record their attendance. However, the proposed system will apply the technology in a gym environment and combine facial recognition attendance with membership management and gesture-based program monitoring.

Jadhav et al. (2024) developed an attendance management system using face recognition to automate the process of attendance recording. The system used facial recognition technology to identify registered individuals and reduce the need for manual checking. The study showed that face recognition can improve attendance accuracy, reduce human error, and make attendance monitoring faster. However, the system was designed mainly for attendance management and was not developed for a gym environment. This limitation is addressed in the proposed IoT-Based Gym Management System for Double Alpha Fitness Gym by applying facial recognition attendance in a gym setting and integrating it with the system’s management and monitoring functions.

Valenzuela et al. (2025) developed and evaluated a facial recognition-based computer laboratory attendance monitoring system. The system used camera-based facial recognition to identify users and record attendance in a laboratory environment. The study showed that facial recognition can help modernize attendance monitoring and support more organized attendance records. However, the system was limited to a computer laboratory setting, which differs from the operational needs of a fitness facility. This limitation is relevant to the present study because the proposed system applies facial recognition attendance within the daily operations of Double Alpha Fitness Gym.

Rao (2022) developed AttenFace, a real-time attendance system using face recognition for educational institutions. The system used live camera input and classroom snapshots to identify students and automatically mark their attendance. The study showed that face recognition can reduce manual attendance work and help prevent proxy attendance. However, the system was designed for classroom attendance and was not intended for gym-based monitoring. These limitations are addressed in the proposed IoT-Based Gym Management System by applying facial recognition attendance to gym operations and connecting it with membership, program monitoring, payment transaction recording, and reports.

Hussain et al. (2022) created a sensor-based gym physical exercise recognition system that automatically identifies free weight exercises in gym settings. The system used a chest-worn accelerometer and Long Short-Term Memory neural networks to recognize different exercise activities. The study showed that automated exercise recognition can support workout tracking and reduce manual exercise logging. However, the system required users to wear a chest-mounted device, which may be inconvenient during workouts. This limitation is addressed in the proposed IoT-Based Gym Management System by using camera input for gesture-based program monitoring instead of requiring worn sensors.

Czekaj et al. (2024) developed a real-time sensor-based human activity recognition system for exercise recognition and repetition counting. The system was designed to recognize different athletic workout movements and count repeated actions using sensor-based data. The study showed that real-time exercise recognition and repetition counting can support automated workout monitoring. However, the system focused mainly on activity recognition and did not cover gym operation management. This gap is addressed in the proposed IoT-Based Gym Management System by combining exercise movement monitoring with the operational needs of Double Alpha Fitness Gym.

Mekruksavanich et al. (2024) developed a gym exercise activity recognition system using wearable multimodal sensor data from electromyography and inertial measurement unit sensors. The system used a residual deep learning method to recognize different gym exercise activities accurately and efficiently. The study showed that wearable sensor data can be used to classify gym workout activities. However, the system depended on wearable sensors attached to the user, which may require additional hardware and may not be practical for all gym members. The proposed IoT-Based Gym Management System addresses this limitation by using camera-based input for attendance and gesture monitoring in a more accessible gym setup.

Chen and Yang (2020) developed Pose Trainer, a pose-based exercise monitoring system that detects exercise posture and provides feedback using pose estimation. The system analyzed body movement during common exercises and used pose data to identify possible form mistakes. The study showed that pose estimation can support exercise monitoring and feedback during workouts. However, the system focused on posture correction rather than attendance and gym program monitoring. In relation to the present study, the proposed IoT-Based Gym Management System will use gesture-based program monitoring for selected exercise recognition and repetition counting as part of the gym’s monitoring process.

## Synthesis of the Study

The reviewed literature and studies show that digital systems are widely used to improve attendance monitoring, membership management, payment transaction recording, and exercise monitoring. The findings support the use of facial recognition for automated attendance because it can reduce manual checking, improve record accuracy, and help prevent proxy attendance. The reviewed sources also show that exercise tracking systems using camera input, pose estimation, and gesture recognition can support the monitoring of selected workout movements and repetition counting. In addition, web-based gym management systems and centralized databases help organize member records, payment records, and reports, making gym operations more efficient and easier to manage.

A common trend across the reviewed literature and studies is the use of automation to reduce manual work and improve the accuracy of records. Facial recognition systems are commonly used for faster and more reliable attendance monitoring, while camera-based and sensor-based exercise recognition systems are used to track workout movements. Web-based platforms also support easier access to system functions through desktop and mobile web browsers, while centralized databases help store and manage gym-related records. These technologies show that combining attendance monitoring, membership management, program monitoring, payment transaction recording, and reports can improve the daily operations of a fitness facility.

Despite these developments, several gaps are still evident in the existing studies. Some facial recognition attendance systems focus only on attendance recording and are commonly applied in schools or laboratories rather than gym environments. Some exercise monitoring systems focus only on movement recognition or posture correction and are not connected to attendance, membership, or payment records. Other sensor-based workout systems require wearable devices or additional equipment, which may not be practical for all gym members. In

addition, some gym management systems improve record handling but do not include facial recognition attendance and gesture-based program monitoring in one integrated platform.

These gaps justify the development of the proposed IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym. The proposed system addresses the identified limitations by integrating facial recognition attendance, selected exercise movement monitoring, package management, membership tracking, payment transaction recording, and report generation into one responsive web-based platform. By combining these features, the system aims to reduce manual record-keeping, improve attendance accuracy, support organized program monitoring, and provide the gym owner or authorized admin with updated records for better daily gym management.

# Chapter 3

# RESEARCH METHODOLOGY

## Introduction

This chapter explains the methodology used to design, develop, test, deploy, and maintain the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym. It presents the Modified Waterfall Software Development Life Cycle (SDLC), the activities in each phase, the tools to be used, and the expected outputs needed to ensure that the system meets the project objectives.

## Figure 2.0 Modified Waterfall Methodology (dela Cruz et al., 2025)

This chapter presents the methodology used in developing the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym. The study uses the Modified Waterfall Software Development Life Cycle (SDLC) model consisting of six phases: Requirements Gathering and Analysis, System Design, Development, Testing and Evaluation, Deployment, and Maintenance. The Modified Waterfall model was selected because it provides a structured and organized approach while allowing revisions and feedback between phases during development. Unlike the traditional Waterfall model, it supports limited revisions to improve system quality and address issues identified during testing. This model is suitable for the study since the system involves camera-based facial recognition, gesture-based program monitoring, attendance tracking, membership management, payment transaction recording, and report generation. It also enables the researchers to identify errors early, such as facial recognition issues, gesture monitoring errors, camera input problems, and system bugs, allowing necessary corrections before proceeding to the next phase.

The Modified Waterfall SDLC model supports continuous refinement throughout the development process. During the Requirements Gathering and Analysis phase, the researchers will identify the system requirements and existing problems encountered by the gym. The System

Design phase will focus on the system architecture, database structure, and user interface design. The Development phase will involve coding and integrating the facial recognition attendance and gesture-based program monitoring features into the system. The Testing and Evaluation phase will assess the system’s functionality, reliability, usability, and performance while identifying necessary improvements. After testing, the system will be deployed for actual or pilot use. Lastly, the Maintenance phase will allow updates, corrections, and enhancements based on user feedback and technical issues encountered after implementation.

## Requirements and Analysis

In this phase, the proponents will align the system’s functional and non-functional requirements with the gym owner’s identified pain points, including manual attendance recording, delayed membership renewals, manual payment recording, lack of organized program monitoring, and data inconsistency. The objective is to translate client needs into a verifiable Software Requirements Specification (SRS). Activities will include a structured interview with the owner of Double Alpha Fitness Gym in Natumolan, Tagoloan, Misamis Oriental, supported by observation and documentation of current manual processes such as logbooks, membership forms, program records, cash payments, digital payment records, and handwritten receipts. The interview results will serve as the primary basis for identifying the functional requirements, non-functional requirements, system constraints, and priority modules of the proposed system. The proponents will then map each problem to a technical requirement, such as facial recognition attendance to reduce manual attendance recording, automated renewal tracking to reduce missed membership deadlines, gesture-based program monitoring to record selected exercise movements and repetitions, and a payment transaction module for accurate financial records.

The main tool to be used during requirements gathering is an interview guide. The interview guide will contain prepared questions for the gym owner to identify the current problems, existing manual processes, needed system features, expected outputs, and limitations of the proposed system. The proponents will also review the gathered information to determine the needed requirements for facial recognition attendance, package management, membership tracking, program assignment, gesture-based program monitoring, payment transaction recording, and report generation. For the facial recognition attendance component, the proponents will identify the needed facial data enrollment process and basic accuracy target to guide testing and evaluation. For the gesture-based program monitoring component, the proponents will identify the selected exercises to be included in the approved scope of the study. The expected outcome of this phase is a finalized SRS document detailing six modules: Member Registration, Attendance Monitoring, Program Monitoring, Package Management, Payment Transaction, and Reports. This document will serve as the guide for all design and development decisions.

By the end of the Requirements and Analysis phase, the proponents will seek approval of the SRS from the gym owner to ensure that the proposed system directly addresses the documented problems. The proponents will also identify scope boundaries, including no native mobile application, web-based access only, basic authentication, no full payment gateway integration, no medical diagnosis, and no complete posture correction or professional fitness assessment. This clarity will prevent feature creep and maintain alignment with the gym’s operational reality.

## System Design

The System Design phase will turn the gathered requirements into a clear technical plan for the proposed system. This phase will help the proponents design the system models, database structure, system architecture, and user interface of the IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring. The design will focus on solving the problems found in the previous phase, such as manual attendance recording, delayed membership renewal, inaccurate payment records, and the need to monitor selected gym program activities properly.

In this phase, the proponents will create system design diagrams that will guide the development of the system. Use case diagrams (UCDs) will show how the Owner/Admin, gym members, and the system interact with each other. The Owner/Admin will be the main user who can manage member registration, attendance records, gym packages, membership records, payment transactions, program monitoring, and reports. Gym members will be represented as external participants because they do not have a separate system interface. Their participation is limited to providing registration information, enrolling facial data, using facial recognition attendance, participating in selected exercise monitoring, and completing admin-assisted payment confirmation. The Owner/Admin remains the primary system actor who manages all system functions through the admin web interface. Data flow diagrams (DFDs) will show how member information, attendance records, membership status, payment records, facial recognition data, gesture monitoring data, and reports move through the system. An entity-relationship diagram (ERD) will also be made to design the MySQL database tables for admin accounts, members, attendance records, packages, memberships, payments, program records, facial recognition data, gesture monitoring records, and reports.

A system architecture diagram will also be created to show how the main parts of the system work together. The system will have a Presentation Layer, Application Layer, Data Layer, and IoT/Device Integration Layer. The Presentation Layer will use ReactJS and can be accessed through desktop and mobile web browsers. The Application Layer will use Laravel REST API, PHP, and a Python-based processing component to handle facial recognition attendance, membership records, payments, reports, and gesture-based program monitoring. The Python component will process enrolled facial data, facial recognition results, and selected exercise movement data, then send the results to the Laravel backend through an API or controlled backend integration. The Data Layer will use a centralized MySQL database, while the IoT/Device Integration Layer will include cameras or webcams used for facial recognition attendance and gesture-based program monitoring. User interface prototypes will also be designed using Figma to show the layout of the admin dashboard, member registration, attendance monitoring, package management, membership tracking, payment transaction, program monitoring, and report pages. The outputs of this phase will be the system diagrams, database design, system architecture diagram, API references, and UI prototypes that will guide the Development phase.

Development

In the Development phase, the proponents will translate the approved system design and architecture into a working web-based system. The frontend will be developed using ReactJS with

Tailwind CSS to provide a responsive and cross-platform admin interface that can be accessed through different screen sizes such as desktop, laptop, tablet, and mobile browser. The interface will allow the Owner/Admin to manage member registration, attendance monitoring, package records, membership records, payment transactions, program monitoring, and reports. Since the system is web-based, no native mobile application will be developed.

The backend will be developed using Laravel/PHP and will serve as the main application layer of the system. It will handle authentication, member management, facial data enrollment records, facial recognition attendance records, package management, membership tracking, payment transaction recording, notification or renewal tracking, and report generation. The backend will be implemented through REST API endpoints to allow structured communication between the ReactJS frontend, the MySQL database, and the device-related inputs.

The system will also include a Python-based processing component for facial recognition attendance and gesture-based program monitoring. For attendance, the component will process facial data captured through the camera and compare it with the enrolled facial data of registered members. After successful recognition, the attendance record will be sent to the Laravel backend for storage. For program monitoring, the component will process camera input to detect body landmarks, identify selected exercise movements, and count completed repetitions based on the approved scope of the study. All validated records, including member profiles, attendance logs, membership records, payment transactions, facial recognition data, gesture monitoring data, and reports, will be stored in the centralized MySQL database.

Development tools will include Visual Studio Code for coding, Composer for Laravel dependencies, npm for ReactJS packages, Git/GitHub for version control, and Postman for API testing. Python libraries for facial recognition and gesture processing may be used to support the camera-based recognition components. The expected output of this phase is a fully integrated system where the Owner/Admin can register members, enroll facial data, record attendance through facial recognition, monitor selected exercise movements and repetitions, record payments, manage gym packages and membership records, and generate reports through a responsive admin web interface.

Figure 3.0 System Architecture of the IoT-Based Gym Management System

The proposed system architecture for the Design and Development of an IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring for Double Alpha Fitness Gym follows a layered client-server architecture composed of the Presentation Layer, Application Layer, Data Layer, and IoT/Device Integration Layer. This architecture is designed to support the main system functions such as member registration, facial recognition attendance monitoring, package management, membership tracking, gesture-based program monitoring, payment transaction recording, and report generation. The Owner/Admin serves as the main user of the system, while gym members participate during registration, facial data enrollment, facial recognition attendance, selected exercise monitoring, and admin-assisted payment confirmation. By separating the system into different layers, the architecture helps organize system development and improve communication between components.

The Presentation Layer represents the web-based admin interface developed using ReactJS and accessed through web browsers on different devices. Through this layer, the Owner/Admin can manage members, monitor attendance, record payments, monitor gym programs, and generate reports. The Application Layer serves as the main processing component of the system and is developed using Laravel REST API, PHP, and a Python-based processing component. It handles authentication, facial data enrollment, facial recognition attendance processing, package management, membership tracking, payment transaction recording, notifications, gesture-based program monitoring results, and report generation. The IoT/Device Integration Layer includes cameras or webcams that capture facial data and exercise movement data and send them to the backend or Python processing component for recognition, processing, and storage.

The Data Layer stores and manages all system records using a centralized MySQL database. This includes admin accounts, member profiles, attendance logs, payment records, package records, membership records, facial recognition data, gesture monitoring data, program records, and reports. The centralized database helps ensure organized and accurate record management for monitoring and reporting purposes. Overall, the proposed architecture provides a structured and technology-driven system that helps improve operational efficiency, reduce manual work, and support reliable attendance, membership, payment, and program monitoring processes within Double Alpha Fitness Gym.

## Testing and Evaluation

During the Testing and Evaluation phase, the proponents will verify that the developed IoT-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring meets the identified system requirements and objectives. The testing strategy will focus on Scenario Testing and Integration Testing to assess the functionality of the system and the communication between its components. These approaches will help identify errors in attendance recording, package management, membership tracking, payment transactions, gesture-based program monitoring, and report generation. The identified issues will be documented and corrected to ensure that the system performs its intended functions before deployment.

Scenario Testing will be conducted to evaluate the system based on actual situations encountered during daily gym operations. The proponents will prepare test scenarios covering member registration, facial data enrollment, facial recognition attendance, package selection and management, membership renewals, payment transaction recording, gesture-based program monitoring, and report generation. For example, the testing will determine whether the system correctly identifies a registered member through facial recognition and records the corresponding attendance date and time. It will also verify whether selected exercise movements are recognized and completed repetitions are counted correctly. Additional scenarios will include expired memberships, unsuccessful facial recognition, incorrect information, and payment confirmation to determine whether the system responds appropriately to different conditions.

Integration Testing will be conducted to verify the communication and data exchange between the ReactJS frontend, Laravel/PHP backend, Python-based facial recognition and gesture processing component, and MySQL database. The proponents will use Postman to test API requests and responses and determine whether information is correctly transmitted, processed, and stored. For example, after successful facial recognition, the Python processing component will send the recognition result to the Laravel backend, which will validate and store the attendance record in the MySQL database. Similarly, package selections, membership updates, confirmed payment transactions, and exercise repetition results will be checked to ensure that the information is correctly reflected in the corresponding records and reports.

The tools for testing and evaluation will include a scenario testing checklist, integration testing checklist, Postman, browser testing tools, and an ISO 25010 evaluation questionnaire. The testing checklists will document the test scenarios, expected results, actual results, and testing status. Postman will be used to verify API communication, while browser testing tools will support the checking of system accessibility and responsiveness through desktop and mobile web browsers. The ISO 25010 evaluation questionnaire will be used to gather feedback from the gym owner or authorized admin and selected registered members based on applicable software quality characteristics, including functional suitability, performance efficiency, usability, reliability, and security.

The proponents will document and review the results of Scenario Testing and Integration Testing to determine whether the developed system meets the identified requirements. Any errors discovered during testing will be recorded, corrected, and tested again to verify that the issues have been resolved. The evaluation results and user feedback will serve as the basis for identifying necessary improvements and determining the system's readiness for deployment at Double Alpha Fitness Gym.

## Deployment

In the Deployment phase, the proponents will release the fully tested system into the live or pilot environment of Double Alpha Fitness Gym to support the replacement of manual logbooks and paper-based transaction records. Activities will include preparing the hosting environment, configuring the database, setting up the Laravel backend, building the ReactJS frontend, and enabling secure access where available. If an online server is used, SSL configuration will be prepared to protect attendance logs, payment records, and facial data. If the system is deployed locally for capstone demonstration, the same deployment process will be simulated on a local server.

Tools to be used may include a Laravel-supported hosting environment or local server setup, database migration scripts, Laravel’s scheduler for membership expiration checks, and backup tools for database protection. The proponents will create the required tables for members, packages, attendance records, memberships, payments, facial recognition data, gesture monitoring data, program records, and reports. Existing members may be encoded into the system and undergo

facial data enrollment. For attendance, members will face the camera so the system can recognize them and record their attendance. For the gesture-based program monitoring module, a webcam or USB camera will be installed and tested under actual gym lighting conditions. The expected outcome is a working deployment where members can use facial recognition attendance and the camera-based module can support selected exercise movement monitoring.

The gym owner will be trained on registering new members, enrolling facial data, monitoring attendance, recording payments, checking membership status, monitoring selected exercise programs, and generating reports. User documentation will include a quick guide for members and an admin guide for the owner. A backup procedure will also be prepared to reduce the risk of data loss. The phase will end with deployment verification and user confirmation that the system is ready for actual or pilot use.

## Maintenance

The Maintenance phase will ensure that the system continues to deliver its core objectives: accurate attendance monitoring, automated renewal tracking, organized program monitoring, and reliable payment transaction records after deployment. The proponents will monitor system logs and database performance to detect errors such as failed login attempts, slow attendance recording, facial recognition issues, or gesture monitoring errors. Bug reports from the gym owner or members may be collected through a communication channel and tracked in GitHub Issues, prioritized as critical, major, or minor.

Maintenance tools may include Laravel logs, MySQL database checks, GitHub Issues, and periodic database backup procedures. For the facial recognition module, the proponents will monitor recognition accuracy and update enrolled facial records when needed due to changes in lighting, camera position, or member appearance. For the gesture-based program monitoring module, the proponents will monitor recognition results and adjust selected exercise movement rules when necessary within the approved scope of the study. The expected outcome of maintenance is a stable system with corrected errors, updated records, and continued usability after implementation.

The proponents will also handle minor feature enhancements within the approved scope, such as improving report formats, recognition feedback, or monitoring display. Major additions, including multi-factor authentication, full payment gateway integration, native mobile applications, wearable IoT devices, and other advanced IoT sensors, will be documented as future work because they are outside the scope of the study. A maintenance report may be prepared to summarize bugs fixed, updates made, and user feedback received.

## REFERENCE(s)

Adekola, O. D., Owelle, K., Daramola, J. C., Mgbeahuruike, E., Adeoti, B. E., & Akande, O. (2023). Student attendance monitoring system using facial recognition. Current Trends in Information Communication Technology Research, 2(1), 47–59.

Allafi, R., & Darem, A. A. (2025). Usability and security in online authentication systems. International Journal of Advanced and Applied Sciences, 12(6). https://www.researchgate.net/publication/392835487_Usability_and_security_in_online_ authentication_systems

Badiola-Bengoa, A., & Mendez-Zorrilla, A. (2021). A systematic review of the application of camera-based human pose estimation in the field of sport and physical exercise. Sensors, 21(18), Article 5996. https://doi.org/10.3390/s21185996

Balagtas, I., Padaon, J., & Punzalan, B. C. (2023). Attendance Monitoring System using Facial Recognition applying Viola-Jones and Principal Component Analysis Algorithm. https://www.ejournals.ph/article.php?id=19728

Bazarevsky, V., Grishchenko, I., Raveendran, K., Zhu, T., Zhang, F., & Grundmann, M. (2020). BlazePose: On-device real-time body pose tracking. arXiv. https://doi.org/10.48550/arXiv.2006.10204

Bian, S., Rupp, A., & Magno, M. (2023). Fully automatic gym exercises recording: An IoT solution. arXiv. https://arxiv.org/abs/2305.17594

Chaudhary, A. (2025). Gym management system. International Journal of Sciences and Innovation Engineering. https://doi.org/10.70849/ijsci

Chen, S., & Yang, R. R. (2020). Pose Trainer: Correcting exercise posture using pose estimation. arXiv. https://doi.org/10.48550/arXiv.2006.11718

Cruz, J. D. D., Alejano, J., Cambronero, R. C., Gregia, E., Valdez, H. J., & Pornasdoro, R. J. B. (2024). Evolve Fitness Gym Management System. Ascendens Asia Singapore – Bestlink College of the Philippines Journal of Multidisciplinary Research Abstracts, 6(1). https://ojs.aaresearchindex.com/index.php/aasgbcpjmra/article/view/16919

Czekaj, Ł., Laskowski, D., Horoba, K., Wodarski, P., & Gzik, M. (2024). Real-time sensor-based human activity recognition for eFitness and eHealth platforms. Sensors, 24(12), Article 3891. https://doi.org/10.3390/s24123891

dela Cruz, R. A., Alcantara, G. S., Gacer, D. B., Garing, G. A. M. D., & Ual, J. R. S. (2025). Attendance face recognition app for Talangan Integrated National High School. IEEE-SEM Journal, 13(2).

Dewi, I. G. A. A. O. (2022). Understanding data collection methods in qualitative research: The perspective of interpretive accounting research. Journal of Tourism Economics and Policy, 1(1), 23–34. https://doi.org/10.38142/jtep.v1i1.105

Doyle, K. (2021, March 29). Diagrams.net vs. Lucidchart: A few things to consider. TechTarget. https://www.techtarget.com/searchapparchitecture/tip/Diagramsnet-vs-Lucidchart-A-few-things-to-consider

GeeksforGeeks. (2022, October 6). Difference between unit, functional, acceptance, and integration tests. GeeksforGeeks. https://www.geeksforgeeks.org/software-testing/difference-between-unit-functional-acceptance-and-integration-tests/

Hussain, A., Zafar, K., Baig, A. R., Almakki, R., AlSuwaidan, L., & Khan, S. (2022). Sensor-based gym physical exercise recognition: Data acquisition and experiments. Sensors, 22(7), Article 2489. https://doi.org/10.3390/s22072489

ISO 25010. (n.d.). ISO/IEC 25010. https://iso25000.com/index.php/en/iso-25000-standards/iso-

25010

Jadhav, A., Kamble, D., Rathod, S. B., Kumar, S., Kadam, P., & Dalwai, M. (2024). Attendance management system using face recognition. IAES International Journal of Artificial Intelligence, 13(1), 673–679. https://doi.org/10.11591/ijai.v13.i1.pp673-679

Khan, P. S. K. F., Mohan, P. K., Gautam, K. P., Munir, S. A., & Bogiri, N. (2022). Gym management system. International Journal of Trend in Scientific Research and Development, 6(3), 459–462. https://www.ijtsrd.com/papers/ijtsrd49542.pdf

Ko, Y.-M., Nasridinov, A., & Park, S.-H. (2024). Real-time AI posture correction for powerlifting exercises using YOLOv5 and MediaPipe. IEEE Access, 12, 195830–195857. https://doi.org/10.1109/ACCESS.2024.3516723

Kumar, V., Patel, S., & Mehta, R. (2022). Web-based financial transaction and record management system using database integration. https://doi.org/10.1109/ICICCS53718.2022.9788291

Mekruksavanich, S., Jitpattanakul, A., & Hnoohom, N. (2024). A residual deep learning method for accurate and efficient recognition of gym exercise activities using electromyography and IMU sensors. Applied System Innovation, 7(4), Article 59. https://doi.org/10.3390/asi7040059

Nguyen, V. D., Khoa, H. V., Kieu, T. N., & Huh, E.-N. (2022). Internet of Things-based intelligent attendance system: Framework, practice implementation, and application. Electronics, 11(19), Article 3151. https://doi.org/10.3390/electronics11193151

Parmar, P., Gharat, A., & Rhodin, H. (2022). Domain knowledge-informed self-supervised representations for workout form assessment. arXiv. https://arxiv.org/abs/2202.14019

Purnawan, A. A., & Sancoko, S. D. (2025). Perancangan dan implementasi FitSphere sebagai aplikasi Android untuk manajemen keanggotaan gym di Chain Gym. J-INTECH: Journal of Information and Technology, 13(2), 282–291. https://doi.org/10.32664/j-intech.v13i02.2132

Putra, F. P. E., Efendi, R. W., Tamam, A. B., & Pramadi, W. A. (2025). Trends and best practices in API-based web development using Laravel and React. Brilliance Research of Artificial Intelligence, 5(1), 223–233. https://doi.org/10.47709/brilliance.v5i1.5971

Rao, A. (2022). AttenFace: A real-time attendance system using face recognition. In 2022 IEEE 6th Conference on Information and Communication Technology (CICT) (pp. 1–5). IEEE. https://doi.org/10.1109/CICT56698.2022.9998001

Sim, K. S., Wong, S. W., Low, A., Yunus, A. P., & Lim, C. P. (2024). Real-time digital assistance for exercise: Exercise tracking system with MediaPipe angle directive rules. JOIV: International Journal on Informatics Visualization, 8(4), 2380–2387. https://doi.org/10.62527/joiv.8.4.2993

Valenzuela, J. T., Sandigan, C. R., Villar, C. R., Litang, L. R., Obligado, J. D., Jr., & Masungsong,

R. A. S. (2026). Development and evaluation of a facial recognition-based computer laboratory attendance monitoring system. Advances in Engineering and Information Sciences, 1(2). https://doi.org/10.54610/aeis.v1i2.207

# APPENDIX – A

Scanned Copy of the Received Letter of the Client

# APPENDIX – B

Scanned Copy of the Interview Guide Questions
