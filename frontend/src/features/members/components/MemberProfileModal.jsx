import React, { useState } from 'react';
import {
  FiX, FiMapPin, FiPhone, FiActivity, FiChevronLeft, FiChevronRight,
  FiChevronDown, FiChevronUp, FiLock
} from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../../api';
import MobileCalendarToolbar from '../../../components/ui/MobileCalendarToolbar';
import MobileCalendarDaySheet from '../../../components/ui/MobileCalendarDaySheet';
import CalendarHoverPopover from '../../../components/ui/CalendarHoverPopover';
import Pagination from '../../../components/ui/Pagination';

const getBmiInfo = (height, weight) => {
  if (!height || !weight) return { value: 'N/A', label: 'Need Data', color: 'bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500' };
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const n = parseFloat(bmi);
  if (n < 16) return { value: bmi, label: 'Severe Thinness', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  if (n < 17) return { value: bmi, label: 'Moderate Thin', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (n < 18.5) return { value: bmi, label: 'Mild Thinness', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (n < 25) return { value: bmi, label: 'Normal', color: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50' };
  if (n < 30) return { value: bmi, label: 'Overweight', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (n < 35) return { value: bmi, label: 'Obese Class I', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (n < 40) return { value: bmi, label: 'Obese Class II', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  return { value: bmi, label: 'Obese Class III', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
};

const getTaskStatus = (log) => {
  if (!log.exercise.startsWith('ASSIGNED: ')) return 'VERIFIED';
  const logDay = log.date ? new Date(`${log.date}T00:00:00`) : new Date(new Date(log.created_at).toDateString());
  const today = new Date(new Date().toDateString());
  if (logDay < today) return 'MISSED';
  if (logDay > today) return 'SCHEDULED';
  if (logDay.getTime() === today.getTime()) {
    const now = new Date();
    if (now.getHours() > 21 || (now.getHours() === 21 && now.getMinutes() >= 30)) return 'MISSED';
    return 'PENDING';
  }
  return 'PENDING';
};

const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  return Math.abs(new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970);
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultRoutine = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
const createEmptyRoutine = () => Object.fromEntries(daysOfWeek.map(day => [day, []]));
const formatExerciseName = (name) => name.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
const getExerciseMediaUrl = (exercise, field = 'gif_url') => {
  const mediaPath = exercise?.[field] || exercise?.image;
  return mediaPath ? `/dataset/${mediaPath.replace(/^\//, '')}` : null;
};
const getGestureClass = (exercise) => {
  const name = exercise.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const movementPatterns = [
    ['BURPEE', /\bburpee\b/],
    ['CRUNCH', /\bcrunch\b/],
    ['DEADLIFT', /\bdeadlift\b/],
    ['HIGH KNEE', /\bhigh knee\b/],
    ['LUNGE', /\blunge\b/],
    ['MOUNTAIN CLIMBER', /\bmountain climber\b/],
    ['PLANK', /\bplank\b/],
    ['PUSH UP', /\bpush up\b/],
    ['RUSSIAN TWIST', /\brussian twist\b/],
    ['SIT UP', /\bsit up\b/],
    ['SQUAT', /\bsquat\b/]
  ];
  const matchedMovement = movementPatterns.find(([, pattern]) => pattern.test(name));
  if (matchedMovement) return matchedMovement[0];
  if (name.includes('curl') && exercise.body_part === 'upper arms' && exercise.target?.toLowerCase().includes('biceps')) return 'CURL';
  return null;
};

export default function MemberProfileModal({ isOpen, member, onClose, onShowAlert }) {
  const [activeTab, setActiveTab] = useState('workouts');
  const [attendance, setAttendance] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [coachNotes, setCoachNotes] = useState('');
  const [workoutPage, setWorkoutPage] = useState(1);
  const [expandedDate, setExpandedDate] = useState(null);
  const [weeklyRoutine, setWeeklyRoutine] = useState(defaultRoutine);
  const [planLogs, setPlanLogs] = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');
  const [exercisesLib, setExercisesLib] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');
  const [exercisePage, setExercisePage] = useState(1);
  const attendanceCalendarRef = React.useRef(null);
  const [attendanceCalendarTitle, setAttendanceCalendarTitle] = useState('');
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null);
  const [selectedAttendanceEntries, setSelectedAttendanceEntries] = useState([]);
  const [mobileCoachView, setMobileCoachView] = useState('routine');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isProfileDataLoading, setIsProfileDataLoading] = useState(false);
  const [profileDataError, setProfileDataError] = useState('');
  const [profileDataRetry, setProfileDataRetry] = useState(0);
  
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  React.useEffect(() => {
    if (!isOpen || !member) return;
    let isCurrent = true;
    setActiveTab('workouts');
    setWorkoutPage(1);
    setExpandedDate(null);
    setCoachNotes(localStorage.getItem(`notes_${member.id}`) || '');
    const saved = localStorage.getItem(`routine_${member.id}`);
    setWeeklyRoutine(saved ? JSON.parse(saved) : defaultRoutine);
    setPlanLogs(null);
    setActiveDay('Monday');
    setIsProfileDataLoading(true);
    setProfileDataError('');

    (async () => {
      try {
        const [attRes, workRes, planRes] = await Promise.all([
          api.get(`/members/${member.id}/attendance`),
          api.get(`/members/${member.id}/workouts`),
          api.get(`/members/${member.id}/workout-plan`)
        ]);
        if (!isCurrent) return;
        setAttendance(attRes.data);
        setWorkouts(workRes.data);
        setPlanLogs(planRes.data);
      } catch (err) {
        console.error('Failed to load profile logs', err);
        if (isCurrent) setProfileDataError('Member activity could not be loaded. Check your connection and retry.');
      } finally {
        if (isCurrent) setIsProfileDataLoading(false);
      }
    })();

    fetch('/dataset/data/exercises.json')
      .then(r => r.json())
      .then(d => setExercisesLib(d.data || d))
      .catch(() => {});
    return () => { isCurrent = false; };
  }, [isOpen, member, profileDataRetry]);

  React.useEffect(() => {
    if (planLogs === null) return;
    const routine = createEmptyRoutine();
    planLogs.forEach(log => {
      const date = String(log.date || '').slice(0, 10);
      const day = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
      if (!routine[day]) return;
      const exerciseName = log.exercise.replace(/^ASSIGNED:\s*/i, '');
      const catalogExercise = exercisesLib.find(ex => ex.name.toUpperCase() === exerciseName.toUpperCase());
      routine[day].push({
        ...(catalogExercise || { id: `planned-${log.id}`, name: exerciseName }),
        sets: log.sets || 3,
        reps: log.reps || 10
      });
    });
    setWeeklyRoutine(routine);
  }, [planLogs, exercisesLib]);

  const handleManualVerify = async (logId) => {
    try {
      await api.put(`/workouts/${logId}/manual-verify`);
      const res = await api.get(`/members/${member.id}/workouts`);
      setWorkouts(res.data);
    } catch { console.error('Verification failed'); }
  };

  const handleAssignWeeklyPlan = async () => {
    if (isSavingPlan) return;

    setIsSavingPlan(true);
    try {
      localStorage.setItem(`routine_${member.id}`, JSON.stringify(weeklyRoutine));
      const today = new Date();
      const todayIndex = (today.getDay() + 6) % 7;
      const tasks = daysOfWeek.flatMap((day, index) => {
        const daysUntil = (index - todayIndex + 7) % 7;
        const scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntil);
        const date = [scheduledDate.getFullYear(), String(scheduledDate.getMonth() + 1).padStart(2, '0'), String(scheduledDate.getDate()).padStart(2, '0')].join('-');
        return weeklyRoutine[day].map(ex => ({
          exercise: ex.name.toUpperCase(),
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          date,
          gesture_class: getGestureClass(ex)
        }));
      });

      await api.post(`/members/${member.id}/workout-plan`, { tasks });
      onShowAlert('Plan Saved', `${tasks.length} workout task${tasks.length === 1 ? '' : 's'} synchronized for the next seven days. AI-supported movements will be verified by the Gesture Engine; other tasks remain available for manual verification.`, 'success');

      try {
        const res = await api.get(`/members/${member.id}/workouts`);
        setWorkouts(res.data);
      } catch (err) {
        console.error('Plan was saved, but workout logs could not be refreshed', err);
        onShowAlert('Plan Saved, Refresh Needed', 'The weekly plan was saved, but the workout logs could not be refreshed. Reopen this profile to load the latest logs.', 'error');
      }
    } catch (err) {
      onShowAlert('Error', err.response?.data?.message || 'Failed to assign workout plan.', 'error');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleAddExercise = (ex) => {
    if (!weeklyRoutine[activeDay].some(e => e.id === ex.id)) {
      setWeeklyRoutine({ 
        ...weeklyRoutine, 
        [activeDay]: [...weeklyRoutine[activeDay], { ...ex, sets: 3, reps: 10 }] 
      });
    }
  };

  const updateExerciseDetail = (index, field, value) => {
    const updatedRoutine = { ...weeklyRoutine };
    updatedRoutine[activeDay][index][field] = value;
    setWeeklyRoutine(updatedRoutine);
  };

  const handleDatesSet = (dateInfo) => {
    const today = new Date();
    const viewDate = dateInfo.view.currentStart;
    const isSameMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
    setIsCurrentMonth(isSameMonth);
  };

  const groupedWorkouts = Object.values(workouts.reduce((acc, log) => {
    const dateValue = log.date ? new Date(`${log.date}T12:00:00`) : new Date(log.created_at);
    const dateStr = dateValue.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, exercises: [] };
    acc[dateStr].exercises.push(log);
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const workoutsPerPage = 9;
  const totalWorkoutPages = Math.ceil(groupedWorkouts.length / workoutsPerPage);
  const currentGroupedWorkouts = groupedWorkouts.slice((workoutPage - 1) * workoutsPerPage, workoutPage * workoutsPerPage);
  const bodyPartOptions = [...new Set(exercisesLib.map(ex => ex.body_part).filter(Boolean))].sort();
  const matchingExercises = exercisesLib.filter(ex =>
    (selectedBodyPart === 'all' || ex.body_part === selectedBodyPart) &&
    [ex.name, ex.target, ex.body_part, ex.equipment]
      .some(value => value?.toLowerCase().includes(exSearch.trim().toLowerCase()))
  );
  const exercisesPerPage = 50;
  const totalExercisePages = Math.ceil(matchingExercises.length / exercisesPerPage);
  const currentExercises = matchingExercises.slice((exercisePage - 1) * exercisesPerPage, exercisePage * exercisesPerPage);

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let h = parseInt(hourStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minStr} ${ampm}`;
  };

  const attendanceEvents = attendance.map(log => ({
    id: log.id,
    title: `Time In: ${formatTime12h(log.time_in)}`,
    date: log.date,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    extendedProps: { logId: log.id, timeIn: formatTime12h(log.time_in) }
  }));

  const [hoveredAttendanceDay, setHoveredAttendanceDay] = useState(null);
  const attendanceHoverTimeoutRef = React.useRef(null);

  const handleAttendanceMouseMove = (e) => {
    if (selectedAttendanceDate) return;
    const dayCell = e.target.closest('.fc-daygrid-day');
    if (!dayCell) {
      if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
      attendanceHoverTimeoutRef.current = setTimeout(() => setHoveredAttendanceDay(null), 120);
      return;
    }
    const dateStr = dayCell.getAttribute('data-date');
    if (!dateStr) return;
    if (hoveredAttendanceDay?.date === dateStr) return;

    const entries = attendance.filter(log => log.date === dateStr);
    if (!entries.length) {
      if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
      setHoveredAttendanceDay(null);
      return;
    }

    if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
    const rect = dayCell.getBoundingClientRect();
    attendanceHoverTimeoutRef.current = setTimeout(() => {
      setHoveredAttendanceDay({
        date: dateStr,
        events: entries.map(log => ({
          id: log.id,
          title: 'Gym Attendance Confirmed',
          color: '#10b981',
          type: 'attendance',
          time: `Time in: ${formatTime12h(log.time_in)}`,
          detail: `${member.firstName} checked in at ${formatTime12h(log.time_in)}`
        })),
        rect
      });
    }, 80);
  };

  const handleAttendanceMouseLeave = () => {
    if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
    attendanceHoverTimeoutRef.current = setTimeout(() => setHoveredAttendanceDay(null), 150);
  };

  const showAttendanceDay = (date) => {
    if (!date) return;
    setHoveredAttendanceDay(null);
    setSelectedAttendanceDate(date);
    const entries = attendance.filter(log => log.date === date);
    if (!entries.length) {
      setSelectedAttendanceEntries([]);
      return;
    }
    setSelectedAttendanceEntries(entries.map(log => ({
      id: log.id,
      title: 'Gym Attendance Confirmed',
      color: '#10b981',
      type: 'attendance',
      time: `Time in: ${formatTime12h(log.time_in)}`,
      detail: `${member.firstName} checked in at ${formatTime12h(log.time_in)}`
    })));
  };

  if (!isOpen || !member) return null;

  const profileBmi = getBmiInfo(member.height, member.weight);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#252830] rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600 relative">

        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-700 dark:text-gray-300 backdrop-blur-md">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">

          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[32%] bg-gray-50 dark:bg-[#1a1c23] border-r-2 border-gray-300 dark:border-gray-700 p-4 sm:p-6 lg:p-8 flex flex-col items-center flex-shrink-0 lg:overflow-y-auto">
            <div className="flex w-full items-center justify-between gap-4 lg:flex-col lg:justify-center lg:gap-0">
              <div className="flex items-center gap-3 lg:flex-col">
                <div className="relative group mt-0 lg:mt-2 shrink-0">
                  {member.profilePicUrl ? (
                    <img src={member.profilePicUrl} alt="Avatar" className="w-16 h-16 lg:w-36 lg:h-36 rounded-full object-cover border-2 lg:border-4 border-white dark:border-gray-600 shadow-md lg:shadow-lg" />
                  ) : (
                    <div className="w-16 h-16 lg:w-36 lg:h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg lg:text-4xl border-2 lg:border-4 border-white dark:border-gray-600 shadow-md lg:shadow-lg">
                      {getInitials(member.firstName, member.lastName)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left lg:text-center">
                  <h2 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-gray-300 tracking-tight">{member.firstName} {member.lastName}</h2>
                  <p className="mt-0.5 border-b-2 border-gray-300 pb-3 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:border-gray-600 dark:text-amber-500 lg:mt-1 lg:text-xs">{member.plan}</p>
                </div>
              </div>
            </div>

            {/* Member information, visible on mobile and desktop */}
            <div className="block w-full mt-4 lg:mt-6 animate-in fade-in">
              <div className="w-full space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm">
                  <FiMapPin className="text-black dark:text-gray-300 flex-shrink-0" size={16} />
                  <span className="truncate">{member.address || 'No Address Provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm">
                  <FiPhone className="text-black dark:text-gray-300 flex-shrink-0" size={16} />
                  <span>{member.phone}</span>
                </div>
              </div>

              {/* Body Metrics */}
              <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-300 dark:border-gray-700 p-4 shadow-sm mb-6">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Body Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Age</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-gray-300">{calculateAge(member.dob)}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">BMI</p>
                    <p className="text-[17px] font-bold leading-none my-1.5 text-slate-900 dark:text-gray-300 tracking-tighter">{profileBmi.value}</p>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${profileBmi.color}`}>{profileBmi.label}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Height</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-300">{member.height || '-'} cm</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Weight</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-300">{member.weight || '-'} kg</p>
                  </div>
                </div>
              </div>

              {/* Coach Notes */}
              <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-300 dark:border-gray-700 p-4 shadow-sm mb-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Coach Notes</h4>
                <textarea
                  className="w-full bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 dark:text-gray-300 transition-colors min-h-[90px]"
                  placeholder="Add Additional Notes here..."
                  value={coachNotes}
                  onChange={(e) => { setCoachNotes(e.target.value); localStorage.setItem(`notes_${member.id}`, e.target.value); }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-full lg:w-[68%] flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
            {/* Tabs */}
            <div className="flex items-center gap-6 px-8 pt-6 border-b-2 border-gray-300 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
              {[['workouts', 'Workout Logs'], ['attendance', 'Attendance Calendar'], ['plan', "Coach's Training Plan"]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeTab === key ? 'text-amber-600 dark:text-amber-500' : 'text-black hover:text-black/50 dark:text-gray-500 dark:hover:text-white'}`}>
                  {label}
                  {activeTab === key && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full" />}
                </button>
              ))}
            </div>

            {(isProfileDataLoading || profileDataError) && (
              <div className={`mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${profileDataError ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-gray-700 dark:bg-[#252830] dark:text-gray-300'}`}>
                <p role={profileDataError ? 'alert' : 'status'}>
                  {profileDataError || 'Loading member activity...'}
                </p>
                {profileDataError && (
                  <button type="button" onClick={() => setProfileDataRetry(retry => retry + 1)} className="shrink-0 font-bold underline">
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 p-1 flex flex-col min-h-0 overflow-hidden">

              {/* ATTENDANCE CALENDAR */}
              {activeTab === 'attendance' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-0">
                  <div className="border border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#252830] shadow-sm relative flex-1 overflow-hidden flex flex-col min-h-0">
                    <style>{`
                      .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; color: #4b5563; }
                      .dark .fc { --fc-border-color: #4b5563; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
                      
                      .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000; }
                      .dark .fc-toolbar-title { color: #d1d5db !important; }
                      
                      /* TODAY BUTTON MATCHING EXACTLY TO "ADD MEMBER" BUTTON */
                      .fc .fc-button.fc-button-primary.fc-today-button,
                      .dark .fc .fc-button.fc-button-primary.fc-today-button,
                      .fc .fc-button.fc-button-primary.fc-today-button:disabled,
                      .dark .fc .fc-button.fc-button-primary.fc-today-button:disabled {
                        background-color: #0f172a !important;
                        color: #ffffff !important; 
                        border: 1px solid #f59e0b !important;
                        border-radius: 0.5rem !important;
                        min-height: 38px !important;
                        font-weight: 700 !important;
                        font-size: 15px !important;
                        padding: 8px 14px !important;
                        box-shadow: none !important;
                        text-transform: none !important;
                        letter-spacing: 0 !important;
                        opacity: 1 !important;
                        text-shadow: none !important;
                        margin: 0 4px !important;
                      }
                      .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled),
                      .dark .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) {
                        filter: none !important;
                      }
                      .calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { opacity: 1 !important; }
                      .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { background-color: #e5e7eb !important; color: #4b5563 !important; opacity: 0.5 !important; }
                      .dark .calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { background-color: #1e293b !important; color: #9ca3af !important; }
                      .dark .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button { border-color: #f59e0b !important; color: #000 !important; }
                      .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button:disabled { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; }
                      .mobile-calendar-grid.calendar-current-month .fc .fc-button.fc-button-primary.fc-today-button { opacity: 1 !important; }
                      .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button, .mobile-calendar-grid.calendar-other-month .fc .fc-button.fc-button-primary.fc-today-button:hover:not(:disabled) { background-image: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: #f59e0b !important; color: #000 !important; opacity: 0.5 !important; }
                      .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button { font-family: ui-sans-serif, system-ui, sans-serif !important; font-size: 15px !important; font-weight: 700 !important; text-transform: none !important; }
                      @media (min-width: 640px) {
                        .mobile-calendar-grid .fc .fc-button.fc-button-primary.fc-today-button { min-height: 38px !important; padding: 8px 14px !important; margin: 0 4px !important; }
                      }
                      
                      .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000 !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; transition: all 0.2s !important; margin: 0 4px !important; }
                      .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
                      .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #e5e7eb !important; border: 2px solid #D1D5DB !important; border-radius: 0.5rem !important; color: #000 !important; padding: .4em .65em !important; }
                      .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #e5e7eb !important; border-color: #D1D5DB !important; color: #000 !important; }
                      .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button, .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button { background-color: #4b5563 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
                      .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:hover:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-prev-button:active:not(:disabled), .dark .mobile-calendar-grid .fc .fc-button-primary.fc-next-button:active:not(:disabled) { background-color: #4b5563 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
                      .attendance-calendar-nav-button { border: 2px solid #D1D5DB !important; }
                      .attendance-calendar-nav-button:hover, .attendance-calendar-nav-button:active { border-color: #D1D5DB !important; background-color: #e5e7eb !important; color: #000 !important; }
                      .dark .attendance-calendar-nav-button { background-color: #4b5563 !important; border-color: #4b5563 !important; color: #d1d5db !important; }
                      .dark .attendance-calendar-nav-button:hover, .dark .attendance-calendar-nav-button:active { border-color: #4b5563 !important; background-color: #4b5563 !important; color: #d1d5db !important; }
                      .attendance-calendar-nav-demo .attendance-calendar-nav-button,
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
                        border: 2px solid #D1D5DB !important;
                        border-radius: 0.5rem !important;
                        background-color: #f8fafc !important;
                        color: #334155 !important;
                        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12) !important;
                        transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease !important;
                      }
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
                        width: 38px !important;
                        height: 38px !important;
                        padding: 0 !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        line-height: 1 !important;
                      }
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button .fc-icon,
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button .fc-icon {
                        margin: 0 !important;
                        vertical-align: middle !important;
                      }
                      .attendance-calendar-nav-demo .attendance-calendar-nav-button:hover,
                      .attendance-calendar-nav-demo .attendance-calendar-nav-button:active,
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
                      .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
                        border-color: #d97706 !important;
                        background-color: #fef3c7 !important;
                        color: #92400e !important;
                        box-shadow: 0 2px 5px rgba(217, 119, 6, 0.2) !important;
                      }
                      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button,
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button,
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button {
                        border-color: #4b5563 !important;
                        background-color: #303643 !important;
                        color: #e2e8f0 !important;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
                      }
                      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button:hover,
                      .dark .attendance-calendar-nav-demo .attendance-calendar-nav-button:active,
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:hover:not(:disabled),
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:hover:not(:disabled),
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-prev-button:active:not(:disabled),
                      .dark .attendance-calendar-nav-demo .fc .fc-button-primary.fc-next-button:active:not(:disabled) {
                        border-color: #f59e0b !important;
                        background-color: #3c4554 !important;
                        color: #fbbf24 !important;
                        box-shadow: 0 2px 6px rgba(245, 158, 11, 0.18) !important;
                      }
                      
                      .fc-scrollgrid { border: none !important; }
                      .fc-theme-standard th, .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; }
                      .fc-theme-standard td { border-right: 1px solid var(--fc-border-color) !important; }
                      .fc-theme-standard td:last-child { border-right: none !important; }
                      .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; text-decoration: none !important; }
                      .fc-daygrid-day-number { font-weight: 800; font-size: 0.8rem; padding: 8px !important; text-decoration: none !important; color: #475569 !important; }
                      .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }
                      
                      .fc-daygrid-event { 
                          border-radius: 4px !important; padding: 2px !important; margin: 1px !important; 
                          border: none !important; background-color: transparent !important;
                          cursor: pointer; transition: all 0.2s;
                      }
                      .fc-daygrid-event:hover { transform: scale(1.02); z-index: 5; background-color: rgba(0,0,0,0.05) !important; }
                      .dark .fc-daygrid-event:hover { background-color: rgba(255,255,255,0.1) !important; }
                      
                      .fc-event-main { 
                        width: 100%; 
                        white-space: nowrap !important; 
                        overflow: hidden !important;   
                        text-overflow: ellipsis !important;
                      }
                      /* Hide the calendar scrollbar */
                      .fc-scroller { overflow: hidden !important; }
                    `}</style>
                    <div className="mb-3 sm:hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="min-w-0 flex-1 truncate text-left text-sm font-black uppercase tracking-wide text-slate-900 dark:text-gray-300">
                          {attendanceCalendarTitle}
                        </h3>
                        <div className="flex items-center gap-0 shrink-0">
                          <button
                            onClick={() => attendanceCalendarRef.current?.getApi().prev()}
                            aria-label="Previous month"
                            className="attendance-calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-[#e5e7eb] text-black shadow-sm transition-colors active:scale-95"
                          >
                            <FiChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => attendanceCalendarRef.current?.getApi().next()}
                            aria-label="Next month"
                            className="attendance-calendar-nav-button mx-1 flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-[#e5e7eb] text-black shadow-sm transition-colors active:scale-95"
                          >
                            <FiChevronRight size={16} />
                          </button>
                          <button
                            onClick={() => attendanceCalendarRef.current?.getApi().today()}
                            aria-label="Today"
                            className={`mx-1 flex min-h-[38px] shrink-0 items-center justify-center rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 text-[15px] font-sans font-bold normal-case text-black shadow-sm transition-colors active:scale-95 ${isCurrentMonth ? 'opacity-100' : 'opacity-50'}`}
                          >
                            Today
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      onMouseMove={handleAttendanceMouseMove}
                      onMouseLeave={handleAttendanceMouseLeave}
                      className={`mobile-calendar-grid attendance-calendar-nav-demo min-w-0 ${isCurrentMonth ? 'calendar-current-month' : 'calendar-other-month'}`}
                    >
                      <FullCalendar
                        ref={attendanceCalendarRef}
                        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        buttonText={{ today: 'Today' }}
                        events={attendanceEvents}
                        height="auto"
                        datesSet={(dateInfo) => {
                          setAttendanceCalendarTitle(dateInfo.view.title);
                          handleDatesSet(dateInfo);
                        }}
                        dayHeaderContent={(headerInfo) => window.innerWidth < 640 ? headerInfo.text.charAt(0) : headerInfo.text}
                        headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
                        dateClick={info => showAttendanceDay(info.dateStr)}
                        eventClick={info => showAttendanceDay(info.event.startStr.slice(0, 10))}
                        eventContent={(eventInfo) => (
                          <div className="flex min-h-6 w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-emerald-300/80 bg-emerald-50 px-1 py-0.5 text-emerald-800 shadow-xs dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300 sm:justify-start">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            <span className="truncate text-[10px] font-medium">
                              <span className="hidden sm:inline">Time In: </span>
                              {eventInfo.event.extendedProps.timeIn}
                            </span>
                          </div>
                        )}
                      />
                    </div>
                    <MobileCalendarDaySheet
                      date={selectedAttendanceDate}
                      events={selectedAttendanceEntries}
                      onClose={() => setSelectedAttendanceDate(null)}
                      emptyMessage="No attendance logs recorded for this day."
                    />
                    <CalendarHoverPopover
                      data={selectedAttendanceDate ? null : hoveredAttendanceDay}
                      onClose={() => setHoveredAttendanceDay(null)}
                      onClick={(date) => {
                        setHoveredAttendanceDay(null);
                        showAttendanceDay(date);
                      }}
                      onMouseEnter={() => {
                        if (attendanceHoverTimeoutRef.current) clearTimeout(attendanceHoverTimeoutRef.current);
                      }}
                      onMouseLeave={handleAttendanceMouseLeave}
                    />
                  </div>
                </div>
              )}

              {/* WORKOUT LOGS */}
              {activeTab === 'workouts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex min-h-0 flex-col">
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-[#252830]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a1c23] border-b border-gray-300 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Date</th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Exercises Logged</th>
                          <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {currentGroupedWorkouts.length === 0 ? (
                          <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">No workout history logged yet.</td></tr>
                        ) : currentGroupedWorkouts.map((group, idx) => {
                          const isExpanded = expandedDate === group.date;
                          const totalTasks = group.exercises.length;
                          const verifiedTasks = group.exercises.filter(log => getTaskStatus(log) === 'VERIFIED').length;
                          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) === group.date;
                          const hasFaceIdToday = isToday ? attendance.some(att => att.date === new Date().toISOString().split('T')[0]) : true;

                          let groupBadge;
                          if (verifiedTasks === totalTasks) {
                            groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">VERIFIED</span>;
                          } else if (verifiedTasks > 0) {
                            groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">INCOMPLETE</span>;
                          } else {
                            const hasPending = group.exercises.some(log => getTaskStatus(log) === 'PENDING');
                            const hasScheduled = group.exercises.some(log => getTaskStatus(log) === 'SCHEDULED');
                            groupBadge = hasPending
                              ? <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">PENDING</span>
                              : hasScheduled
                                ? <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">SCHEDULED</span>
                                : <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-500/30 dark:bg-red-500/10 dark:text-red-400">MISSED</span>;
                          }

                          return (
                            <React.Fragment key={idx}>
                              <tr onClick={() => setExpandedDate(prev => prev === group.date ? null : group.date)} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer group">
                                <td className="px-6 py-4 whitespace-nowrap text-center"><div className="font-bold text-slate-800 dark:text-gray-400 text-sm">{group.date}</div></td>
                                <td className="px-6 py-4 text-center"><span className="text-sm font-bold text-slate-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{group.exercises.length} Exercises Recorded</span></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-3">
                                    {groupBadge}
                                    {isExpanded ? <FiChevronUp className="text-gray-400" size={18} /> : <FiChevronDown className="text-gray-400 group-hover:text-amber-500 transition-colors" size={18} />}
                                  </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-gray-50/50 dark:bg-[#1a1c23]/50 shadow-inner">
                                  <td colSpan="3" className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      {group.exercises.map(log => {
                                        const taskStatus = getTaskStatus(log);
                                        const exName = log.exercise.replace('ASSIGNED: ', '');
                                        const exercise = exercisesLib.find(item => item.name.toUpperCase() === exName.toUpperCase());
                                        const timeFormatted = taskStatus === 'SCHEDULED'
                                          ? new Date(`${log.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                          : new Date(log.created_at).toLocaleTimeString('en-US', { timeStyle: 'short' });
                                        const badgeClass = taskStatus === 'VERIFIED'
                                          ? 'bg-white border-emerald-200 text-emerald-800 dark:bg-[#252830] dark:border-emerald-500/40 dark:text-emerald-300'
                                          : taskStatus === 'PENDING'
                                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
                                            : taskStatus === 'SCHEDULED'
                                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400'
                                              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400';
                                        return (
                                          <div key={log.id} className={`flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.55rem)] min-w-0 rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${badgeClass}`}>
                                            <div className="relative w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#1a1c23] overflow-hidden flex-shrink-0 flex items-center justify-center">
                                              <FiActivity className="text-slate-400 dark:text-slate-500" size={19} />
                                              {getExerciseMediaUrl(exercise) && <img src={getExerciseMediaUrl(exercise)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={event => {
                                                if (exercise?.image && event.currentTarget.dataset.fallback !== 'true') {
                                                  event.currentTarget.dataset.fallback = 'true';
                                                  event.currentTarget.src = getExerciseMediaUrl(exercise, 'image');
                                                } else event.currentTarget.style.display = 'none';
                                              }} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="font-bold text-xs truncate">{formatExerciseName(exName)}</p>
                                              <p className="text-[10px] opacity-70 mt-0.5">{timeFormatted}</p>
                                              {log.sets && log.reps && <p className="text-[10px] font-bold mt-1">{log.sets} sets x {log.reps} reps</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                              {taskStatus === 'PENDING' && (hasFaceIdToday
                                                ? <button onClick={() => handleManualVerify(log.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded-md text-[9px] font-bold transition-colors active:scale-95 shadow-sm">VERIFY</button>
                                                : <span className="opacity-50" title="Locked: No Face ID Today"><FiLock size={12} /></span>)}
                                              {taskStatus !== 'PENDING' && <span className="text-[8px] font-bold uppercase tracking-wide">{taskStatus}</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={workoutPage}
                    totalPages={totalWorkoutPages}
                    onPageChange={setWorkoutPage}
                    totalItems={groupedWorkouts.length}
                    itemsPerPage={workoutsPerPage}
                    itemsLabel="dates"
                  />
                </div>
              )}

              {/* COACH PLAN */}
              {activeTab === 'plan' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-[580px] lg:min-h-0 relative">
                  {/* Mobile Sub-Navigation Switcher */}
                  <div className="mb-2 grid w-full grid-cols-2 rounded-xl border border-gray-300 bg-gray-100 p-1 shadow-sm sm:hidden dark:border-[#393e4f] dark:bg-[#191b22]">
                    <button
                      onClick={() => setMobileCoachView('library')}
                      aria-pressed={mobileCoachView === 'library'}
                      className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${mobileCoachView === 'library' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-300 dark:hover:bg-[#252833]'}`}
                    >
                      Browse Exercises
                    </button>
                    <button
                      onClick={() => setMobileCoachView('routine')}
                      aria-pressed={mobileCoachView === 'routine'}
                      className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${mobileCoachView === 'routine' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-300 dark:hover:bg-[#252833]'}`}
                    >
                      Weekly Routine ({activeDay.slice(0, 3)})
                    </button>
                  </div>

                  <div className="lg:absolute lg:inset-0 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-[#252830] shadow-sm flex flex-col sm:flex-row flex-1 overflow-y-auto sm:overflow-hidden min-h-[520px] lg:min-h-0">
                    
                    {/* Exercise Library */}
                    <div className={`w-full sm:w-1/2 min-h-[14rem] min-w-0 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1c23]/50 sm:min-h-0 ${mobileCoachView === 'library' ? 'flex flex-1' : 'hidden sm:flex'}`}>
                      <div className="p-3 border-b border-gray-300 dark:border-[#393e4f] flex-shrink-0 bg-white dark:bg-[#252833]">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search name, muscle, or equipment..." 
                            value={exSearch} 
                            onChange={e => { setExSearch(e.target.value); setExercisePage(1); }} 
                            className="w-full pl-3 pr-8 py-2 text-xs bg-gray-50 dark:bg-[#191b22] border border-gray-300 dark:border-[#393e4f] rounded-lg outline-none text-slate-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-[#6d758d] font-medium shadow-sm focus:ring-1 focus:ring-amber-500" 
                          />
                          {exSearch && (
                            <button onClick={() => { setExSearch(''); setExercisePage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#6d758d] dark:hover:text-white">
                              <FiX size={12} />
                            </button>
                          )}
                        </div>
                        <label className="block mt-2">
                          <span className="sr-only">Filter exercises by body part</span>
                          <select 
                            value={selectedBodyPart} 
                            onChange={e => { setSelectedBodyPart(e.target.value); setExercisePage(1); }} 
                            className="w-full p-2 text-xs bg-gray-50 dark:bg-[#191b22] border border-gray-300 dark:border-[#393e4f] rounded-lg outline-none text-slate-800 dark:text-gray-100 font-medium shadow-sm focus:ring-1 focus:ring-amber-500 cursor-pointer"
                          >
                            <option value="all">All body parts</option>
                            {bodyPartOptions.map(bodyPart => <option key={bodyPart} value={bodyPart}>{formatExerciseName(bodyPart)}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto space-y-2">
                        {currentExercises.length === 0 ? (
                          <p className="py-8 text-center text-xs font-medium text-slate-500 dark:text-gray-400">No matching exercises</p>
                        ) : currentExercises.map(ex => {
                          return (
                            <div key={ex.id} className="flex items-center bg-white dark:bg-[#252830] p-2 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#1a1c23] flex items-center justify-center">
                                <FiActivity className="text-slate-400 dark:text-slate-500" size={19} />
                                {getExerciseMediaUrl(ex) && <img src={getExerciseMediaUrl(ex)} alt={ex.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={event => {
                                  if (ex.image && event.currentTarget.dataset.fallback !== 'true') {
                                    event.currentTarget.dataset.fallback = 'true';
                                    event.currentTarget.src = getExerciseMediaUrl(ex, 'image');
                                  } else event.currentTarget.style.display = 'none';
                                }} />}
                              </div>
                              <div className="flex-1 min-w-0 px-3">
                                <span className="font-bold text-xs text-slate-800 dark:text-gray-100 truncate block">{formatExerciseName(ex.name)}</span>
                                <span className="text-[10px] text-slate-500 dark:text-gray-400 capitalize truncate block mt-0.5">{ex.target || ex.body_part} · {ex.equipment}</span>
                              </div>
                              <button onClick={() => handleAddExercise(ex)} aria-label={`Add ${ex.name} to ${activeDay}`} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 font-semibold text-black shadow-sm transition-all hover:brightness-105 active:scale-95">+</button>
                            </div>
                          );
                        })}
                      </div>
                      <Pagination
                        currentPage={exercisePage}
                        totalPages={totalExercisePages}
                        onPageChange={setExercisePage}
                        totalItems={matchingExercises.length}
                        itemsPerPage={exercisesPerPage}
                        itemsLabel="exercises"
                        stacked
                      />
                    </div>

                    {/* Selected Routine */}
                    <div className={`w-full sm:w-1/2 min-h-[14rem] min-w-0 flex flex-col bg-white dark:bg-[#252830] sm:min-h-0 ${mobileCoachView === 'routine' ? 'flex flex-1' : 'hidden sm:flex'}`}>
                      <div className="grid w-full flex-shrink-0 grid-cols-7 border-b border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-[#1a1c23]/50">
                        {daysOfWeek.map(day => (
                          <button key={day} title={day} onClick={() => setActiveDay(day)} className={`w-full min-w-0 px-1 py-3 text-[9px] font-bold uppercase tracking-wide transition-colors border-b-2 sm:px-2 sm:text-[10px] sm:tracking-widest ${activeDay === day ? 'border-[#d9a84a] text-[#d9a84a] bg-white dark:bg-[#252830]' : 'border-transparent text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}`}>
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                      
                      <div className="p-3 flex-1 overflow-y-auto space-y-2 bg-gray-50/30 dark:bg-black/10">
                        {weeklyRoutine[activeDay].length === 0
                          ? <p className="text-xs text-center text-gray-400 mt-6 font-medium">No exercises assigned for {activeDay}</p>
                          : weeklyRoutine[activeDay].map((ex, i) => (
                            <div key={i} className="flex flex-col bg-white dark:bg-[#252830] p-3 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#1a1c23] flex items-center justify-center">
                                    <FiActivity className="text-slate-400 dark:text-slate-500" size={16} />
                                    {getExerciseMediaUrl(ex) && <img src={getExerciseMediaUrl(ex)} alt={ex.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={event => {
                                      if (ex.image && event.currentTarget.dataset.fallback !== 'true') {
                                        event.currentTarget.dataset.fallback = 'true';
                                        event.currentTarget.src = getExerciseMediaUrl(ex, 'image');
                                      } else event.currentTarget.style.display = 'none';
                                    }} />}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs text-slate-800 dark:text-gray-100 truncate block">{formatExerciseName(ex.name)}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-gray-400">{ex.sets} sets x {ex.reps} reps</span>
                                    <span className={`text-[9px] font-semibold block mt-0.5 ${getGestureClass(ex) ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                      {getGestureClass(ex) ? `AI tracks ${getGestureClass(ex)}` : 'Manual verification'}
                                    </span>
                                  </div>
                                </div>
                                <button onClick={() => { const arr = [...weeklyRoutine[activeDay]]; arr.splice(i, 1); setWeeklyRoutine({ ...weeklyRoutine, [activeDay]: arr }); }} aria-label={`Remove ${ex.name}`} className="text-[10px] text-red-600 dark:text-red-400 hover:text-white font-black px-2 py-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 rounded-md transition-colors flex-shrink-0">X</button>
                              </div>
                              
                              {/* --- REPS & SETS INPUTS --- */}
                              <div className="flex items-center gap-4 mt-3 pl-[3.25rem]">
                                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-gray-300">
                                  Sets: 
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={ex.sets || ''} 
                                    onChange={(e) => updateExerciseDetail(i, 'sets', e.target.value)} 
                                    className="w-14 px-2 py-1 rounded-md bg-slate-50 dark:bg-[#1a1c23] border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-gray-100 shadow-sm text-center"
                                  />
                                </label>
                                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-gray-300">
                                  Reps: 
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={ex.reps || ''} 
                                    onChange={(e) => updateExerciseDetail(i, 'reps', e.target.value)} 
                                    className="w-14 px-2 py-1 rounded-md bg-slate-50 dark:bg-[#1a1c23] border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-gray-100 shadow-sm text-center"
                                  />
                                </label>
                              </div>
                            </div>
                          ))
                        }
                      </div>

                      <div className="p-3 border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1c23]/50 flex-shrink-0">
                        <button onClick={handleAssignWeeklyPlan} disabled={isSavingPlan} className="mx-1 flex min-h-[38px] w-[calc(100%-8px)] items-center justify-center rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:cursor-wait disabled:opacity-70">
                          {isSavingPlan ? 'Saving Plan...' : 'Save Weekly Plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}