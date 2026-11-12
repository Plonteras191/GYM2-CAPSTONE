import os
import tempfile
import unittest

import numpy as np

from monitoring import EXCLUDED, IDENTIFYING, MONITORED, monitoring_status
from pose_features import (
    TRAIN_TORSO_FALLBACK,
    MotionTracker,
    joints_visible_for,
    load_train_torso,
    scaled_model_input,
)

ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def standing_body(scale=1.0, shift=(0.0, 0.0)):
    """(33, 4) points of a simple upright body, fully visible."""
    points = np.zeros((33, 4), dtype=np.float32)
    layout = {
        0: (0.0, -0.30),                     # nose
        11: (-0.08, -0.20), 12: (0.08, -0.20),  # shoulders
        13: (-0.12, -0.08), 14: (0.12, -0.08),  # elbows
        15: (-0.13, 0.03), 16: (0.13, 0.03),    # wrists
        23: (-0.06, 0.02), 24: (0.06, 0.02),    # hips
        25: (-0.06, 0.20), 26: (0.06, 0.20),    # knees
        27: (-0.06, 0.38), 28: (0.06, 0.38),    # ankles
    }
    for index in range(33):
        x, y = layout.get(index, (0.0, -0.30))
        points[index] = (0.5 + shift[0] + x * scale, 0.5 + shift[1] + y * scale, 0.0, 0.95)
    return points


class MonitoringStatusTests(unittest.TestCase):
    def test_statuses(self):
        self.assertEqual(monitoring_status(None, False), IDENTIFYING)
        self.assertEqual(monitoring_status(None, True), IDENTIFYING)
        self.assertEqual(monitoring_status(5, False), EXCLUDED)
        self.assertEqual(monitoring_status(5, True), MONITORED)


class ScaledInputTests(unittest.TestCase):
    def test_far_body_gives_same_model_input_as_near(self):
        near = scaled_model_input(standing_body(), TRAIN_TORSO_FALLBACK)
        far = scaled_model_input(standing_body(scale=0.3, shift=(0.2, -0.1)), TRAIN_TORSO_FALLBACK)
        self.assertEqual(near.shape, (1, 132))
        np.testing.assert_allclose(near, far, atol=1e-4)

    def test_hidden_torso_returns_none(self):
        body = standing_body()
        body[23, 3] = 0.1
        body[24, 3] = 0.1
        self.assertIsNone(scaled_model_input(body, TRAIN_TORSO_FALLBACK))

    def test_train_torso_from_dataset_and_fallback(self):
        dataset = os.path.join(ENGINE_DIR, 'datasets', 'custom_workout_dataset.csv')
        value = load_train_torso(dataset)
        self.assertGreater(value, 0.05)
        self.assertLess(value, 0.5)
        missing = os.path.join(tempfile.gettempdir(), 'no_such_dataset.csv')
        self.assertEqual(load_train_torso(missing), TRAIN_TORSO_FALLBACK)


class MotionTests(unittest.TestCase):
    def test_still_body_is_not_moving(self):
        tracker = MotionTracker()
        rng = np.random.default_rng(1)
        for step in range(20):
            body = standing_body(scale=0.4)
            body[:, :2] += rng.normal(0, 0.001, size=(33, 2))  # landmark jitter
            tracker.add(body, now=step * 0.1)
        self.assertLess(tracker.motion(), 0.15)

    def test_curling_arms_is_moving(self):
        tracker = MotionTracker()
        for step in range(20):
            body = standing_body(scale=0.4)
            lift = 0.08 * np.sin(step * 0.6)  # wrists go up and down
            body[15, 1] -= lift
            body[16, 1] -= lift
            tracker.add(body, now=step * 0.1)
        self.assertGreater(tracker.motion(), 0.15)

    def test_motion_unknown_until_enough_history(self):
        tracker = MotionTracker()
        tracker.add(standing_body(), now=0.0)
        tracker.add(standing_body(), now=0.1)
        self.assertIsNone(tracker.motion())


class VisibilityTests(unittest.TestCase):
    def test_legs_hidden_blocks_squat_but_not_curl(self):
        body = standing_body()
        body[[25, 26, 27, 28], 3] = 0.1
        self.assertFalse(joints_visible_for('SQUAT', body))
        self.assertTrue(joints_visible_for('CURL', body))

    def test_one_side_is_enough(self):
        body = standing_body()
        body[[13, 15], 3] = 0.1  # left arm hidden (side view)
        self.assertTrue(joints_visible_for('CURL', body))


if __name__ == '__main__':
    unittest.main()
