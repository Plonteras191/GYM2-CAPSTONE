"""Face encoding, optionally in a separate process.

dlib (used by face_recognition) holds Python's global lock while it encodes a
face, which takes ~0.9 s on the gym laptop. In the engine's own process that
freezes every other thread: camera reader, video feed and pose detection.
Running the encoder as a child process (`python face_encoder_process.py`)
gives it its own lock, so the engine keeps running while faces are encoded.

Protocol over the child's stdin/stdout: each message is a 4-byte little-endian
length followed by a pickle. The parent sends a BGR face crop (numpy array);
the child replies ('ok', encoding) where encoding is a 128-float numpy array
or None when no face could be encoded, or ('error', message).
"""

import os
import pickle
import struct
import subprocess
import sys
import threading

import cv2
import face_recognition

HEADER = struct.Struct('<I')


def prepare_face_crop(face_crop):
    """BGR crop -> RGB, gently brightened when dark (keeps colour for dlib)."""
    rgb_crop = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
    # Sample every 4th pixel: same brightness estimate, 16x cheaper.
    if rgb_crop[::4, ::4].mean() < 65:
        hsv = cv2.cvtColor(face_crop, cv2.COLOR_BGR2HSV)
        hsv[:, :, 2] = cv2.convertScaleAbs(hsv[:, :, 2], alpha=1.2, beta=20)
        rgb_crop = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    return rgb_crop


def encode_face_crop(face_crop):
    """128-number face encoding for one BGR face crop, or None if dlib finds none."""
    prep_crop = prepare_face_crop(face_crop)
    crop_h, crop_w = prep_crop.shape[:2]

    # dlib resizes internally anyway, so capping the crop at 160 px keeps the
    # same quality for much less work.
    max_crop = 160
    if crop_h > max_crop or crop_w > max_crop:
        scale = max_crop / max(crop_h, crop_w)
        prep_crop = cv2.resize(prep_crop, (int(crop_w * scale), int(crop_h * scale)))
        crop_h, crop_w = prep_crop.shape[:2]

    # Pass the face location explicitly so dlib does NOT run its own detector
    # on the crop (it may pick a neighbour's face or find none near the edge).
    encodings = face_recognition.face_encodings(
        prep_crop,
        known_face_locations=[(0, crop_w, crop_h, 0)],
        num_jitters=1,
    )
    return encodings[0] if encodings else None


def _read_message(stream):
    header = stream.read(HEADER.size)
    if len(header) < HEADER.size:
        return None
    (length,) = HEADER.unpack(header)
    payload = stream.read(length)
    if len(payload) < length:
        return None
    return pickle.loads(payload)


def _write_message(stream, obj):
    payload = pickle.dumps(obj, protocol=pickle.HIGHEST_PROTOCOL)
    stream.write(HEADER.pack(len(payload)) + payload)
    stream.flush()


class FaceEncoderProcess:
    """Parent-side handle to the encoder child process.

    Used from one thread only (face_recognition_worker). Restarts the child
    if it dies. Raises RuntimeError if the child cannot be started, so the
    caller can fall back to encoding in-process.
    """

    STARTUP_TIMEOUT_SECONDS = 60.0

    def __init__(self):
        self._process = None

    def _start(self):
        self.close()
        script = os.path.abspath(__file__)
        self._process = subprocess.Popen(
            [sys.executable, script],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            cwd=os.path.dirname(script),
        )
        ready = {}

        def wait_ready():
            ready['message'] = _read_message(self._process.stdout)

        waiter = threading.Thread(target=wait_ready, daemon=True)
        waiter.start()
        waiter.join(self.STARTUP_TIMEOUT_SECONDS)
        if ready.get('message') != 'ready':
            self.close()
            raise RuntimeError('Face encoder process did not start.')

    def encode(self, face_crop):
        """Encoding (numpy array) or None. Retries once with a fresh child."""
        for attempt in range(2):
            if self._process is None or self._process.poll() is not None:
                self._start()
            try:
                _write_message(self._process.stdin, face_crop)
                reply = _read_message(self._process.stdout)
            except (BrokenPipeError, OSError, EOFError, pickle.UnpicklingError):
                reply = None
            if reply is None:
                self.close()  # Child died; restart on the next attempt.
                continue
            status, value = reply
            if status == 'ok':
                return value
            raise RuntimeError(value)
        raise RuntimeError('Face encoder process keeps failing.')

    def close(self):
        if self._process is not None:
            try:
                self._process.kill()
            except OSError:
                pass
            self._process = None


def _child_main():
    stdin = sys.stdin.buffer
    stdout = sys.stdout.buffer
    # Anything printed by libraries must not corrupt the message stream.
    sys.stdout = sys.stderr
    _write_message(stdout, 'ready')
    while True:
        face_crop = _read_message(stdin)
        if face_crop is None:
            break  # Parent closed the pipe or exited.
        try:
            _write_message(stdout, ('ok', encode_face_crop(face_crop)))
        except Exception as exc:  # Report, keep serving.
            _write_message(stdout, ('error', str(exc)))


if __name__ == '__main__':
    _child_main()
