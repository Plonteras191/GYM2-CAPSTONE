import os
import tempfile
import unittest
from types import SimpleNamespace

import cv2
import numpy as np

from face_enrollment import EncodingCache, faces_signature, resolve_face_path


class FakeDetector:
    """Stands in for MediaPipe: one face in the middle of every image."""

    def process(self, _rgb):
        box = SimpleNamespace(xmin=0.25, ymin=0.25, width=0.5, height=0.5)
        return SimpleNamespace(detections=[SimpleNamespace(location_data=SimpleNamespace(relative_bounding_box=box))])


class ResolveFacePathTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.backend = self.dir.name
        self.private = os.path.join(self.backend, 'storage', 'app', 'private', 'faces')
        self.public = os.path.join(self.backend, 'public', 'faces')
        os.makedirs(self.private)
        os.makedirs(self.public)

    def tearDown(self):
        self.dir.cleanup()

    def touch(self, folder, name):
        path = os.path.join(folder, name)
        with open(path, 'w') as handle:
            handle.write('x')
        return path

    def test_finds_photo_in_private_storage(self):
        expected = self.touch(self.private, 'a.png')
        self.assertEqual(resolve_face_path(self.backend, '/faces/a.png'), os.path.normpath(expected))

    def test_falls_back_to_old_public_folder(self):
        expected = self.touch(self.public, 'old.png')
        self.assertEqual(resolve_face_path(self.backend, '/faces/old.png'), os.path.normpath(expected))

    def test_private_copy_wins_when_both_exist(self):
        expected = self.touch(self.private, 'both.png')
        self.touch(self.public, 'both.png')
        self.assertEqual(resolve_face_path(self.backend, '/faces/both.png'), os.path.normpath(expected))

    def test_missing_photo_returns_none(self):
        self.assertIsNone(resolve_face_path(self.backend, '/faces/missing.png'))

    def test_paths_outside_the_photo_folders_are_refused(self):
        self.touch(self.backend, 'secret.txt')
        self.assertIsNone(resolve_face_path(self.backend, '/faces/../../../../secret.txt'))
        self.assertIsNone(resolve_face_path(self.backend, '../secret.txt'))


class FacesSignatureTests(unittest.TestCase):
    MEMBERS = [
        {'id': 1, 'name': 'Ana', 'image_file': '/faces/a.png', 'workout_eligible': True, 'subscription_status': 'active'},
        {'id': 2, 'name': 'Ben', 'image_file': '/faces/b.png', 'workout_eligible': False, 'subscription_status': 'none'},
    ]

    def changed(self, **changes):
        members = [dict(member) for member in self.MEMBERS]
        members[0].update(changes)
        return faces_signature(members) != faces_signature(self.MEMBERS)

    def test_same_members_in_any_order_have_the_same_signature(self):
        self.assertEqual(faces_signature(self.MEMBERS), faces_signature(list(reversed(self.MEMBERS))))

    def test_new_photo_name_or_coach_eligibility_changes_the_signature(self):
        self.assertTrue(self.changed(image_file='/faces/new.png'))
        self.assertTrue(self.changed(name='Ana Cruz'))
        self.assertTrue(self.changed(workout_eligible=False))
        self.assertNotEqual(faces_signature(self.MEMBERS), faces_signature(self.MEMBERS[:1]))

    def test_subscription_status_alone_does_not_force_a_face_reload(self):
        self.assertFalse(self.changed(subscription_status='expired'))


class EncodingCacheTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.photo = os.path.join(self.dir.name, 'face.png')
        cv2.imwrite(self.photo, np.full((100, 100, 3), 128, np.uint8))
        self.cache_path = os.path.join(self.dir.name, 'cache.pkl')

    def test_photo_with_no_usable_view_is_retried_next_time(self):
        # Regression: a passing encoder failure was cached as "no face",
        # and the member stayed unrecognizable until the photo changed.
        cache = EncodingCache(self.cache_path)
        encodings, _, _ = cache.get_or_encode(self.photo, FakeDetector(), encode=lambda view, box: None)
        self.assertEqual(encodings, [])
        cache.save()

        cache = EncodingCache(self.cache_path)
        encodings, _, from_cache = cache.get_or_encode(self.photo, FakeDetector(), encode=lambda view, box: np.ones(2))
        self.assertFalse(from_cache)
        self.assertEqual(len(encodings), 1)

    def test_usable_photo_is_cached(self):
        cache = EncodingCache(self.cache_path)
        cache.get_or_encode(self.photo, FakeDetector(), encode=lambda view, box: np.ones(2))
        cache.save()
        _, _, from_cache = EncodingCache(self.cache_path).get_or_encode(
            self.photo, FakeDetector(), encode=lambda view, box: None)
        self.assertTrue(from_cache)


if __name__ == '__main__':
    unittest.main()
