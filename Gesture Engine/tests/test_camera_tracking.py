import unittest

from camera_tracking import IDENTITY_RETENTION_SECONDS, update_pose_track_identity


class PoseTrackIdentityTests(unittest.TestCase):
    def test_retains_recognized_identity_during_brief_face_occlusion(self):
        track = {'name': 'Unknown', 'member_id': None}
        face = {'name': 'Member One', 'member_id': 42, 'workout_eligible': True}

        update_pose_track_identity(track, face, 10.0)
        identity = update_pose_track_identity(track, None, 11.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_expires_identity_after_retention_window(self):
        track = {
            'name': 'Member One',
            'member_id': 42,
            'identity_seen': 10.0,
            'workout_eligible': True,
        }

        identity = update_pose_track_identity(
            track,
            None,
            10.0 + IDENTITY_RETENTION_SECONDS + 0.01,
        )

        self.assertEqual(identity, ('Unknown', None, False))

    def test_recognized_face_refreshes_track_identity(self):
        track = {
            'name': 'Member One',
            'member_id': 42,
            'identity_seen': 10.0,
            'workout_eligible': True,
        }
        face = {'name': 'Member Two', 'member_id': 84, 'workout_eligible': False}

        identity = update_pose_track_identity(track, face, 12.0)

        self.assertEqual(identity, ('Member Two', 84, False))
        self.assertEqual(track['identity_seen'], 12.0)

    def test_unrecognized_face_does_not_immediately_erase_recent_identity(self):
        track = {
            'name': 'Member One',
            'member_id': 42,
            'identity_seen': 10.0,
            'workout_eligible': True,
        }
        face = {'name': 'Unknown', 'member_id': None, 'workout_eligible': False}

        identity = update_pose_track_identity(track, face, 10.5)

        self.assertEqual(identity, ('Member One', 42, True))


if __name__ == '__main__':
    unittest.main()
