# Updates Made by Claude

A log of the changes Claude made to the Smart Gym Management System, newest first.

---

## 2026-11-09: Face recognition in a separate process

### What was measured

Python runs only one thread's Python code at a time. A model that holds that lock while it works freezes every other part of the engine.

| Model | Time per run | Rest of the engine during that time |
|---|---|---|
| Skeleton detection (MediaPipe) | ~94 ms | keeps **86%** of its speed |
| Face recognition (dlib) | ~890 ms | slowed to **2%**, nearly frozen |

So each face recognition froze the camera reader, video feed and skeleton detection for almost a second. That was the remaining stutter. Skeleton detection already lets the rest run, so moving it to a separate process would gain little. It was left as is.

### What changed

- **New file:** [face_encoder_process.py](../Gesture%20Engine/face_encoder_process.py). It runs face encoding as a child process (`python face_encoder_process.py`) with its own lock. The parent sends face crops and receives encodings over the child's stdin/stdout.
- **Matching stays in the engine.** `face_recognition_worker` sends crops to the child and compares the returned encoding with enrolled members in the engine, using the same rules as before.
- **Safe fallbacks:**
  - If the child process dies, it is restarted.
  - If it cannot start at all, the engine prints a warning and encodes in-engine as before.
  - `FACE_RECOGNITION_IN_PROCESS=false` in `Gesture Engine/.env` turns the child process off.
- **One copy of the code:** the crop-preparation and encoding code moved out of `gesture_engine.py` into the new module, so both paths share it.

### Measured results

| | Before (in-engine) | After (child process) |
|---|---|---|
| Rest of the engine while a face is identified | 12.7% speed | **103% speed** (no slowdown) |
| Face encoding result | | **identical** (same 128 numbers) |
| Time until an enrolled member is named (full engine test) | ~1.0 s | 0.94 s |
| Face tracking updates per second (full engine test) | 16.9 | **21.3** |

- The child process takes about 3 seconds to start, while the engine is starting up.
- All 30 Python tests pass.
- On startup the engine prints `[FACE] Face recognition running in a separate process.`

---

## 2026-11-09: Background face recognition and lighter video feed

### Face recognition no longer freezes the boxes

**Before:** the face loop detected faces, then identified each one itself. Identifying a face took about 0.9 s on this laptop, and the loop stopped completely during that time. Name boxes froze, longer with several people.

**Now**, in [gesture_engine.py](../Gesture%20Engine/gesture_engine.py):

- A new thread, `face_recognition_worker`, does the identifying.
- The face loop only hands it a copy of each face that is due for a check (at most 4 waiting at a time), then carries on tracking without waiting.
- Finished results are applied on the face loop's next pass, using the same identity rules as before (`camera_tracking.py`).
- Unknown faces are queued before already-recognised ones.
- A result that never comes back is retried after 5 seconds.

**Tested** end to end with an enrolled member's photo on a test frame:
- the member was named after **about 1 second**;
- the face loop kept running at **about 17 updates per second** the whole time.

### Lighter browser video

- The Security and Gesture feeds are now sent at **960 px wide** (was 1280), JPEG quality 70 (was 75).
- Measured: about 17 ms per frame instead of 29 ms.
- Set `VIDEO_FEED_WIDTH=1280` in `Gesture Engine/.env` if you want the larger picture back.

**Checks:** all 30 Python tests pass.

---

## 2026-11-09: Camera connection and video lag

### CCTV 2 had a new IP address

The Reolink camera (CCTV 2) had moved from `192.168.1.39` to `192.168.1.40`, probably because the router gave it a new address after a restart. `CCTV_2_URL` in `Gesture Engine/.env` now points to `.40`.

At the time of the scan:
- **CCTV 1** (Hikvision, `.45`) was not on the network.
- The **phone camera** (`.55`) was on Wi-Fi, but its streaming app was not running.

### Video lag

