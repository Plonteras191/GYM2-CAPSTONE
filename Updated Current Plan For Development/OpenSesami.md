Admin Dashboard Login
    Email: admin@example.com
    Password: admin123

Hikvision CCTV Hardware
    Web Portal: `[http://192.168.1.84](http://192.168.1.84)`
    Username: admin
    Password: Jheval07012004
    CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101

=======================================================================================================================================

FrontEnd
    cd frontend
    npm run dev / npm run dev --host (For Mobile)

Backend
    cd backend
    php artisan serve

Camera
    cd "Gesture Engine"
    .\venv\Scripts\python.exe gesture_engine.py

Other Part Of Camera
    cd "Gesture Engine"
    .\venv\Scripts\activate
    python collect_data.py

=======================================================================================================================================

Extract Frontend, Backend, Gesture Engine
    Get-ChildItem -Path .\frontend, .\backend, ".\Gesture Engine" -Recurse -File -Include *.jsx,*.js,*.css,*.html,*config.js,package.json,*.php,*.json,.env,*.py,requirements.txt -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\dist\\' -and $_.FullName -notmatch '\\public\\' -and $_.FullName -notmatch '\\vendor\\' -and $_.FullName -notmatch '\\storage\\' -and $_.FullName -notmatch '\\bootstrap\\cache\\' -and $_.FullName -notmatch '\\venv\\' -and $_.FullName -notmatch '\\__pycache__\\' } | ForEach-Object { $relativePath = $_.FullName.Replace($PWD.Path + '\', ''); "=== $relativePath ==="; Get-Content $_.FullName; "" } | Out-File -FilePath GROUP1_CODE.md -Encoding utf8

Extract Installation Process and Product Requirements Documents
    Get-ChildItem -Path . -Recurse -File -Include *.md,*.txt -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\vendor\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.Name -notmatch 'GROUP1_CODE.md' -and $_.Name -notmatch 'GROUP2_DOCS.md' -and $_.Name -notmatch 'FULL_PROJECT_CODE.md' } | ForEach-Object { $relativePath = $_.FullName.Replace($PWD.Path + '\', ''); "=== $relativePath ==="; Get-Content $_.FullName; "" } | Out-File -FilePath GROUP2_DOCS.md -Encoding utf8

=======================================================================================================================================

View all installed packages
    pip list

The "Request for Approval" Workflow
    git checkout main
    git pull origin main
    git checkout -b update-event-plans
    git add .
    git commit -m "Updated Subscriptions Event Plans filter to remove past events"
    git push origin update-event-plans

Getting the code in https://github.com/Plonteras191/GYM2-CAPSTONE

