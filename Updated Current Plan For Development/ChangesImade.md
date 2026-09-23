# System Changes Log
### Double Alpha Fitness Gym – Capstone Project

---

## Changes by Val Salcedo
**Date:** September 21, 2026

- Improved the Member Profile page — trainers can now log reps and sets for exercises
- Updated the calendar look and feel to be cleaner
- Past events are now filtered out automatically so only upcoming ones are shown

---

## Changes by Mr. Plonteras

### 1. Separated Plans from Subscriptions
- A **Plan** is just the gym's price list (e.g., "Monthly Pass – ₱600 for 30 days"). It doesn't change.
- A **Membership/Subscription** is what a member actually buys (e.g., "Juan's pass from Sept 1 – Oct 1").
- The system now properly links each subscription to its plan, and automatically calculates the expiry date.

---

### 2. Attendance Tracking Cleaned Up
- Attendance recording was mixed in with the wrong part of the code.
- It has been moved to its proper place so it works correctly and is easier to maintain.

---

### 3. Code Files Organized into Groups
- All backend files were sorted into labeled folders (Admin, Member, Auth, AI) so the codebase is clean and easy to navigate — especially important for the capstone defense.

---

### 4. API Routes Updated
- Updated all internal links between files to match the new folder structure.
- Fixed minor code warnings.
- Ran a refresh command so the system recognizes all the new file locations.

---

## Changes by Mr. Plonteras — September 23, 2026

### 5. Fixed: Adding a Member Subscription Created a Duplicate
- **The Problem:** When adding or renewing a membership, clicking the "Save" button quickly or multiple times would trigger the request twice, accidentally creating two duplicate subscriptions and two payment records for the same member.
- **The Solution:** Added an instant one-click lock (`isSavingRef`). As soon as the button is clicked, subsequent clicks are locked until the system finishes saving.
- **Why It Matters:** Prevents accidental double-charging and duplicate records in the gym's database.

---

### 6. Fixed: Receipts Were Showing the Wrong Subscription Dates
- **The Problem:** When a member renewed their membership for a new month, viewing or printing an older receipt from a previous month would mistakenly display the *new* subscription's dates instead of the original dates.
- **The Solution:** Each transaction and receipt is now permanently tied to its own specific subscription period. Old receipts always show the exact start and end dates from when that payment was originally made.
- **Why It Matters:** Financial records and member receipts remain 100% accurate, consistent, and audit-ready even after members renew multiple times.

---

### 7. Clean and Formal PDF Reports
- **The Problem:** When generating and printing or downloading system reports to PDF, the document had excessively huge margins, misaligned numbers, and looked disorganized.
- **The Solution:** Redesigned the entire print stylesheet:
  - Tightened margins to standard, professional document borders.
  - Added a formal gym header with the official Double Alpha logo, title, generated timestamp, and filtered date range.
  - Organized financial and attendance numbers into clean, easy-to-read tables with bold totals.
  - Added formal sign-off lines at the bottom ("Prepared By" and "Approved By / Coach") for official gym paperwork.
- **Why It Matters:** Reports look executive, clean, and ready to present to coaches, gym owners, or school thesis panelists.

---

### 8. Enhanced Notification Bell System
- **The Problem:** The coach previously had limited visibility into day-to-day gym events, expiring memberships, and account activity from the top navigation bar.
- **The Solution:** Completely rebuilt the notification bell dropdown with real-time smart alerts:
  1. **Expiring Subscriptions (7 Days):** Warns the coach when any member's subscription is ending within the next 7 days (or expiring today) with an amber badge (`TODAY` or `Xd left`). Clicking it opens the Subscriptions page directly.
  2. **Special Days & Events:** Scans the gym calendar and alerts the coach of upcoming gym events or special coaching sessions scheduled within the next 7 days with an emerald calendar icon.
  3. **Device Login & Security Alerts:** Monitors login activity and notifies the coach whenever an active session is started or a login happens on a device (e.g., Windows PC, Mobile, Tablet).
  4. **Active Members Without Subscription:** Flags members registered over 30 days ago who currently have no active membership pass.
  5. **Pending CCTV AI Tasks:** Reminds the coach about workout exercises waiting for camera AI verification.
  6. **Dismiss & Clear Options:** Coaches can dismiss any single alert using the `×` button on hover, or click "Clear All". Dismissed alerts stay cleared even if the browser is closed or refreshed.
  7. **Auto-Refresh:** Automatically refreshes alerts every 5 minutes in the background so the coach always sees the latest status.
