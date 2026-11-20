import unittest

import numpy as np

from gallery_health import (
    build_gallery_health,
    closest_member_distances,
    look_alike_pairs,
    report_lines,
)
from pose_features import hidden_body_parts
from smoothing import LandmarkSmoother, OneEuroFilter


def unit(angle):
    """A 2-D unit vector: stands in for a face encoding in the gallery tests."""
    return [np.cos(angle), np.sin(angle)]


class OneEuroTests(unittest.TestCase):
    def test_reduces_jitter_on_a_still_point(self):
        rng = np.random.default_rng(1)
        smooth = OneEuroFilter()
        raw, filtered = [], []
        for step in range(60):
            value = 0.5 + rng.normal(scale=0.005)
            raw.append(value)
            filtered.append(float(smooth(np.array([value]), step / 30)[0]))
        self.assertLess(np.std(filtered[10:]), np.std(raw[10:]) * 0.5)

    def test_follows_fast_movement_closely(self):
        smooth = OneEuroFilter()
        lags = []
        for step in range(30):
            value = step * 0.02  # 0.6 frame-widths per second, like a quick rep
            lags.append(value - float(smooth(np.array([value]), step / 30)[0]))
        self.assertLess(max(lags[5:]), 0.02)

    def test_restarts_after_a_gap(self):
        smooth = OneEuroFilter()
        smooth(np.array([0.0]), 0.0)
        self.assertEqual(float(smooth(np.array([1.0]), 5.0)[0]), 1.0)

    def test_landmark_smoother_keeps_visibility_and_input(self):
        points = np.full((33, 4), 0.5, dtype=np.float32)
        points[:, 3] = 0.9
        out = LandmarkSmoother()(points, 0.0)
        np.testing.assert_allclose(out[:, 3], 0.9)
        self.assertIsNot(out, points)


def body(visible=0.95, hidden=()):
    points = np.zeros((33, 4), dtype=np.float32)
    points[:, 3] = visible
    for index in hidden:
        points[index, 3] = 0.1
    return points


class HiddenBodyPartsTests(unittest.TestCase):
    def test_fully_visible(self):
        self.assertEqual(hidden_body_parts({'SQUAT'}, body()), [])

    def test_legs_cut_off_for_a_squat(self):
        self.assertEqual(hidden_body_parts({'SQUAT'}, body(hidden=(25, 26, 27, 28))), ['legs', 'feet'])

    def test_one_side_visible_is_enough(self):
        self.assertEqual(hidden_body_parts({'SQUAT'}, body(hidden=(25, 27))), [])

    def test_uses_the_exercise_closest_to_checkable(self):
        # Legs hidden: a squat cannot be checked, but a curl can.
        self.assertEqual(hidden_body_parts({'SQUAT', 'CURL'}, body(hidden=(25, 26, 27, 28))), [])


class GalleryHealthTests(unittest.TestCase):
    def setUp(self):
        # Unit vectors at these angles; distance is 1 - cos(angle between).
        # Members 1 and 2 look alike (closest views 0.35 apart, below the
        # 0.55 "likely confused" limit); member 3 points the other way.
        self.angle_2 = 0.1 + np.arccos(0.65)
        self.matrix = np.array([unit(0.0), unit(0.1), unit(self.angle_2), unit(np.pi)])
        self.ids = [1, 1, 2, 3]
        self.members = [
            {'id': 1, 'name': 'Dan Cruz', 'views_usable': 2, 'views_total': 4, 'status': 'success'},
            {'id': 2, 'name': 'John Reyes', 'views_usable': 1, 'views_total': 4, 'status': 'weak'},
            {'id': 3, 'name': 'Ana Lim', 'views_usable': 4, 'views_total': 4, 'status': 'success'},
            {'id': 4, 'name': 'Carl Uy', 'views_usable': 0, 'views_total': 4, 'status': 'failed'},
            {'id': 5, 'name': 'Ben Go', 'views_usable': 0, 'views_total': 0, 'status': 'missing'},
            {'id': 6, 'name': '  ana  LIM ', 'views_usable': 4, 'views_total': 4, 'status': 'success'},
        ]

    def test_look_alike_pairs(self):
        pairs = look_alike_pairs(self.matrix, self.ids)
        self.assertEqual([(a, b) for _, a, b in pairs], [(1, 2)])
        self.assertAlmostEqual(pairs[0][0], 0.35, places=6)

    def test_report_finds_every_problem(self):
        report = build_gallery_health(self.members, self.matrix, self.ids)
        self.assertEqual({m['id'] for m in report['unrecognizable']}, {4, 5})
        self.assertEqual([m['id'] for m in report['weak']], [2])
        self.assertEqual(report['duplicate_names'][0]['member_ids'], [3, 6])
        self.assertEqual(report['look_alikes'][0]['level'], 'likely_confused')
        # 2 unrecognizable + 1 duplicate + 1 likely-confused pair.
        self.assertEqual(report['problem_count'], 4)
        text = '\n'.join(report_lines(report))
        for expected in ('CANNOT RECOGNIZE', 'DUPLICATE?', 'LOOK-ALIKE', 'weak'):
            self.assertIn(expected, text)

    def test_closest_member_distances(self):
        probe = np.array([unit(0.05)])
        closest = closest_member_distances(probe, self.matrix, self.ids)
        self.assertAlmostEqual(closest[1], 1 - np.cos(0.05), places=6)
        self.assertAlmostEqual(closest[2], 1 - np.cos(self.angle_2 - 0.05), places=6)
        self.assertEqual(closest_member_distances([], self.matrix, self.ids), {})

    def test_empty_gallery(self):
        report = build_gallery_health([], np.empty((0, 128)), [])
        self.assertEqual(report['problem_count'], 0)
        self.assertEqual(look_alike_pairs(np.empty((0, 128)), []), [])


if __name__ == '__main__':
    unittest.main()
