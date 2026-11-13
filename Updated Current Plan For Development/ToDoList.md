1. Login
2. Overview
3. Member Registration
4. Packages
5. Transactions
6. Reports
7. Attendance Monitor
8. Gesture Monitor
9. Admin profile
10. Notification


0. Login **Hellish Problem**
    - Fixed the issue where it cannot send a verification message to the gmail doublealphafitnessgym@gmail.com, without relying on the SMTP or Gmail.



1. Login
    - Improve the Verification by just telling the admin to input the 6 digit pin, also turn it into boxes 6 boxes.
    - Dont tell the admin to Enter the code sent to your administrator email. since we cannot gain access to the gmail due to it being complicated to access.
    - A local verification PIN was generated. Enter PIN: 187426 turn it into --> Enter This Generated Pin: 
        > Make it visible

3. Member Registration
    - Is there a way we can solve the issue where the coach needs to search  in google on convert the cm into ft when inputting height of the client? (improve the placement of this part, i dont like the UI of it because its a tthe bottom of the height CM input area.)
    - Inside the Add Member Button, Turn the Text of First Name, Last Name, Email, Address, Phone Number, Date of Birth, Height, Weight, BMI into Gray-500 both lightmode and darkmode (Revert it to what it was before)
    - Inside the view action button there is a Placeholder search engine rename it into Search Name, Muscle, or Equipment , then improve the UI of it.

4. Packages
    - Can we change the ui of the New package inside the manage package? Turn it into a pop up instead? because its a hassle to scroll down of stuff. thank you (Make the UI same as the Edit action page)
    
5. Transactions
6. Reports
7. Attendance Monitor
    - (Must do) Set a returning member back to Active automatically. When an Inactive member checks in, their profile becomes Active again, so the rule works both ways: gone 1 month → Inactive, comes back → Active. (Backend: AttendanceController.php)
    - (Must do) Add a manual Active/Inactive switch in Edit Member as a backup, so the admin can fix a member's status when the camera missed them. The backend should only accept "Active" or "Inactive". (Right now there is no way to change status by hand.)
    - (Must do) Run the 1-month Inactive check every day. Add a daily scheduled job so members become Inactive on time, not only when someone opens the Members page. Keeps Dashboard and Reports counts correct. Reuses the existing check.
    - (Recommended) Flag expired subscriptions at the door. Keep logging them, but show an orange name tag on the camera feed and an "Expired" badge in today's log so staff can ask the member to renew. Nothing is blocked.
    - (Nice to have) Show status in today's log. A small badge next to each check-in: Active, "Returned (was Inactive)" or Expired.
    - (Before the defense) Test with several people at once. Have 3–5 registered members plus 1 unregistered person walk in together. Confirm each member is logged exactly once and the stranger stays "Unknown".

8. Gesture Monitor
9. Admin profile
10. Notification
    - Improve the UI/UX a bit more, it looks invisible and it always at the back of other pages, it doesnt actually appear on front.


    Border: Lightmode: gray-300
    tracking-widest, Font Size: 10px/11px, Font Color: Lightmode: Gray-500, Darkmode-Gray-500