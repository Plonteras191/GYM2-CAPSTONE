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

  // Visual style per notification type (presentation only)
  const notificationStyle = (alert) => {
    if (alert.type === 'expiring') {
      const today = alert.days_left === 0;
      return {
        icon: <FiClock size={15} />,
        tile: 'bg-warn-soft text-warn',
        badge: today ? 'TODAY' : `${alert.days_left}d left`,
        badgeClass: today ? 'bg-accent-soft text-accent' : 'bg-warn-soft text-warn',
      };
    }
    if (alert.type === 'event') {
      return {
        icon: <FiCalendar size={15} />,
        tile: 'bg-positive-soft text-positive',
        badge: alert.days_left === 0 ? 'TODAY' : `${alert.days_left}d event`,
        badgeClass: 'bg-positive-soft text-positive',
      };
    }
    if (alert.type === 'no_sub') {
      return { icon: <FiAlertCircle size={15} />, tile: 'bg-accent-soft text-accent', badge: 'No Sub', badgeClass: 'bg-accent-soft text-accent' };
    }
    if (alert.type === 'login') {
      return { icon: <FiLogIn size={15} />, tile: 'bg-hover text-ink-2', badge: 'Login', badgeClass: 'bg-hover text-ink-2' };
    }
    return {
      icon: <FiCheckSquare size={15} />,
      tile: 'bg-brand-navy-50 text-brand-navy dark:bg-brand-navy-200/10 dark:text-brand-navy-200',
      badge: 'Task',
      badgeClass: 'bg-brand-navy-50 text-brand-navy dark:bg-brand-navy-200/10 dark:text-brand-navy-200',
    };
  };

  const iconButton = 'press relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-ink-2 hover:bg-hover hover:text-ink sm:h-11 sm:w-11';

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas font-sans">

      <style>{`
        .hidden-scrollbar::-webkit-scrollbar { display: none; }
        .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {isSidebarOpen && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-brand-dark/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-raised shadow-2xl transition-transform duration-300 ease-out-quint lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-line px-5 sm:h-20 lg:h-[76px]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-brand-dark ring-offset-2 ring-offset-raised dark:ring-brand-gold">
              <img src={systemLogo} alt="System logo" className="h-full w-full rounded-full bg-white object-cover p-0.5" />
            </div>
            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="bg-gradient-to-r from-brand-red to-brand-orange-700 bg-clip-text pr-1 font-display text-[1.65rem] font-extrabold uppercase italic leading-none tracking-tight text-transparent dark:from-brand-red-300 dark:to-brand-orange-300">
                Double Alpha
              </h1>
              <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted">
                Fitness
              </span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation menu" className="press rounded-lg p-2 text-muted hover:bg-hover hover:text-ink lg:hidden">
            <FiX size={22} />
          </button>
        </div>

        <nav aria-label="Main navigation" className="hidden-scrollbar flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {navGroups.map((group, index) => (
            <div key={index}>
              <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {group.title}
              </h3>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        `group press relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium ${
                          isActive
                            ? 'bg-accent-soft text-ink'
                            : 'text-ink-2 hover:bg-hover hover:text-ink'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            aria-hidden="true"
                            className={`absolute inset-y-2 left-0 w-[3px] origin-center rounded-r-full bg-accent transition-transform duration-300 ease-out-quint ${isActive ? 'scale-y-100' : 'scale-y-0'}`}
                          />
                          <span className={`text-lg transition-transform duration-200 ${isActive ? 'text-accent' : 'text-muted group-hover:translate-x-0.5 group-hover:text-ink'}`}>
                            {item.icon}
                          </span>
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

        <div className="flex-shrink-0 border-t border-line p-3">
          <button onClick={handleLogout} className="group press flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-accent-soft hover:text-accent">
            <FiLogOut className="text-lg text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">

        <header className="z-10 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-line bg-raised/90 px-3 backdrop-blur-md transition-colors duration-300 sm:h-20 sm:px-5 lg:h-[76px] lg:px-8">

          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation menu" className={`${iconButton} lg:hidden`}>
              <FiMenu size={20} />
            </button>

            <div className="flex min-w-0 flex-col">
              <h2 key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 max-w-[170px] truncate font-display text-xl font-semibold leading-tight tracking-tight text-ink sm:max-w-xs sm:text-2xl md:max-w-none lg:text-[1.75rem]">
                {getPageTitle(location.pathname)}
              </h2>
              <span className="mt-0.5 hidden truncate text-xs font-medium text-muted sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-3">

            <div className="relative order-3">
              <button
                ref={notificationButtonRef}
                onClick={toggleNotifications}
                aria-label={`Open notifications${visibleNotifications.length ? `, ${visibleNotifications.length} unread` : ''}`}
                aria-expanded={showNotifications}
                aria-controls="notification-panel"
                className={`${iconButton} group ${showNotifications ? 'bg-hover text-ink' : ''}`}
              >
                <FiBell size={19} strokeWidth={2.2} className="origin-top transition-transform duration-300 group-hover:rotate-12" />
                {visibleNotifications.length > 0 && (
                  <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold leading-none text-brand-dark tabular-nums ring-2 ring-raised">
                    {visibleNotifications.length > 99 ? '99+' : visibleNotifications.length}
                  </span>
                )}
              </button>

              {/* Portal layer: above sidebar (z-50), below logout (z-100) and alerts (z-120). */}
              {showNotifications && notificationPanelPosition && createPortal(
                <div
                  id="notification-panel"
                  style={notificationPanelPosition}
                  className="animate-in fade-in zoom-in-95 slide-in-from-top-2 fixed z-[90] flex origin-top-right flex-col overflow-hidden rounded-2xl border border-line bg-panel text-ink shadow-[0_18px_48px_rgb(13_13_13/0.18)] dark:shadow-[0_18px_48px_rgb(0_0_0/0.55)]"
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiBell size={15} className="text-muted" />
                      <h4 className="text-sm font-semibold text-ink">Notifications</h4>
                      {visibleNotifications.length > 0 && (
                        <span className="rounded-full bg-hover px-2 py-0.5 text-xs font-semibold text-ink-2 tabular-nums">{visibleNotifications.length}</span>
                      )}
                    </div>
                    {visibleNotifications.length > 0 && (
                      <button onClick={dismissAll} className="press rounded-md px-2 py-1.5 text-xs font-semibold text-muted hover:bg-hover hover:text-ink">Clear all</button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="hidden-scrollbar max-h-[360px] min-h-0 flex-1 divide-y divide-line overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-positive-soft text-positive">
                          <FiCheckCircle size={20} />
                        </span>
                        <p className="text-sm font-semibold text-ink">All clear</p>
                        <p className="mt-1 text-xs text-muted">No pending alerts right now.</p>
                      </div>
                    ) : (
                      visibleNotifications.map((alert, index) => {
                        const style = notificationStyle(alert);
                        return (
                          <div
                            key={alert.id || index}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationClick(alert)}
                            onKeyDown={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNotificationClick(alert);
                              }
                            }}
                            className="animate-in fade-in slide-in-from-right-4 group relative cursor-pointer px-4 py-3.5 transition-colors hover:bg-hover focus-visible:-outline-offset-2"
                            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${style.tile}`}>
                                {style.icon}
                              </div>
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold leading-tight text-ink">{alert.member_name}</p>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badgeClass}`}>{style.badge}</span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-muted">{alert.message}</p>
                              </div>
                              <button
                                onClick={(e) => dismissOne(alert.id, e)}
                                title="Dismiss notification"
                                aria-label="Dismiss notification"
                                className="press rounded-md p-1.5 text-muted opacity-70 hover:bg-panel hover:text-accent group-hover:opacity-100"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer */}
                  {visibleNotifications.length > 0 && (
                    <div className="border-t border-line bg-canvas px-3 py-2.5 text-center">
                      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted">
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

            <div className="order-2 mx-1 hidden h-8 w-px bg-line md:block"></div>

            <NavLink to="/profile" aria-label="Open admin profile" className="group press order-1 flex items-center gap-3 rounded-full border border-transparent p-1 hover:border-line hover:bg-hover md:py-1 md:pl-1 md:pr-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-brand-white transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10 dark:bg-brand-gold dark:text-brand-dark">
                <FiUser size={18} strokeWidth={2.4} />
              </div>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-semibold leading-none text-ink">
                  {adminName}
                </span>
                <span className="mt-1 text-xs font-medium leading-none text-muted">
                  System Admin
                </span>
              </div>
              <FiChevronDown className="ml-0.5 hidden text-muted transition-transform group-hover:translate-y-0.5 group-hover:text-ink md:block" size={16} strokeWidth={2.4} />
            </NavLink>

            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`${iconButton} order-5`}
              title="Toggle Dark Mode"
            >
              <span key={isDarkMode ? 'sun' : 'moon'} className="icon-swap">
                {isDarkMode ? <FiSun size={19} strokeWidth={2.2} /> : <FiMoon size={19} strokeWidth={2.2} />}
              </span>
            </button>
          </div>
        </header>

        <main className="hidden-scrollbar relative w-full min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-canvas">
          <Outlet />
        </main>

        {/* GLOBAL LAYOUT CONFIRM LOGOUT MODAL */}
        {confirmDialog.isOpen && (
          <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
              <div className="space-y-3 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <FiLogOut size={26} />
                </div>
                <h3 id="logout-title" className="font-display text-2xl font-semibold text-ink">{confirmDialog.title}</h3>
                <p className="text-sm text-muted">{confirmDialog.message}</p>
              </div>
              <div className="flex justify-center gap-3 border-t border-line bg-canvas p-4">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="press min-h-11 flex-1 rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-semibold text-ink-2 hover:bg-hover hover:text-ink">Cancel</button>
                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="press flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-800">
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
