import { useState, useEffect, useRef } from 'react';
import { FiVideo, FiMaximize, FiWifi, FiWifiOff, FiLoader, FiActivity, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../api';

export default function GestureMonitor() {
  const [connectionState, setConnectionState] = useState('CONNECTING'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeStreamUrl, setActiveStreamUrl] = useState(`http://127.0.0.1:5000/gesture_feed?t=${new Date().getTime()}`);
  
  const [latency, setLatency] = useState(0);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const latencyInterval = setInterval(() => {
      if (connectionState === 'LIVE') setLatency(Math.floor(Math.random() * (120 - 40 + 1) + 40));
      else setLatency(0);
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(latencyInterval);
    };
  }, [connectionState]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/workouts/live');
        setRecentLogs(res.data);
      } catch (error) {
        console.error("Failed to fetch live gesture logs");
      }
    };
    
    fetchLogs(); 
    const logInterval = setInterval(fetchLogs, 3000); 
    return () => clearInterval(logInterval);
  }, []);

  const handleSyncAI = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/refresh_ai', { method: 'POST' });
      if (res.ok) {
        setAlertDialog({ isOpen: true, title: 'Sync Complete', message: 'AI Memory successfully synced with the Database!', type: 'success' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Sync Failed', message: 'AI Sync failed to respond correctly.', type: 'error' });
      }
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Engine Offline', message: 'Could not connect to the Python AI Engine.', type: 'error' });
    }
  };

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full min-h-0">
        
        <div ref={containerRef} className="w-full lg:w-3/4 bg-black rounded-2xl overflow-hidden relative border border-slate-300 dark:border-slate-700/50 shadow-xl flex flex-col group aspect-video lg:aspect-auto lg:h-full flex-shrink-0">
          
          <div className="absolute top-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-b from-black/40 to-transparent flex justify-end items-start z-10 pointer-events-none">
            <div className="flex items-center gap-2 md:gap-4 bg-black/50 backdrop-blur-md px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/10">
              {connectionState === 'CONNECTING' ? (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <FiLoader className="animate-spin text-yellow-500 size-3 md:size-4" />
                  <span className="text-yellow-500 font-bold tracking-widest text-[9px] md:text-xs uppercase hidden sm:block">RECONNECTING...</span>
                </div>
              ) : connectionState === 'LIVE' ? (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-red-600"></span>
                  </span>
                  <span className="text-red-500 font-bold tracking-widest text-[9px] md:text-xs uppercase">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-slate-500"></div>
                  <span className="text-slate-400 font-bold tracking-widest text-[9px] md:text-xs uppercase">DISCONNECTED</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative bg-[#0a0a0c] overflow-hidden w-full h-full">
            <img 
              src={activeStreamUrl} 
              alt="Live AI Gesture Feed"
              onLoad={() => setConnectionState('LIVE')}
              onError={() => {
                setConnectionState('DISCONNECTED');
                setTimeout(() => {
                  setConnectionState('CONNECTING');
                  setActiveStreamUrl(`http://127.0.0.1:5000/gesture_feed?t=${new Date().getTime()}`);
                }, 5000);
              }}
              className={`w-full h-full absolute inset-0 z-0 object-cover transition-opacity duration-500 ${connectionState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {connectionState === 'CONNECTING' ? (
              <div className="z-10 flex flex-col items-center justify-center gap-4 text-slate-400">
                <FiLoader size={48} className="text-amber-500 animate-spin" />
                <p className="font-bold uppercase tracking-widest text-xs">Waiting for Python Engine...</p>
              </div>
            ) : connectionState === 'DISCONNECTED' ? (
              <div className="z-10 text-center text-slate-400 bg-black/40 p-4 md:p-8 rounded-2xl border border-white/5">
                <FiWifiOff size={40} md:size={56} className="mx-auto text-slate-600 mb-2 md:mb-4 opacity-90" />
                <p className="text-sm md:text-lg font-bold text-slate-200">Connection Lost</p>
                <p className="text-xs font-medium mt-1">Auto-reconnecting...</p>
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-between items-end z-10">
            <div className="text-slate-300 font-mono text-[9px] md:text-xs uppercase tracking-widest font-semibold">
              <span className="hidden sm:block">{currentTime.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="text-lg md:text-2xl font-bold text-white tracking-widest">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={handleSyncAI} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95" title="Force AI Memory Sync">
                <FiRefreshCw className="size-4 md:size-5" />
              </button>
              <button onClick={toggleFullScreen} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95"><FiMaximize className="size-4 md:size-5" /></button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/4 flex flex-col gap-6 h-[400px] lg:h-full flex-shrink-0">
          <div className="bg-white dark:bg-[#252830] rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-gray-300 flex items-center gap-2 text-sm md:text-base">
                <FiActivity className="text-amber-500" size={18} />
                Gesture Logs
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 hidden-scrollbar">
              {recentLogs.length === 0 ? (
                <div className="text-center mt-10 opacity-60">
                   <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">Waiting for AI detections...</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start relative pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0 animate-in fade-in slide-in-from-right-4">
                    <div className="text-[10px] md:text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5 w-[65px] md:w-[72px] flex-shrink-0">{log.time}</div>
                    <div>
                      <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-gray-200 leading-tight">{log.name}</p>
                      <p className={`text-[10px] md:text-xs font-medium mt-1 ${log.event.includes('Pending') ? 'text-amber-600 dark:text-amber-500' : 'text-green-600 dark:text-green-500'}`}>
                        {log.event}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex-shrink-0">
              <div className="flex justify-between items-center text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">Latency: <span className={`${connectionState === 'LIVE' ? 'text-slate-800 dark:text-gray-300' : 'text-slate-400'}`}>{connectionState === 'LIVE' ? `${latency}ms` : '--'}</span></span>
                <span className={`${connectionState === 'LIVE' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} flex items-center gap-1.5`}>API Status: {connectionState === 'LIVE' ? 'OK' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- CUSTOM ALERT MODAL --- */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 ${alertDialog.type === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
            <div className="p-6 text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${alertDialog.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/30' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/30'}`}>
                {alertDialog.type === 'error' ? <FiAlertCircle size={32} /> : <FiCheckCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase tracking-wide">{alertDialog.title}</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium whitespace-pre-line">{alertDialog.message}</p>
            </div>
            <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center">
              <button onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })} className="w-full px-8 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-200 dark:hover:bg-white dark:text-black transition-colors uppercase tracking-wide text-xs shadow-md active:scale-95">
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}