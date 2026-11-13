import os
import tempfile
import unittest

from face_enrollment import faces_signature, resolve_face_path


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


if __name__ == '__main__':
    unittest.main()
