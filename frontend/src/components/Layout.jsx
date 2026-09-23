import { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { 
  FiHome, FiUsers, FiCheckSquare, FiCreditCard, 
  FiFileText, FiShield, FiCamera, FiUser, FiSun, FiMoon, FiLogOut,
  FiMenu, FiX, FiBell, FiChevronDown, FiAlertCircle, FiClock, FiLogIn, FiCheckCircle, FiCalendar
} from 'react-icons/fi';
import logo from '../assets/logo.png';
import api from '../api'; 
import { usePrefetch } from '../hooks/usePrefetch'; 

const getPageTitle = (path) => {
    switch (path.toLowerCase()) {
      case '/overview': return 'Overview';
      case '/members': return 'Member Directory';
      case '/subscriptions': return 'Subscriptions';
      case '/transactions': return 'Transactions';
      case '/reports': return 'System Reports';
      case '/security': return 'Security Monitor';
      case '/gesture': return 'Gesture Monitor';
      case '/profile': return 'Admin Profile';
      default: return 'Admin Dashboard';
    }
};

export default function Layout() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Pre-fetch all pages' data in parallel on first load
  usePrefetch();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_notif_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- NEW: Custom Confirm Dialog for Logout ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const adminName = localStorage.getItem('admin_name') || 'Admin Profile';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      let combinedAlerts = Array.isArray(res.data) ? [...res.data] : [];

      // ── Special Days / Events from localStorage ('coach_events') ──
      try {
        const savedEvents = localStorage.getItem('coach_events');
        if (savedEvents) {
          const events = JSON.parse(savedEvents);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          events.forEach((ev) => {
            if (!ev.start_date) return;
            const evDate = new Date(ev.start_date);
            evDate.setHours(0, 0, 0, 0);
            const diffTime = evDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Alert for events today or within 7 days
            if (daysLeft >= 0 && daysLeft <= 7) {
              combinedAlerts.push({
                id: `event_${ev.id || ev.title}_${ev.start_date}`,
                type: 'event',
                member_name: ev.title || 'Special Event',
                message: daysLeft === 0
                  ? 'Special Gym Event is scheduled for TODAY!'
                  : `Upcoming special event in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${ev.start_date}).`,
                days_left: daysLeft,
                link: '/subscriptions'
              });
            }
          });
        }
      } catch (err) {
        console.error("Error parsing coach events for notifications", err);
      }

      // ── Login Devices Alert ──
      try {
        const savedLogin = localStorage.getItem('login_device_notif');
        if (savedLogin) {
          const loginData = JSON.parse(savedLogin);
          combinedAlerts.push({
            id: loginData.id || 'login_device_alert',
            type: 'login',
            member_name: loginData.isNewDevice ? 'Security: New Device Login' : 'Admin Login Detected',
            message: `Signed in on ${loginData.deviceName || 'Desktop'} (${loginData.timeStr || 'Recent session'}).`,
            days_left: null,
            link: '/profile'
          });
        } else {
          // Detect current device for active session notice
          const userAgent = navigator.userAgent;
          let deviceType = 'Desktop PC';
          if (/iPad|Tablet/i.test(userAgent)) deviceType = 'Tablet';
          else if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile Device';
          else if (/Macintosh|Mac OS/i.test(userAgent)) deviceType = 'Mac Device';
          else if (/Windows/i.test(userAgent)) deviceType = 'Windows PC';

          combinedAlerts.push({
            id: 'login_current_session',
            type: 'login',
            member_name: 'Admin Active Session',
            message: `Current session authenticated on ${deviceType}.`,
            days_left: null,
            link: '/profile'
          });
        }
      } catch (err) {
        console.error("Error processing login device notification", err);
      }

      setNotifications(combinedAlerts);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const dismissAll = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notif_ids', JSON.stringify(updated));
  };

  const dismissOne = (id, e) => {
    if (e) e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notif_ids', JSON.stringify(updated));
  };

  const handleNotificationClick = (alert) => {
    setShowNotifications(false);
    if (alert.link) {
      navigate(alert.link);
    } else if (alert.type === 'expiring' || alert.type === 'no_sub') {
      navigate('/subscriptions');
    } else if (alert.type === 'task') {
      navigate('/gesture');
    } else if (alert.type === 'login') {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Logout',
      message: 'Are you sure you want to securely end your session and log out of the system?',
      onConfirm: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error("Server logout failed, forcing local logout", error);
        } finally {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_name');
          window.location.href = '/login';
        }
      }
    });
  };

  const navGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Overview', path: '/overview', icon: <FiHome /> },
        { name: 'Member Directory', path: '/members', icon: <FiUsers /> },
        { name: 'Subscriptions', path: '/subscriptions', icon: <FiCheckSquare /> },
        { name: 'Transactions', path: '/transactions', icon: <FiCreditCard /> },
        { name: 'Reports', path: '/reports', icon: <FiFileText /> },
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { name: 'Security Monitor', path: '/security', icon: <FiShield /> },
        { name: 'Gesture Monitor', path: '/gesture', icon: <FiCamera /> },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#050505] overflow-hidden font-sans">
      
      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-72 bg-white dark:bg-[#161616] border-r border-slate-500 dark:border-white/20 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-24 px-5 flex items-center justify-between gap-4 border-b border-slate-500 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#161616] border-[3px] border-black dark:border-amber-500 shadow-md dark:shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all flex-shrink-0">
              <img src={logo} alt="Double Alpha Logo" className="w-full h-full rounded-full object-cover bg-white p-0.5" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-orange text-xl md:text-2xl leading-none uppercase tracking-tight drop-shadow-sm">
                Double Alpha
              </h1>
              <span className="font-bold text-[0.65rem] md:text-xs text-slate-500 dark:text-gray-400 uppercase tracking-[0.25em] mt-0.5">
                Fitness
              </span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:text-brand-red dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
            <FiX size={26} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-8 px-5 space-y-6 hidden-scrollbar">
          {navGroups.map((group, index) => (
            <div key={index}>
              <h3 className="text-[11px] md:text-xs font-bold text-gray-700 dark:text-gray-500 uppercase tracking-widest mb-3 px-3">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm md:text-base ${
                          isActive 
                            ? 'bg-black text-white dark:bg-white/10 dark:text-gray-300 shadow-md' 
                            : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-black dark:hover:text-gray-300'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`text-xl ${isActive ? 'text-brand-gold dark:text-gray-300' : 'opacity-70'}`}>{item.icon}</span>
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-5 border-t border-slate-400 dark:border-white/10 flex-shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3.5 px-4 py-3 w-full text-base text-slate-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-colors font-bold">
            <FiLogOut className="text-xl opacity-70" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        <header className="h-24 bg-white/90 dark:bg-[#161616]/90 backdrop-blur-md border-b border-slate-500 dark:border-white/10 flex justify-between items-center px-4 md:px-8 transition-colors duration-300 z-10 w-full flex-shrink-0">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5">
              <FiMenu size={24} />
            </button>
            
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg sm:text-xl md:text-3xl font-black text-black dark:text-gray-300 tracking-wide leading-tight truncate max-w-[140px] sm:max-w-xs md:max-w-none">
                {getPageTitle(location.pathname)}
              </h2>
              <span className="hidden sm:block text-[9px] md:text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors hidden md:block border border-slate-500 dark:border-white/10"
              >
                <FiBell size={20} />
                {visibleNotifications.length > 0 && (
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-100 dark:border-[#161616] animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-[#161616] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {/* Panel Header */}
                  <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121212] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FiBell size={16} className="text-amber-500" />
                      <h4 className="font-bold text-black dark:text-gray-300 text-sm">Notifications</h4>
                      {visibleNotifications.length > 0 && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full">{visibleNotifications.length}</span>
                      )}
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button onClick={dismissAll} className="text-[10px] font-bold text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-wide">Clear All</button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[360px] overflow-y-auto hidden-scrollbar divide-y divide-slate-100 dark:divide-white/5">
                    {visibleNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <FiCheckCircle size={32} className="mx-auto text-green-500 mb-3" />
                        <p className="text-sm font-bold text-slate-700 dark:text-gray-300">All Clear!</p>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">No pending alerts at the moment.</p>
                      </div>
                    ) : (
                      visibleNotifications.map((alert, index) => {
                        // Determine visual style per type
                        let icon, iconBg, iconColor, badge, badgeColor;
                        if (alert.type === 'expiring') {
                          icon = <FiClock size={15}/>;
                          iconBg = 'bg-amber-100 dark:bg-amber-500/20';
                          iconColor = 'text-amber-600 dark:text-amber-400';
                          badge = alert.days_left === 0 ? 'TODAY' : `${alert.days_left}d left`;
                          badgeColor = alert.days_left === 0 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
                        } else if (alert.type === 'event') {
                          icon = <FiCalendar size={15}/>;
                          iconBg = 'bg-emerald-100 dark:bg-emerald-500/20';
                          iconColor = 'text-emerald-600 dark:text-emerald-400';
                          badge = alert.days_left === 0 ? 'TODAY' : `${alert.days_left}d event`;
                          badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                        } else if (alert.type === 'no_sub') {
                          icon = <FiAlertCircle size={15}/>;
                          iconBg = 'bg-red-100 dark:bg-red-500/20';
                          iconColor = 'text-red-600 dark:text-red-400';
                          badge = 'No Sub';
                          badgeColor = 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400';
                        } else if (alert.type === 'login') {
                          icon = <FiLogIn size={15}/>;
                          iconBg = 'bg-blue-100 dark:bg-blue-500/20';
                          iconColor = 'text-blue-600 dark:text-blue-400';
                          badge = 'Login';
                          badgeColor = 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
                        } else {
                          // task
                          icon = <FiCheckSquare size={15}/>;
                          iconBg = 'bg-purple-100 dark:bg-purple-500/20';
                          iconColor = 'text-purple-600 dark:text-purple-400';
                          badge = 'Task';
                          badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
                        }

                        return (
                          <div
                            key={alert.id || index}
                            onClick={() => handleNotificationClick(alert)}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group relative"
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`w-8 h-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-black dark:text-gray-300 leading-tight">{alert.member_name}</p>
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-0.5 leading-snug">{alert.message}</p>
                              </div>
                              <button
                                onClick={(e) => dismissOne(alert.id, e)}
                                title="Dismiss notification"
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 -mr-2 -mt-1 rounded"
                              >
                                <FiX size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  {visibleNotifications.length > 0 && (
                    <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#121212] text-center">
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium flex items-center justify-center gap-2 flex-wrap">
                        {visibleNotifications.filter(n => n.type === 'expiring').length > 0 && (
                          <span>{visibleNotifications.filter(n => n.type === 'expiring').length} expiring</span>
                        )}
                        {visibleNotifications.filter(n => n.type === 'event').length > 0 && (
                          <span>• {visibleNotifications.filter(n => n.type === 'event').length} event(s)</span>
                        )}
                        {visibleNotifications.filter(n => n.type === 'no_sub').length > 0 && (
                          <span>• {visibleNotifications.filter(n => n.type === 'no_sub').length} no sub</span>
                        )}
                        {visibleNotifications.filter(n => n.type === 'login').length > 0 && (
                          <span>• {visibleNotifications.filter(n => n.type === 'login').length} security</span>
                        )}
                        {visibleNotifications.filter(n => n.type === 'task').length > 0 && (
                          <span>• {visibleNotifications.filter(n => n.type === 'task').length} task(s)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-slate-300 dark:bg-white/10 mx-1 hidden md:block"></div>

            <NavLink to="/profile" className="flex items-center gap-3 p-1.5 md:py-1.5 md:px-2 md:pr-4 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent dark:hover:border-white/5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black dark:bg-amber-500/20 border border-transparent dark:border-amber-500/50 text-white dark:text-amber-500 flex items-center justify-center font-bold shadow-sm text-base transition-transform group-hover:scale-105">
                <FiUser />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-none">
                  {adminName}
                </span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-gray-500 uppercase tracking-widest mt-1.5 leading-none">
                  System Admin
                </span>
              </div>
              <FiChevronDown className="hidden md:block text-slate-400 dark:text-gray-500 group-hover:text-amber-500 ml-1 transition-transform group-hover:translate-y-0.5" size={16} />
            </NavLink>

            <div className="w-px h-8 bg-slate-300 dark:bg-white/10 mx-1 hidden md:block"></div>

            <button 
              onClick={toggleTheme} 
              className="p-3 md:p-3.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-transform hover:scale-110 active:scale-95 shadow-sm border border-slate-500 dark:border-white/10 flex-shrink-0"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-[#050505] w-full relative hidden-scrollbar">
          <Outlet />
        </main>

        {/* GLOBAL LAYOUT CONFIRM LOGOUT MODAL */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                  <FiLogOut size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase tracking-wide">{confirmDialog.title}</h3>
                <p className="text-slate-500 dark:text-gray-400 font-medium">{confirmDialog.message}</p>
              </div>
              <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center gap-3">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs">Cancel</button>
                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 uppercase tracking-wide text-xs">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}