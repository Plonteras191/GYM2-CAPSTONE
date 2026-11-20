import sys
import time
import unittest

import numpy as np

from face_encoder_pool import FaceEncoderPool
from face_enrollment import CONTEXT_MARGIN, face_region

# A stand-in helper with the same pipe protocol as the real one: it replies
# with the region's pixel sum, sleeping first for "upscale" tenths of a second,
# replies with an error when upscale is negative (encoding failed inside a
# healthy helper), and exits without replying when the region is empty (a
# crashed helper).
FAKE_HELPER = r"""
import pickle, sys, time
requests, replies = sys.stdin.buffer, sys.stdout.buffer
while True:
    try:
        request = pickle.load(requests)
    except EOFError:
        break
    if request is None:
        result = None
    else:
        region, location, upscale = request
        if region.size == 0:
            sys.exit(1)
        if upscale < 0:
            result = RuntimeError('Face helper failed: model missing')
            pickle.dump(result, replies)
            replies.flush()
            continue
        time.sleep(upscale / 10)
        result = int(region.sum())
    pickle.dump(result, replies)
    replies.flush()
"""


def make_pool(size=2):
    return FaceEncoderPool(size, command=[sys.executable, '-c', FAKE_HELPER])


class FaceEncoderPoolTests(unittest.TestCase):
    def test_returns_the_helpers_reply(self):
        pool = make_pool(1)
        self.addCleanup(pool.close)
        region = np.ones((4, 4, 3), dtype=np.uint8)
        self.assertEqual(pool.submit(region, (0, 4, 4, 0), upscale=0).result(timeout=20), 48)

    def test_start_reports_ready_helpers(self):
        pool = make_pool(2)
        self.addCleanup(pool.close)
        self.assertTrue(pool.start(timeout=20))
        self.assertTrue(pool.has_capacity())

    def test_start_fails_when_the_helper_cannot_run(self):
        pool = FaceEncoderPool(1, command=[sys.executable, '-c', 'raise SystemExit(3)'])
        self.addCleanup(pool.close)
        self.assertFalse(pool.start(timeout=20))

    def test_capacity_is_used_up_while_helpers_are_busy(self):
        pool = make_pool(2)
        self.addCleanup(pool.close)
        self.assertTrue(pool.start(timeout=20))
        region = np.ones((2, 2, 3), dtype=np.uint8)
        slow = [pool.submit(region, (0, 2, 2, 0), upscale=5) for _ in range(2)]
        self.assertFalse(pool.has_capacity())
        for future in slow:
            future.result(timeout=20)
        deadline = time.time() + 5
        while not pool.has_capacity() and time.time() < deadline:
            time.sleep(0.01)
        self.assertTrue(pool.has_capacity())

    def test_two_helpers_work_at_the_same_time(self):
        pool = make_pool(2)
        self.addCleanup(pool.close)
        self.assertTrue(pool.start(timeout=20))
        region = np.ones((2, 2, 3), dtype=np.uint8)
        started = time.perf_counter()
        for future in [pool.submit(region, (0, 2, 2, 0), upscale=5) for _ in range(2)]:
            future.result(timeout=20)
        self.assertLess(time.perf_counter() - started, 0.9)  # 2 x 0.5 s if run one after another

    def test_a_crashed_helper_is_replaced(self):
        pool = make_pool(1)
        self.addCleanup(pool.close)
        empty = np.empty((0, 0, 3), dtype=np.uint8)
        with self.assertRaises(Exception):
            pool.submit(empty, (0, 0, 0, 0), upscale=0).result(timeout=20)
        region = np.ones((2, 2, 3), dtype=np.uint8)
        self.assertEqual(pool.submit(region, (0, 2, 2, 0), upscale=0).result(timeout=20), 12)
        self.assertTrue(pool.has_capacity())

    def test_a_failed_encoding_raises_instead_of_looking_like_no_face(self):
        # Regression: errors came back as None ("no face found"), so a
        # member's photo was cached as having no usable face (2026-11-20).
        pool = make_pool(1)
        self.addCleanup(pool.close)
        region = np.ones((2, 2, 3), dtype=np.uint8)
        with self.assertRaisesRegex(RuntimeError, 'model missing'):
            pool.submit(region, (0, 2, 2, 0), upscale=-1).result(timeout=20)
        # The helper is still healthy and keeps working.
        self.assertEqual(pool.submit(region, (0, 2, 2, 0), upscale=0).result(timeout=20), 12)


class FaceRegionTests(unittest.TestCase):
    def test_crop_keeps_a_margin_and_reports_the_face_inside_it(self):
        image = np.zeros((200, 200, 3), dtype=np.uint8)
        region, location = face_region(image, (60, 140, 140, 60))  # 80 px face
        pad = int(80 * CONTEXT_MARGIN)  # 20 px margin
        self.assertEqual(region.shape[:2], (80 + 2 * pad, 80 + 2 * pad))
        self.assertEqual(location, (pad, 80 + pad, 80 + pad, pad))

    def test_margin_is_clipped_at_the_image_edge(self):
        image = np.zeros((100, 100, 3), dtype=np.uint8)
        region, location = face_region(image, (0, 80, 80, 0))
        self.assertEqual(region.shape[:2], (100, 100))
        self.assertEqual(location, (0, 80, 80, 0))

    def test_empty_box_returns_none(self):
        image = np.zeros((50, 50, 3), dtype=np.uint8)
        self.assertEqual(face_region(image, (10, 10, 10, 10)), (None, None))


if __name__ == '__main__':
    unittest.main()
