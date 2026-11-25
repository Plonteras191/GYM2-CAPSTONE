1. Login
2. Overview
3. Member Registration/Management
4. Packages
5. Transactions
6. Reports
7. Attendance Monitor
8. Gesture Monitor
9. Admin profile
10. Notification



3. Member Registration/Management
    - [DOCS] Still unresolved from before: Workout Logs, Attendance Calendar and Training Plan live inside the member profile, which does not match the paper's "Member Registration Module" wording. The page was renamed "Member Management" in the app, but the paper/diagrams still say Member Registration. Decide: update the paper, or move those tabs.

11. UI of MObile and Tablet
    - Havent yet applied where its similar to a tiktok buttons

3. Member Registration/Management
    - Rename into Register Member

6. Reports
    - [BUG] Caused by the Title Case change: member emails in report rows are capitalised ("Ada@Example.Com"), because the member cell is a button. Needs the same fix used on the Transactions and Packages tables. (Reports.jsx line 205)
    - [BUG] "Total Active" / "Total Expired" in the Memberships report have the same problem as the Overview card: memberships past their end date but still saved as "Active" are counted as Active. (ReportController.php line 66)
    - [MISSING] Date shortcuts only have Today / Last 7 days / This month. "Last month" is the one people usually need for monthly reporting.
    - [DESIGN] Member names in reports with no linked member (deleted members) still look like a button, but do nothing when pressed.

7. Attendance Monitor
    - [BUG] Still open from before: face recognition can mistake one person for another (Val recognised as Danikhel). Needs calibration with "Gesture Engine/scripts/eval_faces.py" using the real camera and real members.
    - [DESIGN] Message wording is technical: "AI Memory successfully synced with the Database!", "Could not connect to the Python AI Engine." Staff-friendly wording: "Face list updated", "The camera system is offline".
    - [DESIGN] The camera source dropdown and buttons on the video use their own small, uppercase style, unlike the rest of the app.

8. Gesture Monitor
    - [BUG] Still open from before: same face mix-up as the Attendance Monitor, and it takes time to identify a person (camera stream delay, plus 3 matching reads needed before a name shows).

9. Admin profile
    - [MISSING] Forgot Password depends on the email (SMTP) settings working. The earlier email problem means recovery may fail on the real setup. Test it once on the defense laptop.

10. Notification
    - [DESIGN] There is always at least one notification ("Admin Active Session — Current session authenticated on Windows PC"). The bell never reads zero, so real alerts are easy to miss. Remove it or only show real new-device logins.
    - [DESIGN] The "new device login" alert is worked out inside the browser, not by the server, so it is not a real security check. Either label it plainly or move it to the server.
    - [MISSING] Dismissed notifications are remembered only in this browser and the list grows forever; on another computer they all come back.

11. UI of Mobile and Tablet
    - Still open (TikTok-style buttons not started).

12. Whole system (new)
    - [DOCS] The PRD, diagrams and user manual were updated to v2.0 right before these changes. These now differ from the app: "Member Management" rename, Walk-ins tab and New Sale in Packages, Record Transaction removed from Transactions, all registration fields required, Title Case labels, the light-mode border change. Update the docs and screenshots before the defense.
    - [DESIGN] Title Case is done with CSS, so every word is capitalised, including small words ("Date Of Birth", "Check In A Member", "Add A Class Or Event"). If the panel prefers proper title case ("Date of Birth"), the labels have to be retyped by hand.
    - [DESIGN] Package names typed in lowercase by staff (e.g. "with coach") show as "With Coach" inside dropdown buttons but in lowercase in tables. Store names in a consistent case.
    - [DESIGN] Check every page once in light mode after the border change: card outlines are gray-400, inner lines gray-300. Anything that still looks faint is a one-off box that needs switching.
    - [MISSING] None of the recent changes are committed to git yet (Member Management rename, walk-ins, required fields, borders, Title Case, bold buttons, exercise preview, New Sale chooser). Commit before more changes pile up.