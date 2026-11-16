import math
import os
import unittest
from unittest import mock

import numpy as np

from pose_features import L_ANKLE, L_HIP, L_KNEE, R_ANKLE, R_HIP, R_KNEE
from rep_counter import (
    EXERCISE_ANGLES,
    MIN_REP_SECONDS,
    RepCounter,
    countable_exercises_from_env,
    joint_angle,
    measured_angle,
)


def body_with_angle(exercise, degrees, side='left', visibility=0.9, other_side_visibility=0.0):
    """(33, 4) points where the exercise's joint on `side` is bent to `degrees`.

    The first joint sits straight above the middle joint; the last joint is
    rotated so the angle at the middle joint equals `degrees`.
    """
    points = np.zeros((33, 4), dtype=np.float32)
    points[:, :2] = 0.5
    left_triple, right_triple = EXERCISE_ANGLES[exercise]['joints']
    for triple, is_chosen in ((left_triple, side == 'left'), (right_triple, side == 'right')):
        first, middle, last = triple
        points[middle, :2] = (0.5, 0.5)
        points[first, :2] = (0.5, 0.3)
        radians = math.radians(degrees)
        points[last, :2] = (0.5 + 0.2 * math.sin(radians), 0.5 - 0.2 * math.cos(radians))
        points[[first, middle, last], 3] = visibility if is_chosen else other_side_visibility
    return points


def perform_reps(counter, exercise, reps, frames_per_phase=4, start_time=0.0):
    """Drive the counter through `reps` full bend-and-straighten cycles."""
    now = start_time
    flexed, extended = EXERCISE_ANGLES[exercise]['flexed'], EXERCISE_ANGLES[exercise]['extended']
    for _ in range(reps):
        for _ in range(frames_per_phase):
            now += 0.1
            counter.update(body_with_angle(exercise, flexed - 20), now)
        for _ in range(frames_per_phase):
            now += 0.1
            counter.update(body_with_angle(exercise, extended + 15), now)
    return now


class JointAngleTests(unittest.TestCase):
    def test_straight_line_is_180_degrees(self):
        self.assertAlmostEqual(joint_angle((0, 0), (0, 1), (0, 2)), 180.0, places=5)

    def test_right_angle(self):
        self.assertAlmostEqual(joint_angle((0, 0), (0, 1), (1, 1)), 90.0, places=5)

    def test_coincident_points_give_none(self):
        self.assertIsNone(joint_angle((1, 1), (1, 1), (2, 2)))

    def test_measured_angle_uses_the_frame_aspect_ratio(self):
        # A 16:9 frame squashes x in normalized units. The lower leg here
        # points 45 degrees from vertical in real pixels (a 135 degree knee),
        # which only reads as 135 once x is scaled back by the aspect ratio.
        points = np.zeros((33, 4), dtype=np.float32)
        points[:, 3] = 0.9
        points[L_HIP, :2] = (0.5, 0.3)
        points[L_KNEE, :2] = (0.5, 0.5)
        leg = 0.2 * math.sin(math.radians(45))
        points[L_ANKLE, :2] = (0.5 + leg * 9 / 16, 0.5 + leg)
        triples = EXERCISE_ANGLES['SQUAT']['joints']
        self.assertAlmostEqual(measured_angle(points, triples, aspect=16 / 9), 135.0, places=3)
        self.assertGreater(measured_angle(points, triples, aspect=1.0), 140.0)


class MeasuredAngleTests(unittest.TestCase):
    def test_hidden_joints_give_none(self):
        points = body_with_angle('SQUAT', 90, visibility=0.2)
        self.assertIsNone(measured_angle(points, EXERCISE_ANGLES['SQUAT']['joints']))

    def test_better_seen_side_is_used(self):
        points = body_with_angle('SQUAT', 90, side='left', visibility=0.95, other_side_visibility=0.6)
        # Right side is straight (its last joint sits at the default position).
        points[R_HIP, :2], points[R_KNEE, :2], points[R_ANKLE, :2] = (0.7, 0.3), (0.7, 0.5), (0.7, 0.7)
        self.assertAlmostEqual(measured_angle(points, EXERCISE_ANGLES['SQUAT']['joints']), 90.0, places=3)
        points[[L_HIP, L_KNEE, L_ANKLE], 3] = 0.55
        points[[R_HIP, R_KNEE, R_ANKLE], 3] = 0.95
        self.assertAlmostEqual(measured_angle(points, EXERCISE_ANGLES['SQUAT']['joints']), 180.0, places=3)


