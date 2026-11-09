"""Pose feature extraction shared by training and the live engine.

Feature versions
----------------
1: 33 landmarks x (x, y, z, visibility), with x/y/z measured relative to the
   nose. Depends on how far the person is from the camera.
2: Version 1, then x/y/z divided by the person's torso length (distance from
   the shoulder midpoint to the hip midpoint). The same pose now gives the
   same numbers near the camera and at the back of the gym.

Datasets stay in the version 1 (nose-relative) format, which is what
collect_data.py and auto_scraper.py write. Scaling is applied at training and
prediction time, so old and new recordings can be mixed.
"""

import numpy as np

FEATURE_VERSION = 2

NUM_LANDMARKS = 33
VALUES_PER_LANDMARK = 4  # x, y, z, visibility
NUM_FEATURES = NUM_LANDMARKS * VALUES_PER_LANDMARK

LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
LEFT_HIP, RIGHT_HIP = 23, 24

# Below this torso length (in normalised image units) the skeleton is too
# small or broken to scale reliably, so it is left unscaled.
MIN_TORSO_LENGTH = 1e-3


def _value(value):
    return float(value) if value is not None else 0.0


def nose_relative_row(landmarks):
    """Version 1 features for one MediaPipe skeleton, shape (132,)."""
    origin = landmarks[0]
    origin_x, origin_y, origin_z = _value(origin.x), _value(origin.y), _value(origin.z)
    return np.array(
        [
            [
                _value(point.x) - origin_x,
                _value(point.y) - origin_y,
                _value(point.z) - origin_z,
                _value(point.visibility),
            ]
            for point in landmarks
        ],
        dtype=np.float32,
    ).flatten()


def scale_by_torso(rows):
    """Turn version 1 rows (n, 132) into version 2 rows (n, 132)."""
    rows = np.asarray(rows, dtype=np.float32)
    single = rows.ndim == 1
    points = rows.reshape(-1, NUM_LANDMARKS, VALUES_PER_LANDMARK).copy()

    shoulders = (points[:, LEFT_SHOULDER, :2] + points[:, RIGHT_SHOULDER, :2]) / 2.0
    hips = (points[:, LEFT_HIP, :2] + points[:, RIGHT_HIP, :2]) / 2.0
    torso = np.linalg.norm(shoulders - hips, axis=1)
    scale = np.where(torso > MIN_TORSO_LENGTH, torso, 1.0).astype(np.float32)

    points[:, :, :3] /= scale[:, None, None]
    scaled = points.reshape(-1, NUM_FEATURES)
    return scaled[0] if single else scaled


def landmarks_to_features(landmarks, feature_version=FEATURE_VERSION):
    """Model input (1, 132) for one live skeleton, in the model's version."""
    row = nose_relative_row(landmarks)
    if feature_version >= 2:
        row = scale_by_torso(row)
    return row.reshape(1, -1)


def model_feature_version(model):
    """Models trained before torso scaling have no marker: treat them as 1."""
    return int(getattr(model, 'feature_version_', 1))
