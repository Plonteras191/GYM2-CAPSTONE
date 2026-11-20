"""Download the face models into "Gesture Engine/models".

  python scripts/download_face_models.py

Both come from the OpenCV model zoo (Apache 2.0):
  YuNet (0.2 MB)  finds faces and their landmarks: the small-face search
                  (small_face_sweep.py) and face alignment before encoding.
  SFace (37 MB)   face recognition: turns a face into an encoding
                  (face_enrollment.py). The engine cannot name anyone
                  without it.
Files already present are skipped. SFace is checked against a known
SHA-256, so a broken or tampered download is never used.
"""

import hashlib
import os
import sys
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
ZOO = 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/'

# (file name, URL, SHA-256 or None)
MODELS = [
    (
        'face_detection_yunet_2023mar.onnx',
        ZOO + 'face_detection_yunet/face_detection_yunet_2023mar.onnx',
        None,
    ),
    (
        'face_recognition_sface_2021dec.onnx',
        ZOO + 'face_recognition_sface/face_recognition_sface_2021dec.onnx',
        '0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79',
    ),
]


def download(name, url, sha256):
    path = os.path.join(MODELS_DIR, name)
    if os.path.isfile(path):
        print(f"OK: {path} already present.")
        return True
    print(f"Downloading {url} ...")
    with urllib.request.urlopen(url, timeout=600) as response:
        data = response.read()
    if not data.startswith(b'\x08'):  # ONNX protobuf, not a Git LFS pointer
        print(f"ERROR: the {name} download is not an ONNX model. Download it manually from the OpenCV model zoo.")
        return False
    if sha256 is not None and hashlib.sha256(data).hexdigest() != sha256:
        print(f"ERROR: {name} does not match its expected SHA-256; not saved.")
        return False
    tmp_path = path + '.tmp'
    with open(tmp_path, 'wb') as out:
        out.write(data)
    os.replace(tmp_path, path)
    print(f"Saved {path}.")
    return True


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    results = [download(name, url, sha256) for name, url, sha256 in MODELS]
    if not all(results):
        sys.exit(1)
    print("Face models ready. Restart the engine to use them.")


if __name__ == '__main__':
    main()
