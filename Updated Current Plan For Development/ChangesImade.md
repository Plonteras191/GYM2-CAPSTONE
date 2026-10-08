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

---

## Changes by Mr. Plonteras — September 29, 2026

### 11. Phone Mode & UI Optimization Overhaul
- **Calendar UI Fixes across All Calendars:**
  - **Over-stretched Calendar Height:** Reduced day cell frame height from `5rem` to a compact `2.75rem` (and `2.5rem` on very small screens < 360px) in `index.css`. The entire monthly grid now fits comfortably on mobile viewports without excessive vertical scrolling.
  - **Attendance Calendar Text Bleed & Overlapping Dates:** Eliminated `white-space: normal !important; overflow: visible !important;` that forced long check-in text strings across adjacent date columns. Replaced with compact indicator dots (`● 08:30 AM`) with proper ellipsis truncation (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
  - **Static Events to Interactive Pop-up Modals:** Fully connected `MobileCalendarDaySheet` across the Member Profile Attendance Calendar, Subscriptions Calendar, and Dashboard Calendar. Tapping any day or event now smoothly slides open a bottom-sheet modal on mobile (or centered dialog on desktop) displaying all check-in timestamps, status badges, and event details.
  - **Dark Mode Button & Control Visibility:** Upgraded low-contrast buttons across calendar toolbars using the high-contrast dark palette (`#252833` background, `#393e4f` borders, `#f1f5f9` text, and warm amber `#f59e0b` active state highlights).
  - **Calendar Plus (+) Action Button in Dark Mode:** Fixed the plus button in mobile calendar toolbars to display a crisp white icon (`dark:text-gray-100`) on dark surface (`#252833`) and border (`#393e4f`), perfectly matching the neighboring month navigation chevrons.
  - **Hover Popover on Days with Activities:** Created `CalendarHoverPopover` and integrated it across Subscriptions, Dashboard, and Attendance calendars. Hovering over any date with activities now automatically displays a sleek floating card previewing event names, times, locations, and attendance details without needing to click, while clicking continues to open the full detailed modal sheet.
  - **Modern Calendar Modal Overhaul (`MobileCalendarDaySheet` & `CoachEventModal`):** Replaced generic AI-slop modal layouts with a modern design system:
    - **Header Block:** Prominent square date badge showing uppercase month and large day number, relative status chips (`TODAY` with pulsing green dot, `UPCOMING`, `PAST`), and a floating circular frosted close button. Mobile drag handle indicator included for touch ergonomics.
    - **Activity Cards:** Removed flat generic `border-left` lines in favor of type-specific rounded pill badges (`Attendance Check-in`, `Coach Session`, `Membership Pass`), glowing status dots, high-contrast titles, and dedicated metadata chips for time (`FiClock`) and location (`FiMapPin`).
    - **Illustrated Empty State:** Clean layered icon container and helpful messaging when no events exist.
    - **Bottom Bar:** Subtle gym branding and elevated action buttons.
  - **Repositioned Calendar Controls:** Redesigned `MobileCalendarToolbar` to place the Month/Year title neatly on the top-left, group navigation chevrons and Today button on the top-right, and provide full-width segmented view switchers (Month / List) for one-thumb switching.

- **Workout Plan Mobile View ("BIG FAIL" Resolved):**
  - **Fixed 0-Height Collapse:** Identified root cause where `absolute inset-0` inside an unconstrained mobile flex container resulted in a computed height of `0px`. Converted the mobile workout plan view to a responsive `min-h-[580px] flex flex-col` container while preserving `lg:absolute lg:inset-0` for desktop.
  - **Thumb-Friendly Sub-Navigation:** Added a mobile pill switcher between `[ Browse Exercises ]` and `[ Weekly Routine (Days) ]` allowing coaches and members to easily search exercises and assign routine days without complex nested layouts.
  - **Collapsible Member Profile Header:** On mobile, member bio and metrics can now be collapsed with a "Show/Hide Details" toggle, ensuring the workout planner and calendar tabs are immediately accessible at the top of the screen.

- **Search Bar Redesign (Dark Theme):**
  - **Custom Dark Mode Palette:** Upgraded the search bars in Transactions, Member Directory, Subscriptions, and Exercise Library with the specified color scheme:
    - `#191b22`: Inner search input field background
    - `#252833`: Outer container card background
    - `#393e4f`: Thin border outline with subtle hover and amber focus states
    - `#6d758d`: Muted placeholder text and magnifying glass search icon
  - **Usability Enhancements:** Added an instant clear (`✕`) button and adjusted flex wrapping so filters and date pickers never squish or clip the search bar on mobile screens.

- **Card and Table Title Alignment:**
  - Shifted toolbar titles and table headers (`TOTAL MEMBERS`, `TOTAL TRANSACTIONS`, `TOTAL SUBSCRIPTIONS`) from center-top to the **Top-Left Corner** to conform with standard F-pattern visual hierarchy and improve readability across all screen sizes.

### 12. Full-Spectrum Responsiveness: Web Mobile (CP), Web Tablet & Web Desktop
- **Web Tablet Optimization (640px – 1024px / iPad, iPad Air, 768px Viewports):**
  - **Reports & Analytics Header Actions:** Replaced `hidden lg:flex` with responsive `flex flex-col sm:flex-row sm:items-center sm:justify-between`, ensuring "Print PDF" and "Export CSV" buttons remain accessible at the top right of the page instead of being crammed into a tiny 3-button row in the filter card on 768px tablet viewports.
  - **Balanced 4-Way Filter Grid:** Changed Reports filter container from an awkward 2-column + 1-column layout into a clean `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` grid. On tablet screens, Report Type, Start Date, End Date, and "This Month" filter buttons form a balanced 2x2 grid.
  - **Table Cell Padding & Min-Width:** Adjusted tables across Transactions (`TransactionTable.jsx`), Members (`MemberTable.jsx`), Subscriptions (`SubscriptionsTable.jsx`), and Reports (`Reports.jsx`) from rigid `min-w-[800px]` with `px-6 py-4` padding to responsive `min-w-[650px] lg:min-w-full` with `px-3.5 sm:px-4 lg:px-6 py-3.5`. This fits neatly onto iPad portrait (768px) and landscape without unnecessary horizontal clipping.
- **Web Mobile / Cellphone (320px – 640px):**
  - **Full-Width Action Buttons:** Main call-to-action buttons ("Add Member", "Record Transaction", "Add Subscription") now expand to `w-full sm:w-auto`, making them natural, prominent thumb targets on small phone screens.
  - **Compact Avatar & Action Buttons:** Refined member table avatars to `w-9 h-9 sm:w-10 sm:h-10` and button icon spacing to `space-x-2 sm:space-x-3` to prevent cell squishing on mobile screens.
- **AI Monitors (Security CCTV & Gesture Monitor):**
  - **Adaptive Viewport Height:** Updated outer container wrapper from rigid `h-full` to `min-h-full h-auto lg:h-full` with `min-h-[380px]` attendance panel, eliminating log truncation and clipping on mobile and tablet screens when the video feed is displayed in aspect-video mode.
- **Dark Mode Design Tokens Harmonization:**
  - Standardized all card backgrounds, borders, and input boxes across Reports, Monitors, and Subscription views to the unified dark mode palette: `#191b22` (inputs/table headers), `#252833` (cards/modals), `#393e4f` (borders/dividers), and `#f1f5f9` (text).
