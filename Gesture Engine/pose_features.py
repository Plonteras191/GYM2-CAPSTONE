"""Distance-independent pose input for the existing workout model.

The model (models/workout_model.pkl) was trained on 33 nose-relative joint
positions (x, y, z, visibility), mostly from large, near bodies. A person far
from the camera produces much smaller offsets, which the model reads as a
different pose. These helpers rescale each live body to the training data's
typical size, and add two checks the model cannot do itself: whether the
person is moving at all, and whether the joints an exercise needs are visible.
"""

import csv
import os
import time
from collections import deque

import numpy as np

# MediaPipe pose landmark indices.
NOSE = 0
L_SHOULDER, R_SHOULDER = 11, 12
L_ELBOW, R_ELBOW = 13, 14
L_WRIST, R_WRIST = 15, 16
L_HIP, R_HIP = 23, 24
L_KNEE, R_KNEE = 25, 26
L_ANKLE, R_ANKLE = 27, 28

# Median torso length (mid-shoulder to mid-hip, normalized image units) of
# datasets/custom_workout_dataset.csv. Used when the CSV is not available.
TRAIN_TORSO_FALLBACK = 0.2206
MIN_VISIBILITY = 0.5
BODY_JOINTS = list(range(L_SHOULDER, L_ANKLE + 1))

# Joint pairs (left, right) each exercise needs. One side of each pair is
# enough, since side-on views hide the far side.
_LEGS = [(L_HIP, R_HIP), (L_KNEE, R_KNEE), (L_ANKLE, R_ANKLE)]
_ARMS = [(L_SHOULDER, R_SHOULDER), (L_ELBOW, R_ELBOW), (L_WRIST, R_WRIST)]
_CORE = [(L_SHOULDER, R_SHOULDER), (L_HIP, R_HIP), (L_KNEE, R_KNEE)]
REQUIRED_JOINTS = {
    'SQUAT': _LEGS,
    'LUNGE': _LEGS,
    'HIGH KNEE': _LEGS,
    'DEADLIFT': _LEGS + [(L_WRIST, R_WRIST)],
    'BURPEE': _LEGS + [(L_WRIST, R_WRIST)],
    'MOUNTAIN CLIMBER': _LEGS + [(L_WRIST, R_WRIST)],
    'CURL': _ARMS,
    'PUSH UP': _ARMS + [(L_HIP, R_HIP)],
    'PLANK': _ARMS + [(L_HIP, R_HIP)],
    'SIT UP': _CORE,
    'CRUNCH': _CORE,
    'RUSSIAN TWIST': _CORE,
}


def _value(point, name):
    value = getattr(point, name, None)
    return 0.0 if value is None else float(value)


def landmarks_array(landmarks):
    """33 landmarks -> (33, 4) array of x, y, z, visibility."""
    return np.array(
        [[_value(p, 'x'), _value(p, 'y'), _value(p, 'z'), _value(p, 'visibility')] for p in landmarks],
        dtype=np.float32,
    )


def load_train_torso(dataset_path):
    """Median torso length in the training CSV, or the built-in fallback."""
    try:
        lengths = []
        with open(dataset_path, newline='') as dataset_file:
            for row in csv.DictReader(dataset_file):
                # CSV columns are 1-based: landmark i is column i + 1.
                shoulder_x = (float(row['x12']) + float(row['x13'])) / 2
                shoulder_y = (float(row['y12']) + float(row['y13'])) / 2
                hip_x = (float(row['x24']) + float(row['x25'])) / 2
                hip_y = (float(row['y24']) + float(row['y25'])) / 2
                lengths.append(float(np.hypot(shoulder_x - hip_x, shoulder_y - hip_y)))
        if lengths:
            median = float(np.median(lengths))
            if median > 0:
                return median
    except (OSError, KeyError, ValueError):
        pass
    return TRAIN_TORSO_FALLBACK


def torso_length(points):
    """Mid-shoulder to mid-hip distance, or None if those joints are hidden."""
    torso = points[[L_SHOULDER, R_SHOULDER, L_HIP, R_HIP]]
    if (torso[:, 3] < MIN_VISIBILITY).any():
        return None
    shoulders = (points[L_SHOULDER, :2] + points[R_SHOULDER, :2]) / 2
    hips = (points[L_HIP, :2] + points[R_HIP, :2]) / 2
    length = float(np.linalg.norm(shoulders - hips))
    return length if length > 1e-4 else None


def scaled_model_input(points, train_torso):
    """Model input row (1, 132) with the body rescaled to the training size.

    Same layout as training: nose-relative x, y, z plus raw visibility.
    Returns None when the torso cannot be measured.
    """
    length = torso_length(points)
    if length is None:
        return None
    scale = float(np.clip(train_torso / length, 0.2, 20.0))
    relative = points[:, :3] - points[NOSE, :3]
    row = np.column_stack([relative * scale, points[:, 3]])
    return row.astype(np.float32).reshape(1, -1)


def joints_visible_for(exercise, points):
    """True if one side of every joint pair the exercise needs is visible."""
    pairs = REQUIRED_JOINTS.get(exercise)
    if not pairs:
        return True
    return all(max(points[left, 3], points[right, 3]) >= MIN_VISIBILITY for left, right in pairs)


class MotionTracker:
    """How much a body moved over the last `window` seconds, in torso lengths.

    Motion is the mean of the three largest per-joint position ranges, so
    exercises that move only the arms (curls) still count as moving, while
    landmark jitter on a still body stays well below MOTION_MIN.
    """

    def __init__(self, window=1.5, min_span=0.8):
        self.window = window
        self.min_span = min_span
        self.samples = deque()

    def add(self, points, now=None):
        now = time.monotonic() if now is None else now
        length = torso_length(points)
        if length is None:
            return
        center = (points[L_HIP, :2] + points[R_HIP, :2]) / 2
        normalized = (points[BODY_JOINTS, :2] - center) / length
        visible = points[BODY_JOINTS, 3] >= MIN_VISIBILITY
        self.samples.append((now, normalized, visible))
        while self.samples and now - self.samples[0][0] > self.window:
            self.samples.popleft()

    def motion(self):
        """Motion in torso lengths, or None until enough history exists."""
        if len(self.samples) < 3 or self.samples[-1][0] - self.samples[0][0] < self.min_span:
            return None
        positions = np.stack([s[1] for s in self.samples])
        visible = np.stack([s[2] for s in self.samples]).all(axis=0)
        if not visible.any():
            return None
        ranges = np.linalg.norm(positions.max(axis=0) - positions.min(axis=0), axis=1)[visible]
        top = np.sort(ranges)[-3:]
        return float(top.mean())


def static_exercises_from_env():
    raw = os.getenv('STATIC_EXERCISES', 'PLANK')
    return {item.strip().upper() for item in raw.split(',') if item.strip()}
