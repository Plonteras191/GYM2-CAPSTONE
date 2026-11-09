import { useState, useContext, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ThemeContext } from '../context/ThemeContext';
import { 
  FiHome, FiUsers, FiCheckSquare, FiCreditCard, 
  FiFileText, FiShield, FiCamera, FiUser, FiSun, FiMoon, FiLogOut,
  FiMenu, FiX, FiBell, FiChevronDown, FiAlertCircle, FiClock, FiLogIn, FiCheckCircle, FiCalendar
} from 'react-icons/fi';
import api from '../api'; 
import { usePrefetch } from '../hooks/usePrefetch'; 
import { useSystemLogo } from '../hooks/useSystemLogo';

const getPageTitle = (path) => {
    switch (path.toLowerCase()) {
      case '/overview': return 'Overview';
      case '/members': return 'Member Registration';
      case '/subscriptions': return 'Packages';
      case '/transactions': return 'Transactions';
      case '/reports': return 'System Reports';
      case '/security': return 'Attendance Monitor';
      case '/gesture': return 'Gesture Monitor';
      case '/profile': return 'Admin Profile';
      default: return 'Admin Dashboard';
    }
};

export default function Layout() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const systemLogo = useSystemLogo();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState(() => localStorage.getItem('admin_name') || 'Admin Profile');
  const notificationButtonRef = useRef(null);
  const [notificationPanelPosition, setNotificationPanelPosition] = useState(null);

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

  useEffect(() => {
    const handleProfileUpdate = (event) => setAdminName(event.detail || 'Admin Profile');
    window.addEventListener('admin-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdate);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      let combinedAlerts = Array.isArray(res.data) ? [...res.data] : [];

      // ── Upcoming coach events ──
      try {
        const eventsResponse = await api.get('/coach-events');
        const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        events.forEach((event) => {
          if (!event.start_date) return;
          const eventDate = new Date(event.start_date);
          eventDate.setHours(0, 0, 0, 0);
          const diffTime = eventDate.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysLeft >= 0 && daysLeft <= 7) {
            combinedAlerts.push({
              id: `event_${event.id}_${event.start_date}`,
              type: 'event',
              member_name: event.title || 'Special Event',
              message: daysLeft === 0
                ? 'Special Gym Event is scheduled for TODAY!'
                : `Upcoming special event in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (${event.start_date}).`,
              days_left: daysLeft,
              link: '/subscriptions'
            });
          }
        });
      } catch (err) {
        console.error("Failed to fetch coach events for notifications", err);
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

  const updateNotificationPanelPosition = () => {
    const button = notificationButtonRef.current;
    if (!button) return;

    const bounds = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const top = bounds.bottom + 8;
    const isMobile = viewportWidth < 640;
    const width = isMobile ? Math.max(0, viewportWidth - 24) : Math.min(384, viewportWidth - 24);

    setNotificationPanelPosition({
      top,
      width,
      ...(isMobile
        ? { left: 12 }
        : { right: Math.max(12, viewportWidth - bounds.right) }),
      maxHeight: Math.max(0, viewportHeight - top - 12),
    });
  };

  useEffect(() => {
    if (!showNotifications) return undefined;

    const repositionPanel = () => updateNotificationPanelPosition();
    window.addEventListener('resize', repositionPanel);
    window.addEventListener('scroll', repositionPanel, true);
    return () => {
      window.removeEventListener('resize', repositionPanel);
      window.removeEventListener('scroll', repositionPanel, true);
    };
  }, [showNotifications]);

  const toggleNotifications = () => {
    if (!showNotifications) updateNotificationPanelPosition();
    setShowNotifications(!showNotifications);
  };

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
          sessionStorage.removeItem('admin_token');
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
        { name: 'Member Registration', path: '/members', icon: <FiUsers /> },
        { name: 'Packages', path: '/subscriptions', icon: <FiCheckSquare /> },
        { name: 'Transactions', path: '/transactions', icon: <FiCreditCard /> },
        { name: 'Reports', path: '/reports', icon: <FiFileText /> },
      ]
    },
    {
      title: 'Monitoring',
      items: [
        { name: 'Attendance Monitor', path: '/security', icon: <FiShield /> },
        { name: 'Gesture Monitor', path: '/gesture', icon: <FiCamera /> },
      ]
    }
  ];

  return (
    <div className="flex h-dvh bg-slate-100 dark:bg-[#050505] overflow-hidden font-sans">
      
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

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-72 bg-white dark:bg-[#161616] border-r border-gray-400 dark:border-gray-600 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-24 px-5 flex items-center justify-between gap-4 border-b border-gray-400 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white dark:bg-[#161616] border-[3px] border-black dark:border-amber-500 shadow-md dark:shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all flex-shrink-0">
              <img src={systemLogo} alt="System logo" className="w-full h-full rounded-full object-cover bg-white p-0.5" />
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
                          <span className={`text-xl ${isActive ? 'text-gray-300 dark:text-gray-300' : 'opacity-70'}`}>{item.icon}</span>
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

        <div className="p-5 border-t border-gray-400 dark:border-gray-600 flex-shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3.5 px-4 py-3 w-full text-base text-slate-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-xl transition-colors font-bold">
            <FiLogOut className="text-xl opacity-70" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        <header className="h-16 sm:h-20 lg:h-24 bg-white/90 dark:bg-[#161616]/90 backdrop-blur-md border-b border-gray-400 dark:border-gray-600 flex justify-between items-center px-3 sm:px-5 lg:px-8 transition-colors duration-300 z-10 w-full flex-shrink-0">
          
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation menu" className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5 flex-shrink-0">
              <FiMenu size={22} />
            </button>
            
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-xl md:text-3xl font-black text-black dark:text-gray-300 tracking-wide leading-tight truncate max-w-[170px] sm:max-w-xs md:max-w-none">
                {getPageTitle(location.pathname)}
              </h2>
              <span className="hidden sm:block text-[9px] md:text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 flex-shrink-0">
            
            <div className="relative order-3">
              <button 
                ref={notificationButtonRef}
                onClick={toggleNotifications}
                aria-label={`Open notifications${visibleNotifications.length ? `, ${visibleNotifications.length} unread` : ''}`}
                aria-expanded={showNotifications}
                aria-controls="notification-panel"
                className="relative rounded-full border border-gray-500 bg-gray-200 p-2.5 text-black shadow-sm transition-colors hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-[#161616] sm:p-3"
              >
                <FiBell size={21} strokeWidth={2.4} />
                {visibleNotifications.length > 0 && (
                  <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-gray-200 bg-amber-500 px-1 text-[10px] font-extrabold leading-none tabular-nums text-slate-950 shadow-sm dark:border-gray-700 dark:bg-amber-400 dark:text-[#17191f]">
                    {visibleNotifications.length > 99 ? '99+' : visibleNotifications.length}
                  </span>
                )}
              </button>

              {/* Portal layer: above sidebar (z-50), below logout (z-100) and alerts (z-120). */}
              {showNotifications && notificationPanelPosition && createPortal(
                <div
                  id="notification-panel"
                  style={notificationPanelPosition}
                  className="fixed z-[90] flex flex-col overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.18)] ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 dark:border-[#3a3e49] dark:bg-[#1d2028] dark:text-gray-200 dark:shadow-[0_18px_44px_rgba(0,0,0,0.5)] dark:ring-white/5"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-slate-300 bg-slate-200 px-4 py-3.5 dark:border-[#343843] dark:bg-[#232630]">
                    <div className="flex items-center gap-2">
                      <FiBell size={16} className="text-slate-500 dark:text-gray-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-gray-100">Notifications</h4>
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button onClick={dismissAll} className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100">Clear All</button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[360px] min-h-0 flex-1 overflow-y-auto hidden-scrollbar divide-y divide-slate-200/80 dark:divide-[#343843]">
                    {visibleNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <FiCheckCircle size={21} />
                        </span>
                        <p className="text-sm font-bold text-slate-800 dark:text-gray-200">All clear</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">No pending alerts right now.</p>
                      </div>
                    ) : (
                      visibleNotifications.map((alert, index) => {
                        // Determine visual style per type
                        let icon, iconBg, iconColor, badge, badgeColor;
                        if (alert.type === 'expiring') {
                          icon = <FiClock size={15}/>;
                          iconBg = 'bg-amber-50 dark:bg-amber-500/10';
                          iconColor = 'text-amber-700 dark:text-amber-300';
                          badge = alert.days_left === 0 ? 'TODAY' : `${alert.days_left}d left`;
                          badgeColor = alert.days_left === 0 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-500/10 dark:text-red-300' : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-700/50 dark:bg-amber-500/10 dark:text-amber-300';
                        } else if (alert.type === 'event') {
                          icon = <FiCalendar size={15}/>;
                          iconBg = 'bg-emerald-50 dark:bg-emerald-500/10';
                          iconColor = 'text-emerald-700 dark:text-emerald-300';
                          badge = alert.days_left === 0 ? 'TODAY' : `${alert.days_left}d event`;
                          badgeColor = 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-500/10 dark:text-emerald-300';
                        } else if (alert.type === 'no_sub') {
                          icon = <FiAlertCircle size={15}/>;
                          iconBg = 'bg-rose-50 dark:bg-rose-500/10';
                          iconColor = 'text-rose-700 dark:text-rose-300';
                          badge = 'No Sub';
                          badgeColor = 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700/50 dark:bg-rose-500/10 dark:text-rose-300';
                        } else if (alert.type === 'login') {
                          icon = <FiLogIn size={15}/>;
                          iconBg = 'bg-slate-100 dark:bg-slate-500/15';
                          iconColor = 'text-slate-700 dark:text-slate-300';
                          badge = 'Login';
                          badgeColor = 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-500/15 dark:text-slate-300';
                        } else {
                          // task
                          icon = <FiCheckSquare size={15}/>;
                          iconBg = 'bg-violet-50 dark:bg-violet-500/10';
                          iconColor = 'text-violet-700 dark:text-violet-300';
                          badge = 'Task';
                          badgeColor = 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-700/50 dark:bg-violet-500/10 dark:text-violet-300';
                        }

                        return (
                          <div
                            key={alert.id || index}
                            onClick={() => handleNotificationClick(alert)}
                            className="group relative cursor-pointer px-4 py-3.5 transition-colors hover:bg-slate-200 dark:hover:bg-[#292d37]"
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-black/5 ${iconBg} ${iconColor} dark:border-white/5`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-gray-100">{alert.member_name}</p>
                                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>{badge}</span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-gray-400">{alert.message}</p>
                              </div>
                              <button
                                onClick={(e) => dismissOne(alert.id, e)}
                                title="Dismiss notification"
                                aria-label="Dismiss notification"
                                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-rose-300"
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
                    <div className="border-t border-slate-300 bg-slate-200 px-3 py-2.5 text-center dark:border-[#343843] dark:bg-[#232630]">
                      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-gray-400">
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
                </div>,
                document.body
              )}
            </div>

            <div className="w-px h-8 bg-gray-400 dark:bg-gray-600 mx-1 hidden order-2 md:block"></div>

            <NavLink to="/profile" aria-label="Open admin profile" className="order-1 flex items-center gap-3 rounded-full border border-transparent p-1.5 transition-colors hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 md:py-1.5 md:pl-2 md:pr-4 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-[#161616] group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-500 bg-gray-200 text-black shadow-sm transition-transform group-hover:scale-105 sm:h-9 sm:w-9 md:h-10 md:w-10 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300">
                <FiUser size={19} strokeWidth={2.4} />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-bold text-black transition-colors leading-none group-hover:text-gray-700 dark:text-gray-300 dark:group-hover:text-white">
                  {adminName}
                </span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-gray-500 uppercase tracking-widest mt-1.5 leading-none">
                  System Admin
                </span>
              </div>
              <FiChevronDown className="ml-1 hidden text-gray-700 transition-transform group-hover:translate-y-0.5 group-hover:text-black md:block dark:text-gray-300 dark:group-hover:text-white" size={17} strokeWidth={2.5} />
            </NavLink>

            <button 
              onClick={toggleTheme} 
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="order-5 flex-shrink-0 rounded-full border border-gray-500 bg-gray-200 p-2.5 text-black shadow-sm transition-transform hover:scale-110 hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 active:scale-95 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-[#161616] sm:p-3 md:p-3.5"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <FiSun size={21} strokeWidth={2.4} /> : <FiMoon size={21} strokeWidth={2.4} />}
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-100 dark:bg-[#050505] w-full relative hidden-scrollbar overscroll-y-contain">
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