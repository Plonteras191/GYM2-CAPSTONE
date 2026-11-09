# ML Monitoring: Problems and Fixes for Multi-Person Detection

Why the Gesture Engine has trouble watching many gym members at once, and what to change. Based on a review of the code on 2026-11-09.

## How it works now

A single camera feeds two loops in [gesture_engine.py](../Gesture%20Engine/gesture_engine.py):

- **Face loop:** finds faces and recognises members.
- **Pose loop:** runs MediaPipe pose detection (up to 12 people, "lite" model) and attaches each skeleton to a nearby face.

A Random Forest model then guesses the exercise from **one frame at a time**. Once the guess is steady, the engine reports the workout to Laravel.

## Summary

The two biggest causes:

1. The exercise model was trained on far too little data.
2. The code loses track of who a person is as soon as their face turns away.

Several smaller problems make the engine slower as more people appear.

---

## Main problems, worst first

### 1. Not enough training data

- [custom_workout_dataset.csv](../Gesture%20Engine/datasets/custom_workout_dataset.csv) has **167 frames for 12 exercises**.

  | Exercise | Frames |
  |---|---|
  | Burpee | 29 |
  | Mountain climber | 24 |
  | Push up | 21 |
  | Squat, curl, plank, high knee, sit up | 12 each |
  | Russian twist | 11 |
  | Lunge | 9 |
  | Deadlift | 7 |
  | Crunch | 6 |

- [auto_scraper.py](../Gesture%20Engine/scripts/auto_scraper.py) took them from **demo GIF animations**, not from real people on the gym's cameras.
- The model has almost never seen a real person, a CCTV angle, gym clothing, or more than one person in a frame.
- The accuracy printed by [train_model.py](../Gesture%20Engine/scripts/train_model.py) is inflated. Near-identical frames from the same GIF end up in both the training and the test sets.

### 2. Floor exercises lose the person's identity

- [camera_tracking.py](../Gesture%20Engine/camera_tracking.py) forgets who a skeleton belongs to **1.5 seconds** after their face stops being visible (`IDENTITY_RETENTION_SECONDS = 1.5`).
- In push-ups, planks, sit-ups, crunches, mountain climbers and burpees, the face points at the floor.
- The person becomes "UNRECOGNIZED", their prediction history is cleared, and **the exercise is never verified**.

### 3. Strangers slow down everyone else (bug)

- In `face_ai_worker`, a face that doesn't match any member is re-checked on **every loop**. Examples are staff, a walk-in, or someone standing side-on.
- The 4-second wait between checks only applies to recognised members, because the condition `track['name'] == 'Unknown'` is always true for strangers.
- Face encoding is expensive and runs one face at a time. Each unknown person in view makes recognition slower for everyone.
- **Related:** the 4-second re-check replaces a recognised member with "Unknown" if one look fails, for example when they turn their head.

### 4. The pose model is weak with crowds

- MediaPipe's pose model (`pose_landmarker_lite.task`) works best with one or two people close to the camera.
- It often misses people who are far away, small or partly blocked. It can merge or swap people standing close together.
- The engine shrinks frames to **75%** before detecting.
- Faces under **25 pixels** are still sent for recognition, which is far too small to recognise reliably.

### 5. The exercise features depend on distance from the camera

- Joint positions are measured relative to the nose, but never scaled to body size.
- The same squat produces different numbers close to the camera and at the back of the gym.
- That alone causes wrong guesses when several people stand at different distances.

### 6. A single photo can't show a movement

- The model judges one frame at a time.
- The bottom of a squat looks like sitting. A push-up at the top looks like a plank.
- Exercises are movements, so the model needs a **sequence of frames** to tell them apart.

### 7. Only one camera at a time

- You can switch cameras (`/switch_camera`), but the engine never watches two at once.
- Covering the whole gym floor needs several cameras running together.

---

## What to do

### Phase 1: code fixes, no new hardware

Biggest improvement for the least work.

> **Status (2026-11-09):** the first three items are done, and the fourth is partly done. Details are in [UPDATEIMADEBYCLAUDE.md](UPDATEIMADEBYCLAUDE.md).

- [x] **Keep identity on the skeleton.** Keep identity attached for as long as that skeleton is tracked. Only replace it when a *different* member is clearly recognised. *Fixes problem 2.*
- [x] **Throttle unknown faces.** Re-check unknown faces only every 1–2 seconds. A recognised member stays recognised until several checks in a row disagree. *Fixes problem 3.*
- [x] **Scale by body size.** Divide joint positions by torso length (shoulder-to-hip distance) so distance from the camera stops mattering. *Fixes problem 5.* The model has been retrained. The scaling is applied in `pose_features.py` during training and live detection, so [collect_data.py](../Gesture%20Engine/scripts/collect_data.py) needed no change.
- [ ] **Better detection input.**
  - [x] Only try to recognise faces that are big enough (now 48 px, set by `MIN_RECOGNITION_FACE_PX`).
  - [ ] Use MediaPipe's "full" pose model instead of "lite". Test on the gym PC first, because it is slower.
  - ~~Run detection at full resolution.~~ Not needed: MediaPipe shrinks every frame to its own small input size anyway, and face recognition already uses full-resolution crops.

### Phase 2: better verification

Coaches already choose the exercise. So the engine only needs to answer **"is this person doing the assigned exercise?"**, not pick from 12.

- [ ] Count reps from joint angles, one rule per exercise. Example: a squat rep is the knee angle going from about 170° down to under 100° and back up.
- [ ] Compare the counted reps with the coach's **sets × reps**.
- [ ] Keep the ML model only as a backup check.

### Phase 3: real training data

- [ ] Record real members on your own cameras doing each exercise:
  - 5–10 different people per exercise
  - in different spots in the gym
  - with several people in the frame
- [ ] Use whole movement clips of 1–2 seconds, not single frames.
- [ ] Split training and testing **by person**, so the accuracy score is honest.
- [ ] Add a **"nothing / just standing"** class, so walking around isn't counted as an exercise.

### Phase 4: a stronger model for crowds

- [ ] Replace MediaPipe with **YOLO11-pose + ByteTrack** (both from the Ultralytics package).
  - Built to track many people at once.
  - Copes with people blocking each other.
  - Keeps each person's ID stable between frames.
- [ ] Needs an **NVIDIA graphics card** to run in real time. On a normal processor it handles only a few frames per second.

### Phase 5: cameras

- [ ] **Entrance camera** at face height, for check-in recognition.
- [ ] **Workout floor cameras** looking down over the floor, for exercises.
- [ ] Use the **main stream** (`Channels/101`, 1080p) for recognition. Faces need roughly **80 pixels or more** to be recognised well.
- [ ] Mount floor cameras about **2.5–3 m high, angled down**, so fewer people block each other.

---

## How to measure progress

Before changing anything, record two or three **10-minute clips of a busy session** and write down who did what. Re-run them after each change and compare:

| Measure | What it tells you |
|---|---|
| People detected / people present | Whether the pose model finds everyone |
| ID swaps per clip | Whether tracking keeps people apart |
| Workouts correctly verified | Whether real exercises are detected |
| Workouts wrongly credited | Whether people get credit they didn't earn |
| Engine frames per second | Whether the engine keeps up as more people appear |
