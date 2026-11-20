import unittest

from camera_tracking import duplicate_identity_losers


class OneMemberOnePersonTests(unittest.TestCase):
    def test_no_duplicates_no_losers(self):
        candidates = [(1, 'john', (True, 10.0)), (2, 'harvey', (False, 5.0)), (3, None, (False, 0.0))]
        self.assertEqual(duplicate_identity_losers(candidates), set())

    def test_body_with_the_face_seen_now_keeps_the_name(self):
        # Body 1 kept "John" from memory; John's face is on body 2 right now.
        candidates = [(1, 'john', (False, 100.0)), (2, 'john', (True, 50.0))]
        self.assertEqual(duplicate_identity_losers(candidates), {1})

    def test_without_a_face_the_most_recently_confirmed_keeps_it(self):
        candidates = [(1, 'john', (False, 40.0)), (2, 'john', (False, 90.0))]
        self.assertEqual(duplicate_identity_losers(candidates), {1})

    def test_closer_face_match_keeps_the_name(self):
        # Face tracks rank by (seen this frame, -match distance).
        candidates = [(7, 'john', (True, -0.31)), (8, 'john', (True, -0.22))]
        self.assertEqual(duplicate_identity_losers(candidates), {7})

    def test_three_bodies_two_lose(self):
        candidates = [(1, 'john', (False, 1.0)), (2, 'john', (True, 0.0)), (3, 'john', (False, 3.0))]
        self.assertEqual(duplicate_identity_losers(candidates), {1, 3})

    def test_different_members_are_independent(self):
        candidates = [(1, 'john', (False, 1.0)), (2, 'john', (True, 0.0)),
                      (3, 'harvey', (False, 2.0)), (4, 'harvey', (False, 9.0))]
        self.assertEqual(duplicate_identity_losers(candidates), {1, 3})


if __name__ == '__main__':
    unittest.main()
