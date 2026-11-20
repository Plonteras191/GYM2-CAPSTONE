"""Encode faces in helper processes so the live video never freezes.

Each helper is a separate Python process that only encodes faces (YuNet
landmarks + SFace, about 30 ms each, see face_enrollment.py): the engine
sends it a small face crop and carries on, so several faces are encoded at
the same time and the face loop never waits on one. (The pool was first
built for dlib, whose encodings took ~0.5 s and froze the whole engine.)

Run as a script ("python face_encoder_pool.py --worker") this file is the
helper. It reads pickled (region, location, upscale) requests from stdin and
writes the pickled encoding (or None) to stdout. Only the engine talks to
it, over private pipes.
"""

import os
import pickle
import subprocess
import sys
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor

WORKER_FLAG = '--worker'
ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))


class FaceEncoderPool:
    """A fixed number of helper processes, one per sender thread."""

    def __init__(self, size=2, command=None):
        self.size = max(1, int(size))
        self._command = command or [sys.executable, os.path.abspath(__file__), WORKER_FLAG]
        self._executor = ThreadPoolExecutor(max_workers=self.size, thread_name_prefix='face-encoder')
        self._local = threading.local()
        self._lock = threading.Lock()
        self._helpers = []
        self._in_flight = 0

    def has_capacity(self):
        """True while a helper is free to start a new encoding right away."""
        with self._lock:
            return self._in_flight < self.size

    def submit(self, region, location, upscale=1.0):
        """Encode a face_region() crop in a helper; returns a Future.

        The future's result is the encoding, or None when no face was found;
        it raises if encoding failed in the helper, or if the helper could
        not be started or died twice on this request.
        """
        return self._submit(self._request, (region, tuple(location), upscale))

    def start(self, timeout=60):
        """Start every helper and wait until each answers; False on failure."""
        gate = threading.Barrier(self.size)

        def ping():
            gate.wait(timeout)  # hold each sender thread so every helper starts
            return self._request(None)

        try:
            for future in [self._submit(ping) for _ in range(self.size)]:
                future.result(timeout=timeout)
        except Exception as error:
            print(f"[FACE ENCODER] Helper processes did not start: {error!r}")
            return False
        return True

    def close(self):
        self._executor.shutdown(wait=False, cancel_futures=True)
        with self._lock:
            helpers, self._helpers = self._helpers, []
        for helper in helpers:
            _stop(helper)

    def _submit(self, task, *args):
        with self._lock:
            self._in_flight += 1
        try:
            future = self._executor.submit(task, *args)
        except Exception:
            self._finished(None)
            raise
        future.add_done_callback(self._finished)
        return future

    def _finished(self, _future):
        with self._lock:
            self._in_flight -= 1

    def _request(self, request):
        """Send one request to this thread's helper and wait for the reply."""
        for attempt in (1, 2):
            helper = self._helper()
            try:
                pickle.dump(request, helper.stdin, protocol=pickle.HIGHEST_PROTOCOL)
                helper.stdin.flush()
                reply = pickle.load(helper.stdout)
            except (OSError, EOFError, pickle.UnpicklingError):
                # The helper died (or was never healthy): replace it once.
                self._discard(helper)
                if attempt == 2:
                    raise
                continue
            if isinstance(reply, BaseException):
                raise reply  # encoding failed inside a healthy helper
            return reply

    def _helper(self):
        helper = getattr(self._local, 'helper', None)
        if helper is None or helper.poll() is not None:
            helper = subprocess.Popen(
                self._command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                cwd=ENGINE_DIR,
            )
            self._local.helper = helper
            with self._lock:
                self._helpers.append(helper)
        return helper

    def _discard(self, helper):
        self._local.helper = None
        with self._lock:
            if helper in self._helpers:
                self._helpers.remove(helper)
        _stop(helper)


def _stop(helper):
    try:
        helper.kill()
    except OSError:
        pass
    for stream in (helper.stdin, helper.stdout):
        try:
            stream.close()
        except OSError:
            pass


def _serve():
    """Helper process: encode requests until the engine closes the pipe."""
    # Keep the reply pipe private: anything a library prints to stdout goes
    # to stderr instead, so it cannot corrupt the replies.
    reply_fd = os.dup(sys.stdout.fileno())
    os.dup2(sys.stderr.fileno(), sys.stdout.fileno())
    if sys.platform == 'win32':
        import msvcrt
        msvcrt.setmode(reply_fd, os.O_BINARY)
    replies = os.fdopen(reply_fd, 'wb')
    requests = sys.stdin.buffer

    if ENGINE_DIR not in sys.path:
        sys.path.insert(0, ENGINE_DIR)
    import cv2
    # One thread per helper: several helpers each using every core would
    # fight each other (and the camera and pose threads) for the CPU.
    cv2.setNumThreads(1)
    from face_enrollment import encode_region

    last_error = None
    while True:
        try:
            request = pickle.load(requests)
        except EOFError:
            return  # the engine exited
        result = None
        if request is not None:  # None is a "are you ready?" ping
            try:
                result = encode_region(*request)
            except Exception as error:
                # Never pass a failure off as "no face found": enrollment
                # would then treat the member's photo as unusable. Log it
                # (once per distinct error) and send it back as an error.
                message = f"{type(error).__name__}: {error}"
                if message != last_error:
                    traceback.print_exc()
                    last_error = message
                result = RuntimeError(f"Face helper failed: {message}")
        pickle.dump(result, replies, protocol=pickle.HIGHEST_PROTOCOL)
        replies.flush()


if __name__ == '__main__' and WORKER_FLAG in sys.argv[1:]:
    _serve()