**Cause:** the Reolink sends **4K video (3840×2160)**. The engine handled every frame at full 4K:
- three loops each copied it;
- the video loop drew boxes on two full 4K copies and only then shrank them;
- both feeds (Security and Gesture) were JPEG-encoded on every frame, even with no one watching;
- a fixed 33 ms sleep came on top of all that work.

**Fixes in [gesture_engine.py](../Gesture%20Engine/gesture_engine.py):**

1. **Shrink once on arrival.** Frames wider than `MAX_FRAME_WIDTH` (default **1280**) are shrunk as soon as they come from the camera, so no other loop sees 4K.
2. **Encode only watched feeds.** The engine counts open browser streams per feed, and skips drawing and encoding feeds no one is viewing.
3. **Frame pacing.** The fixed 33 ms sleep was replaced with pacing that subtracts the time already spent, targeting 25 fps.

**Measured** on a real frame from the camera: image handling went from **107 ms to 36 ms per frame**, about 3× faster.

> `MAX_FRAME_WIDTH=1280` gives the same detail as the original 720p Hikvision camera. If faces far from the camera are not recognised and the video stays smooth, try `1920` in `Gesture Engine/.env`.

### Camera settings changed (Reolink "Clear" stream)

| Setting | Before | After |
|---|---|---|
| Resolution | 3840×2160 (4K) | 2304×1296 (smallest option offered) |
| CPU to decode the video | 157% of one core | **54% of one core** |

- **Recommended remaining settings:** Frame Rate **15** (currently 30), Max Bitrate **3072** (currently 1024).
- **Startup camera:** `CAMERA_SOURCE=cctv_2` was added to `Gesture Engine/.env`. The engine was starting on the phone camera, which was not streaming, so the dashboard showed "Camera Not Connected".

---

## 2026-11-09: Camera switching without login (development only)

For the defense, switching cameras no longer requires an admin login.

- **New setting:** `REQUIRE_ADMIN_TO_SWITCH_CAMERA` in [gesture_engine.py](../Gesture%20Engine/gesture_engine.py).
  - It defaults to `true` (login required).
  - Your local `Gesture Engine/.env` sets it to `false`.
- **Startup warning:** when it is off, the engine prints `[WARNING] Camera switching does NOT require admin login (development mode).`
- **Only camera switching is affected.** `/refresh_ai` still requires an admin login, which the dashboard sends automatically.
- **Checked:** with no login, `/switch_camera` returned 200 and switched the camera, and `/refresh_ai` returned 401.

> **After the defense:** set `REQUIRE_ADMIN_TO_SWITCH_CAMERA=true` in `Gesture Engine/.env` (or delete the line) and restart the engine.

---

## 2026-11-09: ML monitoring, Phase 1 fixes (multi-person detection)

Phase 1 of [MAIn-PROBLEMToFIX.md](MAIn-PROBLEMToFIX.md): fixes that need no new hardware. **Not committed yet.**

### Summary

| Problem (from MAIn-PROBLEMToFIX.md) | Status |
|---|---|
| 2. Floor exercises lose the person's identity | Fixed |
| 3. Strangers slow down everyone else | Fixed |
| 5. Exercise features depend on distance from the camera | Fixed, model retrained |
| New bug: correct face matches rejected as "ambiguous" | Fixed |
| 4. Faces too small to identify still sent to recognition | Fixed |
| 4. MediaPipe "full" pose model | Not done; needs testing on the gym PC |

### 1. Identity stays with the skeleton (problem 2)

**Before:** a skeleton lost its member identity **1.5 seconds** after the face disappeared. In push-ups, planks, sit-ups, crunches, mountain climbers and burpees the face points at the floor. The member became "UNRECOGNIZED" and the exercise was never verified.

**Now**, in [camera_tracking.py](../Gesture%20Engine/camera_tracking.py):

