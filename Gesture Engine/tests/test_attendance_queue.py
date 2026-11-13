import os
import tempfile
import unittest
from datetime import datetime

import requests

from attendance_queue import QUEUED, REJECTED, SENT, AttendanceSender


class FakeResponse:
    def __init__(self, status_code, body=None):
        self.status_code = status_code
        self._body = body

    def json(self):
        if self._body is None:
            raise ValueError("no json")
        return self._body


class FakeLaravel:
    """Stands in for requests.post; `mode` decides how Laravel behaves."""

    def __init__(self):
        self.mode = 'ok'
        self.received = []

    def __call__(self, url, json=None, headers=None, timeout=None):
        if self.mode == 'down':
            raise requests.ConnectionError("refused")
        if self.mode == 'error500':
            return FakeResponse(500)
        if self.mode == 'bad_token':
            return FakeResponse(401, {'message': 'Invalid AI engine token.'})
        self.received.append(json)
        return FakeResponse(200, {'status': 'logged'})


class AttendanceSenderTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.queue_path = os.path.join(self.dir.name, 'data', 'attendance_queue.jsonl')
        self.laravel = FakeLaravel()
        self.clock = datetime(2026, 11, 13, 10, 5, 42)
        self.sender = self.make_sender()

    def tearDown(self):
        self.dir.cleanup()

    def make_sender(self):
        return AttendanceSender(
            'http://laravel/api/ai/log-attendance', {}, self.queue_path,
            post=self.laravel, now=lambda: self.clock,
        )

    def test_sends_immediately_with_arrival_time_and_details(self):
        outcome, detail = self.sender.submit(7, 'Juan', camera_source='cctv', match_distance=0.37123)

        self.assertEqual((outcome, detail), (SENT, 'logged'))
        self.assertEqual(self.laravel.received, [{
            'member_id': 7,
            'checked_in_at': '2026-11-13 10:05:42',
            'camera_source': 'cctv',
            'match_distance': 0.3712,
        }])
        self.assertEqual(self.sender.pending(), 0)

    def test_queues_when_laravel_is_down_and_delivers_later_with_original_time(self):
        self.laravel.mode = 'down'
        outcome, _ = self.sender.submit(7, 'Juan')
        self.assertEqual(outcome, QUEUED)
        self.assertEqual(self.sender.pending(), 1)

        self.clock = datetime(2026, 11, 13, 10, 20, 0)
        self.assertEqual(self.sender.flush(), 1)  # still down

        self.laravel.mode = 'ok'
        self.assertEqual(self.sender.flush(), 0)
        self.assertEqual(self.laravel.received[0]['checked_in_at'], '2026-11-13 10:05:42')
        self.assertFalse(os.path.exists(self.queue_path))

    def test_server_error_is_retried(self):
        self.laravel.mode = 'error500'
        self.assertEqual(self.sender.submit(7, 'Juan')[0], QUEUED)

    def test_queue_survives_an_engine_restart(self):
        self.laravel.mode = 'down'
        self.sender.submit(7, 'Juan')
        self.sender.submit(8, 'Maria')

        restarted = self.make_sender()
        self.laravel.mode = 'ok'
        self.assertEqual(restarted.flush(), 0)
        self.assertEqual([item['member_id'] for item in self.laravel.received], [7, 8])

    def test_permanent_refusal_is_dropped_not_retried(self):
        self.laravel.mode = 'bad_token'
        outcome, detail = self.sender.submit(7, 'Juan')

        self.assertEqual(outcome, REJECTED)
        self.assertIn('401', detail)
        self.assertEqual(self.sender.pending(), 0)

    def test_saved_check_ins_from_a_previous_day_are_dropped(self):
        self.laravel.mode = 'down'
        self.sender.submit(7, 'Juan')

        self.clock = datetime(2026, 11, 14, 9, 0, 0)
        self.laravel.mode = 'ok'
        self.assertEqual(self.sender.flush(), 0)
        self.assertEqual(self.laravel.received, [])

    def test_corrupt_queue_lines_are_ignored(self):
        os.makedirs(os.path.dirname(self.queue_path))
        with open(self.queue_path, 'w', encoding='utf-8') as queue_file:
            queue_file.write('not json\n{"member_id": 9, "name": "Ana", "checked_in_at": "2026-11-13 09:30:00"}\n')

        self.assertEqual(self.sender.flush(), 0)
        self.assertEqual(self.laravel.received[0]['member_id'], 9)


if __name__ == '__main__':
    unittest.main()