class RepCounterTests(unittest.TestCase):
    def test_counts_each_full_squat(self):
        counter = RepCounter('SQUAT')
        perform_reps(counter, 'SQUAT', 5)
        self.assertEqual(counter.count, 5)
        self.assertEqual(counter.phase, 'up')

    def test_every_supported_exercise_counts(self):
        for exercise in EXERCISE_ANGLES:
            counter = RepCounter(exercise)
            perform_reps(counter, exercise, 3)
            self.assertEqual(counter.count, 3, exercise)

    def test_half_a_rep_is_not_counted(self):
        counter = RepCounter('PUSH UP')
        flexed = EXERCISE_ANGLES['PUSH UP']['flexed']
        for frame in range(6):
            counter.update(body_with_angle('PUSH UP', flexed - 20), frame * 0.1)
        self.assertEqual(counter.count, 0)
        self.assertEqual(counter.phase, 'down')

    def test_wobble_between_the_limits_does_not_count(self):
        counter = RepCounter('CURL')
        flexed, extended = EXERCISE_ANGLES['CURL']['flexed'], EXERCISE_ANGLES['CURL']['extended']
        now = perform_reps(counter, 'CURL', 1)
        # Hover in the dead zone between the two limits.
        for frame in range(20):
            now += 0.1
            counter.update(body_with_angle('CURL', (flexed + extended) / 2 + (5 if frame % 2 else -5)), now)
        self.assertEqual(counter.count, 1)

    def test_too_fast_double_count_is_ignored(self):
        counter = RepCounter('SIT UP')
        flexed, extended = EXERCISE_ANGLES['SIT UP']['flexed'], EXERCISE_ANGLES['SIT UP']['extended']
        with mock.patch('rep_counter.ANGLE_SMOOTHING', 0.0):
            counter.update(body_with_angle('SIT UP', flexed - 20), 0.0)
            counter.update(body_with_angle('SIT UP', extended + 15), 0.1)
            counter.update(body_with_angle('SIT UP', flexed - 20), 0.15)
            counter.update(body_with_angle('SIT UP', extended + 15), 0.2)  # a glitch, < MIN_REP_SECONDS later
            counter.update(body_with_angle('SIT UP', flexed - 20), 0.2 + MIN_REP_SECONDS)
            counter.update(body_with_angle('SIT UP', extended + 15), 0.3 + MIN_REP_SECONDS)
        self.assertEqual(counter.count, 2)

    def test_hidden_joint_frames_keep_the_count_and_phase(self):
        counter = RepCounter('SQUAT')
        now = perform_reps(counter, 'SQUAT', 2)
        flexed = EXERCISE_ANGLES['SQUAT']['flexed']
        for frame in range(1, 5):
            counter.update(body_with_angle('SQUAT', flexed - 20), now + 0.1 * frame)
        self.assertEqual(counter.phase, 'down')
        counter.update(body_with_angle('SQUAT', 180, visibility=0.1), now + 0.6)
        self.assertEqual((counter.count, counter.phase), (2, 'down'))

    def test_starts_from_a_saved_count(self):
        counter = RepCounter('SQUAT', start=12)
        perform_reps(counter, 'SQUAT', 1)
        self.assertEqual(counter.count, 13)

    def test_unknown_exercise_is_rejected(self):
        with self.assertRaises(ValueError):
            RepCounter('PLANK')


class CountableExercisesTests(unittest.TestCase):
    def test_default_is_every_supported_exercise(self):
        with mock.patch.dict(os.environ, {'REP_EXERCISES': ''}):
            self.assertEqual(countable_exercises_from_env(), set(EXERCISE_ANGLES))

    def test_env_selects_and_drops_unsupported(self):
        with mock.patch.dict(os.environ, {'REP_EXERCISES': 'squat, Push Up ,PLANK'}):
            self.assertEqual(countable_exercises_from_env(), {'SQUAT', 'PUSH UP'})


if __name__ == '__main__':
    unittest.main()
