import unittest

import numpy as np

from small_face_sweep import find_faces, sweep_due


class SweepDueTests(unittest.TestCase):
    def test_no_sweep_when_everyone_in_view_is_identified(self):
        self.assertFalse(sweep_due(now=10.0, last_sweep=0.0, unidentified_in_view=False, interval=0.4))

    def test_sweep_while_someone_is_unidentified(self):
        self.assertTrue(sweep_due(now=10.0, last_sweep=9.5, unidentified_in_view=True, interval=0.4))

    def test_sweep_waits_for_the_interval(self):
        self.assertFalse(sweep_due(now=10.0, last_sweep=9.8, unidentified_in_view=True, interval=0.4))


class FakeYuNet:
    """Stands in for cv2.FaceDetectorYN: returns one face in input pixels."""

    def __init__(self, faces):
        self.faces = faces
        self.input_size = None

    def setInputSize(self, size):
        self.input_size = size

    def detect(self, image):
        assert (image.shape[1], image.shape[0]) == self.input_size
        return 1, (None if self.faces is None else np.array(self.faces, dtype=np.float32))


class FindFacesTests(unittest.TestCase):
    def test_boxes_are_relative_to_the_full_frame(self):
        # 1280x720 frame scaled to 960x540: a 30x30 face at (480, 270) there is
        # the 40x40 face at (640, 360) of the full frame.
        detector = FakeYuNet([[480, 270, 30, 30] + [0] * 11])
        boxes = find_faces(detector, np.zeros((720, 1280, 3), np.uint8), width=960)
        self.assertEqual(detector.input_size, (960, 540))
        np.testing.assert_allclose(boxes[0], (0.5, 0.5, 30 / 960, 30 / 540), atol=1e-6)

    def test_small_frames_are_not_enlarged(self):
        detector = FakeYuNet(None)
        self.assertEqual(find_faces(detector, np.zeros((360, 640, 3), np.uint8), width=960), [])
        self.assertEqual(detector.input_size, (640, 360))

    def test_boxes_are_clipped_to_the_frame(self):
        detector = FakeYuNet([[-10, 500, 50, 80] + [0] * 11])
        box = find_faces(detector, np.zeros((540, 960, 3), np.uint8), width=960)[0]
        self.assertGreaterEqual(box[0], 0.0)
        self.assertLessEqual(box[1] + box[3], 1.0 + 1e-6)


if __name__ == '__main__':
    unittest.main()
