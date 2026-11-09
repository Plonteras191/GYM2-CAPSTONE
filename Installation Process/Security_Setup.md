# Security Setup (required after the security update)

After pulling this update, **every teammate must do these steps once**, or the
AI engine will stop logging attendance/workouts.

## 1. Backend (`backend/.env`)

Add these lines (see `backend/.env.example`):

```
AI_SERVICE_KEY=<long random secret>
SANCTUM_TOKEN_EXPIRATION=720
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong password>
```

Generate a random key:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Then clear the cached config:

```bash
php artisan config:clear
```

## 2. Gesture Engine (`Gesture Engine/.env`)

Copy `Gesture Engine/.env.example` to `Gesture Engine/.env` and fill in:

```
AI_SERVICE_KEY=<the SAME key as backend/.env>
CCTV_PASSWORD=<camera password>
CCTV_HOST=192.168.1.45
```

`Gesture Engine/.env` is git-ignored — never commit it.

## 3. Change the leaked passwords

The old camera password and admin password were committed to Git in the past,
so they remain visible in the repository history. **Change them**:

- Hikvision camera: change the admin password in the camera web portal, then
  put the new one in `Gesture Engine/.env`.
- Admin dashboard account: log in and change the password (or set a new
  `ADMIN_PASSWORD` and re-create the admin).

## What changed

| Area | Before | After |
|---|---|---|
| Admin API (members, transactions, reports, ...) | Open to anyone on the network | Requires login token (`auth:sanctum`) |
| AI routes (`/api/ai/*`) | Open to anyone | Require `X-AI-Key` header |
| Login | Unlimited attempts | 5 attempts per minute |
| Login tokens | Never expired | Expire after 12 hours |
| Profile picture upload | Kept client filename (could upload `shell.php`) | Random name, JPG/PNG/WEBP only, max 5 MB |
| Face capture | Any bytes saved; client could set any file path | Verified PNG/JPEG only, random name |
| Member delete/update | Could delete any file via a forged path | Only deletes inside `public/faces` / `public/profiles` |
| Receipt printing | Member names injected as raw HTML (XSS) | All values HTML-escaped |
| Camera password | Hardcoded in source | Read from git-ignored `.env`, masked in logs and `/camera_status` |
| Flask CORS | Any website | Only localhost / private LAN addresses |
