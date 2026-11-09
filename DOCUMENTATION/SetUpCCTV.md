Requirements for CCTV
    a. Power Adapter
    b. Wifi
    c. Ethernet Cable (T568B/White Orange, Orange combination)
        NOTE: Use app version because it has complete information of the CCTV, you also need to enable RTSP which can only be found inside the APP Mobile version, doesnt contain some inside the desktop site and desktop app.
Instruction
1. Plug the Ethernet Cable in both wifi and CCTV
2. Plug the Power Adapter to the CCTV and the outlet
3. Install Reolink App
4. Open the App
5. Click the Add New device
6. Scan the QR code of the CCTV (ensure to have good lighting)
7. Create username and password
    -admin
    -(a strong password; store it only in "Gesture Engine/.env", never in this file)
8. Name the Device
    -Monitoring 
9. Connect the camera and the computer running the GYM2 system to the same network.
10. In the Reolink app, open the Monitoring device and find its network information.
    - Record the camera's current IP address.
    - If the router changes the IP address later, update the address used by the Gesture Engine.
11. Enable RTSP in the Reolink mobile app.
    - Open the camera's settings and find Network > Advanced > Server Settings (menu names can vary by app version).
    - Enable RTSP and save the setting.
    - Confirm the RTSP port shown by the app. For this setup it should be 554.
    - RTSP is separate from ONVIF; enabling ONVIF alone will not enable the video stream used here.
12. Check the live stream in VLC before configuring GYM2.
    - In VLC, select Media > Open Network Stream.
    - Use the RTSP address format below, replacing the example IP with the address from step 10:
      `rtsp://<camera-username>:<camera-password>@<camera-ip>:554/Preview_01_main`
    - URL-encode special characters in the username or password (for example `@` becomes `%40`) before putting them in the address.
    - Enter credentials only on your trusted computer. Do not share screenshots or logs that show the full address.
    - The main stream is `Preview_01_main`; the lower-bandwidth sub-stream is `Preview_01_sub`.
    - If VLC reports an authentication error, verify the camera username/password. If it cannot connect, check that RTSP is enabled, the IP is current, and both devices are on the same network.
13. Configure CCTV 2 for a temporary test in PowerShell.
    - Open PowerShell in the GYM2 project folder and run:

      ```powershell
      cd "Gesture Engine"
      $cameraIp = Read-Host 'Reolink camera IP address'
      $cameraUser = Read-Host 'Reolink camera username'
      $securePassword = Read-Host 'Reolink camera password' -AsSecureString
      $plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
      $encodedUser = [uri]::EscapeDataString($cameraUser)
      $encodedPassword = [uri]::EscapeDataString($plainPassword)
      $env:CCTV_2_URL = "rtsp://${encodedUser}:${encodedPassword}@${cameraIp}:554/Preview_01_main"
      $env:CAMERA_SOURCE = 'cctv_2'
      Remove-Variable securePassword, plainPassword, encodedPassword, cameraUser, encodedUser
      ```

    - These environment variables apply to programs started from this PowerShell window. Re-enter them in a new window, or use a secure environment configuration, when needed again.
14. Test the camera stream with the Gesture Engine camera test script:

    ```powershell
    .\venv\Scripts\python.exe scripts\test_cam.py
    ```

    - Confirm that live video appears, then press `q` to close the test window.
    - If the test fails, resolve the RTSP/IP/credential issue before proceeding.
15. Start the Gesture Engine from the same PowerShell window:

    ```powershell
    .\venv\Scripts\python.exe gesture_engine.py
    ```

    - Keep this single engine window running. Do not start a separate Gesture Engine for attendance monitoring; both monitors use the same engine.
    - Start the GYM2 backend and frontend as usual if they are not already running.
16. Open Gesture Monitoring or Attendance Monitoring in GYM2.
    - Open the camera/source selector and choose **CCTV 2**.
    - Wait for the feed to connect. The engine can use one selected camera source at a time; switching sources changes the feed used by both monitors.
17. Check image quality and performance.
    - Start with `Preview_01_main` for the clearer stream.
    - If the video is delayed or unstable, stop the engine, set the URL path to `Preview_01_sub`, and restart it to compare.
    - A 4K stream needs more decoding bandwidth and processing power; a clear image does not guarantee faster detection or more reliable gesture recognition.

Troubleshooting:
- **CCTV 2 is missing:** restart the Gesture Engine after setting `CAMERA_SOURCE` and `CCTV_2_URL`, then reload the monitor page.
- **CCTV 2 is listed but will not connect:** verify the IP, RTSP setting/port, credentials, and stream path. Check VLC first.
- **VLC works but GYM2 does not:** ensure the engine was launched from the same PowerShell window where `CCTV_2_URL` was set.
- **The feed connects but is slow:** try `Preview_01_sub` or improve the wired network connection.
- **Do not put the RTSP address or camera password in source code, screenshots, chat, or a committed file.**