import React, { useState } from 'react';
import {
  FiX, FiMapPin, FiPhone, FiCamera, FiCheckCircle,
  FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiLock
} from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import api from '../../../api';

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
  const logDay = new Date(new Date(log.created_at).toDateString());
  const today = new Date(new Date().toDateString());
  if (logDay < today) return 'MISSED';
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

export default function MemberProfileModal({ isOpen, member, onClose, onShowAlert }) {
  const [activeTab, setActiveTab] = useState('workouts');
  const [attendance, setAttendance] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [coachNotes, setCoachNotes] = useState('');
  const [workoutPage, setWorkoutPage] = useState(1);
  const [expandedDate, setExpandedDate] = useState(null);
  const [weeklyRoutine, setWeeklyRoutine] = useState(defaultRoutine);
  const [activeDay, setActiveDay] = useState('Monday');
  const [exercisesLib, setExercisesLib] = useState([]);
  const [exSearch, setExSearch] = useState('');

  // Load data when modal opens
  React.useEffect(() => {
    if (!isOpen || !member) return;
    setActiveTab('workouts');
    setWorkoutPage(1);
    setExpandedDate(null);
    setCoachNotes(localStorage.getItem(`notes_${member.id}`) || '');
    const saved = localStorage.getItem(`routine_${member.id}`);
    setWeeklyRoutine(saved ? JSON.parse(saved) : defaultRoutine);
    setActiveDay('Monday');

    (async () => {
      try {
        const [attRes, workRes] = await Promise.all([
          api.get(`/members/${member.id}/attendance`),
          api.get(`/members/${member.id}/workouts`)
        ]);
        setAttendance(attRes.data);
        setWorkouts(workRes.data);
      } catch (err) { console.error('Failed to load profile logs', err); }
    })();

    fetch('/dataset/data/exercises.json')
      .then(r => r.json())
      .then(d => setExercisesLib(d.data || d))
      .catch(() => {});
  }, [isOpen, member]);

  const handleManualVerify = async (logId) => {
    try {
      await api.put(`/workouts/${logId}/manual-verify`);
      const res = await api.get(`/members/${member.id}/workouts`);
      setWorkouts(res.data);
    } catch { console.error('Verification failed'); }
  };

  const handleAssignWeeklyPlan = async () => {
    localStorage.setItem(`routine_${member.id}`, JSON.stringify(weeklyRoutine));
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayExercises = weeklyRoutine[dayName] || [];
    try {
      for (const ex of todayExercises) {
        await api.post(`/members/${member.id}/assign-task`, { exercise: ex.name.toUpperCase() }).catch(() => {});
      }
      onShowAlert('Plan Saved', `✅ Weekly routine saved! Today's tasks (${dayName}) have been dispatched to the AI for monitoring.`, 'success');
      const res = await api.get(`/members/${member.id}/workouts`);
      setWorkouts(res.data);
    } catch { onShowAlert('Error', 'Failed to assign workout plan.', 'error'); }
  };

  const handleAddExercise = (ex) => {
    if (!weeklyRoutine[activeDay].some(e => e.id === ex.id)) {
      setWeeklyRoutine({ ...weeklyRoutine, [activeDay]: [...weeklyRoutine[activeDay], ex] });
    }
  };

  const groupedWorkouts = Object.values(workouts.reduce((acc, log) => {
    const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, exercises: [] };
    acc[dateStr].exercises.push(log);
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const workoutsPerPage = 5;
  const totalWorkoutPages = Math.ceil(groupedWorkouts.length / workoutsPerPage);
  const currentGroupedWorkouts = groupedWorkouts.slice((workoutPage - 1) * workoutsPerPage, workoutPage * workoutsPerPage);

  const attendanceEvents = attendance.map(log => ({
    id: log.id,
    title: `Checked In: ${log.time_in}`,
    date: log.date,
    color: '#10b981'
  }));

  if (!isOpen || !member) return null;

  const profileBmi = getBmiInfo(member.height, member.weight);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#252830] rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600 relative">

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-700 dark:text-gray-300 backdrop-blur-md">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">

          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[32%] bg-gray-50 dark:bg-[#1a1c23] border-r-2 border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center flex-shrink-0 overflow-y-auto">
            <div className="relative mb-4 group mt-2">
              {member.profilePicUrl ? (
                <img src={member.profilePicUrl} alt="Avatar" className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg" />
              ) : (
                <div className="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-4xl border-4 border-white dark:border-gray-600 shadow-lg">
                  {getInitials(member.firstName, member.lastName)}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-gray-300 text-center tracking-tight">{member.firstName} {member.lastName}</h2>
            <p className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest text-xs mt-1 mb-6">{member.plan}</p>

            <div className="w-full space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <FiMapPin className="text-amber-500 flex-shrink-0" size={16} />
                <span className="truncate">{member.address || 'No Address Provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <FiPhone className="text-amber-500 flex-shrink-0" size={16} />
                <span>{member.phone}</span>
              </div>
            </div>

            {/* Body Metrics */}
            <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Body Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Age</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-gray-300">{calculateAge(member.dob)}</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">BMI</p>
                  <p className="text-4xl font-black leading-none my-1.5 text-slate-900 dark:text-gray-300 tracking-tighter">{profileBmi.value}</p>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${profileBmi.color}`}>{profileBmi.label}</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Height</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{member.height || '-'} cm</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Weight</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{member.weight || '-'} kg</p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Account Status</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${member.enrolledFaceId ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <FiCamera size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Face ID</p>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{member.enrolledFaceId ? 'Active & Synced' : 'Not Enrolled'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${member.status === 'Active' ? 'bg-green-500' : member.status === 'Inactive' ? 'bg-slate-500' : 'bg-red-500'}`}>
                    <FiCheckCircle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Membership</p>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{member.status === 'Active' ? 'Valid Access' : member.status === 'Inactive' ? 'Inactive Account' : 'Expired/Suspended'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Notes */}
            <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mt-6 mb-4">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Coach Notes</h4>
              <textarea
                className="w-full bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 dark:text-gray-300 transition-colors min-h-[100px]"
                placeholder="Add Additional Notes here..."
                value={coachNotes}
                onChange={(e) => { setCoachNotes(e.target.value); localStorage.setItem(`notes_${member.id}`, e.target.value); }}
              />
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-full lg:w-[68%] flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
            {/* Tabs */}
            <div className="flex items-center gap-6 px-8 pt-6 border-b-2 border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
              {[['workouts', 'Workout Logs'], ['attendance', 'Attendance Calendar'], ['plan', "Coach's Training Plan"]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeTab === key ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                  {label}
                  {activeTab === key && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full" />}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-8 flex flex-col min-h-0 overflow-hidden">

              {/* ATTENDANCE CALENDAR */}
              {activeTab === 'attendance' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-0">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#252830] shadow-sm relative flex-1 overflow-hidden flex flex-col min-h-0">
                    <style>{`
                      .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; color: #4b5563; }
                      .dark .fc { --fc-border-color: #4b5563; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
                      .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000 !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; transition: all 0.2s !important; margin: 0 4px !important; }
                      .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
                      .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background: linear-gradient(to right, #fbbf24, #f59e0b) !important; border-color: transparent !important; color: #000 !important; }
                      .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000; }
                      .dark .fc-toolbar-title { color: #d1d5db !important; }
                      .fc-scrollgrid { border: none !important; }
                      .fc-theme-standard th, .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; }
                      .fc-theme-standard td { border-right: 1px solid var(--fc-border-color) !important; }
                      .fc-theme-standard td:last-child { border-right: none !important; }
                      .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; text-decoration: none !important; }
                      .fc-daygrid-day-number { font-weight: 600; font-size: 0.8rem; padding: 8px !important; text-decoration: none !important; color: #475569 !important; }
                      .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }
                      .fc-daygrid-event { border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.2) !important; }
                      .fc-event-main { color: #fff !important; font-weight: 800 !important; font-size: 0.65rem !important; }
                      .fc-scroller { overflow: hidden !important; }
                    `}</style>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        events={attendanceEvents}
                        height="100%"
                        contentHeight="100%"
                        expandRows={true}
                        headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WORKOUT LOGS */}
              {activeTab === 'workouts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col gap-4 min-h-0">
                  {totalWorkoutPages > 1 && (
                    <div className="flex justify-end flex-shrink-0">
                      <div className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                        <button onClick={() => setWorkoutPage(p => Math.max(1, p - 1))} disabled={workoutPage === 1} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronLeft size={16} /></button>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300">Page {workoutPage} of {totalWorkoutPages}</span>
                        <button onClick={() => setWorkoutPage(p => Math.min(totalWorkoutPages, p + 1))} disabled={workoutPage === totalWorkoutPages} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronRight size={16} /></button>
                      </div>
                    </div>
                  )}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto shadow-sm flex-1 bg-white dark:bg-[#252830]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a1c23] border-b border-gray-200 dark:border-gray-700">
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
                            groupBadge = hasPending
                              ? <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">PENDING</span>
                              : <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-500/30 dark:bg-red-500/10 dark:text-red-400">MISSED</span>;
                          }

                          return (
                            <React.Fragment key={idx}>
                              <tr onClick={() => setExpandedDate(prev => prev === group.date ? null : group.date)} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer group">
                                <td className="px-6 py-4 whitespace-nowrap text-center"><div className="font-bold text-slate-800 dark:text-gray-200 text-sm">{group.date}</div></td>
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
                                        const timeFormatted = new Date(log.created_at).toLocaleTimeString('en-US', { timeStyle: 'short' });
                                        const badgeClass = taskStatus === 'VERIFIED'
                                          ? 'bg-white border-green-200 text-green-700 dark:bg-[#252830] dark:border-green-500/50 dark:text-green-400'
                                          : taskStatus === 'PENDING'
                                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
                                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400';
                                        return (
                                          <div key={log.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                                            <span>{exName}</span>
                                            <span className="opacity-60 font-medium ml-0.5 border-l pl-1.5 border-current">({timeFormatted})</span>
                                            {taskStatus === 'PENDING' && (
                                              hasFaceIdToday
                                                ? <button onClick={() => handleManualVerify(log.id)} className="ml-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] transition-colors active:scale-95 shadow-sm">VERIFY</button>
                                                : <span className="ml-1 opacity-50 cursor-not-allowed" title="Locked: No Face ID Today"><FiLock size={12} /></span>
                                            )}
                                            {taskStatus === 'MISSED' && <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 rounded text-[9px]">MISSED</span>}
                                            {taskStatus === 'VERIFIED' && <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 rounded text-[9px]">VERIFIED</span>}
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
                </div>
              )}

              {/* COACH PLAN */}
              {activeTab === 'plan' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full relative min-h-0">
                  <div className="absolute inset-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#252830] shadow-sm flex flex-col sm:flex-row overflow-hidden">
                    {/* Exercise Library */}
                    <div className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1c23]/50 h-full">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <input type="text" placeholder="Search Exercise Library..." value={exSearch} onChange={e => setExSearch(e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-[#252830] border border-gray-200 dark:border-gray-700 rounded outline-none text-slate-800 dark:text-gray-300 font-medium shadow-sm" />
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto space-y-2">
                        {exercisesLib.filter(ex => ex.name.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 50).map(ex => {
                          const exId = String(ex.id).padStart(4, '0');
                          return (
                            <div key={ex.id} className="flex items-center bg-white dark:bg-[#1a1c23] p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group">
                              <img src={`/dataset/videos/${exId}.gif`} alt={ex.name} className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-black" loading="lazy" onError={e => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23f1f5f9" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%2394a3b8" font-weight="bold">NO PREVIEW</text></svg>'; }} />
                              <div className="flex-1 min-w-0 px-3">
                                <span className="font-bold text-[11px] text-slate-800 dark:text-gray-200 truncate block">{ex.name.toUpperCase()}</span>
                              </div>
                              <button onClick={() => handleAddExercise(ex)} className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg font-black transition-colors flex-shrink-0">+</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Routine */}
                    <div className="w-full sm:w-1/2 flex flex-col bg-white dark:bg-[#252830] h-full">
                      <div className="flex w-full overflow-x-auto border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-[#1a1c23]/50">
                        {daysOfWeek.map(day => (
                          <button key={day} onClick={() => setActiveDay(day)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeDay === day ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-white dark:bg-[#252830]' : 'border-transparent text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}`}>
                            {day.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto space-y-2 bg-gray-50/30 dark:bg-black/10">
                        {weeklyRoutine[activeDay].length === 0
                          ? <p className="text-xs text-center text-gray-400 mt-6 font-medium">No exercises assigned for {activeDay}</p>
                          : weeklyRoutine[activeDay].map((ex, i) => (
                            <div key={i} className="flex justify-between items-center bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-100 dark:border-amber-500/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex items-center gap-3 min-w-0">
                                <img src={`/dataset/videos/${String(ex.id).padStart(4, '0')}.gif`} className="w-8 h-8 rounded border border-amber-200 dark:border-amber-500/30 object-cover flex-shrink-0" onError={e => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23fcd34d" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%2378350f" font-weight="bold">NA</text></svg>'; }} alt={ex.name} />
                                <span className="font-bold text-xs text-amber-900 dark:text-amber-400 truncate block">{ex.name.toUpperCase()}</span>
                              </div>
                              <button onClick={() => { const arr = [...weeklyRoutine[activeDay]]; arr.splice(i, 1); setWeeklyRoutine({ ...weeklyRoutine, [activeDay]: arr }); }} className="text-[10px] text-red-500 hover:text-red-700 font-black px-2 py-1 bg-red-100/50 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/30 rounded transition-colors flex-shrink-0">X</button>
                            </div>
                          ))
                        }
                      </div>
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1c23]/50 flex-shrink-0">
                        <button onClick={handleAssignWeeklyPlan} className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md active:scale-95 transition-all">
                          Save Weekly Plan
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
