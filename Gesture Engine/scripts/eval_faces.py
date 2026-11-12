"""Measure face recognition separation to choose FACE_MATCH_THRESHOLD.

Usage (from "Gesture Engine/", with Laravel running):
    .\\venv\\Scripts\\python.exe scripts\\eval_faces.py
    .\\venv\\Scripts\\python.exe scripts\\eval_faces.py --live 20

Offline mode encodes every enrolled view exactly like the engine and reports:
  - how many views encoded per member (re-capture members with 0-1 views),
  - same-person distances (between one member's own views),
  - different-person distances (closest views of two different members),
  - the most similar pairs of different members (lookalike risk),
  - a suggested FACE_MATCH_THRESHOLD.

Live mode reads the configured camera (CAMERA_SOURCE) for N seconds and
prints the best and second-best member distance for each detected face.
Stand in front of the camera as a registered member, then as an
unregistered person, to see where the threshold should sit.
"""

import argparse
import itertools
import os
import sys
import time

ENGINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

import env_loader  # noqa: E402  (loads "Gesture Engine/.env")

os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")

import cv2  # noqa: E402
import face_recognition  # noqa: E402
import mediapipe as mp  # noqa: E402
import numpy as np  # noqa: E402
import requests  # noqa: E402

from face_enrollment import EncodingCache, encode_at  # noqa: E402
from face_matching import align_box, best_member_match, box_size  # noqa: E402

LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")
KNOWN_FACES_DIR = os.path.abspath(os.path.join(ENGINE_DIR, "..", "backend", "public"))
CACHE_PATH = os.path.join(ENGINE_DIR, "models", "face_cache.pkl")
THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.50"))
MARGIN = float(os.getenv("FACE_MATCH_MARGIN", "0.05"))
MIN_SIZE = int(os.getenv("FACE_MIN_SIZE", "70"))


