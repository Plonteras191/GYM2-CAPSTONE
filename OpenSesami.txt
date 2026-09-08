Admin Dashboard Login
    Email: admin@example.com
    Password: admin123


Hikvision CCTV Hardware
    Web Portal: `[http://192.168.1.84](http://192.168.1.84)`
    Username: admin
    Password: Jheval07012004
    CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101


Backend
    cd backend
    php artisan serve


Camera
    cd gesture-engine
    .\venv\Scripts\python.exe gesture_engine.py

Other Part Of Camera
    cd gesture-engine
    .\venv\Scripts\activate
    python collect_data.py

FrontEnd
    cd frontend
    npm run dev / npm run dev --host (For Mobile)


Extract all codes in FrontEnd
  Get-ChildItem -Path . -Recurse -File -Include *.jsx,*.js,*.css,*.html,*config.js,package.json -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\dist\\' -and $_.FullName -notmatch '\\public\\' } | ForEach-Object { "=== $($_.Name) ==="; Get-Content $_.FullName; "" } | Out-File -FilePath FULL_FRONTEND_CODE.txt -Encoding utf8


Extract all codes in Backend
    Get-ChildItem -Path . -Recurse -File -Include *.php,*.json,.env -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\vendor\\' -and $_.FullName -notmatch '\\storage\\' -and $_.FullName -notmatch '\\bootstrap\\cache\\' } | ForEach-Object { "=== $($_.Name) ==="; Get-Content $_.FullName; "" } | Out-File -FilePath FULL_BACKEND_CODE.txt -Encoding utf8


Extract all codes in Gesture-Engine
    Get-ChildItem -Path . -Recurse -File -Include *.py,requirements.txt -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\venv\\' -and $_.FullName -notmatch '\\__pycache__\\' } | ForEach-Object { "=== $($_.Name) ==="; Get-Content $_.FullName; "" } | Out-File -FilePath FULL_GESTURE_ENGINE_CODE.txt -Encoding utf8


View all installed packages
    pip list

