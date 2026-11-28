import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiUserCheck, FiExternalLink, FiClipboard, FiCamera, FiEdit3, FiCheckCircle, FiCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../../api';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import ManualCheckInModal from '../../../components/ui/ManualCheckInModal';
import useDialogAccessibility from '../../../components/ui/useDialogAccessibility';
import MemberAttendanceCalendar from '../../members/components/MemberAttendanceCalendar';
import { getMediaUrl } from '../../../utils/mediaUrl';
import SubscriptionBadge from './SubscriptionBadge';
import WeekStrip from './WeekStrip';
import { dateKey, formatLongDay, formatShortDay, formatTime12h, isAbsent, lastVisitLabel, parseDay } from '../attendanceFormat';

const ASSIGNED_PREFIX = 'ASSIGNED: ';
const CHECKINS_PER_PAGE = 12;

/** A training task has sets and reps; it is pending until verified, and missed once its day has passed. */
const taskStatus = (log, todayKey) => {
  if (!String(log.exercise || '').startsWith(ASSIGNED_PREFIX)) return 'done';
  return String(log.date).slice(0, 10) < todayKey ? 'missed' : 'pending';
};

const TASK_STYLE = {
  done: { icon: FiCheckCircle, label: 'Done', className: 'text-positive' },
  pending: { icon: FiCircle, label: 'To do', className: 'text-muted' },
  missed: { icon: FiAlertCircle, label: 'Missed', className: 'text-negative' },
};

const SUBSCRIPTION_AT_CHECKIN = { active: 'Active', paused: 'Paused', expired: 'Expired', none: 'No subscription' };