- A skeleton keeps its identity for as long as the pose tracker follows it, with or without a visible face.
- An unrecognised face never erases the identity.
- A *different* member must be recognised **3 times in a row** to relabel the skeleton (`CONFLICT_CONFIRMATIONS`). One wrong match changes nothing.
- Safety limit: the identity is cleared after **90 seconds** with no face confirming it (`IDENTITY_MAX_UNCONFIRMED_SECONDS`). This limits the damage if the tracker ever swaps two people.

### 2. Unknown faces no longer re-checked every frame (problem 3)

**Before:** a face that matched no member (staff, a walk-in, someone side-on) went through face recognition on **every loop**. Recognition is the most expensive step and runs one face at a time, so each stranger made the engine slower for everyone. Also, one failed re-check wiped a recognised member back to "Unknown".

**Now**, in [camera_tracking.py](../Gesture%20Engine/camera_tracking.py) and the face loop of [gesture_engine.py](../Gesture%20Engine/gesture_engine.py):

| Rule | Value |
|---|---|
| Unknown faces re-checked at most every | 1 second (`UNKNOWN_RECHECK_SECONDS`) |
| Recognised faces re-confirmed every | 4 seconds (`KNOWN_RECHECK_SECONDS`) |
| Failed re-checks in a row before a member is forgotten | 3 (`FACE_MISSES_TO_FORGET`) |
| Agreeing matches needed to switch a face to another member | 2 (`FACE_SWITCH_CONFIRMATIONS`) |

### 3. Correct matches were being rejected as "ambiguous" (bug found while fixing)

Each member is enrolled with several face views, stored as separate entries. To avoid confusing look-alikes, the old code compared the **two closest entries** and rejected the match if they were too similar. Those two entries were usually **two views of the same person**, so correct matches were often thrown away.

**Now** `select_member_match()` first keeps only the closest view **per member**, then compares the best member with the next-best *different* member. The match threshold (0.50) and the margin (0.06) are unchanged.

### 4. Small faces are tracked but not recognised (part of problem 4)

Faces narrower than **48 pixels** are still tracked, but no longer sent to face recognition. Below that size recognition is unreliable and wastes CPU when many people are in view. The value is set by `MIN_RECOGNITION_FACE_PX` in `Gesture Engine/.env`. Lower it if members far from the camera are never recognised.

### 5. Exercise features no longer depend on distance (problem 5)

**Before:** joint positions were measured relative to the nose but not scaled to body size. The same squat produced different numbers close to the camera and at the back of the gym.

**Now** a new module, [pose_features.py](../Gesture%20Engine/pose_features.py), divides every skeleton by its **torso length** (shoulder midpoint to hip midpoint). Training and live detection both use this module, so they always build the same features.

- **Feature version 2.** The saved model records which version it was trained on (`feature_version_`). The engine reads that and builds matching features, so an old model would still work.
- **No new recordings needed.** The dataset keeps its existing format; scaling is applied when training and when predicting.
- **Retrained model.** [train_model.py](../Gesture%20Engine/scripts/train_model.py) now applies the scaling and balances exercises with few frames (`class_weight='balanced'`). It also prints a per-exercise report and saves `models/workout_model.pkl` as feature version 2.

**Measured on the existing dataset:**

| | Old features | New features |
|---|---|---|
| Cross-validated accuracy | 96.4% | 98.8% |
| Same answer when the person is 2× further away | 52.1% | **100%** |
| Same answer when the person is 1.4× further away | 78.4% | **100%** |
| Same answer when the person is 1.5× closer | 92.2% | **100%** |

> The accuracy figures are inflated: the dataset is only 167 frames taken from demo GIFs, and near-identical frames end up in both training and testing. Use them to compare old and new, not as real-world accuracy. Phase 3 (real recordings) is what fixes this.

### Smaller changes

- `train_model.py` crashed with an encoding error when its output was piped on Windows. It now uses UTF-8 output like `main.py`.
- [.env.example](../Gesture%20Engine/.env.example) documents the new `MIN_RECOGNITION_FACE_PX` setting.

### Files changed

