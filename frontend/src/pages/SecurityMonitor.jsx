import { useState, useEffect, useRef } from 'react';
import { FiMaximize, FiCamera, FiWifiOff, FiLoader, FiUserCheck, FiArrowRight, FiRefreshCw, FiUserPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AI_BASE, aiEngineFetch } from '../utils/aiEngine';
import { getCameraSourceLabel } from '../utils/cameraSourceLabel';
import { getMediaUrl } from '../utils/mediaUrl';
import { formatNumber } from '../utils/numberFormat';
import ManualCheckInModal from '../components/ui/ManualCheckInModal';
import AlertDialog from '../components/ui/AlertDialog';
import Badge from '../components/ui/Badge';

function AttendanceAvatar({ member }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = `${member?.first_name || ''} ${member?.last_name || ''}`.trim();
  // The face enrollment photo is private biometric data; only the profile picture is shown.
  const profilePic = member?.profile_pic ? getMediaUrl(member.profile_pic) : null;

  if (profilePic && !imageFailed) {
    return (
      <img
        src={profilePic}
        alt={`${name || 'Member'} profile`}
        onError={() => setImageFailed(true)}
        className="h-9 w-9 flex-shrink-0 rounded-full border border-line object-cover md:h-10 md:w-10"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-hover font-display text-sm font-semibold text-ink-2 md:h-10 md:w-10">
      {name.charAt(0) || '?'}
    </div>
  );
}

function AttendanceBadges({ log }) {
  const badges = [];
  if (log.reactivated) {
    badges.push(['Returned', 'info', 'Was Inactive; set back to Active by this check-in']);
  }
  if (log.subscription_status === 'expired') {
    badges.push(['Expired', 'warning', 'Subscription expired: ask the member to renew']);
  } else if (log.subscription_status === 'none') {
    badges.push(['No Sub', 'default', 'No subscription on record']);
  } else if (log.subscription_status === 'active') {
    badges.push(['Active', 'success', 'Subscription active']);
  }
  if (log.source === 'manual') {
    badges.push(['Manual', 'default', 'Checked in by staff']);
  }
  if (badges.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {badges.map(([label, variant, title]) => (
        <span key={label} title={title}><Badge size="sm" variant={variant}>{label}</Badge></span>
      ))}
    </div>
  );
}

function formatTimeIn(timeIn) {
  const [hours, minutes] = String(timeIn || '').split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeIn || '';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
}

export default function SecurityMonitor() {
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState('RECONNECTING'); 
  const [activeStreamUrl, setActiveStreamUrl] = useState("");
  const [cameraSource, setCameraSource] = useState('cctv');
  const [availableCameraSources, setAvailableCameraSources] = useState(['cctv', 'webcam']);
  const [cameraFps, setCameraFps] = useState(null);
  const [cameraStatusError, setCameraStatusError] = useState(false);
  const [engineOnline, setEngineOnline] = useState(null);
  const cameraConnectedRef = useRef(false);
  
  const [liveLogs, setLiveLogs] = useState([]); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false);

  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleSyncAI = async () => {
    setIsSyncing(true);
    try {
      const res = await aiEngineFetch('/refresh_ai', { method: 'POST' });
      if (res.ok) {
        setAlertDialog({ isOpen: true, title: 'Sync Complete', message: 'AI Memory successfully synced with the Database!', type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Sync Failed', message: 'AI Sync failed to respond correctly.', type: 'error' });
      }
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Engine Offline', message: 'Could not connect to the Python AI Engine.', type: 'error' });
    }
    setIsSyncing(false);
  };

  const handleCameraChange = async (event) => {
    const nextSource = event.target.value;
    try {
      const res = await aiEngineFetch('/switch_camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: nextSource })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Camera source could not be switched.');
      }

      setCameraSource(data.mode);
      setActiveStreamUrl(`${AI_BASE}/security_feed?t=${new Date().getTime()}`);
      setAlertDialog({ isOpen: true, title: 'Camera Switched', message: `Switched video source to: ${data.mode.toUpperCase()}`, type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Switch Failed', message: error.message || 'Could not reach Python engine to switch camera.', type: 'error' });
    }
  };
  
  const containerRef = useRef(null);
  useEffect(() => {
    setActiveStreamUrl(`${AI_BASE}/security_feed?t=${Date.now()}`);
    setConnectionState('RECONNECTING');

    const fetchCameraStatus = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`${AI_BASE}/camera_status`, { signal: controller.signal });
        if (!response.ok) throw new Error('Camera status request failed.');
        const data = await response.json();
        if (data.source) setCameraSource(data.source);
        if (Array.isArray(data.available_sources)) setAvailableCameraSources(data.available_sources);
        setCameraFps(Number.isFinite(data.fps) ? data.fps : null);
        cameraConnectedRef.current = Boolean(data.connected);
        setEngineOnline(true);
        setConnectionState(data.connected ? 'LIVE' : 'DISCONNECTED');
        setCameraStatusError(false);
      } catch (error) {
        cameraConnectedRef.current = false;
        setEngineOnline(false);
        setCameraFps(null);
        console.error('Failed to read camera status:', error);
        setCameraStatusError(true);
        setConnectionState('DISCONNECTED');
      } finally {
        clearTimeout(timeout);
      }
    };
    fetchCameraStatus();
    const statusInterval = setInterval(fetchCameraStatus, 3000);

    const logInterval = setInterval(async () => {
      try {
        const res = await api.get('/attendance/today');
        setLiveLogs(res.data); 
      } catch (error) { console.error("Failed to refresh today's attendance logs:", error); }
    }, 3000);

    return () => { clearInterval(logInterval); clearInterval(statusInterval); };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        setAlertDialog({ isOpen: true, title: 'Fullscreen Error', message: err.message, type: 'error' });
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto min-h-full h-auto lg:h-full flex flex-col">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 min-h-0">
        
        <div ref={containerRef} className="w-full lg:w-3/4 bg-black rounded-2xl overflow-hidden relative border border-line shadow-xl flex flex-col group aspect-video lg:aspect-auto lg:h-full flex-shrink-0">
          
          <div className="absolute top-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-b from-black/40 to-transparent flex justify-end items-start z-10 pointer-events-none">
            <div className="flex items-center gap-2 md:gap-4 bg-black/50 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/10">
              {connectionState === 'RECONNECTING' ? (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <FiLoader className="animate-spin text-brand-gold size-3 md:size-4" />
                  <span className="text-brand-gold font-bold tracking-widest text-[10px] md:text-xs uppercase hidden sm:block">RECONNECTING...</span>
                </div>
              ) : connectionState === 'LIVE' ? (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-brand-red-300"></span>
                  </span>
                  <span className="text-brand-red-300 font-bold tracking-widest text-[10px] md:text-xs uppercase">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-slate-500"></div>
                  <span className="text-muted font-bold tracking-widest text-[10px] md:text-xs uppercase">DISCONNECTED</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative bg-[#0a0a0c] overflow-hidden w-full h-full">
              <img 
                src={activeStreamUrl} 
                alt="Live CCTV" 
                onLoad={() => setConnectionState(cameraConnectedRef.current ? 'LIVE' : 'DISCONNECTED')}
                onError={() => {
                  setConnectionState('DISCONNECTED');
                  setTimeout(() => {
                    if (navigator.onLine) {
                      setConnectionState('RECONNECTING');
                      setActiveStreamUrl(`${AI_BASE}/security_feed?t=${Date.now()}`);
                    } else {
                      setConnectionState('DISCONNECTED');
                    }
                  }, 5000);
                }}
                className={`w-full h-full absolute inset-0 z-0 object-cover transition-opacity duration-500 ${connectionState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`} 
              />

              {connectionState === 'RECONNECTING' ? (
               <div className="z-10 flex flex-col items-center justify-center text-muted">
                 <FiLoader size={40} md:size={56} className="mb-2 md:mb-4 text-brand-gold animate-spin" />
                  <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-slate-300">Connecting to camera...</p>
               </div>
              ) : connectionState === 'DISCONNECTED' ? (
                  <div className="z-10 text-center text-muted bg-black/40 p-4 md:p-8 rounded-2xl border border-white/5">
                    <FiWifiOff size={40} md:size={56} className="mx-auto text-ink-2 mb-2 md:mb-4 opacity-90" />
                     <p className="text-sm md:text-lg font-bold text-slate-200">
                       {engineOnline === false ? 'Python Engine Offline' : 'Camera Not Connected'}
                     </p>
                     <p className="text-xs font-medium mt-1">
                       {engineOnline === false
                         ? 'Start gesture_engine.py and wait for it to finish loading.'
                         : 'Check the camera stream URL, credentials, and network.'}
                     </p>
                     <button
                       type="button"
                       onClick={() => {
                         setConnectionState('RECONNECTING');
                         setActiveStreamUrl(`${AI_BASE}/security_feed?t=${Date.now()}`);
                       }}
                       className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                     >
                       <FiRefreshCw size={14} /> Retry now
                     </button>
                  </div>
              ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-end items-end z-10">
            <div className="flex gap-2 md:gap-3 items-center">
              <label className="px-2.5 py-2 md:px-3.5 md:py-2.5 bg-white/10 text-white rounded-lg md:rounded-xl backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm" title="Select video source">
                <FiCamera className="size-4 md:size-5 text-brand-gold" />
                <select value={cameraSource} onChange={handleCameraChange} className="camera-source-select bg-transparent text-white font-bold uppercase focus:outline-none">
                  {availableCameraSources.map(source => (
                    <option key={source} value={source} className="bg-slate-900 text-white">{getCameraSourceLabel(source)}</option>
                  ))}
                </select>
              </label>
              <button onClick={() => setIsManualCheckInOpen(true)} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95" title="Manual check-in (when the camera cannot recognize a member)" aria-label="Manual check-in">
                <FiUserPlus className="size-4 md:size-5" />
              </button>
              <button onClick={handleSyncAI} disabled={isSyncing} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95" title="Force AI Memory Sync">
                <FiRefreshCw className={`size-4 md:size-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={toggleFullScreen} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95"><FiMaximize className="size-4 md:size-5" /></button>
            </div>

          </div>
        </div>

        <div className="flex min-h-[380px] w-full flex-shrink-0 flex-col lg:h-full lg:w-1/4">
          <section className="rise flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel" style={{ '--i': 1 }}>

            <header className="flex flex-shrink-0 items-center justify-between border-b border-line bg-field px-4 py-3">
              <h3 className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                <FiUserCheck className="text-muted" size={16} />
                Current Attendance
              </h3>
              <span className="rounded-full bg-hover px-2.5 py-0.5 font-display text-sm font-semibold tabular-nums text-ink-2" title="Check-ins today">
                {liveLogs.length}
              </span>
            </header>

            <div className="hidden-scrollbar flex-1 space-y-0.5 overflow-y-auto p-2.5">
               {liveLogs.length === 0 ? (
                   <div className="mt-8 flex flex-col items-center gap-3 px-4 text-center">
                     <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-muted"><FiCamera size={20} /></span>
                     <p className="text-sm font-semibold text-ink">
                       {engineOnline === false ? 'Engine offline' : 'No check-ins yet today'}
                     </p>
                     <p className="text-xs text-muted">
                       {engineOnline === false
                         ? 'Start the Python engine to record attendance.'
                         : 'Members appear here when the camera recognizes them.'}
                     </p>
                   </div>
               ) : (
                   liveLogs.map((log, index) => {
                    const memberName = log.member
                      ? `${log.member.first_name} ${log.member.last_name}`
                      : (log.member_name_snapshot || 'Deleted member');
                     return (
                     <div key={log.id} className="animate-in fade-in slide-in-from-right-4 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-hover" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                        <AttendanceAvatar member={log.member} />
                        <div className="min-w-0 flex-1">
                         <button type="button" onClick={() => log.member?.id && navigate('/members', { state: { memberId: log.member.id } })} className={`block max-w-full truncate text-left text-sm font-semibold leading-tight text-ink${log.member?.id ? ' link-draw' : ''}`}>{memberName}</button>
                         <p className="mt-0.5 truncate text-xs text-muted tabular-nums">
                           {formatTimeIn(log.time_in)}
                         </p>
                         <AttendanceBadges log={log} />
                       </div>
                    </div>
                   )})
               )}
            </div>

            <footer className="flex-shrink-0 border-t border-line bg-field p-3">
              <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-muted">
                <span>Source <span className="font-semibold text-ink-2">{getCameraSourceLabel(cameraSource)}</span></span>
                <span>FPS <span className="font-semibold tabular-nums text-ink-2">{cameraFps === null ? '--' : formatNumber(cameraFps, { maximumFractionDigits: 1 })}</span></span>
                <span className={`col-span-2 flex items-center gap-2 font-semibold ${engineOnline ? 'text-positive' : 'text-negative'}`}>
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${engineOnline ? 'bg-positive' : 'bg-negative'}`} />
                  {engineOnline === false
                    ? 'Python engine offline'
                    : cameraStatusError
                      ? 'Camera status unavailable'
                      : cameraConnectedRef.current
                        ? 'Camera connected'
                        : 'Camera connecting / unavailable'}
                </span>
              </div>
              <button onClick={() => navigate('/reports', { state: { defaultTab: 'Attendance' } })} className="group press flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-ink-2 hover:bg-hover hover:text-ink">
                Full Log <FiArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </footer>

          </section>
        </div>

      </div>

      <ManualCheckInModal
        isOpen={isManualCheckInOpen}
        onClose={() => setIsManualCheckInOpen(false)}
        onDone={(title, message, type) => {
          setAlertDialog({ isOpen: true, title, message, type });
          api.get('/attendance/today').then(res => setLiveLogs(res.data)).catch(() => {});
        }}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />

    </div>
  );
}