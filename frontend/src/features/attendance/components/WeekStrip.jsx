import React from 'react';
import { dateKey, parseDay } from '../attendanceFormat';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * This week at a glance, Monday to Sunday: days with a check-in are filled
 * cyan, days without one are only outlined (dashed and faded when still to
 * come), and today has a cyan ring.
 */
export default function WeekStrip({ days = [], weekStart, size = 'md' }) {
  const start = parseDay(weekStart);
  if (!start) return null;
  const visited = new Set(days);
  const todayKey = dateKey(new Date());
  const box = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-[11px]';

  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Visited ${visited.size} of 7 days this week`}>
      {LETTERS.map((letter, index) => {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
        const key = dateKey(day);
        const came = visited.has(key);
        const isToday = key === todayKey;
        const isFuture = key > todayKey;
        return (
          <span
            key={key}
            title={`${NAMES[index]}${came ? ': checked in' : ''}`}
            className={[
              'flex shrink-0 items-center justify-center rounded-md font-semibold',
              box,
              // Came: filled cyan. Missed (past) or still to come: only an outline.
              came ? 'bg-brand-gold text-brand-dark' : 'border border-line-strong text-muted',
              isToday ? 'ring-2 ring-focus ring-offset-1 ring-offset-panel' : '',
              isFuture && !came ? 'border-dashed opacity-50' : '',
            ].join(' ')}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
