import { useState, useEffect, useRef } from 'react';
import { FiMaximize, FiWifiOff, FiLoader, FiActivity, FiRefreshCw, FiCamera } from 'react-icons/fi';
import api from '../api';
import { AI_BASE, aiEngineFetch } from '../utils/aiEngine';
import { getCameraSourceLabel } from '../utils/cameraSourceLabel';
import { useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/numberFormat';
import AlertDialog from '../components/ui/AlertDialog';

export default function GestureMonitor() {
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState('CONNECTING'); 
  const [activeStreamUrl, setActiveStreamUrl] = useState(`${AI_BASE}/gesture_feed?t=${new Date().getTime()}`);
  const [cameraSource, setCameraSource] = useState('cctv');
  const [availableCameraSources, setAvailableCameraSources] = useState(['cctv', 'webcam']);
  
  const [cameraFps, setCameraFps] = useState(null);
  const [cameraStatusError, setCameraStatusError] = useState(false);
  const [engineOnline, setEngineOnline] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const containerRef = useRef(null);
  const cameraConnectedRef = useRef(false);
  const reconnectCamera = () => {
    setConnectionState('CONNECTING');
    setActiveStreamUrl(`${AI_BASE}/gesture_feed?t=${Date.now()}`);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/workouts/live');
        setRecentLogs(res.data);
      } catch {
        console.error("Failed to fetch live gesture logs");
      }
    };
    
    fetchLogs(); 
    const logInterval = setInterval(fetchLogs, 3000); 
    return () => clearInterval(logInterval);
  }, []);

  const handleSyncAI = async () => {
    try {
      const res = await aiEngineFetch('/refresh_ai', { method: 'POST' });
      if (res.ok) {
        setAlertDialog({ isOpen: true, title: 'Sync Complete', message: 'AI Memory successfully synced with the Database!', type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Sync Failed', message: 'AI Sync failed to respond correctly.', type: 'error' });
      }
    } catch {
      setAlertDialog({ isOpen: true, title: 'Engine Offline', message: 'Could not connect to the Python AI Engine.', type: 'error' });
    }
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
      setActiveStreamUrl(`${AI_BASE}/gesture_feed?t=${new Date().getTime()}`);
      setAlertDialog({ isOpen: true, title: 'Camera Switched', message: `Switched video source to: ${data.mode.toUpperCase()}`, type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Switch Failed', message: error.message || 'Could not reach Python engine to switch camera.', type: 'error' });
    }
  };

  useEffect(() => {
    const fetchCameraStatus = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(`${AI_BASE}/camera_status`, { signal: controller.signal });
        if (!response.ok) throw new Error('Camera status request failed.');
        const d = await response.json();
        if (d.source) setCameraSource(d.source);
        if (Array.isArray(d.available_sources)) setAvailableCameraSources(d.available_sources);
        setCameraFps(Number.isFinite(d.fps) ? d.fps : null);
        cameraConnectedRef.current = Boolean(d.connected);
        setEngineOnline(true);
        setConnectionState(d.connected ? 'LIVE' : 'DISCONNECTED');
        setCameraStatusError(false);
      } catch {
        cameraConnectedRef.current = false;
        setEngineOnline(false);
        setCameraFps(null);
        setCameraStatusError(true);
        setConnectionState('DISCONNECTED');
      } finally {
        clearTimeout(timeout);
      }
    };

    fetchCameraStatus();
    const statusInterval = setInterval(fetchCameraStatus, 3000);
    return () => clearInterval(statusInterval);
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
              {connectionState === 'CONNECTING' ? (
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
              alt="Live AI Gesture Feed"
              onLoad={() => setConnectionState(cameraConnectedRef.current ? 'LIVE' : 'DISCONNECTED')}
              onError={() => {
                setConnectionState('DISCONNECTED');
                setTimeout(() => {
                  setConnectionState('CONNECTING');
                  setActiveStreamUrl(`${AI_BASE}/gesture_feed?t=${new Date().getTime()}`);
                }, 5000);
              }}
              className={`w-full h-full absolute inset-0 z-0 object-cover transition-opacity duration-500 ${connectionState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {connectionState === 'CONNECTING' ? (
              <div className="z-10 flex flex-col items-center justify-center gap-4 text-muted">
                <FiLoader size={48} className="text-brand-gold animate-spin" />
                <p className="font-bold uppercase tracking-widest text-xs">Connecting to camera...</p>
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
                <button type="button" onClick={reconnectCamera} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20">
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
              <button onClick={handleSyncAI} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95" title="Force AI Memory Sync">
                <FiRefreshCw className="size-4 md:size-5" />
              </button>
              <button onClick={toggleFullScreen} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95"><FiMaximize className="size-4 md:size-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex min-h-[380px] w-full flex-shrink-0 flex-col lg:h-full lg:w-1/4">
          <section className="rise flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel" style={{ '--i': 1 }}>
            <header className="flex flex-shrink-0 items-center justify-between border-b border-line bg-field px-4 py-3">
              <h3 className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold leading-tight text-ink">
                <FiActivity className="shrink-0 text-muted" size={16} />
                <span className="min-w-0">Workout Queue & Gesture Logs</span>
              </h3>
            </header>

            <div className="hidden-scrollbar flex-1 divide-y divide-line overflow-y-auto px-4">
              {recentLogs.length === 0 ? (
                <div className="mt-8 flex flex-col items-center gap-3 px-2 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-muted"><FiActivity size={20} /></span>
                  <p className="text-sm font-medium text-muted">No scheduled workouts or AI detections yet.</p>
                </div>
              ) : (
                recentLogs.map((log, index) => (
                  <div key={log.id} className="animate-in fade-in slide-in-from-right-4 flex items-start gap-3 py-3" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
                    <div className="mt-0.5 w-[68px] flex-shrink-0 font-display text-sm font-semibold tabular-nums text-muted">{log.time}</div>
                    <div className="min-w-0">
                      <button type="button" onClick={() => log.member_id && navigate('/members', { state: { memberId: log.member_id } })} className={`block max-w-full truncate text-left text-sm font-semibold leading-tight text-ink${log.member_id ? ' link-draw' : ''}`}>{log.name}</button>
                      <p className={`mt-1 text-xs font-medium ${log.event.includes('Pending') ? 'text-warn' : 'text-positive'}`}>
                        {log.event}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="flex-shrink-0 border-t border-line bg-field p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Camera FPS <span className={`font-semibold tabular-nums ${connectionState === 'LIVE' ? 'text-ink-2' : 'text-muted'}`}>{connectionState === 'LIVE' && cameraFps !== null ? formatNumber(cameraFps, { maximumFractionDigits: 1 }) : '--'}</span></span>
                <span className={`flex items-center gap-2 font-semibold ${engineOnline ? 'text-positive' : engineOnline === null ? 'text-muted' : 'text-negative'}`}>
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${engineOnline ? 'bg-positive' : engineOnline === null ? 'bg-line-strong' : 'bg-negative'}`} />
                  API {engineOnline === null ? 'checking' : engineOnline ? 'online' : 'offline'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-muted">
                <span>Source <span className="font-semibold text-ink-2">{getCameraSourceLabel(cameraSource)}</span></span>
                <span>
                  {cameraStatusError
                    ? 'Camera status unavailable'
                    : cameraConnectedRef.current
                      ? 'Camera connected'
                      : 'Camera connecting / unavailable'}
                </span>
              </div>
            </footer>
          </section>
        </div>

      </div>

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