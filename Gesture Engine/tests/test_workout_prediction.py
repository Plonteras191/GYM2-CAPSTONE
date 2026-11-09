import unittest

from workout_prediction import select_assigned_prediction


class AssignedWorkoutPredictionTests(unittest.TestCase):
    def test_selects_the_best_assigned_class_even_when_an_unassigned_class_ranks_first(self):
        prediction, confidence = select_assigned_prediction(
            [0.05, 0.48, 0.47],
            ["SQUAT", "PUSH UP", "LUNGE"],
            {"SQUAT", "LUNGE"},
        )

        self.assertEqual(prediction, "LUNGE")
        self.assertAlmostEqual(confidence, 0.47)

    def test_waits_when_no_assigned_class_has_enough_probability(self):
        prediction, confidence = select_assigned_prediction(
            [0.20, 0.72, 0.08],
            ["SQUAT", "PUSH UP", "LUNGE"],
            {"SQUAT", "LUNGE"},
        )

        self.assertEqual(prediction, "WAITING")
        self.assertAlmostEqual(confidence, 0.72)

    def test_scans_when_overall_confidence_is_low(self):
        prediction, confidence = select_assigned_prediction(
            [0.31, 0.36, 0.33],
            ["SQUAT", "PUSH UP", "LUNGE"],
            {"SQUAT"},
        )

        self.assertEqual(prediction, "SCANNING")
        self.assertAlmostEqual(confidence, 0.36)

    def test_rejects_probability_class_count_mismatch(self):
        with self.assertRaises(ValueError):
            select_assigned_prediction([0.8], ["SQUAT", "LUNGE"], {"SQUAT"})


if __name__ == "__main__":
    unittest.main()
