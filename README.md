# 🏋️‍♂️ Smart Gym Management System with AI Vision & Gesture Engine

## 📌 System Overview

The **Smart Gym Management System** is a next-generation gym management platform designed to automate operations, member tracking, and exercise verification through AI-powered computer vision. 

By integrating **Biometric Facial Recognition** and **Real-Time Computer Vision Pose Tracking**, the system eliminates manual attendance logging and gives coaches automated tools to monitor athlete performance and workout compliance.

> **README updated November 17, 2026** to describe the system as built. Detailed documents are in `DOCUMENTATION/` and `Correct_Diagrams/`; the list of changes is in `Updated Current Plan For Development/ChangeIMade2.0Features.md`.

---

## 🛠️ Technology Stack & System Components

### 🎨 Frontend Technologies
- **React 19**: Modern UI library for building component-based single-page application (SPA) interfaces.
- **Vite 8**: Fast frontend build tool and local development server.
- **Tailwind CSS v4**: Utility-first CSS framework for modern, responsive UI styling.
- **React Router v7**: Declarative client-side routing and page navigation.
- **Recharts**: Data visualization library for interactive membership, revenue, and attendance analytics.
- **FullCalendar**: Calendar for subscriptions, classes and events on the Packages page.
- **Axios**: Promise-based HTTP client for API communication with the Laravel backend.
- **MJPEG video feed**: The Gesture Engine streams annotated frames that the monitors show in an image element.

### ⚙️ Backend Technologies
- **Laravel 12**: PHP web framework powering REST API services, business logic, and database operations.
- **PHP 8.2+**: Core server-side execution language.
- **Laravel Sanctum**: Token-based API authentication for the administrator login (email and password only; a forgotten password is recovered with an emailed PIN).
- **MySQL**: Relational database management system for storing member profiles, attendance, plans, transactions, and workout logs.
- **Carbon**: Date and time manipulation library for operating hours verification and attendance timestamping.

### 🤖 AI Vision & Gesture Engine Technologies
- **Python 3.10+**: Core programming language for data processing and computer vision algorithms.
- **OpenCV (`opencv-python`)**: Computer vision library for processing live video streams and image frames.
- **MediaPipe**: Cross-platform ML framework for real-time human pose landmark tracking and body joint detection.
- **Scikit-Learn**: Machine learning library powering the workout classification model (`workout_model.pkl`).
- **OpenCV YuNet + SFace**: Deep-learning face landmark and face recognition models for biometric identity verification.
- **Flask & Flask-CORS**: Lightweight Python web framework providing live camera feed endpoints and bridge APIs.
- **NumPy & Requests**: High-performance numerical matrix computations and HTTP bridge communication to Laravel API.

### 📹 Hardware & Network Integrations
- **Hikvision CCTV Cameras**: IP-based surveillance cameras connected via Real-Time Streaming Protocol (RTSP). Optional.
- **USB Webcams and phone cameras**: Enough for a small gym or a demo; the engine reads them directly.
- **Local Area Network (LAN)**: IP-based RTSP streaming and cross-device communication.

---

## 🚀 Key Modules & Functional Capabilities

### 🤖 1. AI Facial Recognition Attendance System
- **Touchless Check-In**: Automatically identifies registered members as they enter the gym using live camera feeds.
- **Operating Hours Enforcement**: Automatically restricts and records attendance logs strictly within operational gym hours (9:00 AM – 9:30 PM).
- **Single Daily Check-In Rule**: Ensures accurate daily attendance records by logging a member's check-in once per calendar day.
- **Manual Check-In**: When a face is shown as Unknown, the admin can check the member in by hand with a reason.
- **Renewal Flag and Inactivity Rule**: A member with an expired subscription is flagged RENEW on the live feed. A member with no check-in for a month becomes Inactive and is set back to Active by the next check-in.

---

### 💪 2. AI Workout & Gesture Verification Engine
- **Pose Landmark Detection**: Analyzes body movement landmarks in real-time to detect physical exercises.
- **Repetition Counting**: For squat, push-up, curl and sit-up, repetitions are counted from the joint angle and saved as progress until the target sets × reps is reached.
- **Automatic Task Verification**: When the camera recognizes the assigned exercise, the task is marked verified. Other exercises are verified when recognized.
- **Training Plans**: The admin or coach builds a 7-day plan (exercise, date, sets, reps) from the member's profile.
- **Coach Members Only**: Only members with an active With Coach subscription are tracked by the camera.
- **Manual Verification Fallback**: The coach can verify any task by hand when the camera cannot check it.
- **Program Monitoring Report**: Reports has a Program Monitoring tab with assigned, verified and counted repetitions per member.

---

### 👥 3. Member Directory & Fitness Profile Management
- **Biometric Enrollment**: Links high-accuracy face reference data directly to member profiles.
- **Face Consent**: Face enrollment needs the member's consent, and the date is saved.
- **Full Member Records**: Stores contact details, address, date of birth, and the member's subscription history.
- **Body Metrics**: Records height, weight and body type (Ectomorph, Mesomorph or Endomorph).
- **Individual Activity Log**: Comprehensive view of individual attendance history, assigned workout plans, and completed exercise sessions.

---

### 💳 4. Membership & Subscription Lifecycle Management
- **Price List**: Create, edit and delete packages (name, category, days, price, color). A package that members are subscribed to cannot be deleted.
- **Renew and Upgrade**: Renew extends a running subscription from its end date (or starts a new one today if it ended). An upgrade charges only the balance. A payment record is created automatically.
- **Automated Membership Status**: System continuously monitors subscription end dates and updates statuses:
  - 🟢 **Active**: Valid active membership.
  - 🟡 **Expiring Soon**: Membership expiring within 7 days.
  - 🔴 **Expired**: Past renewal date.

---

### 💰 5. Financial Transactions & Receipt Management
- **Payment Processing**: Log payment records for memberships, renewals, and day passes.
- **Transaction History**: Searchable and filterable transaction tables with custom date ranges.
- **Printable Receipts**: Generates standardized digital receipts suitable for printing or recordkeeping.

---

### 📹 6. Security & Live Camera Feed Monitor
- **Live Stream View**: The Attendance Monitor and Gesture Monitor show the live camera feed with names, and the camera can be switched (webcam, phone or CCTV).
- **Today's Check-Ins**: The Attendance Monitor lists the check-ins of the day.

---

### 📊 7. Executive Dashboard & Analytics
- **At-a-Glance Metrics**: Real-time stats on total active members, today's attendance count, expiring plans, and daily revenue.
- **Graphical Analytics**: Charts for attendance trends, memberships and sales.
- **Reports**: Payments, Memberships, Attendance and Program Monitoring, each exportable as CSV or print.
- **Notification System**: Instant alerts notifying staff about upcoming subscription renewals, system events, and security notifications.

---

## 👥 Supported Roles & Workflows

### 🛡️ Administrator (Gym Owner and Coach)
- One shared login. Manages member records, packages and subscriptions, payments, reports, training plans and manual verification, and watches the live camera feeds. The owner and the coach use the same account.

### 🧘 Member / Athlete
- Never logs in. Gives personal details and consent, is enrolled by the admin, checks in by facing the camera, and performs assigned exercises in camera view.