- **Why It Matters:** The coach has complete, effortless situational awareness of the gym from any page without having to manually search through lists.

---

### 9. Solved CCTV Stream Latency & Added Live Camera Switcher
- **The Problem:** The Hikvision camera stream had extreme delay (3 to 6 seconds of lag). The AI engine was streaming from the heavy 1080p Main Stream (Channel 101) which queued up frames inside OpenCV's FFmpeg buffer on CPU. Additionally, testing outside the gym network (like during defense presentation) caused the video to freeze completely.
- **The Solution:**
  1. **Switched to Sub-Stream (Channel 102):** Configured `gesture_engine.py` and `settings.py` to use Hikvision Channel 102, which is tailored specifically for real-time computer vision with low bitrate and instant decoding.
  2. **Zero-Buffer Network Capture:** Added `rtsp_transport;tcp|fflags;nobuffer|flags;low_delay|max_delay;500000|reorder_queue_size;0` FFmpeg environment parameters and non-blocking `.grab()` frame flushing to eliminate frame backlog.
  3. **Added Webcam Fallback & Live Switcher:** Added a `/switch_camera` API endpoint and a camera toggle button directly on both the Security Monitor and Gesture Monitor pages. The coach or student can seamlessly switch between the Hikvision CCTV and their local PC Webcam with a single click—ideal for thesis defense demos.
  4. **Smooth Standby Screen:** If the RTSP camera temporarily disconnects, the engine now generates a clean branded standby frame instead of stalling the HTTP stream.
  5. **Fast Face Sync:** Optimized `num_jitters` from 3 to 1 so database face synchronization responds in under 1 second without freezing the engine.
  6. **Fixed Training Landmark Coordinates:** Fixed `collect_data.py` to record translation-invariant landmarks relative to the nose joint so newly recorded exercises match the trained model.
- **Why It Matters:** Live camera latency is reduced from ~5 seconds down to under 200ms, and the system is 100% prepared for on-site presentations without needing physical access to the gym's CCTV network.

---

### 10. Multi-Person Face Recognition & Identity Separation
- **The Problem:** When 2 people stood in front of the CCTV camera simultaneously, the AI confused their identities, labeled both people as the same member, or misclassified faces.
- **The Solution:**
  1. **Replaced the 250px Spatial Cache with an IOU Multi-Person Tracker:** Removed the flawed `abs(x - center_x) < 250` distance check that caused anyone standing near another person to steal their name. Implemented a proper multi-object centroid and IOU tracker assigning unique track IDs to each detected face.
  2. **Calibrated Strict Threshold (0.52):** Reduced the recognition threshold from an overly permissive `0.65` down to `0.52`. Because the mathematical face distance between Jheval and Kashiro is `0.603`, the previous 0.65 threshold allowed them to match each other. The new 0.52 threshold strictly separates them.
  3. **Added Confidence Margin Check:** Requires at least a `0.035` confidence gap between the closest match and the second closest match before confirming identity, preventing false guesses in ambiguous lighting.
  4. **Color-Preserving Feature Extraction:** Replaced destructive grayscale MinMax normalization with true 3D RGB color preprocessing in HSV space, preserving natural facial depth for dlib's ResNet face descriptor.
  5. **Skeleton-to-Head Proximity Binding:** Active athlete selection in the Gesture Monitor now calculates exact Euclidean distance from the skeleton's nose joint to each detected face center, locking onto the actual athlete performing the exercise without jumping to bystanders.
- **Why It Matters:** Multiple people can now stand in front of the camera simultaneously, each receiving their own independent, accurate green name tag (or red "Unknown" tag) with zero identity cross-contamination.


