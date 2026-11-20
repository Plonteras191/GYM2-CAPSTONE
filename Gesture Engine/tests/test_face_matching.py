import unittest

import numpy as np

from face_matching import (
    IdentityVote,
    align_box,
    best_member_match,
    box_size,
    face_distances,
    normalize_lighting,
    views_agree,
)

THRESHOLD = 0.50
MARGIN = 0.05


class BestMemberMatchTests(unittest.TestCase):
    def test_multiple_views_of_same_member_still_match(self):
        # Regression: two views of member 1 are the closest encodings. The old
        # top-2 encoding gap check rejected this as ambiguous.
        distances = [0.30, 0.32, 0.45, 0.60]
        member_ids = [1, 1, 1, 2]

        member, best, second = best_member_match(distances, member_ids, THRESHOLD, MARGIN)

        self.assertEqual(member, 1)
        self.assertAlmostEqual(best, 0.30)
        self.assertAlmostEqual(second, 0.60)

    def test_two_members_too_close_is_unknown(self):
        member, _, _ = best_member_match([0.40, 0.43], [1, 2], THRESHOLD, MARGIN)
        self.assertIsNone(member)

    def test_above_threshold_is_unknown(self):
        member, _, _ = best_member_match([0.55, 0.80], [1, 2], THRESHOLD, MARGIN)
        self.assertIsNone(member)

    def test_single_enrolled_member(self):
        member, _, second = best_member_match([0.35, 0.38], [7, 7], THRESHOLD, MARGIN)
        self.assertEqual(member, 7)
        self.assertEqual(second, float('inf'))

    def test_no_enrollments(self):
        member, best, _ = best_member_match([], [], THRESHOLD, MARGIN)
        self.assertIsNone(member)
        self.assertEqual(best, float('inf'))


class IdentityVoteTests(unittest.TestCase):
    def test_single_hit_does_not_confirm(self):
        vote = IdentityVote(window=6, required=3)
        self.assertFalse(vote.add(1))
        self.assertIsNone(vote.confirmed)

    def test_confirms_after_required_hits_and_reports_once(self):
        vote = IdentityVote(window=6, required=3)
        results = [vote.add(m) for m in (1, None, 1, 1, 1)]
        self.assertEqual(results, [False, False, False, True, False])
        self.assertEqual(vote.confirmed, 1)

    def test_stray_frame_does_not_flip_confirmed_member(self):
        vote = IdentityVote(window=6, required=3)
        for m in (1, 1, 1):
            vote.add(m)
        vote.add(2)
        vote.add(None)
        self.assertEqual(vote.confirmed, 1)

    def test_switches_when_other_member_dominates(self):
        vote = IdentityVote(window=6, required=3, release_after=10)
        for m in (1, 1, 1):
            vote.add(m)
        switched = [vote.add(2) for _ in range(4)]
        self.assertEqual(vote.confirmed, 2)
        self.assertEqual(switched.count(True), 1)

    def test_far_samples_need_more_votes(self):
        # Far faces count 3/5 of a vote: 4 are not enough, 5 confirm.
        vote = IdentityVote(window=10, required=3)
        results = [vote.add(1, weight=0.6) for _ in range(5)]
        self.assertEqual(results, [False, False, False, False, True])

    def test_releases_after_consecutive_misses(self):
        vote = IdentityVote(window=6, required=3, release_after=4)
        for m in (1, 1, 1):
            vote.add(m)
        for _ in range(4):
            vote.add(None)
        self.assertIsNone(vote.confirmed)


class AlignBoxTests(unittest.TestCase):
    def test_returns_square_box_inside_frame(self):
        top, right, bottom, left = align_box(0.4, 0.3, 0.1, 0.12, 1280, 720)
        self.assertEqual(right - left, bottom - top)
        self.assertTrue(0 <= left < right <= 1280)
        self.assertTrue(0 <= top < bottom <= 720)

    def test_clamps_to_frame_edges(self):
        top, right, bottom, left = align_box(-0.05, -0.05, 0.2, 0.2, 640, 480)
        self.assertEqual((top, left), (0, 0))
        self.assertGreater(box_size((top, right, bottom, left)), 0)


class NormalizeLightingTests(unittest.TestCase):
    def test_bright_image_unchanged(self):
        image = np.full((40, 40, 3), 150, dtype=np.uint8)
        self.assertIs(normalize_lighting(image), image)

    def test_dark_image_brightened(self):
        rng = np.random.default_rng(0)
        image = rng.integers(10, 60, size=(40, 40, 3), dtype=np.uint8)
        self.assertGreater(normalize_lighting(image).mean(), image.mean())


class ViewsAgreeTests(unittest.TestCase):
    # One enrolled member with 4 views (Front, Chin down, Left, Right).
    IDS = [1, 1, 1, 1]

    def test_stranger_close_to_one_side_view_only_is_rejected(self):
        # Measured on 2026-11-20: unregistered person vs the only member.
        distances = [0.61, 0.64, 0.419, 0.512]
        self.assertEqual(best_member_match(distances, self.IDS, 0.5, 0.05)[0], 1)
        self.assertFalse(views_agree(distances, self.IDS, 1, 0.5))

    def test_member_matching_two_views_is_accepted(self):
        self.assertTrue(views_agree([0.32, 0.58, 0.61, 0.41], self.IDS, 1, 0.5))

    def test_members_with_few_views_keep_single_view_rule(self):
        self.assertTrue(views_agree([0.40, 0.70], [1, 1], 1, 0.5))

    def test_setting_one_view_disables_the_rule(self):
        self.assertTrue(views_agree([0.61, 0.64, 0.419, 0.512], self.IDS, 1, 0.5, min_views=1))

    def test_only_this_members_views_count(self):
        distances = [0.30, 0.70, 0.70, 0.30]
        self.assertFalse(views_agree(distances, [1, 1, 1, 2], 1, 0.5))


class FaceDistancesTests(unittest.TestCase):
    def test_one_minus_cosine_for_unit_encodings(self):
        matrix = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0]], dtype=np.float32)
        distances = face_distances(matrix, np.array([1.0, 0.0]))
        np.testing.assert_allclose(distances, [0.0, 1.0, 2.0], atol=1e-6)

    def test_empty_gallery_gives_no_distances(self):
        self.assertEqual(len(face_distances(np.empty((0, 128)), np.ones(128))), 0)


if __name__ == '__main__':
    unittest.main()
