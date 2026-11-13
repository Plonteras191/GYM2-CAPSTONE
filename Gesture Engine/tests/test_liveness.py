import unittest

import numpy as np

from liveness import LEFT_EYE, RIGHT_EYE, BlinkDetector, eye_aspect_ratio, face_ear

OPEN, CLOSED = 0.30, 0.12


def eye_points(openness):
    """478 landmark points with both eyes drawn 20px wide and `openness`*20px tall."""
    points = np.zeros((478, 2), dtype=np.float32)
    for eye, x0 in ((LEFT_EYE, 100.0), (RIGHT_EYE, 200.0)):
        outer, upper1, upper2, inner, lower2, lower1 = eye
        half = openness * 20 / 2
        points[outer] = (x0, 50)
        points[inner] = (x0 + 20, 50)
        points[upper1] = (x0 + 7, 50 - half)
        points[upper2] = (x0 + 13, 50 - half)
        points[lower1] = (x0 + 7, 50 + half)
        points[lower2] = (x0 + 13, 50 + half)
    return points


class EyeAspectRatioTests(unittest.TestCase):
    def test_open_eye_has_higher_ratio_than_closed_eye(self):
        self.assertAlmostEqual(face_ear(eye_points(0.30)), 0.30, places=3)
        self.assertAlmostEqual(face_ear(eye_points(0.10)), 0.10, places=3)

    def test_zero_width_eye_cannot_be_measured(self):
        points = np.zeros((478, 2), dtype=np.float32)
        self.assertIsNone(eye_aspect_ratio(points, LEFT_EYE))
        self.assertIsNone(face_ear(points))


class BlinkDetectorTests(unittest.TestCase):
    def feed(self, detector, samples, step=0.1):
        result = False
        for index, ear in enumerate(samples):
            result = detector.add(ear, now=index * step)
        return result

    def test_open_closed_open_is_a_blink(self):
        self.assertTrue(self.feed(BlinkDetector(), [OPEN, OPEN, CLOSED, CLOSED, OPEN]))

    def test_printed_photo_with_open_eyes_never_blinks(self):
        self.assertFalse(self.feed(BlinkDetector(), [OPEN] * 50))

    def test_photo_with_closed_eyes_never_blinks(self):
        self.assertFalse(self.feed(BlinkDetector(), [CLOSED] * 50))

    def test_small_flicker_between_thresholds_is_not_a_blink(self):
        self.assertFalse(self.feed(BlinkDetector(), [OPEN, 0.22, 0.21, 0.23, OPEN, 0.21, OPEN]))

    def test_eyes_closed_too_long_is_not_a_blink(self):
        samples = [OPEN] + [CLOSED] * 12 + [OPEN]  # closed for 1.2s
        self.assertFalse(self.feed(BlinkDetector(), samples))

    def test_blink_after_a_long_closure_still_counts(self):
        samples = [OPEN] + [CLOSED] * 12 + [OPEN, OPEN, CLOSED, OPEN]
        self.assertTrue(self.feed(BlinkDetector(), samples))

    def test_unmeasured_frames_are_ignored_and_result_is_remembered(self):
        detector = BlinkDetector()
        self.assertTrue(self.feed(detector, [OPEN, None, CLOSED, None, OPEN]))
        self.assertTrue(detector.add(OPEN, now=99))


if __name__ == '__main__':
    unittest.main()
