"""Health report of the enrolled face gallery.

Finds the enrollment problems that cause missed or wrong recognitions:
members with no usable face view, missing photo files, two records with the
same name (usually one person enrolled twice), and pairs of members whose
faces the model can confuse. Printed in the engine log at every face reload
and shown on the Attendance Monitor (GET /gallery_health).

Pure numpy, so it can be unit-tested without a camera or face models.
"""

import time
from collections import defaultdict

import numpy as np

# Two different members' enrolled faces closer than this can be mistaken
# for each other by the face model ("look-alikes"). Distances are SFace's
# 1 - cosine. The engine's match threshold is 0.55, so pairs below that are
# the most likely to be confused; below 0.62 (the keep threshold) a member
# could keep a look-alike's name.
LOOK_ALIKE_DISTANCE = 0.62
LIKELY_CONFUSED_DISTANCE = 0.55


def _cosine(matrix, probe):
    """1 - cosine similarity of every row of matrix to probe."""
    matrix = np.asarray(matrix, dtype=np.float64)
    probe = np.asarray(probe, dtype=np.float64)
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(probe)
    return 1.0 - (matrix @ probe) / np.where(norms > 0, norms, 1.0)


def _cross(a, b, distance):
    """Distances between every row of a and every row of b, shape (len(a), len(b))."""
    a = np.asarray(a, dtype=np.float64)
    return np.stack([distance(a, row) for row in np.asarray(b, dtype=np.float64)], axis=1)


def closest_member_distances(probe_encodings, matrix, member_ids, distance=None):
    """For each enrolled member, the smallest distance to any probe encoding.

    probe_encodings: (n, d) encodings of one face (several views).
    matrix, member_ids: the enrolled gallery, one row per enrolled view.
    distance(matrix, probe) -> distances; defaults to 1 - cosine (SFace).
    Returns {member_id: distance}.
    """
    if len(member_ids) == 0 or len(probe_encodings) == 0:
        return {}
    distances = _cross(matrix, probe_encodings, distance or _cosine).min(axis=1)
    closest = {}
    for member_id, distance in zip(member_ids, distances):
        distance = float(distance)
        if member_id not in closest or distance < closest[member_id]:
            closest[member_id] = distance
    return closest


def look_alike_pairs(matrix, member_ids, max_distance=LOOK_ALIKE_DISTANCE, distance=None):
    """Pairs of different members whose closest enrolled views are < max_distance.

    Returns [(distance, member_a, member_b)], closest first.
    """
    ids = list(member_ids)
    unique = list(dict.fromkeys(ids))
    rows = {member: [i for i, m in enumerate(ids) if m == member] for member in unique}
    gallery = np.asarray(matrix, dtype=np.float64)
    pairs = []
    for index, member_a in enumerate(unique):
        for member_b in unique[index + 1:]:
            closest = float(_cross(gallery[rows[member_a]], gallery[rows[member_b]], distance or _cosine).min())
            if closest < max_distance:
                pairs.append((closest, member_a, member_b))
    return sorted(pairs, key=lambda pair: pair[0])


def _normalized_name(name):
    return ' '.join(str(name or '').lower().split())


def build_gallery_health(members, matrix, member_ids, look_alike=LOOK_ALIKE_DISTANCE,
                         likely_confused=LIKELY_CONFUSED_DISTANCE, distance=None):
    """members: [{'id', 'name', 'views_usable', 'views_total', 'status'}]
    with status one of 'success', 'weak', 'failed', 'missing', 'error'.
    look_alike / likely_confused / distance: the face model's own scale
    (defaults are SFace's).
    """
    names = {member['id']: member['name'] for member in members}

    by_name = defaultdict(list)
    for member in members:
        by_name[_normalized_name(member['name'])].append(member['id'])
    duplicate_names = [
        {'name': names[ids[0]], 'member_ids': sorted(ids)}
        for key, ids in sorted(by_name.items())
        if key and len(ids) > 1
    ]

    look_alikes = [
        {
            'members': [
                {'id': member_a, 'name': names.get(member_a, str(member_a))},
                {'id': member_b, 'name': names.get(member_b, str(member_b))},
            ],
            'distance': round(pair_distance, 3),
            'level': 'likely_confused' if pair_distance < likely_confused else 'similar',
        }
        for pair_distance, member_a, member_b in look_alike_pairs(matrix, member_ids, look_alike, distance)
    ]

    unrecognizable = [
        {'id': m['id'], 'name': m['name'], 'status': m['status']}
        for m in members if m['status'] in ('failed', 'missing', 'error')
    ]
    weak = [
        {'id': m['id'], 'name': m['name'], 'views_usable': m['views_usable'], 'views_total': m['views_total']}
        for m in members if m['status'] == 'weak'
    ]

    return {
        'ready': True,
        'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        'member_count': len(members),
        'unrecognizable': unrecognizable,
        'weak': weak,
        'duplicate_names': duplicate_names,
        'look_alikes': look_alikes,
        'problem_count': len(unrecognizable) + len(duplicate_names)
        + sum(1 for pair in look_alikes if pair['level'] == 'likely_confused'),
    }


def report_lines(report):
    """Plain-language lines for the engine log."""
    if not report.get('ready'):
        return []
    lines = [f"[GALLERY] Face gallery check: {report['problem_count']} problem(s) to fix."]
    for member in report['unrecognizable']:
        reason = 'photo file missing' if member['status'] == 'missing' else 'no usable face in the photo'
        lines.append(f"  [CANNOT RECOGNIZE] {member['name']}: {reason}. Re-enroll this member's face.")
    for duplicate in report['duplicate_names']:
        ids = ', '.join(f"#{member_id}" for member_id in duplicate['member_ids'])
        lines.append(f"  [DUPLICATE?] '{duplicate['name']}' has {len(duplicate['member_ids'])} records ({ids}). "
                     f"Delete the extra record, or check-ins may go to the wrong one.")
    for pair in report['look_alikes']:
        a, b = (member['name'] for member in pair['members'])
        if pair['level'] == 'likely_confused':
            lines.append(f"  [LOOK-ALIKE] {a} and {b} look very alike to the face model ({pair['distance']}). "
                         f"Re-enroll both in good light.")
        else:
            lines.append(f"  [similar] {a} and {b} ({pair['distance']}).")
    for member in report['weak']:
        lines.append(f"  [weak] {member['name']}: only {member['views_usable']}/{member['views_total']} views usable.")
    return lines
