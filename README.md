# 🏋️‍♂️ Smart Gym Management System with AI Vision & Gesture Engine

## 📌 System Overview

The **Smart Gym Management System** is a next-generation gym management platform designed to automate operations, member tracking, and exercise verification through AI-powered computer vision. 

By integrating **Biometric Facial Recognition** and **Real-Time Computer Vision Pose Tracking**, the system eliminates manual attendance logging and gives coaches automated tools to monitor athlete performance and workout compliance.

---

## 🛠️ Technology Stack & System Components

### 🎨 Frontend Technologies
- **React 19**: Modern UI library for building component-based single-page application (SPA) interfaces.
- **Vite 8**: Fast frontend build tool and local development server.
- **Tailwind CSS v4**: Utility-first CSS framework for modern, responsive UI styling.
- **React Router v7**: Declarative client-side routing and page navigation.
- **Recharts**: Data visualization library for interactive membership, revenue, and attendance analytics.
- **FullCalendar**: Feature-rich calendar component for tracking attendance and scheduled workout plans.
- **Axios**: Promise-based HTTP client for API communication with the Laravel backend.
- **JSMpeg Player**: Low-latency video streaming player for live camera feeds.

### ⚙️ Backend Technologies
- **Laravel 11 / 12**: PHP web framework powering REST API services, business logic, and database operations.
- **PHP 8.2+**: Core server-side execution language.
- **Laravel Sanctum**: Secure token-based API authentication for administrator login sessions.
- **MySQL**: Relational database management system for storing member profiles, attendance, plans, transactions, and workout logs.
- **Carbon**: Date and time manipulation library for operating hours verification and attendance timestamping.

### 🤖 AI Vision & Gesture Engine Technologies
- **Python 3.10+**: Core programming language for data processing and computer vision algorithms.
- **OpenCV (`opencv-python`)**: Computer vision library for processing live video streams and image frames.
- **MediaPipe**: Cross-platform ML framework for real-time human pose landmark tracking and body joint detection.
- **Scikit-Learn**: Machine learning library powering the workout classification model (`workout_model.pkl`).
- **`face_recognition`**: Deep-learning facial recognition library for biometric identity verification.
- **Flask & Flask-CORS**: Lightweight Python web framework providing live camera feed endpoints and bridge APIs.
- **NumPy & Requests**: High-performance numerical matrix computations and HTTP bridge communication to Laravel API.

### 📹 Hardware & Network Integrations
- **Hikvision CCTV Cameras**: IP-based surveillance cameras connected via Real-Time Streaming Protocol (RTSP).
- **USB Webcams**: Plug-and-play video capture support for demo setups and desktop installations.
- **Local Area Network (LAN)**: IP-based RTSP streaming and cross-device communication.

---

## 🚀 Key Modules & Functional Capabilities

### 🤖 1. AI Facial Recognition Attendance System
- **Touchless Check-In**: Automatically identifies registered members as they enter the gym using live camera feeds.
- **Operating Hours Enforcement**: Automatically restricts and records attendance logs strictly within operational gym hours (9:00 AM – 9:30 PM).
- **Single Daily Check-In Rule**: Ensures accurate daily attendance records by logging a member's check-in once per calendar day.

---

### 💪 2. AI Workout & Gesture Verification Engine
- **Pose Landmark Detection**: Analyzes body movement landmarks in real-time to detect physical exercises.
- **Automated Rep & Task Verification**: Automatically detects and verifies workouts assigned by gym coaches (e.g., Squats, Bicep Curls, Pushups).
- **Coach Supervisor Mode**: Allows coaches to assign custom workout tasks to members. Once the AI camera detects proper exercise execution, the task is marked completed automatically.
- **Manual Verification Fallback**: Provides coaches with a biometrically secured option to manually verify obscure or unassisted workout routines.

---

### 👥 3. Member Directory & Fitness Profile Management
- **Biometric Enrollment**: Links high-accuracy face reference data directly to member profiles.
- **Full Member Records**: Stores contact details, membership tiers, address information, and emergency contacts.
- **Fitness & Body Metrics Tracking**: Records progress indicators including body measurements and fitness goals over time.
- **Individual Activity Log**: Comprehensive view of individual attendance history, assigned workout plans, and completed exercise sessions.

---

### 💳 4. Membership & Subscription Lifecycle Management
- **Custom Plan Creation**: Flexible creation of membership tiers, duration options, and pricing structures.
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
- **Live Stream View**: Multi-stream monitoring interface for live camera feeds (Webcam and IP CCTV).
- **Real-Time Event Feed**: Live ticker displaying recent check-ins, detected workout gestures, and system events.

---

### 📊 7. Executive Dashboard & Analytics
- **At-a-Glance Metrics**: Real-time stats on total active members, today's attendance count, expiring plans, and daily revenue.
- **Graphical Analytics**: Visual charts representing attendance trends, membership breakdown, and workout completion rates.
- **Notification System**: Instant alerts notifying staff about upcoming subscription renewals, system events, and security notifications.

---

## 👥 Supported Roles & Workflows

### 🛡️ System Administrator / Gym Management
- Full administrative access to member records, financial reports, system configurations, and subscription plan management.

### 🏋️‍♂️ Gym Coach / Trainer
- Assigns workout plans to athletes, monitors live workout verification feeds, and manages training progress.

### 🧘 Member / Athlete
- Enrolls biometrically, receives assigned workout goals, and tracks individual gym check-in records and fitness milestones.
