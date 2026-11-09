import unittest
from types import SimpleNamespace

import numpy as np

from pose_features import (
    FEATURE_VERSION,
    NUM_FEATURES,
    landmarks_to_features,
    model_feature_version,
    scale_by_torso,
)


def make_skeleton(scale=1.0, shift_x=0.0, shift_y=0.0):
    """A simple standing skeleton; `scale` mimics distance from the camera."""
    rng = np.random.default_rng(7)
    base = rng.uniform(-0.2, 0.2, size=(33, 3))
    base[0] = [0.0, -0.3, 0.0]          # nose
    base[11] = [-0.1, -0.2, 0.0]        # left shoulder
    base[12] = [0.1, -0.2, 0.0]         # right shoulder
    base[23] = [-0.08, 0.1, 0.0]        # left hip
    base[24] = [0.08, 0.1, 0.0]         # right hip
    return [
        SimpleNamespace(
            x=0.5 + shift_x + point[0] * scale,
            y=0.5 + shift_y + point[1] * scale,
            z=point[2] * scale,
            visibility=0.9,
        )
        for point in base
    ]


class PoseFeatureTests(unittest.TestCase):
    def test_feature_shape_matches_the_model_input(self):
        features = landmarks_to_features(make_skeleton())

        self.assertEqual(features.shape, (1, NUM_FEATURES))

    def test_same_pose_gives_same_features_at_any_distance_and_position(self):
        near = landmarks_to_features(make_skeleton(scale=1.0))
        far = landmarks_to_features(make_skeleton(scale=0.4, shift_x=0.2, shift_y=-0.1))

        np.testing.assert_allclose(near, far, atol=1e-5)

    def test_version_one_features_still_depend_on_distance(self):
        near = landmarks_to_features(make_skeleton(scale=1.0), feature_version=1)
        far = landmarks_to_features(make_skeleton(scale=0.4), feature_version=1)

        self.assertFalse(np.allclose(near, far, atol=1e-3))

    def test_visibility_is_not_scaled(self):
        features = landmarks_to_features(make_skeleton(scale=0.4)).reshape(33, 4)

        np.testing.assert_allclose(features[:, 3], 0.9, atol=1e-6)

    def test_collapsed_skeleton_is_left_unscaled(self):
        row = np.zeros(NUM_FEATURES, dtype=np.float32)

        np.testing.assert_array_equal(scale_by_torso(row), row)

    def test_model_version_defaults_to_one_for_old_models(self):
        self.assertEqual(model_feature_version(object()), 1)
        self.assertEqual(
            model_feature_version(SimpleNamespace(feature_version_=FEATURE_VERSION)),
            FEATURE_VERSION,
        )


if __name__ == '__main__':
    unittest.main()
