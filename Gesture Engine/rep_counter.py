"""Count exercise repetitions from pose landmarks.

Each selected exercise is counted from the angle of one joint that bends and
straightens once per repetition: the knee for squats, the elbow for push-ups
and curls, the hip for sit-ups. A repetition is one full bend (angle below
the "flexed" limit) followed by a straighten (angle above the "extended"
limit). The gap between the two limits stops a small wobble near one limit
from counting as extra repetitions.

Pure numpy, so it can be unit-tested without a camera or MediaPipe.
"""

import math
import os

import numpy as np

from pose_features import (
    L_ANKLE, L_ELBOW, L_HIP, L_KNEE, L_SHOULDER, L_WRIST,
    R_ANKLE, R_ELBOW, R_HIP, R_KNEE, R_SHOULDER, R_WRIST,
    MIN_VISIBILITY,
)

# Exercises the counter supports: the joint triple (first, middle, last)
# whose angle at the middle joint is measured, one triple per body side, and
# the angle limits in degrees. The gym's approved exercises are chosen with
# REP_EXERCISES in "Gesture Engine/.env" (see countable_exercises_from_env).
EXERCISE_ANGLES = {
    'SQUAT': {
        'joints': ((L_HIP, L_KNEE, L_ANKLE), (R_HIP, R_KNEE, R_ANKLE)),
        'flexed': 110.0,    # knee at the bottom of the squat
        'extended': 155.0,  # standing again
    },
    'PUSH UP': {
        'joints': ((L_SHOULDER, L_ELBOW, L_WRIST), (R_SHOULDER, R_ELBOW, R_WRIST)),
        'flexed': 100.0,    # elbow with the chest near the floor
        'extended': 150.0,  # arms straight again
    },
    'CURL': {
        'joints': ((L_SHOULDER, L_ELBOW, L_WRIST), (R_SHOULDER, R_ELBOW, R_WRIST)),
        'flexed': 70.0,     # elbow fully curled
        'extended': 145.0,  # arm lowered again
    },
    'SIT UP': {
        'joints': ((L_SHOULDER, L_HIP, L_KNEE), (R_SHOULDER, R_HIP, R_KNEE)),
        'flexed': 100.0,    # hip when sitting up
        'extended': 140.0,  # lying back down
    },
}

# Two repetitions closer together than this are a landmark glitch, not a rep.
MIN_REP_SECONDS = 0.4
# Smoothing of the measured angle (0 = none, 1 = ignore new readings).
ANGLE_SMOOTHING = 0.4


def joint_angle(first, middle, last):
    """Angle in degrees at `middle` between the lines to `first` and `last`."""
    a = np.asarray(first, dtype=np.float64) - np.asarray(middle, dtype=np.float64)
    b = np.asarray(last, dtype=np.float64) - np.asarray(middle, dtype=np.float64)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm < 1e-9:
        return None
    cosine = float(np.clip(np.dot(a, b) / norm, -1.0, 1.0))
    return math.degrees(math.acos(cosine))


def measured_angle(points, triples, aspect=1.0):
    """Angle of the better-seen side, or None if no side is fully visible.

    points: (33, 4) array of x, y, z, visibility with x and y normalized to
    the frame. aspect = frame width / height, so angles are measured in
    real proportions rather than the squashed normalized ones.
    """
    best = None
    for triple in triples:
        visibility = min(float(points[index, 3]) for index in triple)
        if visibility < MIN_VISIBILITY:
            continue
        if best is None or visibility > best[0]:
            best = (visibility, triple)
    if best is None:
        return None
    first, middle, last = (points[index, :2] * (aspect, 1.0) for index in best[1])
    return joint_angle(first, middle, last)


class RepCounter:
    """Counts full repetitions of one exercise from successive landmark frames.

    phase is 'up' (joint extended, between reps) or 'down' (joint flexed,
    in the middle of a rep). A rep is counted when the joint straightens
    again after having been flexed.
    """

    def __init__(self, exercise, start=0):
        config = EXERCISE_ANGLES.get(str(exercise).upper())
        if config is None:
            raise ValueError(f"No repetition rule for exercise '{exercise}'.")
        self.exercise = str(exercise).upper()
        self.joints = config['joints']
        self.flexed = config['flexed']
        self.extended = config['extended']
        self.count = max(0, int(start or 0))
        self.phase = 'up'
        self.angle = None
        self.last_rep_at = None

    def update(self, points, now=0.0, aspect=1.0):
        """Feed one frame of landmarks; returns the count so far."""
        angle = measured_angle(points, self.joints, aspect)
        if angle is None:
            return self.count  # joint hidden this frame: keep the state
        if self.angle is None:
            self.angle = angle
        else:
            self.angle = ANGLE_SMOOTHING * self.angle + (1.0 - ANGLE_SMOOTHING) * angle

        if self.phase == 'up' and self.angle <= self.flexed:
            self.phase = 'down'
        elif self.phase == 'down' and self.angle >= self.extended:
            self.phase = 'up'
            if self.last_rep_at is None or now - self.last_rep_at >= MIN_REP_SECONDS:
                self.count += 1
                self.last_rep_at = now
        return self.count


def countable_exercises_from_env():
    """Exercises to count, from REP_EXERCISES (default: every supported one)."""
    raw = os.getenv('REP_EXERCISES', '').strip()
    if not raw:
        return set(EXERCISE_ANGLES)
    chosen = {item.strip().upper() for item in raw.split(',') if item.strip()}
    unsupported = sorted(chosen - set(EXERCISE_ANGLES))
    if unsupported:
        print(f"[WARNING] REP_EXERCISES has no repetition rule for: {', '.join(unsupported)}. "
              f"Supported: {', '.join(sorted(EXERCISE_ANGLES))}.")
    return chosen & set(EXERCISE_ANGLES)
