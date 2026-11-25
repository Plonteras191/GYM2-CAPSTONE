/** Date and time wording shared by the Attendance page and its side panel. */

export const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const parseDay = (value) => {
  const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

/** "07:42:00" -> "7:42 AM" */
export const formatTime12h = (time) => {
  if (!time) return '';
  const [hours, minutes] = String(time).split(':');
  const h = Number(hours);
  if (Number.isNaN(h)) return String(time);
  return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const formatShortDay = (value) =>
  parseDay(value)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || '—';

export const formatLongDay = (value) =>
  parseDay(value)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) || '—';

/** "Today, 7:42 AM", "Yesterday", "9 days ago", or "Never". */
export const lastVisitLabel = (attendance) => {
  const days = attendance?.days_since_last_visit;
  if (days === null || days === undefined) return 'Never';
  if (days === 0) return `Today, ${formatTime12h(attendance.last_visit_time)}`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

/** Same threshold as the server (AttendanceTrackerController::ABSENT_AFTER_DAYS). */
export const ABSENT_AFTER_DAYS = 7;

export const isAbsent = (row) => {
  const days = row?.attendance?.days_since_last_visit;
  return row?.subscription?.status === 'Active' && (days === null || days === undefined || days >= ABSENT_AFTER_DAYS);
};
