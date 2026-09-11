# Backend Installation & Environment Setup Guide

**Product Name:** Camera-Based Gym Management System with Facial Recognition Attendance and Gesture-Based Program Monitoring  
**Client:** Double Alpha Fitness Gym (Natumolan, Tagoloan, Misamis Oriental)  
**Target Component:** Backend API Layer (Laravel 12 / PHP 8.2+ / MySQL)  
**Document Version:** 1.0  
**Date:** September 2026  

---

## 1. System Requirements & Prerequisites

Before installing the backend, ensure the host system satisfies the following runtime requirements:

| Component | Minimum Version | Recommended Version | Description |
| :--- | :--- | :--- | :--- |
| **PHP** | `v8.2.0` | `v8.2.x` or `v8.3.x` | Server-side execution language |
| **Composer** | `v2.5.0` | `v2.6+` | PHP dependency package manager |
| **MySQL Server** | `v8.0.0` | `v8.0.x` or `v8.4.x` | Relational database management system |
| **OpenSSL PHP Extension**| Enabled | Enabled | Required for encryption & security |
| **PDO & PDO_MySQL** | Enabled | Enabled | Database connection extensions |
| **Mbstring / BCMath**| Enabled | Enabled | String & math processing extensions |
| **GD / Fileinfo** | Enabled | Enabled | Profile image processing extensions |

---

## 2. Step-by-Step Backend Installation

### Step 1: Open Terminal & Navigate to Project Directory
Launch PowerShell or Terminal and navigate to the backend folder:
```bash
cd c:\CLIENT\GYM\GYM2-CAPSTONE\backend
```

---

### Step 2: Install PHP Dependencies via Composer
Execute Composer to download all framework and core packages (Laravel Framework 12, Sanctum, Tinker, Carbon, etc.):
```bash
composer install
```
*Note: If installing on production environments, append `--no-dev --optimize-autoloader` for enhanced performance.*

---

### Step 3: Configure Environment Settings (`.env`)
1. Create a local environment file by copying `.env.example`:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On Linux/macOS:
   cp .env.example .env
   ```
2. Open `.env` in an editor and configure the MySQL database credentials:
   ```ini
   APP_NAME="Gym Management System Backend"
   APP_ENV=local
   APP_KEY=
   APP_DEBUG=true
   APP_URL=http://localhost:8000

   LOG_CHANNEL=stack
   LOG_STACK=single
   LOG_LEVEL=debug

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=gym_management
   DB_USERNAME=root
   DB_PASSWORD=

   SESSION_DRIVER=database
   SESSION_LIFETIME=120
   SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173
   ```

---

### Step 4: Generate Application Security Key
Generate a unique 32-character base64 application key:
```bash
php artisan key:generate
```

---

### Step 5: Initialize MySQL Database & Run Migrations
1. Ensure MySQL Server is running (e.g., via XAMPP, WampServer, or MySQL Windows Service).
2. Create the target database if it does not already exist:
   ```sql
   CREATE DATABASE gym_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Run all database migration files to build tables (`members`, `attendances`, `memberships`, `transactions`, `plans`, `workout_logs`, `personal_access_tokens`):
   ```bash
   php artisan migrate
   ```
4. **(Optional) Seed Initial Administrative Data**:
   Populate seed data (default Admin credentials, standard gym plans):
   ```bash
   php artisan db:seed
   ```

---

### Step 6: Create Storage Symbolic Link
Link the private storage disk to the public directory so uploaded profile photos (`/profiles/`) are publicly accessible by the web frontend:
```bash
php artisan storage:link
```

---

### Step 7: Launch Backend REST API Server
Start the built-in PHP development web server listening on port `8000`:
```bash
php artisan serve --host=127.0.0.1 --port=8000
```
*Output Verification*:
```
INFO  Server running on [http://127.0.0.1:8000].
Press Ctrl+C to stop the server.
```

---

## 3. Backend Verification Commands

Run the built-in test suite to confirm database models and business logic integrity:
```bash
php artisan test
```

Clear cached configuration if modifications are made to `.env`:
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 4. Backend Troubleshooting Matrix

| Issue / Error Message | Root Cause | Solution |
| :--- | :--- | :--- |
| **`SQLSTATE[HY000] [2002] Connection refused`** | MySQL Server service is stopped or port `3306` is blocked. | Start MySQL in XAMPP or Windows Services panel (`net start MySQL`). |
| **`SQLSTATE[42000]: Unknown database 'gym_management'`** | Target database missing in MySQL. | Run `CREATE DATABASE gym_management;` in MySQL CLI / phpMyAdmin. |
| **`No application encryption key has been specified`** | Missing `APP_KEY` in `.env`. | Run `php artisan key:generate`. |
| **`403 Forbidden / Sanctum Unauthenticated`** | Missing or expired Sanctum bearer token in HTTP header. | Obtain token via `/api/auth/login` and pass `Authorization: Bearer <token>`. |