function InfoCard({ label, children }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/**
 * A subscriber's attendance in a large window, laid out like the Member
 * Profile: details on the left; the attendance calendar, the check-in list
 * and (With Coach) the coach plan as tabs on the right.
 */
export default function AttendanceDetailModal({ row, weekStart, onClose, onCheckedIn, onShowAlert, isCovered = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calendar');
  const [visits, setVisits] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkInPage, setCheckInPage] = useState(1);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const isOpen = Boolean(row);
  const dialogRef = useDialogAccessibility(isOpen && !isCheckInOpen && !isCovered, onClose);
  const memberId = row?.member.id;
  const withCoach = Boolean(row?.plan);

  useEffect(() => {
    if (!memberId) return undefined;
    let active = true;
    setIsLoading(true);
    setActiveTab('calendar');
    setCheckInPage(1);
    Promise.all([
      api.get(`/members/${memberId}/attendance`),
      withCoach ? api.get(`/members/${memberId}/workouts`) : Promise.resolve({ data: [] }),
    ])
      .then(([attendanceRes, workoutRes]) => {
        if (!active) return;
        setVisits(attendanceRes.data || []);
        setWorkouts(workoutRes.data || []);
      })
      .catch(error => console.error('Failed to load attendance details:', error))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [memberId, withCoach]);

  if (!row) return null;
  const { member, subscription, attendance, plan } = row;
  const absent = isAbsent(row);
  const todayKey = dateKey(new Date());
  const monthKey = todayKey.slice(0, 7);
  const visitsThisMonth = visits.filter(log => String(log.date).startsWith(monthKey)).length;
  const firstName = member.name.split(' ')[0] || member.name;

  const checkInPages = Math.ceil(visits.length / CHECKINS_PER_PAGE);
  const pageVisits = visits.slice((checkInPage - 1) * CHECKINS_PER_PAGE, checkInPage * CHECKINS_PER_PAGE);

  // This week's coach tasks, grouped by day.
  const weekStartDay = parseDay(weekStart);
  const weekDays = weekStartDay
    ? Array.from({ length: 7 }, (_, i) => dateKey(new Date(weekStartDay.getFullYear(), weekStartDay.getMonth(), weekStartDay.getDate() + i)))
    : [];
  const weekTasks = workouts
    .filter(log => log.sets && log.reps && weekDays.includes(String(log.date).slice(0, 10)))
    .map(log => ({ ...log, day: String(log.date).slice(0, 10), status: taskStatus(log, todayKey), name: String(log.exercise || '').replace(ASSIGNED_PREFIX, '') }));

  const reloadVisits = () => {
    api.get(`/members/${memberId}/attendance`).then(res => setVisits(res.data || [])).catch(() => {});
  };
  const openProfile = (tab) => navigate('/members', { state: { memberId: member.id, ...(tab ? { tab } : {}) } });

  const tabs = [['calendar', 'Attendance Calendar'], ['checkins', `Check-ins (${visits.length})`], ...(withCoach ? [['plan', 'Coach plan']] : [])];
  const daysNote = subscription.status === 'Active' && subscription.days_left !== null
    ? `${subscription.days_left} day${subscription.days_left === 1 ? '' : 's'} left`
    : subscription.status === 'Paused' && subscription.paused_days_left !== null
      ? `${subscription.paused_days_left} days kept`
      : subscription.status;

  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-70 flex items-center justify-center bg-brand-dark/70 p-4 backdrop-blur-sm lg:p-8">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-detail-name"
          tabIndex={-1}
          className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 relative flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
        >
          <div className="absolute right-4 top-4 z-20">
            <button onClick={onClose} aria-label="Close attendance" className="press flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel/90 text-muted backdrop-blur-md hover:border-negative/40 hover:bg-negative-soft hover:text-negative">
              <FiX size={16} />
            </button>
          </div>

          <div className="flex h-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            {/* LEFT: member and attendance summary */}
            <div className="flex w-full shrink-0 flex-col border-r border-line bg-field p-4 sm:p-6 lg:w-[32%] lg:overflow-y-auto lg:p-8">
              <div className="flex items-center gap-4 lg:flex-col lg:text-center">
                {member.profile_pic ? (
                  <img src={getMediaUrl(member.profile_pic)} alt="" className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-md dark:border-line lg:mt-2 lg:h-32 lg:w-32 lg:border-4 lg:shadow-lg" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-line text-lg font-medium text-ink-2 shadow-md dark:border-line dark:bg-hover lg:mt-2 lg:h-32 lg:w-32 lg:border-4 lg:text-4xl">
                    {member.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 id="attendance-detail-name" className="truncate text-lg font-medium tracking-[-0.02em] text-ink lg:text-2xl">{member.name}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted lg:justify-center">
                    <span className="font-mono">#{member.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{subscription.plan_type}</span>
                    <SubscriptionBadge status={subscription.status} />
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <InfoCard label="Last visit">
                  <p className={`text-[15px] font-semibold ${absent ? 'text-negative' : 'text-ink'}`}>
                    {absent && <FiAlertCircle className="mr-1 inline" size={14} aria-hidden="true" />}
                    {lastVisitLabel(attendance)}
                  </p>
                  {attendance.last_visit_date && attendance.days_since_last_visit > 0 && (
                    <p className="text-xs text-muted">{formatLongDay(attendance.last_visit_date)} at {formatTime12h(attendance.last_visit_time)}</p>
                  )}
                </InfoCard>
                <InfoCard label="Subscription">
                  <p className="text-[15px] font-semibold text-ink">{daysNote}</p>
                  <p className="text-xs text-muted">{formatShortDay(subscription.start_date)} → {formatShortDay(subscription.end_date)}</p>
                </InfoCard>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <InfoCard label={`This week · ${attendance.week_visits}/7`}>
                    <WeekStrip days={attendance.week_days} weekStart={weekStart} size="sm" />
                  </InfoCard>
                  <InfoCard label="This month">
                    <p className="font-display text-2xl font-medium tabular-nums text-ink">{attendance.month_visits}<span className="ml-1 font-sans text-xs font-normal text-muted">visit{attendance.month_visits === 1 ? '' : 's'}</span></p>
                  </InfoCard>
                </div>
                {plan && (
                  <InfoCard label="Coach plan this week">
                    {plan.week_assigned > 0 ? (
                      <>
                        <p className="text-[15px] font-semibold text-ink">
                          {plan.week_done}/{plan.week_assigned} done
                          {plan.week_missed > 0 && <span className="ml-2 text-xs font-medium text-negative">{plan.week_missed} missed</span>}
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hover">
                          <div className="h-full rounded-full bg-brand-gold" style={{ width: `${(plan.week_done / plan.week_assigned) * 100}%` }} />
                        </div>
                      </>
                    ) : <p className="text-sm text-muted">No tasks this week</p>}
                  </InfoCard>
                )}
              </div>

              <div className="mt-6 grid gap-2 lg:mt-auto lg:pt-6">
                <Button icon={<FiUserCheck size={16} />} onClick={() => setIsCheckInOpen(true)}>Manual check-in</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" icon={<FiExternalLink size={14} />} onClick={() => openProfile()}>Profile</Button>
                  <Button variant="outline" size="sm" icon={<FiClipboard size={14} />} onClick={() => openProfile('plan')} disabled={!withCoach} title={withCoach ? undefined : 'Only for With Coach members'}>Training plan</Button>
                </div>
              </div>
            </div>

            {/* RIGHT: tabs */}
            <div className="flex h-full w-full flex-col bg-panel lg:w-[68%]">
              <div className="flex shrink-0 items-center gap-6 overflow-x-auto border-b border-line px-8 pt-6">
                {tabs.map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`press relative whitespace-nowrap pb-4 text-[15px] font-semibold transition-colors ${activeTab === key ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                    {label}
                    {activeTab === key && <div className="animate-in fade-in absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-brand-gold" />}
                  </button>
                ))}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {isLoading && <p role="status" className="mb-3 rounded-xl border border-line bg-field px-4 py-3 text-sm text-ink-2">Loading attendance…</p>}

                {activeTab === 'calendar' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-line bg-panel p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold text-muted">
                      Visits this month: <span className="font-medium text-ink">{visitsThisMonth}</span>
                      <span aria-hidden="true" className="mx-2 text-line-strong">|</span>
                      Last 2 years: <span className="font-medium text-ink">{visits.length}</span>
                    </p>
                    <MemberAttendanceCalendar attendance={visits} memberFirstName={firstName} />
                  </div>
                )}

                {activeTab === 'checkins' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-xl border border-line">
                    {visits.length === 0 ? (
                      <p className="px-4 py-10 text-center text-sm text-muted">No check-ins in the last 2 years.</p>
                    ) : (
                      <>
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-field">
                            <tr className="border-b border-line text-xs font-medium text-muted">
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Time in</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="hidden px-4 py-3 sm:table-cell">Subscription then</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {pageVisits.map(log => (
                              <tr key={log.id}>
                                <td className="px-4 py-3 font-medium text-ink">{formatLongDay(log.date)}<span className="ml-1 text-muted">{String(log.date).slice(0, 4)}</span></td>
                                <td className="px-4 py-3 tabular-nums text-ink-2">{formatTime12h(log.time_in)}</td>
                                <td className="px-4 py-3 text-ink-2">
                                  <span className="inline-flex items-center gap-1.5">
                                    {log.source === 'manual' ? <FiEdit3 size={13} aria-hidden="true" /> : <FiCamera size={13} aria-hidden="true" />}
                                    {log.source === 'manual' ? 'Manual' : 'Face'}
                                  </span>
                                </td>
                                <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">
                                  {SUBSCRIPTION_AT_CHECKIN[log.subscription_status] || '—'}
                                  {log.plan_snapshot && <span className="text-muted"> · {log.plan_snapshot}</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <Pagination
                          currentPage={checkInPage}
                          totalPages={checkInPages}
                          onPageChange={setCheckInPage}
                          totalItems={visits.length}
                          itemsPerPage={CHECKINS_PER_PAGE}
                          itemsLabel="check-ins"
                        />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'plan' && withCoach && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
                    {subscription.status === 'Paused' && (
                      <p className="rounded-xl border border-line bg-field px-4 py-3 text-sm text-ink-2">Paused: the camera does not track this member's tasks until the subscription is resumed.</p>
                    )}
                    {weekDays.map(day => {
                      const tasks = weekTasks.filter(task => task.day === day);
                      return (
                        <div key={day} className={`overflow-hidden rounded-xl border ${day === todayKey ? 'border-focus' : 'border-line'}`}>
                          <div className="flex items-center justify-between bg-field px-4 py-2.5">
                            <span className="text-sm font-semibold text-ink">{formatLongDay(day)}{day === todayKey && <span className="ml-2 text-xs font-medium text-focus">Today</span>}</span>
                            <span className="text-xs text-muted">{tasks.length ? `${tasks.filter(task => task.status === 'done').length}/${tasks.length} done` : 'Rest day'}</span>
                          </div>
                          {tasks.length > 0 && (
                            <ul className="divide-y divide-line">
                              {tasks.map(task => {
                                const style = TASK_STYLE[task.status];
                                const Icon = style.icon;
                                return (
                                  <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                    <span className="min-w-0 truncate text-ink"><span className="font-medium">{task.name}</span> <span className="text-muted">· {task.sets} × {task.reps}</span></span>
                                    <span className={`inline-flex shrink-0 items-center gap-1 font-medium ${style.className}`}><Icon size={14} aria-hidden="true" />{style.label}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ManualCheckInModal
        isOpen={isCheckInOpen}
        member={{ id: member.id, name: member.name }}
        onClose={() => setIsCheckInOpen(false)}
        onDone={(title, message, type) => {
          onShowAlert?.(title, message, type);
          reloadVisits();
          onCheckedIn?.();
        }}
      />
    </>
  );
}
