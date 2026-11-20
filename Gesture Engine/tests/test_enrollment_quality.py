import math
import unittest

import cv2
import numpy as np

from enrollment_quality import assess_view, head_turn


def photo(brightness=120, blur=0, size=300):
    """A 300x300 photo with a textured 'face' area, at a given brightness."""
    rng = np.random.default_rng(4)
    texture = (rng.random((40, 40)) * 120 - 60).astype(np.float32)
    texture = cv2.resize(texture, (size, size), interpolation=cv2.INTER_CUBIC)
    image = np.clip(brightness + texture, 0, 255).astype(np.uint8)
    if blur:
        image = cv2.GaussianBlur(image, (0, 0), blur)
    return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)


def face(height=0.5, turn=0.0, size=300, roll=0.0):
    """A detected face centred in the photo, with keypoints giving `turn`."""
    eye_distance = height * size * 0.4
    center = np.array([size / 2, size * 0.45])
    direction = np.array([math.cos(math.radians(roll)), math.sin(math.radians(roll))])
    right_eye = center - direction * eye_distance / 2
    left_eye = center + direction * eye_distance / 2
    down = np.array([-direction[1], direction[0]])  # perpendicular to the eye line
    nose = center + direction * turn * eye_distance + down * eye_distance * 0.6
    return {
        'box': (0.5 - height / 2, 0.5 - height / 2, height, height),
        'keypoints': [tuple(right_eye), tuple(left_eye), tuple(nose)],
        'score': 0.9,
    }


def codes(result):
    return [issue['code'] for issue in result['issues']]


class HeadTurnTests(unittest.TestCase):
    def test_frontal_and_turned(self):
        self.assertAlmostEqual(head_turn(face(turn=0.0)['keypoints']), 0.0, places=6)
        self.assertAlmostEqual(head_turn(face(turn=0.4)['keypoints']), 0.4, places=6)
        self.assertAlmostEqual(head_turn(face(turn=-0.4)['keypoints']), -0.4, places=6)

    def test_tilt_is_not_a_turn(self):
        self.assertAlmostEqual(head_turn(face(turn=0.0, roll=20)['keypoints']), 0.0, places=6)

    def test_missing_keypoints(self):
        self.assertIsNone(head_turn(None))


class AssessViewTests(unittest.TestCase):
    def test_good_front_photo_passes(self):
        result = assess_view('Front', photo(), [face()])
        self.assertTrue(result['ok'], result)
        self.assertEqual(result['metrics']['faces'], 1)

    def test_no_face(self):
        self.assertEqual(codes(assess_view('Front', photo(), [])), ['no_face'])

    def test_two_faces(self):
        self.assertIn('many_faces', codes(assess_view('Front', photo(), [face(), face(height=0.3)])))

    def test_face_too_small_or_too_big(self):
        self.assertIn('too_far', codes(assess_view('Front', photo(), [face(height=0.2)])))
        self.assertIn('too_close', codes(assess_view('Front', photo(), [face(height=0.9)])))

    def test_dark_photo_says_too_dark_only(self):
        # Like the photos that could not be recognised (brightness ~16).
        self.assertEqual(codes(assess_view('Front', photo(brightness=20), [face()])), ['too_dark'])

    def test_overexposed_photo(self):
        self.assertIn('too_bright', codes(assess_view('Front', photo(brightness=245), [face()])))

    def test_blurry_photo(self):
        self.assertEqual(codes(assess_view('Front', photo(blur=8), [face()])), ['blurry'])

    def test_front_view_must_face_the_camera(self):
        self.assertEqual(codes(assess_view('Front', photo(), [face(turn=0.35)])), ['not_facing'])
        self.assertTrue(assess_view('Chin down', photo(), [face(turn=0.1)])['ok'])

    def test_side_view_must_be_turned_enough_but_not_too_far(self):
        # Like the old "left" photos where the member did not turn (0.03-0.07).
        self.assertEqual(codes(assess_view('Left', photo(), [face(turn=0.05)])), ['turn_more'])
        self.assertEqual(codes(assess_view('Left', photo(), [face(turn=0.8)])), ['turned_too_far'])
        self.assertTrue(assess_view('Left', photo(), [face(turn=0.4)])['ok'])

    def test_sides_must_point_in_opposite_directions(self):
        self.assertEqual(
            codes(assess_view('Right', photo(), [face(turn=0.4)], opposite_turn=0.42)),
            ['same_side'],
        )
        self.assertTrue(assess_view('Right', photo(), [face(turn=-0.4)], opposite_turn=0.42)['ok'])

    def test_every_issue_has_a_message(self):
        result = assess_view('Left', photo(brightness=20), [face(height=0.2, turn=0.05), face()])
        self.assertTrue(all(issue['message'] for issue in result['issues']))


if __name__ == '__main__':
    unittest.main()
