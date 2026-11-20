"""One Euro Filter for pose landmarks.

The One Euro Filter (Casiez, Roussel and Vogel, CHI 2012) is the standard
filter for live tracking in AR, VR and fitness apps. It smooths a lot when a
point is nearly still, removing landmark jitter, and smooths little when the
point moves fast, so quick movements are not delayed. Steadier joint
positions give steadier joint angles: cleaner repetition counts, fewer false
repetitions, and less "NOT MOVING" / "MOVING" flicker.

Pure numpy and vectorized over all 33 landmarks.
"""

import math

import numpy as np


def _smoothing_factor(elapsed, cutoff):
    tau = 1.0 / (2.0 * math.pi * cutoff)
    return 1.0 / (1.0 + tau / elapsed)


class OneEuroFilter:
    """Filters an array of values (e.g. 33 x 2 landmark coordinates).

    min_cutoff: smoothing when still (lower = smoother, more lag at rest).
    beta: how quickly smoothing relaxes as speed rises (higher = less lag).
    """

    def __init__(self, min_cutoff=1.0, beta=8.0, derivative_cutoff=1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.derivative_cutoff = derivative_cutoff
        self.previous_value = None
        self.previous_derivative = None
        self.previous_time = None

    def __call__(self, value, now):
        value = np.asarray(value, dtype=np.float64)
        if (
            self.previous_value is None
            or self.previous_value.shape != value.shape
            or now <= self.previous_time
            or now - self.previous_time > 1.0
        ):
            # First sample, a new shape, or a long gap: restart from here.
            self.previous_value = value.copy()
            self.previous_derivative = np.zeros_like(value)
            self.previous_time = now
            return value

        elapsed = now - self.previous_time
        derivative = (value - self.previous_value) / elapsed
        alpha_derivative = _smoothing_factor(elapsed, self.derivative_cutoff)
        derivative = alpha_derivative * derivative + (1 - alpha_derivative) * self.previous_derivative

        cutoff = self.min_cutoff + self.beta * np.abs(derivative)
        tau = 1.0 / (2.0 * np.pi * cutoff)
        alpha = 1.0 / (1.0 + tau / elapsed)
        filtered = alpha * value + (1 - alpha) * self.previous_value

        self.previous_value = filtered
        self.previous_derivative = derivative
        self.previous_time = now
        return filtered


class LandmarkSmoother:
    """Smooths the x, y of (33, 4) landmark arrays; z and visibility pass through."""

    def __init__(self, min_cutoff=1.0, beta=8.0):
        self.filter = OneEuroFilter(min_cutoff=min_cutoff, beta=beta)

    def __call__(self, points, now):
        points = np.array(points, dtype=np.float32, copy=True)
        points[:, :2] = self.filter(points[:, :2], now).astype(np.float32)
        return points
