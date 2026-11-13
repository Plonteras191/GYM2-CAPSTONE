"""Reliable delivery of check-ins from the engine to Laravel.

A check-in is sent once, when a face is confirmed. If Laravel is down,
restarting or returns a server error at that moment, the check-in is saved
to a small file and retried later, with the member's real arrival time.
Check-ins Laravel refuses for a permanent reason (wrong token, unknown
member) are reported clearly and dropped, since retrying cannot fix them.
"""

import json
import os
import threading
from datetime import datetime

import requests

SENT = 'sent'          # Laravel answered; see the returned status text
QUEUED = 'queued'      # saved to disk, will be retried
REJECTED = 'rejected'  # Laravel refused it permanently; dropped

TIME_FORMAT = '%Y-%m-%d %H:%M:%S'


class AttendanceSender:
    def __init__(self, url, headers, queue_path, post=None, now=None, timeout=5):
        self.url = url
        self.headers = headers
        self.queue_path = queue_path
        self.timeout = timeout
        self._post = post or requests.post
        self._now = now or datetime.now
        self._lock = threading.Lock()

    # ---- public API -----------------------------------------------------

    def submit(self, member_id, name, camera_source=None, match_distance=None):
        """Send a check-in now; queue it if Laravel cannot be reached.

        Returns (outcome, detail): (SENT, laravel status), (QUEUED, reason)
        or (REJECTED, reason).
        """
        entry = {
            'member_id': member_id,
            'name': name,
            'checked_in_at': self._now().strftime(TIME_FORMAT),
            'camera_source': camera_source,
            'match_distance': None if match_distance is None else round(float(match_distance), 4),
        }
        outcome, detail = self._send(entry)
        if outcome == QUEUED:
            with self._lock:
                self._write(self._read() + [entry])
            print(f"[ATTENDANCE] Could not reach Laravel ({detail}). Saved {name}'s check-in; will retry.")
        elif outcome == REJECTED:
            print(f"[ATTENDANCE ERROR] Laravel refused {name}'s check-in: {detail}")
        return outcome, detail

    def flush(self):
        """Retry saved check-ins. Returns how many are still waiting."""
        with self._lock:
            entries = self._read()
            if not entries:
                return 0

            today = self._now().strftime('%Y-%m-%d')
            remaining = []
            for index, entry in enumerate(entries):
                if not str(entry.get('checked_in_at', '')).startswith(today):
                    # Laravel only accepts same-day arrival times.
                    print(f"[ATTENDANCE] Dropped an old saved check-in for {entry.get('name')} ({entry.get('checked_in_at')}).")
                    continue
                outcome, detail = self._send(entry)
                if outcome == QUEUED:
                    # Laravel is still unreachable: keep this and the rest.
                    remaining.extend(entries[index:])
                    break
                if outcome == SENT:
                    print(f"[ATTENDANCE] Delivered saved check-in for {entry.get('name')} ({detail}).")
                else:
                    print(f"[ATTENDANCE ERROR] Laravel refused saved check-in for {entry.get('name')}: {detail}")

            self._write(remaining)
            return len(remaining)

    def pending(self):
        with self._lock:
            return len(self._read())

    # ---- internals ------------------------------------------------------

    def _send(self, entry):
        payload = {key: value for key, value in entry.items() if key != 'name' and value is not None}
        try:
            response = self._post(self.url, json=payload, headers=self.headers, timeout=self.timeout)
        except requests.RequestException as error:
            return QUEUED, type(error).__name__

        code = response.status_code
        if 200 <= code < 300:
            try:
                return SENT, str(response.json().get('status', 'ok'))
            except ValueError:
                return SENT, 'ok'
        if code >= 500 or code in (408, 429):
            return QUEUED, f"HTTP {code}"

        try:
            message = response.json().get('message', '')
        except ValueError:
            message = ''
        return REJECTED, f"HTTP {code} {message}".strip()

    def _read(self):
        entries = []
        try:
            with open(self.queue_path, encoding='utf-8') as queue_file:
                for line in queue_file:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except ValueError:
                        continue
                    if isinstance(entry, dict) and 'member_id' in entry:
                        entries.append(entry)
        except OSError:
            pass
        return entries

    def _write(self, entries):
        if not entries:
            try:
                os.remove(self.queue_path)
            except OSError:
                pass
            return
        os.makedirs(os.path.dirname(self.queue_path), exist_ok=True)
        tmp_path = self.queue_path + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8') as queue_file:
            for entry in entries:
                queue_file.write(json.dumps(entry) + '\n')
        os.replace(tmp_path, self.queue_path)
