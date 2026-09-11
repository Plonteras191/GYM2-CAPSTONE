import { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { 
  FiHome, FiUsers, FiCheckSquare, FiCreditCard, 
  FiFileText, FiShield, FiCamera, FiUser, FiSun, FiMoon, FiLogOut,
  FiMenu, FiX, FiBell, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';
import logo from '../assets/logo.png';
import api from '../api'; 

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
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- NEW: Custom Confirm Dialog for Logout ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const adminName = localStorage.getItem('admin_name') || 'Admin Profile';

  useEffect(() => {
      const fetchNotifications = async () => {
          try {
              const res = await api.get('/notifications');
              setNotifications(res.data);
          } catch (error) {
              console.error("Failed to fetch notifications", error);
          }
      };
      fetchNotifications();
  }, [location.pathname]);

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
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-100 dark:border-[#161616] animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#161616] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#121212] flex justify-between items-center">
                      <h4 className="font-bold text-black dark:text-gray-300 text-sm">Action Required</h4>
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full">{notifications.length} Alerts</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto hidden-scrollbar">
                      {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm font-medium text-slate-500 dark:text-gray-400">All members have active subscriptions and no pending tasks!</div>
                      ) : (
                          notifications.map((alert, index) => (
                            <div key={alert.id || index} onClick={() => { setShowNotifications(false); }} className="p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"><FiAlertCircle size={16}/></div>
                                  <div>
                                      <p className="text-sm font-bold text-black dark:text-gray-300 leading-tight">{alert.member_name}</p>
                                      <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-1">{alert.message}</p>
                                  </div>
                                </div>
                            </div>
                          ))
                      )}
                    </div>
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