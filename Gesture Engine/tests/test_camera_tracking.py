import unittest

from camera_tracking import (
    CONFLICT_CONFIRMATIONS,
    FACE_MISSES_TO_FORGET,
    IDENTITY_MAX_UNCONFIRMED_SECONDS,
    KNOWN_RECHECK_SECONDS,
    UNKNOWN_RECHECK_SECONDS,
    apply_face_recognition_result,
    face_track_needs_recognition,
    select_member_match,
    update_pose_track_identity,
)

MEMBER_ONE = {'name': 'Member One', 'member_id': 42, 'workout_eligible': True}
MEMBER_TWO = {'name': 'Member Two', 'member_id': 84, 'workout_eligible': False}
UNKNOWN_FACE = {'name': 'Unknown', 'member_id': None, 'workout_eligible': False}


class PoseTrackIdentityTests(unittest.TestCase):
    def test_first_recognized_face_names_the_skeleton(self):
        track = {'name': 'Unknown', 'member_id': None}

        identity = update_pose_track_identity(track, MEMBER_ONE, 10.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_keeps_identity_while_face_is_hidden_during_a_floor_exercise(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        # 60 seconds of push-ups: the face is never visible.
        for second in range(11, 71):
            identity = update_pose_track_identity(track, None, float(second))

        self.assertEqual(identity, ('Member One', 42, True))

    def test_unrecognized_face_does_not_erase_identity(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        identity = update_pose_track_identity(track, UNKNOWN_FACE, 30.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_identity_expires_after_long_time_without_any_confirmation(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        identity = update_pose_track_identity(
            track, None, 10.0 + IDENTITY_MAX_UNCONFIRMED_SECONDS + 0.01,
        )

        self.assertEqual(identity, ('Unknown', None, False))

    def test_seeing_the_face_again_restarts_the_expiry_clock(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)
        update_pose_track_identity(track, MEMBER_ONE, 80.0)

        identity = update_pose_track_identity(track, None, 150.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_one_conflicting_recognition_does_not_relabel_the_skeleton(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        identity = update_pose_track_identity(track, MEMBER_TWO, 11.0)

        self.assertEqual(identity, ('Member One', 42, True))

    def test_repeated_conflicting_recognitions_relabel_the_skeleton(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        for step in range(CONFLICT_CONFIRMATIONS):
            identity = update_pose_track_identity(track, MEMBER_TWO, 11.0 + step)

        self.assertEqual(identity, ('Member Two', 84, False))

    def test_conflict_count_resets_when_the_original_member_is_seen(self):
        track = {'name': 'Unknown', 'member_id': None}
        update_pose_track_identity(track, MEMBER_ONE, 10.0)

        update_pose_track_identity(track, MEMBER_TWO, 11.0)
        update_pose_track_identity(track, MEMBER_TWO, 12.0)
        update_pose_track_identity(track, MEMBER_ONE, 13.0)
        identity = update_pose_track_identity(track, MEMBER_TWO, 14.0)

        self.assertEqual(identity, ('Member One', 42, True))


class FaceRecognitionScheduleTests(unittest.TestCase):
    def test_new_track_is_recognized_immediately(self):
        self.assertTrue(face_track_needs_recognition({'member_id': None}, 100.0))

    def test_unknown_face_is_not_re_encoded_every_frame(self):
        track = {'member_id': None}
        apply_face_recognition_result(track, None, 100.0)

        self.assertFalse(face_track_needs_recognition(track, 100.05))
        self.assertTrue(face_track_needs_recognition(track, 100.0 + UNKNOWN_RECHECK_SECONDS))

    def test_known_face_is_reconfirmed_less_often(self):
        track = {'member_id': None}
        apply_face_recognition_result(track, MEMBER_ONE, 100.0)

        self.assertFalse(face_track_needs_recognition(track, 100.0 + UNKNOWN_RECHECK_SECONDS))
        self.assertTrue(face_track_needs_recognition(track, 100.0 + KNOWN_RECHECK_SECONDS))

    def test_failed_encoding_waits_before_retrying(self):
        track = {'member_id': None, 'last_recon_failed': 100.0}

        self.assertFalse(face_track_needs_recognition(track, 101.0))
        self.assertTrue(face_track_needs_recognition(track, 102.0))


class FaceRecognitionResultTests(unittest.TestCase):
    def test_match_names_an_unknown_face_and_logs_attendance(self):
        track = {'member_id': None, 'name': 'Unknown'}

        should_log = apply_face_recognition_result(track, MEMBER_ONE, 1.0)

        self.assertTrue(should_log)
        self.assertEqual(track['member_id'], 42)

    def test_single_failed_recheck_keeps_a_recognized_member(self):
        track = {'member_id': None}
        apply_face_recognition_result(track, MEMBER_ONE, 1.0)

        apply_face_recognition_result(track, None, 5.0)

        self.assertEqual(track['member_id'], 42)

    def test_repeated_failed_rechecks_forget_the_member(self):
        track = {'member_id': None}
        apply_face_recognition_result(track, MEMBER_ONE, 1.0)

        for step in range(FACE_MISSES_TO_FORGET):
            apply_face_recognition_result(track, None, 5.0 + step * 4)

        self.assertIsNone(track['member_id'])
        self.assertEqual(track['name'], 'Unknown')

    def test_switches_member_only_after_two_agreeing_matches(self):
        track = {'member_id': None}
        apply_face_recognition_result(track, MEMBER_ONE, 1.0)

        apply_face_recognition_result(track, MEMBER_TWO, 5.0)
        self.assertEqual(track['member_id'], 42)

        apply_face_recognition_result(track, MEMBER_TWO, 9.0)
        self.assertEqual(track['member_id'], 84)


class MemberMatchTests(unittest.TestCase):
    IDS = [42, 42, 84]
    NAMES = ['Member One', 'Member One', 'Member Two']
    ELIGIBLE = [True, True, False]

    def match(self, distances):
        return select_member_match(distances, self.IDS, self.NAMES, self.ELIGIBLE)

    def test_two_views_of_the_same_member_are_not_treated_as_ambiguous(self):
        # Both of Member One's enrolled views are close; Member Two is far.
        match = self.match([0.30, 0.32, 0.70])

        self.assertIsNotNone(match)
        self.assertEqual(match['member_id'], 42)

    def test_two_different_members_too_close_is_ambiguous(self):
        self.assertIsNone(self.match([0.40, 0.45, 0.42]))

    def test_no_member_within_threshold_is_unknown(self):
        self.assertIsNone(self.match([0.55, 0.60, 0.70]))

    def test_no_enrolled_faces_is_unknown(self):
        self.assertIsNone(select_member_match([], [], [], []))


if __name__ == '__main__':
    unittest.main()
