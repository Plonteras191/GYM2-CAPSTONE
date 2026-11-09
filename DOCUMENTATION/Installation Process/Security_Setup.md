# Security Setup

Do these steps once on the laptop that runs the system. Without step 1 the
Gesture Engine cannot log attendance or workouts.

## 1. Backend (`backend/.env`)

Copy the security entries from `backend/.env.example`:

```
AI_ENGINE_TOKEN=<long random secret>
SANCTUM_TOKEN_EXPIRATION=720
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong password>
```

Generate a random token:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Then clear the cached config:

```bash
php artisan config:clear
```

`ADMIN_PASSWORD` is only used by `php artisan db:seed` when no admin exists yet.
If it is empty, a strong random password is generated and printed once.

## 2. Gesture Engine (`Gesture Engine/.env`)

Copy `Gesture Engine/.env.example` to `Gesture Engine/.env` and fill in:

```
AI_ENGINE_TOKEN=<same token as backend/.env>
CCTV_URL=rtsp://USER:PASSWORD@CAMERA_IP:554/Streaming/Channels/101
```

On a single laptop you can leave `AI_ENGINE_TOKEN` empty here: the engine
reads it from `../backend/.env` automatically. `Gesture Engine/.env` is
git-ignored, so never commit it.

## 3. Before the system is used at the real gym

The old camera password and the old `admin123` admin password were committed
to Git in the past and remain in the repository history. Change both:

- Hikvision camera: change the password in the camera web portal and update `CCTV_URL`.
- Admin account: change the password from the Admin Profile page.

## Demo-day notes

- Login is rate-limited: too many wrong passwords locks login for a minute.
- Login tokens expire after 12 hours (`SANCTUM_TOKEN_EXPIRATION`), so log in fresh.
- Attendance is only recorded during gym hours (9:00 AM - 9:30 PM).
- Check that the camera IP in `CCTV_URL` matches the current network.

## What is protected

| Area | Protection |
|---|---|
| Admin API (members, transactions, reports, ...) | Requires a Sanctum login token |
| AI routes (`/api/ai/*`) | Require the `X-AI-Engine-Token` header (closed if no token is configured) |
| Login / password reset | Rate-limited |
| Login tokens | Expire after 12 hours |
| Profile pictures | JPG/PNG/WEBP only, max 5 MB, saved under a random server-generated name |
| Face captures | Must be a real PNG/JPEG; client-supplied file paths are ignored |
| File deletion | Only inside `public/faces` and `public/profiles` |
| Printed receipts | All values HTML-escaped (no XSS) |
| CSV export | Formula-injection safe |
| Payments | Amounts must be between 0 and 9,999,999.99 |
| Camera passwords | Only in git-ignored `.env` files |
| Seeded admin | No known default password |

These are covered by the backend tests: `php artisan test`
(`ApiAccessControlTest`, `MemberMediaSecurityTest`, `SecurityTest`).
