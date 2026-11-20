import unittest

from face_matching import IdentityVote, still_matches

# One member (john) with 2 enrolled views, one other member (harvey).
IDS = ['john', 'john', 'harvey']
KEEP, STRICT = 0.46, 0.36


class StillMatchesTests(unittest.TestCase):
    def test_side_view_keeps_the_name_within_the_keep_limit(self):
        # Too far for a first identification (0.36), close enough to keep it.
        self.assertTrue(still_matches([0.42, 0.55, 0.80], IDS, 'john', KEEP, STRICT))

    def test_too_different_drops_it(self):
        self.assertFalse(still_matches([0.50, 0.60, 0.80], IDS, 'john', KEEP, STRICT))

    def test_another_member_matching_strictly_wins(self):
        self.assertFalse(still_matches([0.40, 0.55, 0.30], IDS, 'john', KEEP, STRICT))

    def test_another_member_closer_wins(self):
        self.assertFalse(still_matches([0.44, 0.55, 0.43], IDS, 'john', KEEP, STRICT))

    def test_member_no_longer_enrolled(self):
        self.assertFalse(still_matches([0.30], ['harvey'], 'john', KEEP, STRICT))


class ReacquireVoteTests(unittest.TestCase):
    def test_seeded_votes_confirm_on_one_agreeing_sample(self):
        vote = IdentityVote(window=10, required=3)
        for _ in range(2):  # earlier votes carried over from the lost face
            vote.history.append(('john', 1.0))
        self.assertTrue(vote.add('john'))
        self.assertEqual(vote.confirmed, 'john')

    def test_seeded_votes_do_not_confirm_someone_else(self):
        vote = IdentityVote(window=10, required=3)
        for _ in range(2):
            vote.history.append(('john', 1.0))
        self.assertFalse(vote.add('harvey'))
        self.assertIsNone(vote.confirmed)


class NearestRecentlyLostTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Pure function in the engine module; imported lazily (heavy module).
        import importlib
        cls.engine = importlib.import_module('gesture_engine')

    def test_same_spot_is_found_far_away_is_not(self):
        lost = [{'member_id': 'john', 'box': (100, 200, 200, 100), 'lost_at': 0.0}]
        near = self.engine.nearest_recently_lost((110, 230, 210, 130), lost)
        far = self.engine.nearest_recently_lost((100, 900, 200, 800), lost)
        self.assertIs(near, lost[0])
        self.assertIsNone(far)

    def test_neighbour_does_not_take_over_a_missed_face(self):
        # John's face (100 px wide) missed for one frame; Harvey stands next to
        # him, 1.5 face widths away: Harvey must not get John's name.
        missed = [{'member_id': 'john', 'box': (100, 200, 200, 100), 'max_widths': 0.75}]
        neighbour = (100, 350, 200, 250)
        head_turn = (105, 240, 205, 140)  # same face shifted 0.4 widths
        self.assertIsNone(self.engine.nearest_recently_lost(neighbour, missed))
        self.assertIs(self.engine.nearest_recently_lost(head_turn, missed), missed[0])

    def test_very_different_face_size_is_not_the_same_face(self):
        lost = [{'member_id': 'john', 'box': (100, 200, 200, 100)}]
        tiny = (140, 165, 165, 140)  # 25 px wide, same spot
        self.assertIsNone(self.engine.nearest_recently_lost(tiny, lost))

    def test_unnamed_face_with_votes_keeps_its_progress(self):
        vote = IdentityVote(window=10, required=3)
        vote.add('john')
        vote.add(None)
        track = {'member_id': None, 'vote': vote, 'encoding_jobs': ['job']}
        progress = self.engine.unconfirmed_progress(track)
        self.assertEqual(progress['history'], [('john', 1.0), (None, 1.0)])
        self.assertEqual(progress['jobs'], ['job'])

        # Continued on the face found again: one more agreeing sample is not
        # enough on its own (2 of 3), the next one names the member.
        found_again = IdentityVote(window=10, required=3)
        found_again.history.extend(progress['history'])
        self.assertFalse(found_again.add('john'))
        self.assertTrue(found_again.add('john'))

    def test_nothing_to_keep_without_votes_or_once_named(self):
        unknown = IdentityVote(window=10, required=3)
        unknown.add(None)
        self.assertIsNone(self.engine.unconfirmed_progress(
            {'member_id': None, 'vote': unknown, 'encoding_jobs': []}))
        named = IdentityVote(window=10, required=3)
        named.add('john')
        self.assertIsNone(self.engine.unconfirmed_progress(
            {'member_id': 'john', 'vote': named, 'encoding_jobs': []}))


if __name__ == '__main__':
    unittest.main()
