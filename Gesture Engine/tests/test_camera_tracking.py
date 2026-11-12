import unittest
from types import SimpleNamespace

import numpy as np

from camera_tracking import (
    IDENTITY_MAX_UNCONFIRMED,
    boxes_overlap,
    head_region,
    torso_histogram,
    update_pose_track_identity,
)

FACE = {'name': 'Member One', 'member_id': 42, 'workout_eligible': True}


def shirt_frame(bgr_color):
    """640x480 frame with a coloured shirt between the torso landmarks."""
    frame = np.full((480, 640, 3), 30, dtype=np.uint8)
    frame[150:330, 250:390] = bgr_color
    return frame


def torso_landmarks():
    points = [SimpleNamespace(x=0.5, y=0.2, visibility=0.9) for _ in range(33)]
    points[11] = SimpleNamespace(x=250 / 640, y=150 / 480, visibility=0.9)
    points[12] = SimpleNamespace(x=390 / 640, y=150 / 480, visibility=0.9)
    points[23] = SimpleNamespace(x=250 / 640, y=330 / 480, visibility=0.9)
    points[24] = SimpleNamespace(x=390 / 640, y=330 / 480, visibility=0.9)
    return points


class PoseTrackIdentityTests(unittest.TestCase):
    def test_retains_identity_while_body_tracked_without_face(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0)

        identity = update_pose_track_identity(track, None, 70.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_expires_identity_after_max_unconfirmed_time(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0)

        identity = update_pose_track_identity(track, None, 10.0 + IDENTITY_MAX_UNCONFIRMED + 0.01)

        self.assertEqual(identity, ('Unknown', None, False))

    def test_keeps_identity_when_clothing_matches(self):
        landmarks = torso_landmarks()
        red = torso_histogram(shirt_frame((0, 0, 220)), landmarks)
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0, appearance=red)

        identity = update_pose_track_identity(track, None, 12.0, appearance=red)

        self.assertEqual(identity[1], 42)

    def test_drops_identity_when_clothing_changes(self):
        landmarks = torso_landmarks()
        red = torso_histogram(shirt_frame((0, 0, 220)), landmarks)
        blue = torso_histogram(shirt_frame((220, 60, 0)), landmarks)
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0, appearance=red)

        identity = update_pose_track_identity(track, None, 12.0, appearance=blue)

        self.assertEqual(identity, ('Unknown', None, False))

    def test_drops_identity_after_overlap_without_appearance(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0)

        during = update_pose_track_identity(track, None, 11.0, overlapped=True)
        after = update_pose_track_identity(track, None, 12.0, overlapped=False)

        self.assertEqual(during[1], 42)
        self.assertEqual(after, ('Unknown', None, False))

    def test_new_face_overrides_identity(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, FACE, 10.0)
        other = {'name': 'Member Two', 'member_id': 7, 'workout_eligible': False}

        identity = update_pose_track_identity(track, other, 11.0)

        self.assertEqual(identity, ('Member Two', 7, False))


class GeometryTests(unittest.TestCase):
    def test_boxes_overlap(self):
        self.assertTrue(boxes_overlap((0, 100, 100, 0), (10, 110, 110, 10)))
        self.assertFalse(boxes_overlap((0, 100, 100, 0), (0, 300, 100, 200)))

    def test_head_region_scales_with_head_size(self):
        near = [SimpleNamespace(x=0.5 + 0.01 * (i % 3), y=0.3 + 0.01 * (i // 3), visibility=0.9) for i in range(33)]
        far = [SimpleNamespace(x=0.5 + 0.002 * (i % 3), y=0.3 + 0.002 * (i // 3), visibility=0.9) for i in range(33)]
        near_box = head_region(near, 1280, 720)
        far_box = head_region(far, 1280, 720)
        self.assertIsNotNone(near_box)
        self.assertIsNotNone(far_box)
        self.assertGreater(near_box[1] - near_box[3], far_box[1] - far_box[3])

    def test_torso_histogram_none_when_hidden(self):
        landmarks = torso_landmarks()
        landmarks[23] = SimpleNamespace(x=0.4, y=0.7, visibility=0.1)
        self.assertIsNone(torso_histogram(shirt_frame((0, 0, 220)), landmarks))


if __name__ == '__main__':
    unittest.main()
