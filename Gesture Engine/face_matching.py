"""Face matching helpers shared by live recognition, enrollment and scripts.

Pure functions (only numpy/cv2), so they can be unit-tested without a camera,
face models or a running Laravel backend.
"""

from collections import Counter, deque

import cv2
import numpy as np

# MediaPipe's face box runs roughly from the eyebrows to the mouth. Expanding
# it to a square that reaches the chin (and shifting it down) frames the whole
# face, so the crop handed to the encoder always contains the complete face
# for YuNet to place its landmarks on (face_enrollment.encode_region).
ALIGN_SCALE = 1.15
ALIGN_SHIFT_DOWN = 0.08

DARK_FACE_MEAN = 80


def face_distances(matrix, encoding):
    """Distance from one encoding to every row of matrix: 1 - cosine similarity.

    0 = identical, about 1 = unrelated faces. Encodings from
    face_enrollment are unit length, so this is one matrix product.
    """
    matrix = np.asarray(matrix, dtype=np.float32)
    if matrix.size == 0:
        return np.empty(0, dtype=np.float32)
    return 1.0 - matrix @ np.asarray(encoding, dtype=np.float32).reshape(-1)


def align_box(xmin, ymin, width, height, frame_w, frame_h):
    """Map a relative MediaPipe face box to a dlib-style square box.

    Returns (top, right, bottom, left) in pixels, clamped to the frame.
    Used for both enrollment and live frames so they are framed identically.
    """
    box_w = width * frame_w
    box_h = height * frame_h
    center_x = xmin * frame_w + box_w / 2
    center_y = ymin * frame_h + box_h / 2 + ALIGN_SHIFT_DOWN * box_h
    side = int(round(max(box_w, box_h) * ALIGN_SCALE))
    raw_top = int(round(center_y - side / 2))
    raw_left = int(round(center_x - side / 2))

    top = max(0, raw_top)
    left = max(0, raw_left)
    bottom = min(frame_h, raw_top + side)
    right = min(frame_w, raw_left + side)
    return (top, right, bottom, left)


def box_size(box):
    """Smaller side of a (top, right, bottom, left) box, in pixels."""
    top, right, bottom, left = box
    return min(bottom - top, right - left)


def normalize_lighting(rgb_image):
    """Lift dark faces with CLAHE on the lightness channel only.

    Unlike a global brightness/contrast boost, this keeps local facial
    contrast and colour, which the face descriptor relies on. Images that
    are not dark are returned unchanged.
    """
    if rgb_image.size == 0 or rgb_image[::4, ::4].mean() >= DARK_FACE_MEAN:
        return rgb_image
    lab = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2LAB)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)


def best_member_match(distances, member_ids, threshold, margin):
    """Pick a member from distances to every enrolled encoding.

    Members can have several enrolled views, so distances are first reduced
    to the closest view per member. The ambiguity margin is then measured
    against the closest *different* member, never against another view of
    the same person.

    Returns (member_id or None, best_distance, second_member_distance).
    """
    best_per_member = {}
    for member_id, distance in zip(member_ids, distances):
        distance = float(distance)
        if member_id not in best_per_member or distance < best_per_member[member_id]:
            best_per_member[member_id] = distance

    if not best_per_member:
        return None, float('inf'), float('inf')

    ranked = sorted(best_per_member.items(), key=lambda item: item[1])
    best_id, best_distance = ranked[0]
    second_distance = ranked[1][1] if len(ranked) > 1 else float('inf')

    if best_distance >= threshold:
        return None, best_distance, second_distance
    if second_distance - best_distance < margin:
        return None, best_distance, second_distance
    return best_id, best_distance, second_distance


def views_agree(distances, member_ids, member_id, threshold, min_views=2, min_enrolled=3):
    """True if enough of the member's enrolled views match, not just one.

    A real member facing the camera is close to several of their enrolled
    views (e.g. Front and a slight side turn). A stranger usually comes
    close to only one view at a time, most often a strongly turned side
    view. Measured 2026-11-20: an unregistered person's closest view to the
    only enrolled member was under 0.50 in 4 of 24 samples, the second
    closest never (minimum 0.512).

    Applies only to members with at least min_enrolled usable views; members
    with fewer cannot meet it and keep the single-view rule.
    """
    member_distances = [float(d) for m, d in zip(member_ids, distances) if m == member_id]
    if len(member_distances) < min_enrolled or min_views <= 1:
        return True
    return sum(d < threshold for d in member_distances) >= min_views


def still_matches(distances, member_ids, member_id, keep_threshold, strict_threshold):
    """True if a face already confirmed as member_id still looks like them.

    Hysteresis: keeping a name is easier than getting one. A confirmed face
    keeps its member while that member is the closest one and within
    keep_threshold (looser than the match threshold, one enrolled view is
    enough), so turning the head to the side does not drop the name.
    It does not keep the name if any OTHER member matches within the strict
    threshold, so a real different member still takes over.
    """
    own = [float(d) for m, d in zip(member_ids, distances) if m == member_id]
    others = [float(d) for m, d in zip(member_ids, distances) if m != member_id]
    if not own:
        return False
    best_own = min(own)
    if others and (min(others) < strict_threshold or min(others) <= best_own):
        return False
    return best_own < keep_threshold


class IdentityVote:
    """Stabilise one face track's identity across several recognition samples.

    A member is confirmed only after `required` agreeing samples within the
    last `window` samples. Once confirmed, a single stray result cannot flip
    the identity: switching to another member needs that member to reach
    `required` votes *and* outnumber the current one, and the identity is
    dropped only after `release_after` consecutive non-confirming samples.
    """

    def __init__(self, window=6, required=3, release_after=4):
        self.history = deque(maxlen=window)
        self.required = required
        self.release_after = release_after
        self.confirmed = None
        self.non_confirming = 0

    def add(self, member_id, weight=1.0):
        """Record one sample. Returns True if a member was newly confirmed.

        weight < 1 makes a less reliable sample (e.g. a small, far face)
        count as part of a vote, so more of them are needed to confirm.
        """
        self.history.append((member_id, weight))
        counts = Counter()
        for sample_id, sample_weight in self.history:
            if sample_id is not None:
                counts[sample_id] += sample_weight
        # Small tolerance so e.g. 5 samples of weight 0.6 reach 3 votes.
        counts = Counter({k: v + 1e-9 for k, v in counts.items()})

        if self.confirmed is not None:
            if member_id == self.confirmed:
                self.non_confirming = 0
                return False
            self.non_confirming += 1
            challenger = member_id
            if (
                challenger is not None
                and counts[challenger] >= self.required
                and counts[challenger] > counts[self.confirmed]
            ):
                self.confirmed = challenger
                self.non_confirming = 0
                return True
            if self.non_confirming >= self.release_after:
                self.confirmed = None
                self.non_confirming = 0
                self.history.clear()
            return False

        if counts:
            leader, votes = counts.most_common(1)[0]
            if votes >= self.required:
                self.confirmed = leader
                self.non_confirming = 0
                return True
        return False