def fetch_members():
    headers = {"X-AI-Engine-Token": env_loader.ai_engine_token(), "Accept": "application/json"}
    response = requests.get(f"{LARAVEL_API}/ai/members-faces", headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def load_enrollments(detector):
    """Return {member_id: (name, [encodings], total_views)}."""
    cache = EncodingCache(CACHE_PATH)
    enrolled = {}
    for member in fetch_members():
        path = os.path.normpath(os.path.join(KNOWN_FACES_DIR, member["image_file"].lstrip("/")))
        if not os.path.exists(path):
            print(f"  missing image: {member['name']}")
            continue
        encodings, views, _ = cache.get_or_encode(path, detector)
        enrolled[member["id"]] = (member["name"], encodings, views)
    try:
        cache.save()
    except OSError:
        pass
    return enrolled


def percentile_line(label, values):
    if not values:
        return f"  {label}: (none)"
    arr = np.array(values)
    return (
        f"  {label}: n={len(arr)}  min={arr.min():.3f}  p5={np.percentile(arr, 5):.3f}  "
        f"median={np.median(arr):.3f}  p95={np.percentile(arr, 95):.3f}  max={arr.max():.3f}"
    )


def offline_report(enrolled):
    print("\n== Enrolled views ==")
    for name, encodings, views in sorted(enrolled.values()):
        flag = "" if len(encodings) >= min(2, views) else "   <-- re-capture recommended"
        print(f"  {name}: {len(encodings)}/{views}{flag}")

    same, different, pairs = [], [], []
    for _, encodings, _ in enrolled.values():
        for a, b in itertools.combinations(encodings, 2):
            same.append(float(np.linalg.norm(a - b)))

    members = [(mid, name, encs) for mid, (name, encs, _) in enrolled.items() if encs]
    for (_, name_a, encs_a), (_, name_b, encs_b) in itertools.combinations(members, 2):
        closest = min(float(np.linalg.norm(a - b)) for a in encs_a for b in encs_b)
        different.append(closest)
        pairs.append((closest, name_a, name_b))

    print("\n== Distances (lower = more similar) ==")
    print(percentile_line("same person (front vs side views)", same))
    print(percentile_line("different people (closest views)", different))

    if pairs:
        print("\n== Most similar different members (highest mix-up risk) ==")
        for distance, name_a, name_b in sorted(pairs)[:5]:
            warn = "   <-- below threshold!" if distance < THRESHOLD else ""
            print(f"  {distance:.3f}  {name_a}  vs  {name_b}{warn}")

    if different:
        impostor_p5 = float(np.percentile(different, 5))
        suggestion = min(0.55, max(0.40, impostor_p5 - 0.05))
        print(
            f"\nCurrent FACE_MATCH_THRESHOLD={THRESHOLD:.2f}. Suggested: {suggestion:.2f} "
            f"(keeps ~0.05 below the closest 5% of different-member pairs)."
        )
        print("Confirm with --live: a registered member's live best distance should sit clearly below it.")
    else:
        print("\nNeed at least two enrolled members to compare different people.")


def open_capture():
    source = os.getenv("CAMERA_SOURCE", "webcam").lower()
    if source == "webcam":
        return cv2.VideoCapture(int(os.getenv("WEBCAM_INDEX", "0")), cv2.CAP_DSHOW)
    url_env = {"cctv": "CCTV_URL", "cctv_2": "CCTV_2_URL", "cctv_3": "CCTV_3_URL", "phone": "PHONE_CAMERA_URL"}
    url = os.getenv(url_env.get(source, ""), "").strip()
    if not url:
        raise SystemExit(f"CAMERA_SOURCE={source} has no URL configured.")
    return cv2.VideoCapture(url, cv2.CAP_FFMPEG)


def live_report(enrolled, seconds, detector):
    ids, names, rows = [], {}, []
    for member_id, (name, encodings, _) in enrolled.items():
        names[member_id] = name
        for encoding in encodings:
            ids.append(member_id)
            rows.append(encoding)
    if not rows:
        raise SystemExit("No enrolled encodings to compare against.")
    matrix = np.array(rows)

    capture = open_capture()
    if not capture.isOpened():
        raise SystemExit("Could not open the camera.")
    print(f"\n== Live for {seconds}s (threshold {THRESHOLD:.2f}, margin {MARGIN:.2f}, min size {MIN_SIZE}px) ==")
    end = time.time() + seconds
    last_print = 0.0
    try:
        while time.time() < end:
            ok, frame = capture.read()
            if not ok or frame is None:
                continue
            if time.time() - last_print < 0.5:
                continue
            last_print = time.time()
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w = rgb.shape[:2]
            results = detector.process(rgb)
            for detection in results.detections or []:
                bbox = detection.location_data.relative_bounding_box
                box = align_box(bbox.xmin, bbox.ymin, bbox.width, bbox.height, w, h)
                size = box_size(box)
                if size < MIN_SIZE:
                    print(f"  face {size}px: too small (would show 'Move closer')")
                    continue
                encoding = encode_at(rgb, box)
                if encoding is None:
                    continue
                distances = face_recognition.face_distance(matrix, encoding)
                per_member = {}
                for member_id, distance in zip(ids, distances):
                    per_member[member_id] = min(per_member.get(member_id, 9.0), float(distance))
                ranked = sorted(per_member.items(), key=lambda item: item[1])
                match, _, _ = best_member_match(distances, ids, THRESHOLD, MARGIN)
                best_name = names[ranked[0][0]]
                second = f"{names[ranked[1][0]]} {ranked[1][1]:.3f}" if len(ranked) > 1 else "-"
                verdict = names[match] if match is not None else "Unknown"
                print(f"  face {size}px: best {best_name} {ranked[0][1]:.3f} | 2nd {second} -> {verdict}")
    finally:
        capture.release()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--live", type=int, metavar="SECONDS", help="also test live camera faces for N seconds")
    args = parser.parse_args()

    detector = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.5, model_selection=1)
    print("Loading enrollments (first run encodes every view; later runs use the cache)...")
    enrolled = load_enrollments(detector)
    offline_report(enrolled)
    if args.live:
        live_detector = mp.solutions.face_detection.FaceDetection(min_detection_confidence=0.3, model_selection=1)
        live_report(enrolled, args.live, live_detector)


if __name__ == "__main__":
    main()