| File | Change |
|---|---|
| `Gesture Engine/camera_tracking.py` | Rewritten: identity rules, recognition schedule, member matching |
| `Gesture Engine/pose_features.py` | **New**: shared feature extraction with torso scaling |
| `Gesture Engine/gesture_engine.py` | Face loop uses the new rules; classifier uses `pose_features.py` |
| `Gesture Engine/scripts/train_model.py` | Torso scaling, balanced classes, per-exercise report, version tag |
| `Gesture Engine/models/workout_model.pkl` | Retrained (feature version 2) |
| `Gesture Engine/tests/test_camera_tracking.py` | Rewritten for the new rules (20 tests) |
| `Gesture Engine/tests/test_pose_features.py` | **New** (6 tests) |
| `Gesture Engine/.env.example` | Documents `MIN_RECOGNITION_FACE_PX` |
| `MAIn-PROBLEMToFIX.md` | Phase 1 items ticked |

### How it was checked

- **All 30 Python tests pass** (20 tracking, 6 pose features, 4 existing prediction tests).
- **Engine smoke test:**
  - The engine imports without starting cameras or threads.
  - It loads the retrained model as feature version 2.
  - It classifies a test skeleton.
- **Not yet tested with live cameras.** Real behaviour with several people in the gym still has to be confirmed (see "Next steps").

---

## 2026-11-09: Security fixes (committed as `1f2f3a06` on `update-event-plans`)

- **Login required:** all admin API routes require login (Sanctum). The `/api/ai/*` routes require the engine's shared `AI_ENGINE_TOKEN`.
- **Safe member photos:** face enrollment must be a real image, and photos can only be deleted inside `public/faces` and `public/profiles`. This blocks deleting files such as `.env`.
- **Reset PIN limits:** password-reset PINs lock after 5 wrong guesses, and login/reset routes are rate limited.
- **Camera passwords:** moved out of the code into the git-ignored `Gesture Engine/.env`.
- **Member photos:** no longer tracked by git.
- **Engine controls:** `/refresh_ai` and `/switch_camera` require an admin login. The engine listens on `127.0.0.1` by default.
- **Other:**
  - Route logic moved into `WorkoutController` and `AiBridgeController`.
  - Faster inactive-member check.
  - `member_id` validated when logging attendance.
  - `Login.jsx` uses `VITE_API_BASE_URL`.

---

## Next steps

### 1. Test Phase 1 on the real cameras (do this first)

1. Restart the Gesture Engine: `python main.py` in `Gesture Engine/`.
2. Check the startup log for `[MODEL] Workout model uses pose feature version 2.`
3. Have 2–3 enrolled members do a **floor exercise** (push-ups or planks) at the same time. Their names should stay on their skeletons for the whole set.
4. Walk an **unenrolled** person through the frame. The video should stay smooth.
5. If members far from the camera are never recognised, lower `MIN_RECOGNITION_FACE_PX` (e.g. to 36) in `Gesture Engine/.env`.

### 2. Record a baseline

Record two or three 10-minute clips of a busy session and note who did what. Re-run them after each change to measure people detected, ID swaps, and correct versus wrong verifications.

### 3. Phase 2: rep counting for the assigned exercise

The coach already picks the exercise, so the engine only has to check *that* exercise. Counting reps from joint angles (e.g. knee angle for squats) is more reliable than the 12-way classifier, and gives real rep counts to compare with sets × reps.

### 4. Phase 3: real training data

The model is still trained on 167 frames from demo GIFs. This is the biggest remaining limit on accuracy. Record real members on the gym cameras: 5–10 people per exercise, short clips, and a "just standing" class.

### 5. Later

- Try MediaPipe's "full" pose model on the gym PC.
- For crowds, plan the move to YOLO11-pose + ByteTrack (needs an NVIDIA GPU) and better camera placement. See Phases 4–5 of [MAIn-PROBLEMToFIX.md](MAIn-PROBLEMToFIX.md).
