=== Layout.jsx ===
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
    switch (path) {
      case '/Overview': return 'Overview';
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
        { name: 'Overview', path: '/Overview', icon: <FiHome /> },
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

=== ThemeContext.jsx ===
import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check local storage for saved preference on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

=== AdminProfile.jsx ===
import { useState } from 'react';
import { 
  FiUser, FiMail, FiLock, FiSave, FiShield, 
  FiEye, FiEyeOff, FiUpload, FiImage, FiLayout,
  FiZoomIn, FiZoomOut, FiCheck, FiX, FiCamera, FiLoader, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';

import logo from '../assets/logo.png'; 

export default function AdminProfile() {
  const [adminData, setAdminData] = useState({
    name: 'Fustino Padera Anasco Jr.',
    email: 'admin@doublealpha.fit',
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [images, setImages] = useState({
    profile: logo,
    logo: logo,
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop' 
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[0-9]/g, '');
    setAdminData({ ...adminData, name: lettersOnly });
  };

  const togglePass = (field) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const [imageModal, setImageModal] = useState({
    isOpen: false,
    type: null, 
    tempUrl: null,
    rawFile: null 
  });
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setImageModal({ isOpen: true, type, tempUrl, rawFile: file });
      setZoomLevel(100); 
      setImagePos({ x: 0, y: 0 }); 
    }
    e.target.value = null; 
  };

  const handleApplyImage = async () => {
    setImages((prev) => ({ ...prev, [imageModal.type]: imageModal.tempUrl }));
    setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
  };

  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
  };

  const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y }); };
  const handleMouseMove = (e) => { if (isDragging) setImagePos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => { setIsDragging(false); };
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true); 
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      setAlertDialog({ isOpen: true, title: 'Profile Updated', message: `Profile updated successfully for ${adminData.name}!`, type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setIsSavingProfile(false); 
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'New passwords do not match!', type: 'error' });
      return;
    }
    
    setIsSavingSecurity(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAlertDialog({ isOpen: true, title: 'Security Updated', message: 'Password changed successfully!', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' }); 
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update password.', type: 'error' });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAlertDialog({ isOpen: true, title: 'Branding Saved', message: 'System Branding updated successfully!', type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save branding.', type: 'error' });
    } finally {
      setIsSavingBranding(false);
    }
  };

  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-sm";
  const labelClass = "text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center h-fit">
          <div className="relative mb-4 group">
            <img 
              src={images.profile} 
              alt="Admin Profile" 
              className="w-36 h-36 rounded-full object-cover border-4 border-slate-900 dark:border-white bg-white dark:bg-[#252830] p-1 shadow-md transition-transform group-hover:scale-105" 
            />
            
            <label className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center">
              <FiCamera size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'profile')} />
            </label>
          </div>
          
          <h3 className="font-bold text-lg text-slate-800 dark:text-gray-300 mt-2">{adminData.name}</h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">System Administrator</p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
              <FiUser className="text-slate-900 dark:text-gray-300 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Account Details</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <label className="block">
                <span className={labelClass}><FiUser size={14} className="text-slate-400"/> Full Name</span>
                <input 
                  type="text" 
                  value={adminData.name} 
                  onChange={handleNameChange} 
                  className={inputClass} 
                  required 
                />
              </label>
              <label className="block">
                <span className={labelClass}><FiMail size={14} className="text-slate-400"/> Email Address</span>
                <input type="email" value={adminData.email} onChange={(e) => setAdminData({...adminData, email: e.target.value})} className={inputClass} required />
              </label>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingProfile} className={primaryButtonClass}>
                  {isSavingProfile ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingProfile ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
              <FiShield className="text-red-500 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Security</h3>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Update your administrative password. It will be securely hashed before storage.</p>
            <form onSubmit={handleSavePassword} className="space-y-5">
              
              <label className="block relative">
                <span className={labelClass}><FiLock size={14} className="text-slate-400"/> Current Password</span>
                <div className="relative">
                  <input type={showPass.current ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputClass} required />
                  <button type="button" onClick={() => togglePass('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {showPass.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-slate-400"/> New Password</span>
                  <div className="relative">
                    <input type={showPass.new ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputClass} required />
                    <button type="button" onClick={() => togglePass('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPass.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-slate-400"/> Confirm New Password</span>
                  <div className="relative">
                    <input type={showPass.confirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputClass} required />
                    <button type="button" onClick={() => togglePass('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPass.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingSecurity} className={primaryButtonClass}>
                  {isSavingSecurity ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingSecurity ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm mt-6">
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
          <FiLayout className="text-slate-900 dark:text-gray-300 text-xl" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">System Branding</h3>
        </div>

        <form onSubmit={handleSaveBranding} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-3">
            <span className={labelClass}><FiImage size={14} className="text-slate-400"/> Sidebar Logo</span>
            <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
              <img 
                src={images.logo} 
                alt="App Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-900 dark:border-white bg-white dark:bg-[#252830] p-0.5" 
              />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recommended: 256x256 PNG</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#252830] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <FiUpload /> Choose New Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'logo')} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className={labelClass}><FiImage size={14} className="text-slate-400"/> Dashboard Cover Photo</span>
            <div className="flex flex-col gap-3 p-4 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
              <img src={images.cover} alt="Dashboard Cover" className="w-full h-24 rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
              <div className="flex justify-between items-center w-full">
                <p className="text-xs font-medium text-slate-500">Wide format (1920x400)</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#252830] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <FiUpload /> Change Cover
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'cover')} />
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <button type="submit" disabled={isSavingBranding} className={primaryButtonClass}>
              {isSavingBranding ? <FiLoader className="animate-spin" size={18} /> : <FiCheck size={18} />} 
              {isSavingBranding ? 'Applying...' : 'Apply Branding Changes'}
            </button>
          </div>

        </form>
      </div>

      {imageModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-[#1e1e1e]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 capitalize">
                Adjust {imageModal.type} Photo
              </h3>
              <button onClick={handleCloseImageModal} className="text-slate-400 hover:text-red-500 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-slate-100 dark:bg-[#1a1c23]">
              
              <div 
                className={`relative overflow-hidden bg-black/10 dark:bg-black/30 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center cursor-move
                ${imageModal.type === 'cover' ? 'w-full aspect-video rounded-xl' : 'w-64 h-64 rounded-full'}
              `}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={imageModal.tempUrl} 
                  alt="Preview" 
                  className="relative pointer-events-none min-w-full min-h-full object-cover" 
                  style={{ 
                    transform: `translate(${imagePos.x}px, ${imagePos.y}px) scale(${zoomLevel / 100})`,
                    userSelect: 'none'
                  }}
                  draggable="false"
                />
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>

              <div className="w-full max-w-xs mt-6 flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <FiZoomOut size={20} />
                <input 
                  type="range" 
                  min="100" max="250" 
                  value={zoomLevel} 
                  onChange={(e) => setZoomLevel(e.target.value)}
                  className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <FiZoomIn size={20} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium text-center">
                Drag image to reposition & use slider to zoom.
              </p>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex justify-end gap-3">
              <button onClick={handleCloseImageModal} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              
              <button onClick={handleApplyImage} className={primaryButtonClass}>
                <FiCheck size={18} /> Apply Image
              </button>
            </div>
            
          </div>
        </div>
      )}

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

=== Dashboard.jsx ===
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import api from '../api'; 

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FiUsers, FiCheckCircle, FiDollarSign, FiFileText, 
  FiAlertCircle, FiLoader 
} from 'react-icons/fi';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [rawCalendarEvents, setRawCalendarEvents] = useState([]);

  // Fetch coach events stored in local storage from Subscriptions page
  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/dashboard');
        const data = response.data;

        setStats(data.stats);
        setSalesData(data.salesData);
        setRecentMembers(data.recentMembers.map(m => `${m.first_name} ${m.last_name}`));
        
        // --- ADDED MEMBER NAME EXTRACTION ---
        setRecentTxns(data.recentTxns.map(t => ({
          type: t.type,
          amount: t.amount,
          method: t.payment_method,
          memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
        })));

        setExpiringSoon(data.expiringSoon.map(sub => {
          const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          return {
            name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
            days: daysLeft
          };
        }));
        
        // Save the raw subscriptions for smart mapping later
        setRawCalendarEvents(data.calendarEvents || []);

      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- SMART CALENDAR MAPPING ENGINE ---
  let allCalendarEvents = [];

  // Deduplicate active subscriptions to show only the latest per member
  const activeSubsMap = new Map();
  rawCalendarEvents.forEach(sub => {
    if (sub.status === 'Active' && sub.member) {
      const existing = activeSubsMap.get(sub.member_id);
      if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
        activeSubsMap.set(sub.member_id, sub);
      }
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

  uniqueLatestActiveSubs.forEach(sub => {
    const planName = (sub.plan_type || '').toLowerCase();
    if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return;
    
    const firstName = sub.member.first_name;
    
    allCalendarEvents.push({
      id: `start-${sub.id}`,
      title: `Start of ${firstName}'s ${sub.plan_type}`,
      date: sub.start_date, 
      backgroundColor: sub.color || '#f59e0b',
      borderColor: sub.color || '#f59e0b',
      allDay: true,
      extendedProps: { type: 'sub', ...sub }
    });

    if (sub.end_date && sub.end_date !== sub.start_date) {
      allCalendarEvents.push({
        id: `end-${sub.id}`,
        title: `End of ${firstName}'s ${sub.plan_type}`,
        date: sub.end_date, 
        backgroundColor: sub.color || '#f59e0b',
        borderColor: sub.color || '#f59e0b',
        allDay: true,
        extendedProps: { type: 'sub', ...sub }
      });
    }
  });

  coachEvents.forEach(ev => {
    let endObj = new Date(ev.end_date || ev.start_date);
    endObj.setDate(endObj.getDate() + 1); 
    let exclusiveEndDate = endObj.toISOString().split('T')[0];

    allCalendarEvents.push({
      id: `coach-${ev.id}`,
      title: ev.title,
      start: ev.start_date,
      end: ev.start_date !== ev.end_date ? exclusiveEndDate : undefined,
      date: ev.start_date === ev.end_date ? ev.start_date : undefined,
      allDay: true,
      backgroundColor: ev.color || '#3b82f6',
      borderColor: ev.color || '#3b82f6',
      extendedProps: { type: 'coach', ...ev }
    });
  });

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (method.toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if (method.toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
      <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">
          {isLoading ? <FiLoader className="animate-spin text-xl mt-2 text-amber-500" /> : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/transactions"><StatCard title="Total Revenue" value={`â‚± ${stats.revenue.toLocaleString()}`} icon={<FiDollarSign size={28} strokeWidth={2.5} />} colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" /></Link>
        <Link to="/members"><StatCard title="Total Members" value={stats.members} icon={<FiUsers size={28} strokeWidth={2.5} />} colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" /></Link>
        <Link to="/subscriptions"><StatCard title="Active Subs" value={stats.activeSubs} icon={<FiCheckCircle size={28} strokeWidth={2.5} />} colorClass="bg-purple-800 text-white shadow-lg shadow-purple-700/40 dark:shadow-none" /></Link>
        <Link to="/reports"><StatCard title="Transactions" value={stats.reports} icon={<FiFileText size={28} strokeWidth={2.5} />} colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" /></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Revenue Growth (Last 6 Months)</h3>
          <div className="flex-1 min-h-[250px] relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <FiLoader className="animate-spin text-amber-500 text-3xl" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6b7280" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `â‚±${val}`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1f2937', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-700">
            <FiAlertCircle size={20} strokeWidth={2.5} />
            <h3 className="text-lg font-bold">Expiring within 7 Days</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {isLoading ? (
               <div className="flex justify-center py-10"><FiLoader className="animate-spin text-amber-500 text-2xl" /></div>
            ) : expiringSoon.length === 0 ? (
               <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">No memberships expiring soon.</div>
            ) : (
              expiringSoon.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/30">
                  <span className="font-normal text-slate-800 dark:text-gray-200">{item.name}</span>
                  <span className="text-xs font-normal text-red-600 dark:text-red-400">{item.days} days left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Recently Added Members</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentMembers.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No members found.</div>
            ) : (
              recentMembers.map((name, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <span className="font-semibold text-slate-700 dark:text-gray-300">{name}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50">New</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-4">Recent Transactions</h3>
          <ul className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-6"><FiLoader className="animate-spin text-amber-500" /></div>
            ) : recentTxns.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">No transactions found.</div>
            ) : (
              recentTxns.map((txn, i) => (
                <li key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 animate-in fade-in slide-in-from-top-2">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-slate-800 dark:text-gray-300 text-sm font-semibold truncate">{txn.memberName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{txn.type}</span>
                      <span className={getMethodBadge(txn.method)}>
                        {txn.method}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-500 whitespace-nowrap">{Number(txn.amount) > 0 ? '+' : '-'} â‚±{Math.abs(txn.amount)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm w-full overflow-x-auto relative">
        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 mb-6">Schedules & Subscriptions</h3>
        
        {isLoading ? (
           <div className="h-[400px] flex items-center justify-center">
              <FiLoader className="animate-spin text-amber-500 text-4xl" />
           </div>
        ) : (
          <div className="min-w-[700px] text-slate-800 dark:text-gray-200">
            <style>{`
              .fc { --fc-border-color: #d1d5db; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); }
              .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-list-event-hover-bg-color: rgba(255,255,255,0.05); }
              .fc .fc-button-primary { background-color: #e5e7eb; border-color: transparent; color: #4b5563; text-transform: capitalize; font-weight: 700 !important; border-radius: 0.5rem !important; margin: 0 4px !important; transition: all 0.2s; }
              .dark .fc .fc-button-primary { background-color: #1f2937; color: #d1d5db; }
              .fc .fc-button-primary:hover { background-color: #d1d5db; }
              .dark .fc .fc-button-primary:hover { background-color: #374151; }
              .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:disabled { background: linear-gradient(to right, #facc15, #f59e0b) !important; border-color: transparent !important; color: #000 !important; box-shadow: 0 4px 14px -3px rgba(217, 119, 6, 0.3) !important; opacity: 1 !important; }
              
              /* Explicitly disable pointer cursors for events in Dashboard */
              .fc-daygrid-event, .fc-timegrid-event { 
                  border-radius: 6px; padding: 2px 4px; font-weight: 800; font-size: 0.65rem; border: 1px solid rgba(255,255,255,0.2) !important; color: white !important; cursor: default !important; margin: 2px !important; 
              }
              .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }
              .fc-daygrid-more-link { color: #4b5563 !important; font-weight: 800 !important; font-size: 0.75rem !important; margin-top: 2px; display: block; text-align: left; padding-left: 6px; }
              .dark .fc-daygrid-more-link { color: #d1d5db !important; }
              .fc-list-event-title a { color: #1f2937 !important; font-weight: 700; cursor: default !important; }
              .dark .fc-list-event-title a { color: #d1d5db !important; }
              .fc-list-event-time { color: #6b7280 !important; font-weight: 600; }
              .dark .fc-list-event-time { color: #9ca3af !important; }
              .fc-list-day-cushion { background-color: #f3f4f6 !important; font-weight: 800; text-transform: uppercase; padding: 8px 14px !important; }
              .dark .fc-list-day-cushion { background-color: #1f2937 !important; color: #d1d5db; }
              .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; }
              .fc-daygrid-day-number { font-weight: 600; padding: 4px 8px !important; }
              .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.05) !important; }
              .dark .fc-today-bg-color { background-color: rgba(245, 158, 11, 0.15) !important; }
              .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important; overflow: hidden; }
              .dark .fc-popover { background-color: #1e293b !important; border-color: #334155 !important; }
              .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important;}
              .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important;}
              .fc-popover-title { font-weight: 800 !important; font-size: 0.9rem !important; color: #0f172a !important; }
              .dark .fc-popover-title { color: #f8fafc !important; }
              .fc-popover-body { padding: 12px !important; }
            `}</style>
            
            <FullCalendar
              plugins={[dayGridPlugin, listPlugin]} // Interaction plugin intentionally removed for strict view-only
              initialView="dayGridMonth"
              dayMaxEvents={2}
              displayEventTime={false}
              editable={false}
              selectable={false}
              moreLinkContent={(arg) => `+${arg.num} more`}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listWeek'
              }}
              events={allCalendarEvents}
              height="auto"
            />
          </div>
        )}
      </div>

    </div>
  );
}

=== GestureMonitor.jsx ===
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

=== Login.jsx ===
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiLoader, FiAlertCircle } from 'react-icons/fi';

import loginBg from '../assets/Login.jpg'; 
import logo from '../assets/logo.png'; 

export default function Login() {
  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_name', data.admin.name); 
            // Force reload to update App.jsx authentication state properly
            window.location.href = '/Overview'; 
        } else {
            if (data.errors && data.errors.email) {
                throw new Error(data.errors.email[0]);
            }
            throw new Error(data.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error("Login failed:", error);
        setErrorMsg(error.message || 'Network error. Cannot connect to the server.');
    } finally {
        setIsLoading(false);
    }
  };

  // SOFTENED INPUT CLASSES
  const inputClass = "w-full pl-12 pr-10 py-3.5 bg-slate-800/80 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-gray-200 font-medium transition-all shadow-inner placeholder-gray-500";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2.5 ml-1";

  return (
    // SOFTENED BACKGROUND: Changed from #030303 to slate-900
    <div className="min-h-screen w-full relative bg-slate-900 text-gray-200 overflow-hidden font-sans">
      
      <div className="hidden lg:block absolute top-0 left-0 w-[65%] h-full z-0">
        <div 
          className="absolute inset-0 bg-cover bg-left-center mix-blend-lighten opacity-80"
          style={{ backgroundImage: `url(${loginBg})` }}
        ></div>
        {/* Softened Gradient to match slate-900 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-900/40 via-50% to-slate-900 to-100%"></div>
      </div>

      <div className="relative z-10 flex w-full h-screen">
        
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="p-1 bg-white/10 backdrop-blur-md rounded-full border-2 border-slate-400/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
              <img src={logo} alt="Double Alpha Logo" className="w-12 h-12 rounded-full object-cover" />
            </div>
            <span className="font-black italic text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-orange text-[1.1rem] leading-none uppercase tracking-tight">Double Alpha</span>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 relative z-10">
          
          <div className="max-w-[420px] w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pointer-events-auto">
            
            <div className="flex flex-col items-center lg:hidden mb-10">
              <img src={logo} alt="Logo" className="w-20 h-20 mb-4 rounded-full border-2 border-slate-500/50 bg-white/10 backdrop-blur-md shadow-lg p-1 object-cover" />
              <h2 className="text-2xl font-black text-white text-center tracking-tight">Double Alpha</h2>
            </div>

            <div className="text-left mb-10 border-l-4 border-amber-500 pl-5 py-1">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                System <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-500">Login</span>
              </h2>
              <p className="text-slate-400 mt-2.5 font-medium text-sm tracking-wide">
                Enter your administrator credentials to secure access to the hub.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in">
                  <FiAlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm font-bold text-red-300">
                    {errorMsg}
                  </p>
                </div>
              )}

              <div>
                <label className={labelClass}>Admin Email</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors text-lg" />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@example.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2.5 ml-1">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">Security Key</label>
                  <a href="#" className="text-[11px] font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider">Recovery?</a>
                </div>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors text-lg" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className={inputClass}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gray-300 transition-colors focus:outline-none"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 ml-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 text-amber-500 bg-slate-800 border-slate-600 rounded focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer transition-all" 
                />
                <label htmlFor="remember" className="text-sm font-bold text-slate-400 cursor-pointer select-none hover:text-gray-200 transition-colors">
                  Remember me
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 py-4 rounded-xl font-black shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest mt-8 text-sm"
              >
                {isLoading ? <FiLoader className="animate-spin" size={20} /> : <FiLogIn size={20} />}
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>
              
            </form>
            
            <div className="pt-12 text-center border-t border-slate-800 mt-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Double Alpha Fitness v1.0 <br/> Tagoloan Community College Capstone
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

=== Members.jsx ===
import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiCamera, 
  FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiUsers, FiUpload,
  FiLoader, FiSave, FiX, FiCheckCircle, FiVideoOff, FiEye,
  FiActivity, FiCalendar, FiClock, FiMail, FiPhone, FiMapPin, FiLock, FiList, FiAlertCircle
} from 'react-icons/fi';
import api from '../api';
import AvatarEditor from 'react-avatar-editor';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const getBmiInfo = (height, weight) => {
  if (!height || !weight) return { value: 'N/A', label: 'Need Data', color: 'bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500' };
  
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const numBmi = parseFloat(bmi);

  if (numBmi < 16) return { value: bmi, label: 'Severe Thinness', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  if (numBmi >= 16 && numBmi < 17) return { value: bmi, label: 'Moderate Thin', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (numBmi >= 17 && numBmi < 18.5) return { value: bmi, label: 'Mild Thinness', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (numBmi >= 18.5 && numBmi < 25) return { value: bmi, label: 'Normal', color: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50' };
  if (numBmi >= 25 && numBmi < 30) return { value: bmi, label: 'Overweight', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (numBmi >= 30 && numBmi < 35) return { value: bmi, label: 'Obese Class I', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (numBmi >= 35 && numBmi < 40) return { value: bmi, label: 'Obese Class II', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  return { value: bmi, label: 'Obese Class III', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
};

const getTaskStatus = (log) => {
  const isAssigned = log.exercise.startsWith('ASSIGNED: ');
  if (!isAssigned) return 'VERIFIED';
  
  const logDate = new Date(log.created_at);
  const now = new Date();
  
  const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (logDay < todayDay) return 'MISSED';
  
  if (logDay.getTime() === todayDay.getTime()) {
      const isPast930PM = now.getHours() > 21 || (now.getHours() === 21 && now.getMinutes() >= 30);
      if (isPast930PM) return 'MISSED';
      return 'PENDING';
  }
  
  return 'PENDING';
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  
  const [activeProfileTab, setActiveProfileTab] = useState('workouts');
  const [profileAttendance, setProfileAttendance] = useState([]);
  const [profileWorkouts, setProfileWorkouts] = useState([]);
  
  const [workoutPage, setWorkoutPage] = useState(1);
  const [expandedDate, setExpandedDate] = useState(null);

  const [exercisesLib, setExercisesLib] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const defaultRoutine = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
  const [weeklyRoutine, setWeeklyRoutine] = useState(defaultRoutine);
  const [activeDay, setActiveDay] = useState('Monday');

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleManualVerify = async (logId) => {
    try {
      await api.put(`/workouts/${logId}/manual-verify`);
      const workRes = await api.get(`/members/${selectedProfile.id}/workouts`);
      setProfileWorkouts(workRes.data);
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const handleAssignWeeklyPlan = async () => {
    localStorage.setItem(`routine_${selectedProfile.id}`, JSON.stringify(weeklyRoutine));
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaysExercises = weeklyRoutine[currentDayName] || [];

    try {
        for (let ex of todaysExercises) {
            await api.post(`/members/${selectedProfile.id}/assign-task`, { exercise: ex.name.toUpperCase() }).catch(()=>{});
        }
        setAlertDialog({ 
            isOpen: true, 
            title: 'Plan Saved', 
            message: `âœ… Weekly routine saved! Today's tasks (${currentDayName}) have been dispatched to the AI for monitoring.`, 
            type: 'success' 
        });
        
        const workRes = await api.get(`/members/${selectedProfile.id}/workouts`);
        setProfileWorkouts(workRes.data);
    } catch (error) {
        console.error("Failed to assign plan", error);
        setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to assign workout plan.', type: 'error' });
    }
  };

  const handleAddExercise = (ex) => {
      if(!weeklyRoutine[activeDay].some(e => e.id === ex.id)) {
          setWeeklyRoutine({...weeklyRoutine, [activeDay]: [...weeklyRoutine[activeDay], ex]});
      }
  };

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const defaultForm = {
    id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active', 
    enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [profilePic, setProfilePic] = useState(null);
  const editorRef = useRef(null);
  const [editorScale, setEditorScale] = useState(1.2);

  const fetchMembers = async () => {
    setIsLoadingData(true);
    try {
      const response = await api.get('/members');
      const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const formattedMembers = dataArray.map(dbMember => ({
        id: dbMember.id,
        firstName: dbMember.first_name,
        lastName: dbMember.last_name,
        email: dbMember.email,
        phone: dbMember.phone,
        address: dbMember.address || '',
        plan: dbMember.plan,
        status: dbMember.status,
        enrolledFaceId: dbMember.enrolled_face_id,
        profilePicUrl: dbMember.profile_pic ? `http://127.0.0.1:8000${dbMember.profile_pic}` : null,
        dob: dbMember.dob || '',
        height: dbMember.height || '',
        weight: dbMember.weight || '',
        customerSince: new Date(dbMember.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }));
      setMembers(formattedMembers);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    fetchMembers();
    
    // Fetch frontend exercise dictionary for the Coach Plan tab
    fetch('/dataset/data/exercises.json')
      .then(res => res.json())
      .then(data => {
        if (data.data) setExercisesLib(data.data);
        else setExercisesLib(data);
      })
      .catch(err => console.error("Could not load local exercises", err));

    return () => stopCamera();
  }, []);

  const handleOpenAddModal = () => {
    setFormData(defaultForm);
    setProfilePic(null);
    setFaceImage(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setFormData(member);
    setProfilePic(null);
    setFaceImage(member.enrolledFaceId ? 'existing_data' : null); 
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Member',
      message: 'Are you sure you want to completely remove this member? All associated data will be lost.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/members/${id}`); 
          setMembers(members.filter(m => m.id !== id)); 
        } catch (error) {
          console.error("Failed to delete member:", error);
          if (error.response && error.response.data && error.response.data.message) {
            setAlertDialog({ isOpen: true, title: 'Action Denied', message: error.response.data.message, type: 'error' });
          } else {
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to connect to the server or database.', type: 'error' });
          }
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const getCroppedImageBlob = () => {
    return new Promise((resolve) => {
      if (editorRef.current) {
        const canvas = editorRef.current.getImageScaledToCanvas();
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8); 
      } else {
        resolve(null);
      }
    });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append('first_name', formData.firstName);
    formDataToSend.append('last_name', formData.lastName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('plan', formData.plan);
    formDataToSend.append('status', formData.status);
    
    if (formData.dob) formDataToSend.append('dob', formData.dob);
    if (formData.height) formDataToSend.append('height', formData.height);
    if (formData.weight) formDataToSend.append('weight', formData.weight);
    
    if (faceImage && faceImage !== 'existing_data') {
      formDataToSend.append('enrolled_face_id', faceImage);
    }

    if (profilePic && editorRef.current) {
      const croppedBlob = await getCroppedImageBlob();
      if (croppedBlob) {
        formDataToSend.append('profile_pic', croppedBlob, 'profile.jpg'); 
      }
    } else if (profilePic) {
      formDataToSend.append('profile_pic', profilePic);
    }

    try {
      if (isEditing) {
        formDataToSend.append('_method', 'PUT');
        await api.post(`/members/${formData.id}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/members', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await fetchMembers(); 
      handleCloseModal();
      
      fetch('http://127.0.0.1:5000/refresh_ai', { method: 'POST' }).catch(() => {});
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Member profile saved successfully!', type: 'success' });

    } catch (error) {
      console.error("Failed to save member:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
        setAlertDialog({ isOpen: true, title: 'Action Denied', message: errorMessages, type: 'error' });
      } else if (error.response && error.response.data && error.response.data.message) {
        setAlertDialog({ isOpen: true, title: 'Server Error', message: error.response.data.message, type: 'error' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save data. Please check your connection.', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (e, field) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-Z\s-Ã±Ã‘]/g, '');
    setFormData({ ...formData, [field]: lettersOnly });
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, phone: digitsOnly });
  };

  const startCamera = async () => {
    setFaceImage(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setAlertDialog({ isOpen: true, title: 'Camera Error', message: 'Could not access camera. Please ensure permissions are granted.', type: 'error' });
      setIsCameraActive(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const size = Math.min(video.videoWidth, video.videoHeight);
      const xOffset = (video.videoWidth - size) / 2;
      const yOffset = (video.videoHeight - size) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, xOffset, yOffset, size, size, 0, 0, canvas.width, canvas.height);
      context.restore();
      const imageData = canvas.toDataURL('image/png');
      setFaceImage(imageData);
      stopCamera();
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  const getStatusBadge = (status) => {
    const badgeBase = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') {
      return <span className={`${badgeBase} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    }
    if (status === 'Inactive') {
      return <span className={`${badgeBase} bg-slate-50 text-slate-700 border-slate-500 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/50`}>Inactive</span>;
    }
    return <span className={`${badgeBase} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const getInitials = (first, last) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  
  const formBmiData = getBmiInfo(formData.height, formData.weight);

  const groupedWorkouts = Object.values(profileWorkouts.reduce((acc, log) => {
    const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, exercises: [] };
    acc[dateStr].exercises.push(log);
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const workoutsPerPage = 5; 
  const totalWorkoutPages = Math.ceil(groupedWorkouts.length / workoutsPerPage);
  const currentGroupedWorkouts = groupedWorkouts.slice((workoutPage - 1) * workoutsPerPage, workoutPage * workoutsPerPage);

  const toggleDropdownRow = (dateStr) => {
      setExpandedDate(prev => prev === dateStr ? null : dateStr);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div></div>
        <button onClick={handleOpenAddModal} className={primaryButtonClass}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input 
            type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-sm border-2 border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
            <FiUsers size={18} />
            <span>{filteredMembers.length} TOTAL MEMBERS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Member Details</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Address</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Membership Plan</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Customer Since</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
              {isLoadingData ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No members found in the database.
                  </td>
                </tr>
              ) : (
                currentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-b border-gray-200 dark:border-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {member.profilePicUrl ? (
                          <img 
                            src={member.profilePicUrl} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-sm">
                            {getInitials(member.firstName, member.lastName)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-gray-300">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-gray-300 font-normal whitespace-nowrap">{member.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-gray-300 font-normal truncate max-w-[150px]">{member.address || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-gray-400 whitespace-nowrap">{member.plan}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400 font-normal whitespace-nowrap">{member.customerSince}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      
                      <button onClick={async () => { 
                          setSelectedProfile(member);
                          setCoachNotes(localStorage.getItem(`notes_${member.id}`) || '');
                          
                          // Auto-load their saved weekly plan
                          const savedRoutine = localStorage.getItem(`routine_${member.id}`);
                          if(savedRoutine) setWeeklyRoutine(JSON.parse(savedRoutine));
                          else setWeeklyRoutine(defaultRoutine);
                          setActiveDay('Monday');

                          setIsProfileModalOpen(true); 
                          setActiveProfileTab('workouts'); 
                          setWorkoutPage(1); 
                          setExpandedDate(null); 
                          
                          try {
                            const attRes = await api.get(`/members/${member.id}/attendance`);
                            setProfileAttendance(attRes.data);

                            const workRes = await api.get(`/members/${member.id}/workouts`);
                            setProfileWorkouts(workRes.data);
                          } catch (err) { console.error("Failed to load profile logs", err); }

                        }} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
                        <FiEye size={16} strokeWidth={2.5} />
                      </button>

                      <button onClick={() => handleOpenEditModal(member)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      
                      <button onClick={() => handleDelete(member.id)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingId === member.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- ADDED BOTTOM PAGINATION HERE --- */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMembers.length)} of {filteredMembers.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
              {generatePageNumbers()}
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
            </div>
          </div>
        )}

      </div>

      {/* --- ADD / EDIT MEMBER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <div className="p-6 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">{isEditing ? `Edit Member Profile` : `Add New Member`}</h3>
              <button onClick={handleCloseModal} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white dark:bg-[#252830] hidden-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
                  <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Display Picture</h4>
                  
                  {profilePic ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="rounded-full overflow-hidden border-4 border-amber-500 shadow-lg">
                        <AvatarEditor
                          ref={editorRef}
                          image={profilePic}
                          width={150}
                          height={150}
                          border={0}
                          borderRadius={75}
                          color={[255, 255, 255, 0.6]}
                          scale={editorScale}
                          rotate={0}
                        />
                      </div>
                      
                      <div className="w-full max-w-[200px] flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">-</span>
                        <input 
                          type="range" 
                          min="1" max="3" step="0.01" 
                          value={editorScale} 
                          onChange={(e) => setEditorScale(parseFloat(e.target.value))} 
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-400">+</span>
                      </div>

                      <button type="button" onClick={() => { setProfilePic(null); setEditorScale(1.2); }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">
                        Cancel / Pick New Image
                      </button>
                    </div>
                  ) : (
                    <label className="relative group cursor-pointer mt-2">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-[#252830] group-hover:border-amber-500 transition-colors overflow-hidden">
                        
                        {formData.profilePicUrl ? (
                          <img src={formData.profilePicUrl} alt="Existing Profile" className="w-full h-full object-cover" />
                        ) : (
                          <FiUpload className="text-gray-400 group-hover:text-amber-500" size={24} />
                        )}

                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          setProfilePic(e.target.files[0]);
                          setEditorScale(1.2);
                      }} />
                    </label>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
                  <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>
                  <div className={`mt-2 w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${faceImage ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : isCameraActive ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-gray-200 dark:bg-[#252830] border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                     <canvas ref={canvasRef} width="300" height="300" className="hidden"></canvas>
                     {faceImage ? (
                       <div className="relative w-full h-full group">
                         {faceImage === 'existing_data' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-green-500">
                              <FiCheckCircle size={32} />
                              <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Data Saved</span>
                            </div>
                         ) : (
                            <img src={faceImage} alt="Captured Face" className="w-full h-full object-cover" />
                         )}
                         <button onClick={() => { setFaceImage(null); startCamera(); }} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">Retake</button>
                       </div>
                     ) : isCameraActive ? (
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                     ) : (
                       <FiCamera size={32} />
                     )}
                  </div>
                  {!faceImage && <button type="button" onClick={isCameraActive ? captureFace : startCamera} className={`mt-1 text-xs font-bold hover:underline px-4 py-1.5 rounded-full transition-colors ${isCameraActive ? 'bg-amber-500 text-black shadow-md no-underline hover:bg-amber-400' : 'text-amber-600 dark:text-amber-500'}`}>{isCameraActive ? 'Capture Photo' : 'Scan Face Data Now'}</button>}
                  {isCameraActive && <button type="button" onClick={stopCamera} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1"><FiVideoOff /> Cancel</button>}
                </div>
              </div>

              <form id="memberForm" className="space-y-6" onSubmit={handleSaveMember}>
                <div>
                  <h4 className="text-lg font-bold border-b-2 border-gray-200 dark:border-gray-700/50 pb-2 mb-4 text-slate-800 dark:text-gray-300">Personal Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <label className="block"><span className={labelClass}>First Name</span><input type="text" required value={formData.firstName} onChange={(e) => handleNameChange(e, 'firstName')} className={inputClass} placeholder="Juan" /></label>
                    <label className="block"><span className={labelClass}>Last Name</span><input type="text" required value={formData.lastName} onChange={(e) => handleNameChange(e, 'lastName')} className={inputClass} placeholder="Dela Cruz" /></label>
                    <label className="block"><span className={labelClass}>Email</span><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="juan@email.com" /></label>
                    
                    <label className="block lg:col-span-2"><span className={labelClass}>Address</span><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={inputClass} placeholder="123 Gym Street, Tagoloan" /></label>
                    <label className="block"><span className={labelClass}>Phone Number</span><input type="text" required value={formData.phone} onChange={handlePhoneChange} className={inputClass} placeholder="09171234567" /><span className="text-[10px] text-gray-400 font-medium float-right mt-1">{formData.phone.length}/11</span></label>
                    
                    {/* ANTHROPOMETRICS */}
                    <label className="block"><span className={labelClass}>Date of Birth</span><input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Height (cm)</span><input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className={inputClass} placeholder="170" /></label>
                    <label className="block"><span className={labelClass}>Weight (kg)</span><input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className={inputClass} placeholder="65" /></label>
                    
                    {/* Dynamic BMI Display */}
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-100 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-xs">Body Mass Index (BMI)</span>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm mt-1.5 w-fit ${formBmiData.color}`}>
                          {formBmiData.label}
                        </span>
                      </div>
                      <span className="font-bold text-2xl text-slate-900 dark:text-gray-300">
                        {formBmiData.value}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
              <button form="memberForm" type="submit" disabled={isSaving || (formData.phone.length > 0 && formData.phone.length < 11)} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Member')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPREHENSIVE PROFILE LIBRARY MODAL --- */}
      {isProfileModalOpen && selectedProfile && (() => {
        const profileBmiData = getBmiInfo(selectedProfile.height, selectedProfile.weight);
        
        // Maps the attendance data so FullCalendar can render it
        const attendanceEvents = profileAttendance.map(log => ({
            id: log.id,
            title: `Checked In: ${log.time_in}`,
            date: log.date,
            color: '#10b981' // Green
        }));

        return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#252830] rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600 relative">
            
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-700 dark:text-gray-300 backdrop-blur-md">
                <FiX size={24} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
              
              {/* Left Sidebar: Profile Summary */}
              <div className="w-full lg:w-[32%] bg-gray-50 dark:bg-[#1a1c23] border-r-2 border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center flex-shrink-0 overflow-y-auto hidden-scrollbar">
                
                <div className="relative mb-4 group mt-2">
                  {selectedProfile.profilePicUrl ? (
                    <img src={selectedProfile.profilePicUrl} alt="Avatar" className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg" />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-4xl border-4 border-white dark:border-gray-600 shadow-lg">
                      {getInitials(selectedProfile.firstName, selectedProfile.lastName)}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-gray-300 text-center tracking-tight">
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </h2>
                <p className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest text-xs mt-1 mb-6">
                  {selectedProfile.plan}
                </p>

                <div className="w-full space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <FiMapPin className="text-amber-500 flex-shrink-0" size={16} />
                    <span className="truncate">{selectedProfile.address || 'No Address Provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <FiPhone className="text-amber-500 flex-shrink-0" size={16} />
                    <span>{selectedProfile.phone}</span>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Body Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Age</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-gray-300">{calculateAge(selectedProfile.dob)}</p>
                    </div>
                    {/* Enlarged BMI Display */}
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">BMI</p>
                      <p className={`text-4xl font-black leading-none my-1.5 text-slate-900 dark:text-gray-300 tracking-tighter`}>
                        {profileBmiData.value}
                      </p>
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${profileBmiData.color}`}>
                        {profileBmiData.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Height</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{selectedProfile.height || '-'} cm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Weight</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{selectedProfile.weight || '-'} kg</p>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Account Status</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${selectedProfile.enrolledFaceId ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <FiCamera size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Face ID</p>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{selectedProfile.enrolledFaceId ? 'Active & Synced' : 'Not Enrolled'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${selectedProfile.status === 'Active' ? 'bg-green-500' : (selectedProfile.status === 'Inactive' ? 'bg-slate-500' : 'bg-red-500')}`}>
                        <FiCheckCircle size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Membership</p>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{selectedProfile.status === 'Active' ? 'Valid Access' : (selectedProfile.status === 'Inactive' ? 'Inactive Account' : 'Expired/Suspended')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* --- COACH NOTES --- */}
                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mt-6 mb-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Coach Notes</h4>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 dark:text-gray-300 transition-colors min-h-[100px]" 
                    placeholder="Add Additional Notes here..."
                    value={coachNotes}
                    onChange={(e) => {
                      setCoachNotes(e.target.value);
                      localStorage.setItem(`notes_${selectedProfile.id}`, e.target.value);
                    }}
                  ></textarea>
                </div>

              </div>

              {/* Right Content: Tabs & Data */}
              <div className="w-full lg:w-[68%] flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
                
                {/* Tabs */}
                <div className="flex items-center gap-6 px-8 pt-6 border-b-2 border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto hidden-scrollbar">
                  <button onClick={() => setActiveProfileTab('workouts')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'workouts' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Workout Logs
                    {activeProfileTab === 'workouts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                  <button onClick={() => setActiveProfileTab('attendance')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'attendance' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Attendance Calendar
                    {activeProfileTab === 'attendance' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                  <button onClick={() => setActiveProfileTab('plan')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'plan' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Coach's Training Plan
                    {activeProfileTab === 'plan' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 p-8 flex flex-col min-h-0 overflow-hidden">

                  {/* OVERHAULED ATTENDANCE DATA (Calendar View) */}
                  {activeProfileTab === 'attendance' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-0">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#252830] shadow-sm relative flex-1 overflow-hidden flex flex-col min-h-0">
                          <style>{`
                            .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); color: #4b5563; }
                            .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
                            
                            /* Amber-Gradient Buttons exactly matching the Dashboard */
                            .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000000 !important; text-transform: capitalize !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; transition: all 0.2s ease !important; margin: 0 4px !important; }
                            .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
                            .fc .fc-button-primary:hover { background-color: #e2e8f0 !important; color: #000000 !important; }
                            .dark .fc .fc-button-primary:hover { background-color: #334155 !important; color: #ffffff !important; }
                            .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:disabled { background: linear-gradient(to right, #fbbf24, #f59e0b) !important; border-color: transparent !important; color: #000 !important; box-shadow: 0 4px 10px -2px rgba(245, 158, 11, 0.3) !important; opacity: 1 !important; }
                            
                            .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000000; }
                            .dark .fc-toolbar-title { color: #d1d5db !important; }
                            .fc-scrollgrid { border: none !important; }
                            .dark .fc-scrollgrid { border-color: #334155 !important; }
                            .fc-theme-standard th { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; padding: 12px 0 !important; }
                            .dark .fc-theme-standard th { border-color: #334155 !important; }
                            .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; border-right: 1px solid var(--fc-border-color) !important; }
                            .dark .fc-theme-standard td { border-color: #334155 !important; }
                            .fc-theme-standard td:last-child { border-right: none !important; }
                            .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; color: #0f172a !important; text-decoration: none !important; padding: 4px 0 !important;}
                            .dark .fc-col-header-cell-cushion { color: #f8fafc !important; }
                            .fc-daygrid-day-number { font-weight: 600; font-size: 0.8rem; padding: 8px !important; color: #475569 !important; text-decoration: none !important; }
                            .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }
                            
                            .fc-daygrid-event { border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.2) !important; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important; transition: transform 0.1s ease, box-shadow 0.1s ease; }
                            .fc-daygrid-event:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 4px 8px rgba(0,0,0,0.25) !important; z-index: 5; }
                            .fc-daygrid-event-dot { display: none !important; } 
                            .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }

                            /* ÃƒÂ°Ã…Â¸Ã¢â‚¬ Ã‚Â´ NEW: Completely nuke all internal scrollbars to force a clean fit */
                            .fc-scroller::-webkit-scrollbar { display: none !important; }
                            .fc-scroller { -ms-overflow-style: none; scrollbar-width: none; overflow: hidden !important; }
                          `}</style>
                          <div className="flex-1 min-h-0 overflow-hidden">
                              <FullCalendar
                                plugins={[dayGridPlugin]}
                                initialView="dayGridMonth"
                                events={attendanceEvents}
                                height="100%"
                                contentHeight="100%"
                                expandRows={true}
                                headerToolbar={{
                                  left: 'prev,next',
                                  center: 'title',
                                  right: 'today'
                                }}
                              />
                          </div>
                      </div>
                    </div>
                  )}

                  {/* REAL WORKOUTS DATA ACCORDION */}
                  {activeProfileTab === 'workouts' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col gap-4 min-h-0">
                      
                      {/* Pagination Controls */}
                      {totalWorkoutPages > 1 && (
                          <div className="flex justify-end flex-shrink-0">
                              <div className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                                  <button onClick={() => setWorkoutPage(p => Math.max(1, p - 1))} disabled={workoutPage === 1} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronLeft size={16} /></button>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300">Page {workoutPage} of {totalWorkoutPages}</span>
                                  <button onClick={() => setWorkoutPage(p => Math.min(totalWorkoutPages, p + 1))} disabled={workoutPage === totalWorkoutPages} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronRight size={16} /></button>
                              </div>
                          </div>
                      )}

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto shadow-sm flex-1 hidden-scrollbar bg-white dark:bg-[#252830]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a1c23] border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <tr>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Date</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Exercises Logged</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {currentGroupedWorkouts.length === 0 ? (
                               <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">No workout history logged yet.</td></tr>
                            ) : (
                               currentGroupedWorkouts.map((group, idx) => {
                                  const isExpanded = expandedDate === group.date;

                                  const totalTasks = group.exercises.length;
                                  const verifiedTasks = group.exercises.filter(log => getTaskStatus(log) === 'VERIFIED').length;
                                  
                                  // Check if today for biometric lock
                                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) === group.date;
                                  const hasFaceIdToday = isToday ? profileAttendance.some(att => att.date === new Date().toISOString().split('T')[0]) : true;

                                  let groupBadge;
                                  if (verifiedTasks === totalTasks) {
                                      groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">VERIFIED</span>;
                                  } else if (verifiedTasks > 0 && verifiedTasks < totalTasks) {
                                      groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">INCOMPLETE</span>;
                                  } else {
                                      const hasPending = group.exercises.some(log => getTaskStatus(log) === 'PENDING');
                                      if (hasPending) {
                                          groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">PENDING</span>;
                                      } else {
                                          groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-500/30 dark:bg-red-500/10 dark:text-red-400">MISSED</span>;
                                      }
                                  }

                                  return (
                                     <React.Fragment key={idx}>
                                       <tr onClick={() => toggleDropdownRow(group.date)} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer group">
                                         <td className="px-6 py-4 whitespace-nowrap text-center">
                                           <div className="font-bold text-slate-800 dark:text-gray-200 text-sm flex items-center justify-center">
                                               {group.date}
                                           </div>
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                                              {group.exercises.length} Exercises Recorded
                                            </span>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex items-center justify-center gap-3">
                                               {groupBadge}
                                               {isExpanded ? <FiChevronUp className="text-gray-400" size={18} /> : <FiChevronDown className="text-gray-400 group-hover:text-amber-500 transition-colors" size={18} />}
                                           </div>
                                         </td>
                                       </tr>

                                       {/* --- EXPANDED ROW CONTENT (THE BADGES) --- */}
                                       {isExpanded && (
                                          <tr className="bg-gray-50/50 dark:bg-[#1a1c23]/50 shadow-inner">
                                            <td colSpan="3" className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2">
                                              <div className="flex flex-wrap gap-2 justify-center">
                                                  {group.exercises.map(log => {
                                                      const taskStatus = getTaskStatus(log);
                                                      const exName = log.exercise.replace('ASSIGNED: ', '');
                                                      const timeFormatted = new Date(log.created_at).toLocaleTimeString('en-US', { timeStyle: 'short' });
                                                      
                                                      let badgeClass = '';
                                                      if (taskStatus === 'VERIFIED') {
                                                          badgeClass = 'bg-white border-green-200 text-green-700 dark:bg-[#252830] dark:border-green-500/50 dark:text-green-400';
                                                      } else if (taskStatus === 'PENDING') {
                                                          badgeClass = 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400';
                                                      } else {
                                                          badgeClass = 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400';
                                                      }

                                                      return (
                                                          <div key={log.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                                                              <span>{exName}</span>
                                                              <span className="opacity-60 font-medium ml-0.5 border-l pl-1.5 border-current">({timeFormatted})</span>
                                                              {taskStatus === 'PENDING' && (
                                                                  hasFaceIdToday ? (
                                                                      <button onClick={() => handleManualVerify(log.id)} className="ml-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] transition-colors active:scale-95 shadow-sm" title="Manually Verify">
                                                                          VERIFY
                                                                      </button>
                                                                  ) : (
                                                                      <span className="ml-1 opacity-50 cursor-not-allowed" title="Locked: No Face ID Today"><FiLock size={12}/></span>
                                                                  )
                                                              )}
                                                              {taskStatus === 'MISSED' && (
                                                                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 rounded text-[9px]">MISSED</span>
                                                              )}
                                                              {taskStatus === 'VERIFIED' && (
                                                                  <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 rounded text-[9px]">VERIFIED</span>
                                                              )}
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                            </td>
                                          </tr>
                                       )}
                                     </React.Fragment>
                                  );
                               })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. THE MULTI-SELECT WEEKLY SCHEDULE ASSIGNER */}
                  {activeProfileTab === 'plan' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full relative min-h-0">
                      
                      {/* --- ABSOLUTE INSET WRAPPER PREVENTS HEIGHT BLOWOUT --- */}
                      <div className="absolute inset-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#252830] shadow-sm flex flex-col sm:flex-row overflow-hidden">
                         
                         {/* Left: Exercise Library */}
                         <div className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1c23]/50 h-full">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                               <input type="text" placeholder="Search Exercise Library..." value={exSearch} onChange={e=>setExSearch(e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-[#252830] border border-gray-200 dark:border-gray-700 rounded outline-none text-slate-800 dark:text-gray-300 font-medium shadow-sm" />
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto hidden-scrollbar space-y-2">
                               {exercisesLib.filter(ex => ex.name.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 50).map(ex => {
                                   const exId = String(ex.id).padStart(4, '0');
                                   return (
                                     <div key={ex.id} className="flex items-center bg-white dark:bg-[#1a1c23] p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group">
                                        <img 
                                          src={`/dataset/videos/${exId}.gif`} 
                                          alt={ex.name} 
                                          className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-black" 
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23f1f5f9" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%2394a3b8" font-weight="bold">NO PREVIEW</text></svg>';
                                          }} 
                                        />
                                        <div className="flex-1 min-w-0 px-3">
                                           <span className="font-bold text-[11px] text-slate-800 dark:text-gray-200 truncate block" title={ex.name}>{ex.name.toUpperCase()}</span>
                                        </div>
                                        <button onClick={() => handleAddExercise(ex)} className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg font-black transition-colors flex-shrink-0">
                                            +
                                        </button>
                                     </div>
                                   )
                               })}
                            </div>
                         </div>

                         {/* Right: Selected Routine */}
                         <div className="w-full sm:w-1/2 flex flex-col bg-white dark:bg-[#252830] h-full">
                            <div className="flex w-full overflow-x-auto hidden-scrollbar border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-[#1a1c23]/50">
                               {daysOfWeek.map(day => (
                                  <button key={day} onClick={() => setActiveDay(day)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeDay === day ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-white dark:bg-[#252830]' : 'border-transparent text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}`}>
                                     {day.substring(0,3)}
                                  </button>
                               ))}
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto hidden-scrollbar space-y-2 bg-gray-50/30 dark:bg-black/10">
                               {weeklyRoutine[activeDay].length === 0 ? <p className="text-xs text-center text-gray-400 mt-6 font-medium">No exercises assigned for {activeDay}</p> : 
                                 weeklyRoutine[activeDay].map((ex, i) => (
                                   <div key={i} className="flex justify-between items-center bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-100 dark:border-amber-500/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img 
                                          src={`/dataset/videos/${String(ex.id).padStart(4, '0')}.gif`} 
                                          className="w-8 h-8 rounded border border-amber-200 dark:border-amber-500/30 object-cover flex-shrink-0" 
                                          onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23fcd34d" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%2378350f" font-weight="bold">NA</text></svg>'; 
                                          }}
                                        />
                                        <span className="font-bold text-xs text-amber-900 dark:text-amber-400 truncate block">{ex.name.toUpperCase()}</span>
                                      </div>
                                      <button onClick={() => {
                                         const newDayArr = [...weeklyRoutine[activeDay]];
                                         newDayArr.splice(i, 1);
                                         setWeeklyRoutine({...weeklyRoutine, [activeDay]: newDayArr});
                                      }} className="text-[10px] text-red-500 hover:text-red-700 font-black px-2 py-1 bg-red-100/50 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/30 rounded transition-colors flex-shrink-0">X</button>
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
      })()}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                <FiAlertCircle size={32} />
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

=== Reports.jsx ===
import { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, FiDownload, FiPrinter, FiFileText, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiActivity, FiLoader
} from 'react-icons/fi';
import api from '../api';
import { useLocation } from 'react-router-dom';

export default function Reports() {
  const location = useLocation();
  const [reportType, setReportType] = useState(location.state?.defaultTab || 'Payments');
  
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(currentMonthStart); 
  const [endDate, setEndDate] = useState(today); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [reportData, setReportData] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!reportData) setIsLoading(true);
    try {
      const res = await api.get(`/reports?start=${startDate}&end=${endDate}`);
      setReportData(res.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCSV = async () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      const currentData = reportData[reportType];
      const headers = currentData.columns.join(',');
      const rows = currentData.rows.map(row => row.join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_Report_${startDate}_to_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => window.print();

  if (isLoading || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 animate-in fade-in">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-gray-300 animate-pulse mt-4">Crunching Numbers from Database...</h2>
      </div>
    );
  }

  const currentData = reportData[reportType];
  const filteredRows = currentData.rows.filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderCellContent = (cell) => {
    const val = String(cell);
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    
    if (val === 'Active' || val === 'Checked In' || val === 'Complete' || val === 'Cash') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>{val}</span>;
    if (val === 'Expired' || val === 'Failed') return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>{val}</span>;
    if (val === 'Gcash' || val === 'Pending') return <span className={`${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`}>{val}</span>;
    if (val === 'Card' || val === 'Other') return <span className={`${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`}>{val}</span>;
    
    return val;
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#1e1e1e] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium shadow-sm transition-all outline-none";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-900 dark:text-gray-300 text-lg pointer-events-none";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-white dark:bg-[#252830] border-2 border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 15mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; background: white; color: black; }
        `}
      </style>

      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        <div id="printable-report" className="hidden print:block bg-white text-black font-sans w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Double Alpha Fitness {reportType} Records</h1>
            <p className="text-sm font-bold text-gray-600">Reporting Period: {startDate} to {endDate}</p>
          </div>
          
          <table className="w-full border-collapse border-2 border-black mb-8 text-center">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                {currentData.kpis.map((kpi, idx) => (
                  <th key={idx} className={`py-2 text-sm font-bold uppercase tracking-widest ${idx !== currentData.kpis.length - 1 ? 'border-r-2 border-black' : ''}`}>
                    {kpi.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {currentData.kpis.map((kpi, idx) => (
                  <td key={idx} className={`py-4 text-2xl font-black ${idx !== currentData.kpis.length - 1 ? 'border-r-2 border-black' : ''}`}>
                    {kpi.value}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border-2 border-black text-center text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                {currentData.columns.map((col, idx) => (
                  <th key={idx} className={`py-2 font-bold uppercase tracking-widest ${idx !== currentData.columns.length - 1 ? 'border-r-2 border-black' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-black last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`py-3 font-medium ${cellIndex !== row.length - 1 ? 'border-r-2 border-black' : ''}`}>
                      {String(cell).toUpperCase()}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={currentData.columns.length} className="py-8 font-medium">No matching records found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-right mt-4 text-xs font-bold text-gray-500">
            Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="print:hidden space-y-6">
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
            <div className="flex gap-3 w-full md:w-auto ml-auto">
              <button onClick={handlePrint} className={secondaryButtonClass}><FiPrinter size={18} /> Print PDF</button>
              <button onClick={handleExportCSV} disabled={isExporting} className={primaryButtonClass}>
                {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full relative">
              <label className={labelClass}>Report Type</label>
              <div className="relative">
                <FiFileText className={iconClass} />
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={inputClass}>
                  <option value="Payments">Payment Transactions</option>
                  <option value="Memberships">Membership Status</option>
                  <option value="Attendance">Attendance & Entry Logs</option>
                </select>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <label className={labelClass}>Start Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <label className={labelClass}>End Date</label>
              <div className="relative">
                <FiCalendar className={iconClass} />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            
            <button 
              onClick={() => {
                setStartDate(currentMonthStart);
                setEndDate(today);
              }} 
              className={primaryButtonClass} 
              style={{ minWidth: '160px' }}
            >
              <FiClock size={18} />
              This Month
            </button>
          </div>

          {/* DYNAMIC GRID: Switches between 3 and 4 columns automatically */}
          <div className={`grid grid-cols-1 gap-6 ${currentData.kpis.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
            {currentData.kpis.map((kpi, index) => {
              
              let IconComponent = FiTrendingUp;
              let colorClass = "bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none";
              const labelLower = kpi.label.toLowerCase();
              
              if (labelLower.includes('refund') || labelLower.includes('expire')) {
                IconComponent = FiTrendingDown;
                colorClass = "bg-red-800 text-white shadow-lg shadow-red-800/40 dark:shadow-none";
              } else if (labelLower.includes('transaction') || labelLower.includes('signup') || labelLower.includes('visits')) {
                IconComponent = labelLower.includes('transaction') ? FiDollarSign : FiActivity;
                colorClass = "bg-blue-800 text-white shadow-lg shadow-blue-800/40 dark:shadow-none";
              } else if (labelLower.includes('time') || labelLower.includes('pending')) {
                IconComponent = FiClock;
                colorClass = "bg-amber-600 text-white shadow-lg shadow-amber-600/40 dark:shadow-none";
              }

              return (
                <div key={index} className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
                  <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>
                    <IconComponent size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{kpi.label}</p>
                    <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">{kpi.value}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-[#252830] rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b-2 border-slate-200 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-[#1e1e1e]">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800 dark:text-gray-300 text-lg">Recent Reports</h3>
              </div>
              <input type="text" placeholder={`Search ${reportType}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 px-4 py-2 text-sm font-medium bg-white dark:bg-[#252830] border-2 border-slate-300 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 transition-all shadow-sm" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-[#1a1c23] border-b-2 border-slate-200 dark:border-slate-700/50">
                    {currentData.columns.map((col, i) => (
                      <th key={i} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                          {renderCellContent(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={currentData.columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No matching records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

=== SecurityMonitor.jsx ===
import { useState, useEffect, useRef } from 'react';
import { FiMaximize, FiCamera, FiWifiOff, FiLoader, FiUserCheck, FiArrowRight, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SecurityMonitor() {
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState('RECONNECTING'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeStreamUrl, setActiveStreamUrl] = useState("");
  
  const [liveLogs, setLiveLogs] = useState([]); 
  const [isSyncing, setIsSyncing] = useState(false);

  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleSyncAI = async () => {
    setIsSyncing(true);
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
    setIsSyncing(false);
  };
  
  const containerRef = useRef(null);
  const [cameraConfig] = useState({ name: 'Main Gym Floor', model: 'HIKVISION DS-2CD', streamUrl: `http://127.0.0.1:5000/security_feed` });

  useEffect(() => {
    setActiveStreamUrl(`${cameraConfig.streamUrl}?t=${new Date().getTime()}`);
    setConnectionState('RECONNECTING');
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const logInterval = setInterval(async () => {
      try {
        const res = await api.get('/attendance/today');
        setLiveLogs(res.data); 
      } catch (error) { console.error("Checking for new logs..."); }
    }, 1000);

    return () => { clearInterval(timer); clearInterval(logInterval); };
  }, [cameraConfig.streamUrl]);

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
              {connectionState === 'RECONNECTING' ? (
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
                alt="Live CCTV" 
                onLoad={() => setConnectionState('LIVE')}
                onError={() => {
                  setConnectionState('DISCONNECTED');
                  setTimeout(() => {
                    if (navigator.onLine) {
                      setConnectionState('RECONNECTING');
                      setActiveStreamUrl(`${cameraConfig.streamUrl}?t=${new Date().getTime()}`);
                    } else {
                      setConnectionState('DISCONNECTED');
                    }
                  }, 5000);
                }}
                className={`w-full h-full absolute inset-0 z-0 object-cover transition-opacity duration-500 ${connectionState === 'LIVE' ? 'opacity-100' : 'opacity-0'}`} 
              />

              {connectionState === 'RECONNECTING' ? (
               <div className="z-10 flex flex-col items-center justify-center text-slate-400">
                 <FiLoader size={40} md:size={56} className="mb-2 md:mb-4 text-yellow-500 animate-spin" />
                 <p className="text-sm md:text-lg font-bold uppercase tracking-widest text-slate-300">Handshake...</p>
               </div>
              ) : connectionState === 'DISCONNECTED' ? (
                  <div className="z-10 text-center text-slate-400 bg-black/40 p-4 md:p-8 rounded-2xl border border-white/5">
                    <FiWifiOff size={40} md:size={56} className="mx-auto text-slate-600 mb-2 md:mb-4 opacity-90" />
                    <p className="text-sm md:text-lg font-bold text-slate-200">Stream Offline</p>
                    <p className="text-xs font-medium mt-1">Check camera connection...</p>
                  </div>
              ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-between items-end z-10">
            <div className="text-slate-300 font-mono text-[9px] md:text-xs uppercase tracking-widest font-semibold">
              <span className="hidden sm:block">{currentTime.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="text-lg md:text-2xl font-bold text-white tracking-widest">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button onClick={handleSyncAI} disabled={isSyncing} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95" title="Force AI Memory Sync">
                <FiRefreshCw className={`size-4 md:size-5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={toggleFullScreen} className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg md:rounded-xl backdrop-blur-md transition-colors border border-white/10 active:scale-95"><FiMaximize className="size-4 md:size-5" /></button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/4 flex flex-col gap-6 h-[400px] lg:h-full flex-shrink-0">
          <div className="bg-white dark:bg-[#252830] rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col overflow-hidden h-full">
            
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-gray-300 flex items-center gap-2 text-sm md:text-base">
                <FiUserCheck className="text-emerald-500" size={18} />
                Current Attendance
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 hidden-scrollbar">
               {liveLogs.length === 0 ? (
                   <div className="text-center mt-6 md:mt-10 opacity-60">
                     <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3"><FiCamera className="size-5 md:size-6 text-slate-400"/></div>
                     <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400">Camera is Scanning...</p>
                   </div>
               ) : (
                   liveLogs.map((log, index) => {
                    const memberName = log.member ? `${log.member.first_name} ${log.member.last_name}` : 'Unknown';
                    return (
                    <div key={index} className="flex gap-3 items-center border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-0 last:pb-0 animate-in fade-in slide-in-from-right-4">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 text-white dark:bg-amber-500 dark:text-black flex items-center justify-center font-bold shadow-md text-xs md:text-sm flex-shrink-0">
                         {memberName.charAt(0)}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-gray-200 leading-tight truncate">{memberName}</p>
                         <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                           {log.time_in}
                         </p>
                       </div>
                    </div>
                   )})
               )}
            </div>

            <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex-shrink-0">
              <button onClick={() => navigate('/reports', { state: { defaultTab: 'Attendance' } })} className="w-full py-2 flex items-center justify-center gap-2 text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
                Full Log <FiArrowRight />
              </button>
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

=== Subscriptions.jsx ===
import { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, 
  FiList, FiCalendar, FiX, FiLoader, FiSave, FiTag, FiCheckCircle,
  FiMapPin, FiClock, FiFilter, FiChevronLeft, FiChevronRight, FiAlertCircle
} from 'react-icons/fi';
import api from '../api'; 

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function Subscriptions() {
  const [activeView, setActiveView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plans, setPlans] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingPlanId, setDeletingPlanId] = useState(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showCoachEvents, setShowCoachEvents] = useState(true);

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const defaultEventForm = { 
    title: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: new Date().toISOString().split('T')[0], 
    start_time: '18:00', 
    end_time: '19:00', 
    location: 'Main Gym Floor', 
    color: '#eab308' 
  };
  const [eventForm, setEventForm] = useState(defaultEventForm);

  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentColors, setRecentColors] = useState(() => {
    const saved = localStorage.getItem('recent_colors');
    return saved ? JSON.parse(saved) : ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
  });

  const saveRecentColor = (hex) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== hex);
      const updated = [hex, ...filtered].slice(0, 5);
      localStorage.setItem('recent_colors', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('coach_events', JSON.stringify(coachEvents));
  }, [coachEvents]);

  const handleSaveCoachEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now() };
    setCoachEvents([...coachEvents, newEvent]);
    saveRecentColor(eventForm.color);
    setIsEventModalOpen(false);
  };

  const handleDeleteCoachEvent = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event',
      message: 'Are you sure you want to permanently delete this scheduled coaching event?',
      onConfirm: () => setCoachEvents(coachEvents.filter(ev => ev.id !== id))
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${ampm}`;
  };

  const defaultForm = {
    id: '', member_id: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], 
    end_date: '', status: 'Active', auto_renew: false, payment_method: 'Cash', notes: '', color: '#f59e0b', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration_days: 30 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get('/memberships'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      setSubscriptions(Array.isArray(subsResponse.data) ? subsResponse.data : []);
      setMembersList(Array.isArray(membersResponse.data) ? membersResponse.data : []);
      setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.start_date || !formData.plan_type) return;
    const start = new Date(formData.start_date);
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (selectedPlan) {
      let expiry = new Date(start);
      expiry.setDate(start.getDate() + selectedPlan.duration_days);
      setFormData(prev => ({ ...prev, end_date: expiry.toISOString().split('T')[0] }));
    }
  }, [formData.plan_type, formData.start_date, plans]);

  const [loyalDiscount, setLoyalDiscount] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (!formData.member_id || !formData.plan_type) return;
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (!selectedPlan) return;

    let finalPrice = Number(selectedPlan.price);
    let discount = 0;

    if (finalPrice > 300) {
      const pastSubs = subscriptions.filter(s => s.member_id === parseInt(formData.member_id)).length;
      discount = pastSubs * 20;
      finalPrice = finalPrice - discount;
      if (finalPrice < 300) {
        finalPrice = 300;
        discount = Number(selectedPlan.price) - 300;
      }
    }
    setLoyalDiscount(discount);
    setCalculatedPrice(finalPrice);
  }, [formData.member_id, formData.plan_type, subscriptions, plans]);

  const handleOpenAddModal = (defaultDate = null) => {
    setFormData({ 
      ...defaultForm, 
      start_date: defaultDate || new Date().toISOString().split('T')[0],
      plan_type: plans.length > 0 ? plans[0].name : '' 
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub) => {
    setFormData({
      id: sub.id, member_id: sub.member_id, plan_type: sub.plan_type, start_date: sub.start_date,
      end_date: sub.end_date, status: sub.status, auto_renew: sub.auto_renew === 1 || sub.auto_renew === true, 
      payment_method: sub.payment_method, notes: sub.notes || '', color: sub.color || '#f59e0b', reference_number: sub.reference_number || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subscription',
      message: 'Are you sure you want to permanently delete this subscription? This action cannot be undone.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/memberships/${id}`);
          setSubscriptions(subscriptions.filter(s => s.id !== id));
        } catch (error) {
          console.error("Failed to delete:", error);
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete subscription.', type: 'error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData, auto_renew: formData.auto_renew ? 1 : 0, amount: calculatedPrice, reference_number: formData.reference_number };
      if (isEditing) await api.put(`/memberships/${formData.id}`, payload);
      else await api.post('/memberships', payload);

      if (formData.member_id && formData.plan_type) {
        const memberData = new FormData();
        memberData.append('plan', formData.plan_type);
        memberData.append('status', 'Active');
        memberData.append('_method', 'PUT');
        await api.post(`/members/${formData.member_id}`, memberData).catch(() => {});
      }
      saveRecentColor(formData.color);
      await fetchData(); 
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription saved successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to save:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save subscription.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleUpdatePlanPrice = (id, newPrice) => {
    setPlans(plans.map(p => p.id === id ? { ...p, price: Number(newPrice) } : p));
  };

  const handleSavePlans = async () => {
    setIsSaving(true);
    try {
      await api.post('/plans/bulk-update', { plans: plans });
      setIsPlanModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription Plans updated successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to update plans:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update subscription plans.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleAddNewPlan = async () => {
    if (!newPlan.name || !newPlan.price || !newPlan.duration_days) {
      setAlertDialog({ isOpen: true, title: 'Incomplete Data', message: 'Please fill out all plan fields.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/plans', newPlan);
      setNewPlan({ name: '', price: '', duration_days: 30 }); 
      setIsAddingPlan(false); 
      await fetchData(); 
    } catch (error) { 
      console.error("Failed to add new plan:", error); 
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to create the new plan.', type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleDeletePlan = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pricing Plan',
      message: 'Are you sure you want to permanently delete this pricing plan?',
      onConfirm: async () => {
        setDeletingPlanId(id); 
        try {
          await api.delete(`/plans/${id}`);
          setPlans(plans.filter(p => p.id !== id));
        } catch (error) { 
          console.error("Failed to delete plan:", error); 
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete plan.', type: 'error' });
        } finally { setDeletingPlanId(null); }
      }
    });
  };

  const filteredSubs = subscriptions.filter(sub => {
    const memberName = sub.member ? `${sub.member.first_name} ${sub.member.last_name}`.toLowerCase() : '';
    const matchesSearch = memberName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || sub.status === filterStatus;
    const matchesPlan = filterPlan === 'All' || sub.plan_type === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, filterPlan]);
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubs = filteredSubs.slice(indexOfFirstItem, indexOfLastItem);
  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));
  const todayStr = new Date().toISOString().split('T')[0];
  let allCalendarEvents = [];

  const activeSubsMap = new Map();
  subscriptions.forEach(sub => {
    if (sub.status === 'Active' && sub.member) {
      const existing = activeSubsMap.get(sub.member_id);
      if (!existing || new Date(sub.end_date) > new Date(existing.end_date)) {
        activeSubsMap.set(sub.member_id, sub);
      }
    }
  });
  const uniqueLatestActiveSubs = Array.from(activeSubsMap.values());

  if (showSubscriptions) {
    uniqueLatestActiveSubs.forEach(sub => {
      const planName = (sub.plan_type || '').toLowerCase();
      if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return;
      const firstName = sub.member.first_name;
      allCalendarEvents.push({ id: `start-${sub.id}`, title: `Start of ${firstName}'s ${sub.plan_type}`, date: sub.start_date, backgroundColor: sub.color || '#f59e0b', borderColor: sub.color || '#f59e0b', allDay: true, extendedProps: { type: 'sub', ...sub } });
      if (sub.end_date && sub.end_date !== sub.start_date) {
        allCalendarEvents.push({ id: `end-${sub.id}`, title: `End of ${firstName}'s ${sub.plan_type}`, date: sub.end_date, backgroundColor: sub.color || '#f59e0b', borderColor: sub.color || '#f59e0b', allDay: true, extendedProps: { type: 'sub', ...sub } });
      }
    });
  }

  if (showCoachEvents) {
    coachEvents.forEach(ev => {
      let endObj = new Date(ev.end_date || ev.start_date);
      endObj.setDate(endObj.getDate() + 1); 
      let exclusiveEndDate = endObj.toISOString().split('T')[0];
      allCalendarEvents.push({ id: `coach-${ev.id}`, title: ev.title, start: ev.start_date, end: ev.start_date !== ev.end_date ? exclusiveEndDate : undefined, date: ev.start_date === ev.end_date ? ev.start_date : undefined, allDay: true, backgroundColor: ev.color || '#3b82f6', borderColor: ev.color || '#3b82f6', extendedProps: { type: 'coach', ...ev } });
    });
  }

  const activeSubsLegend = uniqueLatestActiveSubs.filter(s => {
    const planName = (s.plan_type || '').toLowerCase();
    if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return false;
    return true;
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const sortedCoachEvents = coachEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-gray-200 dark:bg-gray-300 dark:hover:bg-white dark:text-black px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
          <button onClick={() => setIsPlanModalOpen(true)} className={secondaryButtonClass}>
            <FiTag size={16} /> Manage Plans
          </button>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1 shadow-inner w-full sm:w-auto">
            <button onClick={() => setActiveView('list')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'list' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}><FiList size={16} /> List</button>
            <button onClick={() => setActiveView('calendar')} className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'calendar' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}><FiCalendar size={16} /> Calendar</button>
          </div>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      {activeView === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                <input type="text" placeholder="Search by member name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Statuses</option><option value="Active">Active</option><option value="Expired">Expired</option>
              </select>
              <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Plans</option>{filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={() => handleOpenAddModal()} className={primaryButtonClass}><FiPlus size={18} strokeWidth={3} /> Add Subscription</button>
          </div>

          <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
                <FiList size={18} />
                <span>{filteredSubs.length} TOTAL SUBSCRIPTIONS</span>
              </div>
              <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
                <button onClick={goToPrevPage} disabled={currentPage === 1 || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
                {generatePageNumbers()}
                <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Color</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Plan</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">Auto-Renew</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentSubs.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No subscriptions found.</td></tr>
                  ) : (
                    currentSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap"><div className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm" style={{ backgroundColor: sub.color }}></div></td>
                        <td className="px-6 py-4 font-medium text-black dark:text-gray-300 whitespace-nowrap">{sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member'}</td>
                        <td className="px-6 py-4 text-sm text-black dark:text-gray-300 font-normal whitespace-nowrap">{sub.plan_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-normal text-black dark:text-gray-300">{sub.start_date}</div><div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">{sub.auto_renew ? <FiRefreshCw size={16} className="inline text-green-500" /> : <span className="text-slate-400 font-bold">-</span>}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                          <button onClick={() => handleOpenEditModal(sub)} disabled={deletingId === sub.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"><FiEdit2 size={16} strokeWidth={2.5} /></button>
                          <button onClick={() => handleDelete(sub.id)} disabled={deletingId === sub.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">{deletingId === sub.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- RE-STYLED DUAL-COLUMN CALENDAR VIEW --- */}
      {activeView === 'calendar' && (
        <div className="flex flex-col xl:flex-row gap-6 items-start animate-in fade-in duration-300">
          
          <div className="flex-1 w-full bg-white dark:bg-[#252830] p-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm relative">
            <style>{`
              .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); color: #4b5563; }
              .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
              
              .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000000 !important; text-transform: capitalize !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; transition: all 0.2s ease; margin: 0 4px !important; }
              .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
              .fc .fc-button-primary:hover { background-color: #e2e8f0 !important; color: #000000 !important; }
              .dark .fc .fc-button-primary:hover { background-color: #334155 !important; color: #ffffff !important; }
              .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active { background: linear-gradient(to right, #fbbf24, #f59e0b) !important; border: none !important; color: #000 !important; font-weight: 800 !important; box-shadow: 0 4px 10px -2px rgba(245, 158, 11, 0.3) !important; }
              
              .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000000; }
              .dark .fc-toolbar-title { color: #d1d5db !important; }
              .fc-scrollgrid { border: none !important; }
              .dark .fc-scrollgrid { border-color: #334155 !important; }
              .fc-theme-standard th { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; padding: 12px 0 !important; }
              .dark .fc-theme-standard th { border-color: #334155 !important; }
              .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; border-right: 1px solid var(--fc-border-color) !important; }
              .dark .fc-theme-standard td { border-color: #334155 !important; }
              .fc-theme-standard td:last-child { border-right: none !important; }
              
              .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; color: #0f172a !important; text-decoration: none !important; padding: 4px 0 !important;}
              .dark .fc-col-header-cell-cushion { color: #f8fafc !important; }
              .fc-daygrid-day-number { font-weight: 600; font-size: 0.8rem; padding: 8px !important; color: #475569 !important; text-decoration: none !important; }
              .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }

              .fc-daygrid-event {
                  border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.2) !important; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important; transition: transform 0.1s ease, box-shadow 0.1s ease;
              }
              .fc-daygrid-event:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 4px 8px rgba(0,0,0,0.25) !important; z-index: 5; }
              .fc-daygrid-event-dot { display: none !important; } 
              .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }

              .fc-daygrid-more-link { color: #4b5563 !important; font-weight: 800 !important; font-size: 0.75rem !important; margin-top: 2px; display: block; text-align: left; padding-left: 6px; }
              .dark .fc-daygrid-more-link { color: #d1d5db !important; }
              
              .fc-popover { border: 1px solid var(--fc-border-color) !important; border-radius: 12px !important; background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15) !important; overflow: hidden; }
              .dark .fc-popover { background-color: #1e293b !important; border-color: #334155 !important; }
              .fc-popover-header { background: #f8fafc !important; padding: 12px !important; border-bottom: 1px solid var(--fc-border-color) !important;}
              .dark .fc-popover-header { background: #0f172a !important; border-color: #334155 !important;}
              .fc-popover-title { font-weight: 800 !important; font-size: 0.9rem !important; color: #000000 !important; }
              .dark .fc-popover-title { color: #d1d5db !important; }
              .fc-popover-body { padding: 12px !important; }
            `}</style>
            
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              dayMaxEvents={2} 
              displayEventTime={false} 
              moreLinkContent={(arg) => `+${arg.num} more`} 
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
              events={allCalendarEvents}
              height="auto" 
              dateClick={(info) => {
                setEventForm({...eventForm, start_date: info.dateStr, end_date: info.dateStr});
                setIsEventModalOpen(true);
              }}
            />
          </div>

          <div className="w-full xl:w-[340px] flex flex-col gap-6 flex-shrink-0">

            <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3">
                <FiFilter className="text-amber-500" /> View Filters
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showSubscriptions} onChange={e => setShowSubscriptions(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                  <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Client Subscriptions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showCoachEvents} onChange={e => setShowCoachEvents(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
                  <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Coach Events & Sessions</span>
                </label>
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col max-h-[300px]">
              <h3 className="text-base font-bold text-black dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Active Subscriptions</h3>
              
              <div className="overflow-y-auto hidden-scrollbar space-y-4 flex-1 pr-2">
                {activeSubsLegend.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">No active subscriptions detected.</p>
                ) : (
                  activeSubsLegend.map((sub, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-md flex-shrink-0 shadow-sm mt-0.5" style={{ backgroundColor: sub.color || '#f59e0b' }}></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-black dark:text-gray-300 truncate leading-tight">
                          {sub.member ? `${sub.member.first_name}` : 'Unknown'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[9px] text-slate-500 dark:text-gray-400 truncate uppercase tracking-widest font-bold">
                            {sub.plan_type}
                          </p>
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${sub.start_date > todayStr ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50' : 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50'}`}>
                            {sub.start_date > todayStr ? 'Future' : 'Current'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col flex-1 max-h-[350px]">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex-shrink-0">
                <h3 className="text-base font-bold text-black dark:text-gray-300">Today's Event Plan</h3>
                <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-3 py-1.5 rounded-lg font-bold shadow-md shadow-amber-900/20 transition-all active:scale-95 uppercase tracking-wider text-[10px]">
                  <FiPlus size={12} strokeWidth={3} /> Add New
                </button>
              </div>
              
              <div className="overflow-y-auto hidden-scrollbar space-y-3 flex-1 pr-1">
                {sortedCoachEvents.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-8">No coaching sessions scheduled.</p>
                ) : (
                  sortedCoachEvents.map((ev) => (
                    <div key={ev.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group p-3.5 flex justify-between items-center transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600" style={{ borderLeft: `5px solid ${ev.color || '#eab308'}` }}>
                      
                      <button onClick={() => handleDeleteCoachEvent(ev.id)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md hover:bg-red-600 hover:scale-110" title="Delete Event">
                        <FiTrash2 size={12} />
                      </button>

                      <div className="flex flex-col flex-1 pr-4 min-w-0">
                        <h4 className="font-bold text-sm text-black dark:text-gray-300 mb-1.5 leading-tight truncate">
                          {ev.title}
                        </h4>
                        <div className="text-[10px] font-medium text-slate-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-1">
                          <FiMapPin size={12} className="flex-shrink-0 text-slate-400 dark:text-gray-500"/> <span className="truncate">{ev.location}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-4 w-[75px] flex-shrink-0">
                        <span className="text-[24px] font-black leading-none mb-0.5 tracking-tighter text-black dark:text-gray-300">
                          {new Date(ev.start_date + 'T00:00:00').getDate()}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-1.5">
                          {new Date(ev.start_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 dark:text-gray-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                           {formatTime(ev.start_time)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* --- COACH EVENT PLANNER MODAL --- */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col">
            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-bold text-black dark:text-gray-300">Add Coach Event</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveCoachEvent} className="p-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Event Title</span>
                <input type="text" required value={eventForm.title} onChange={e=>setEventForm({...eventForm, title: e.target.value})} placeholder="e.g. CrossFit WOD" className={inputClass} />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Start Date</span>
                  <input type="date" required value={eventForm.start_date} onChange={e=>setEventForm({...eventForm, start_date: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>End Date</span>
                  <input type="date" required value={eventForm.end_date} onChange={e=>setEventForm({...eventForm, end_date: e.target.value})} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Start Time</span>
                  <input type="time" required value={eventForm.start_time} onChange={e=>setEventForm({...eventForm, start_time: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>End Time</span>
                  <input type="time" required value={eventForm.end_time} onChange={e=>setEventForm({...eventForm, end_time: e.target.value})} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Location</span>
                  <input type="text" required value={eventForm.location} onChange={e=>setEventForm({...eventForm, location: e.target.value})} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Banner Color</span>
                  <div className="flex gap-2 mt-1 items-center">
                    <input type="color" value={eventForm.color} onChange={e=>setEventForm({...eventForm, color: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" />
                    <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                      {recentColors.map(c => (
                        <button type="button" key={c} onClick={() => setEventForm({...eventForm, color: c})} className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" style={{backgroundColor: c}}></button>
                      ))}
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs">Cancel</button>
                <button type="submit" className={primaryButtonClass + " !text-xs !px-5"}>
                  <FiSave size={16} /> Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT SUBSCRIPTION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-black dark:text-gray-300">{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#252830]">
              <form id="subForm" className="space-y-5" onSubmit={handleSaveSubscription}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Select Member</span>
                    <select required value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} className={inputClass}>
                      <option value="">-- Choose Member --</option>
                      {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}><FiTag className="inline mr-1" /> Custom Calendar Color</span>
                    <div className="flex gap-2 mt-2 items-center">
                      <input 
                        type="color" 
                        value={formData.color} 
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })} 
                        className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" 
                      />
                      <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                        {recentColors.map(c => (
                          <button type="button" key={c} onClick={() => setFormData({...formData, color: c})} className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" style={{backgroundColor: c}}></button>
                        ))}
                      </div>
                    </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Plan</span>
                    <select required value={formData.plan_type} onChange={(e) => setFormData({...formData, plan_type: e.target.value})} className={inputClass}>
                      <option value="">-- Select a Plan --</option>
                      {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>Payment Method</span>
                    <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className={inputClass}>
                      <option value="Cash">Cash</option><option value="Gcash">Gcash</option><option value="Card">Card</option>
                    </select>
                  </label>
                </div>
                
                {loyalDiscount > 0 && (
                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                    <FiCheckCircle size={18} />
                    Loyal Client Detected! A &#8369;{loyalDiscount} discount has been applied. Final Auto-Billed Price: &#8369;{calculatedPrice}
                  </div>
                )}
                
                <label className="block">
                  <span className={labelClass}>Reference Number</span>
                  <input type="text" value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} className={inputClass} placeholder="Receipt or Transaction #" />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="block">
                    <span className={labelClass}>Start Date</span>
                    <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className={inputClass} />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Expiration Date (Auto-calculated)</span>
                    <input type="date" value={formData.end_date} disabled className="mt-1 w-full p-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" />
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 mt-4 p-5 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.status === 'Active'} onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Active' : 'Expired'})} className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" />
                    <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Set as Active</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.auto_renew} onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})} className="w-5 h-5 accent-amber-500 text-amber-500 bg-white border-gray-300 rounded focus:ring-amber-500" />
                    <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Enable Auto-Renew</span>
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Notes (Optional)</span>
                  <textarea rows="2" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Add any specific conditions..." className={inputClass}></textarea>
                </label>
              </form>
            </div>
            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
              <button form="subForm" type="submit" disabled={isSaving} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Subscription')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRICING CATALOG MODAL --- */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col max-h-[90vh]">
            
            <style>{`
              input[type='number']::-webkit-inner-spin-button,
              input[type='number']::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              input[type='number'] {
                -moz-appearance: textfield;
              }
            `}</style>

            <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-lg font-bold text-black dark:text-gray-300">Pricing Catalog</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><FiX size={24} /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              {isAddingPlan ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500/50 flex flex-col gap-5 mb-2 animate-in fade-in slide-in-from-top-2 relative shadow-inner">
                  <button onClick={() => setIsAddingPlan(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-sm" title="Cancel New Plan">
                    <FiX size={16} strokeWidth={3} />
                  </button>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
                    <FiPlus className="stroke-[3px]" size={20} />
                    <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-gray-300">Create Custom Plan</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="block">
                      <span className={labelClass}>Plan Name</span>
                      <input type="text" value={newPlan.name} onChange={e=>setNewPlan({...newPlan, name: e.target.value})} placeholder="e.g. Student Promo" className={inputClass} />
                    </label>
                    <div className="flex gap-4">
                      <label className="block w-1/2">
                        <span className={labelClass}>Duration (Days)</span>
                        <input type="number" value={newPlan.duration_days} onChange={e=>setNewPlan({...newPlan, duration_days: e.target.value})} className={inputClass} placeholder="30" />
                      </label>
                      <label className="block w-1/2">
                        <span className={labelClass}>Price (&#8369;)</span>
                        <input type="number" value={newPlan.price} onChange={e=>setNewPlan({...newPlan, price: e.target.value})} className={inputClass} placeholder="0.00" />
                      </label>
                    </div>
                  </div>
                  <button onClick={handleAddNewPlan} disabled={isSaving} className={primaryButtonClass + " mt-2 shadow-amber-500/30 w-full"}>
                    {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                    {isSaving ? 'Creating...' : 'Save New Plan'}
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[65%]">
                    Update current prices below, or create a brand new custom plan.
                  </p>
                  <button onClick={() => setIsAddingPlan(true)} className={primaryButtonClass + " !px-4 !py-2 !text-[11px] shadow-sm active:scale-95"}>
                    <FiPlus size={16} strokeWidth={3} /> New Plan
                  </button>
                </div>
              )}

              {plans.length === 0 && !isAddingPlan && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No plans found in the database.</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>Click 'New Plan' to create one!</p>
                </div>
              )}
              
              <div className="space-y-3">
                {plans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 group transition-all hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-black dark:text-gray-300">{plan.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{plan.duration_days} Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-black dark:text-gray-300 font-bold text-lg px-2">&#8369;</span>
                      <input 
                        type="number" 
                        value={plan.price} 
                        onChange={(e) => handleUpdatePlanPrice(plan.id, e.target.value)} 
                        className="w-24 px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl text-right font-bold text-black dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                      />
                      <button onClick={() => handleDeletePlan(plan.id)} disabled={deletingPlanId === plan.id} title="Delete Plan" className="inline-flex items-center justify-center p-2 ml-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 mt-auto">
              <button onClick={() => setIsPlanModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Close</button>
              <button onClick={handleSavePlans} disabled={isSaving || plans.length === 0} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Saving...' : 'Save Updated Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                <FiAlertCircle size={32} />
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

=== Transactions.jsx ===
import { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, 
  FiX, FiLoader, FiSave, FiTag, FiPrinter, FiUser, FiCheckCircle, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiList
} from 'react-icons/fi';
import api from '../api';
import logo from '../assets/logo.png'; 

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const defaultForm = { 
    id: '', transaction_date: '', member_id: '', type: 'Subscription Payment', 
    description: '', payment_method: 'Cash', amount: '', status: 'Complete', reference_number: '' 
  };
  const [formData, setFormData] = useState(defaultForm);

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txnRes, memRes, plansRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      setTransactions(txnRes.data);
      setMembersList(memRes.data);
      setPlansList(plansRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelection = (planName) => {
    const selectedPlan = plansList.find(p => p.name === planName);
    if (selectedPlan) {
      setFormData({
        ...formData,
        amount: selectedPlan.price,
        description: `${selectedPlan.name} Plan Payment`
      });
    }
  };

  const handleOpenAddModal = () => {
    setFormData({ ...defaultForm, transaction_date: new Date().toISOString().split('T')[0] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (txn) => {
    setFormData({
      id: txn.id,
      transaction_date: txn.transaction_date,
      member_id: txn.member_id || '', 
      type: txn.type,
      description: txn.description || '',
      payment_method: txn.payment_method,
      amount: txn.amount,
      status: txn.status,
      reference_number: txn.reference_number || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to permanently delete this transaction? This action cannot be undone.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/transactions/${id}`);
          setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
          console.error("Failed to delete transaction:", error);
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to delete transaction.', type: 'error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData, member_id: formData.member_id === '' ? null : formData.member_id };
      
      if (isEditing) {
        await api.put(`/transactions/${formData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      await fetchData();
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Transaction recorded successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to save transaction:", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Error saving transaction data. Make sure all required fields are filled.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const headers = "Transaction ID,Date,Member,Type,Description,Method,Amount,Status,Reference\n";
      const rows = filteredTxns.map(t => {
        const memberName = t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest';
        return `${t.transaction_id},${t.transaction_date},${memberName},${t.type},"${t.description || ''}",${t.payment_method},${t.amount},${t.status},${t.reference_number || ''}`;
      }).join("\n");
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReceipt = (txn) => {
    const memberPlan = txn.member?.plan || 'Walk-in';
    const txnDesc = txn.description || '';
    const isWalkIn = 
      txn.type === 'Fee' || 
      !txn.member || 
      memberPlan.toLowerCase().includes('walk') || 
      memberPlan.toLowerCase() === 'none' ||
      txnDesc.toLowerCase().includes('walk');

    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-In Guest';
    const memberId = txn.member ? String(txn.member.id).padStart(4, '0') : 'N/A';
    
    let membershipPlan = 'Walk-In'; 
    if (!isWalkIn) {
      membershipPlan = memberPlan === 'Without Coach' ? 'Without Coach (Open Gym)' : memberPlan;
    }

    let basePrice = Number(txn.amount);
    let discountAmount = 0;
    let itemName = isWalkIn ? 'Walk-In Access' : (txn.type === 'Subscription Payment' ? 'Subscription Bill' : txn.type);

    const matchedPlan = plansList.find(p => p.name === memberPlan || txnDesc.includes(p.name));
    if (!isWalkIn && txn.type === 'Subscription Payment' && matchedPlan) {
      if (Number(matchedPlan.price) > Number(txn.amount)) {
        basePrice = Number(matchedPlan.price);
        discountAmount = basePrice - Number(txn.amount);
        itemName = `${matchedPlan.name} Bill`;
      }
    }

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    let validThru = 'See Active Subs Tab';
    if (isWalkIn) {
      const walkInDate = new Date(txn.transaction_date + 'T00:00:00');
      const formattedWalkInDate = walkInDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      validThru = `${formattedWalkInDate} (9:00 AM - 9:30 PM)`;
    } else if (txn.type === 'Subscription Payment' && matchedPlan) {
      const startDate = new Date(txn.transaction_date + 'T00:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + matchedPlan.duration_days);
      const startFmt = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      const endFmt = endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      validThru = `${startFmt} - ${endFmt}`;
    } else if (txn.type === 'Refund' || txn.type === 'Other') {
      validThru = 'N/A';
    }

    const fullLogoUrl = window.location.origin + logo;

    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${txn.transaction_id}</title>
          <style>
            @page { size: A6 portrait; margin: 10mm; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 100%; 
              max-width: 100%;
              margin: 0 auto; 
              padding: 0; 
              font-size: 11px; 
              color: #000; 
              line-height: 1.4;
            }
            .center { text-align: center; }
            .left { text-align: left; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .dashed-line { border-top: 1px dashed #000; margin: 8px 0; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="${fullLogoUrl}" style="width: 45px; height: 45px; filter: grayscale(100%); margin-bottom: 5px;" onerror="this.style.display='none'" />
            <div class="bold" style="font-size: 14px;">DOUBLE ALPHA FITNESS</div>
            <div>Tagoloan, Misamis Oriental</div>
            <div>0991 448 9942</div>
            <div>Open Daily 9:00 AM - 9:00 PM</div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Date: ${printDate}</span><span>Time: ${printTime}</span></div>
          <div class="dashed-line"></div>
          <div class="left">
            <div>Name: <span class="bold">${memberName}</span></div>
            <div>Member ID: <span class="bold">${memberId}</span></div>
            <div>Membership: <span class="bold">${membershipPlan}</span></div>
          </div>
          <div class="dashed-line"></div>
          <div class="flex-between"><span>${itemName}:</span><span>&#8369;${basePrice.toFixed(2)}</span></div>
          ${discountAmount > 0 ? `<div class="flex-between" style="font-size: 10px;"><span>Loyalty Discount:</span><span>-&#8369;${discountAmount.toFixed(2)}</span></div>` : ''}
          <div class="dashed-line"></div>
          <div class="flex-between"><span>Sub Total:</span><span>&#8369;${Number(txn.amount).toFixed(2)}</span></div>
          <div class="dashed-line"></div>
          <div class="flex-between bold" style="font-size: 14px; margin-top: 4px;"><span>Total:</span><span>&#8369;${Number(txn.amount).toFixed(2)}</span></div>
          <br/>
          <div class="flex-between"><span>Payment Method:</span><span class="uppercase">${txn.payment_method}</span></div>
          <div class="flex-between"><span>Receipt Number:</span><span>${txn.transaction_id}</span></div>
          ${txn.reference_number ? `<div class="flex-between"><span>Ref/Trace:</span><span>${txn.reference_number}</span></div>` : ''}
          <br/>
          <div class="center"><div>Membership Valid Thru:</div><div class="bold">${validThru}</div></div>
          <br/>
          <div class="center" style="margin-top: 8px;">
            <div class="bold uppercase">"BE THE BEST VERSION OF YOURSELF."</div>
            <div style="margin-top: 2px;">fb.com/doublealphafitnessgym</div>
          </div>
          <script>setTimeout(function() { window.print(); window.close(); }, 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredTxns = transactions.filter(txn => {
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || txn.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredTxns.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = filteredTxns.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  const totalIncome = transactions.filter(t => Number(t.amount) > 0 && t.status === 'Complete').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = transactions.filter(t => t.type === 'Refund').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const netRevenue = totalIncome - totalRefunds;
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount), 0);

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    switch (status) {
      case 'Complete': return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
      case 'Pending': return `${base} bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50`;
      case 'Refunded': return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
      case 'Failed': return `${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`;
      default: return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
    }
  };

  const getMethodBadge = (method) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (method.toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if (method.toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
      <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">{value}</h3>
      </div>
    </div>
  );

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const exportButtonClass = "flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-300 dark:hover:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 15mm; }
          html, body { background-color: white !important; -webkit-print-color-adjust: exact; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; background: white; color: black; }
        `}
      </style>

      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        <div id="printable-report" className="hidden print:block bg-white text-black font-sans w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
              Double Alpha Fitness Transaction Records
            </h1>
            <p className="text-sm font-bold text-gray-600">
              Generated on: {new Date().toLocaleDateString()}
            </p>
          </div>

          <table className="w-full border-collapse border-2 border-black mb-8 text-center">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Total Income</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Refunds</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest border-r-2 border-black">Net Revenue</th>
                <th className="py-2 text-sm font-bold uppercase tracking-widest">Pending</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4 text-2xl font-black border-r-2 border-black">Ã¢â€šÂ± {totalIncome.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black border-r-2 border-black">Ã¢â€šÂ± {totalRefunds.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black border-r-2 border-black">Ã¢â€šÂ± {netRevenue.toLocaleString()}</td>
                <td className="py-4 text-2xl font-black">Ã¢â€šÂ± {pendingAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border-2 border-black text-center text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">TXN ID & DATE</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">MEMBER</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">DETAILS</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">METHOD</th>
                <th className="py-2 font-bold uppercase tracking-widest border-r-2 border-black">AMOUNT</th>
                <th className="py-2 font-bold uppercase tracking-widest">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((txn) => {
                const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
                const amtStr = Number(txn.amount) > 0 ? `Ã¢â€šÂ± ${Number(txn.amount).toLocaleString()}` : `-Ã¢â€šÂ± ${Math.abs(Number(txn.amount)).toLocaleString()}`;
                return (
                  <tr key={txn.id} className="border-b border-black last:border-0">
                    <td className="py-3 font-medium border-r-2 border-black">
                      <div className="font-bold">{txn.transaction_id}</div>
                      <div className="text-xs">{txn.transaction_date}</div>
                    </td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{memberName}</td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">
                      <div className="font-bold">{txn.type}</div>
                      <div className="text-xs">{txn.description || '-'}</div>
                    </td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{txn.payment_method}</td>
                    <td className="py-3 font-medium border-r-2 border-black uppercase">{amtStr}</td>
                    <td className="py-3 font-medium uppercase">{txn.status}</td>
                  </tr>
                );
              })}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 font-medium">
                    No matching records found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="print:hidden space-y-6">
          <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
            <button onClick={handleOpenAddModal} className={primaryButtonClass}>
              <FiPlus size={18} strokeWidth={3} /> Record Transaction
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Income" value={`\u20B1 ${totalIncome.toLocaleString()}`} icon={<FiTrendingUp size={28} strokeWidth={2.5} />} colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" />
            <StatCard title="Refunds" value={`\u20B1 ${totalRefunds.toLocaleString()}`} icon={<FiTrendingDown size={28} strokeWidth={2.5} />} colorClass="bg-red-800 text-white shadow-lg shadow-red-700/40 dark:shadow-none" />
            <StatCard title="Net Revenue" value={`\u20B1 ${netRevenue.toLocaleString()}`} icon={<FiDollarSign size={28} strokeWidth={2.5} />} colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" />
            <StatCard title="Pending" value={`\u20B1 ${pendingAmount.toLocaleString()}`} icon={<FiClock size={28} strokeWidth={2.5} />} colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <input type="text" placeholder="Search by ID or Member Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm" />
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm">
                <option value="All">All Types</option>
                <option value="Subscription Payment">Subscription Payment</option>
                <option value="Fee">Fee (Walk-in)</option>
                <option value="Refund">Refund</option>
                <option value="Other">Other</option>
              </select>

              <button onClick={handleExportCSV} disabled={isExporting} className={exportButtonClass} title="Download table data to a spreadsheet">
                {isExporting ? <FiLoader className="animate-spin" size={18} /> : <FiDownload size={18} />}
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button onClick={() => window.print()} className={primaryButtonClass}>
                <FiPrinter size={18} /> Print All
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
                <FiList size={18} />
                <span>{filteredTxns.length} TOTAL TRANSACTIONS</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Txn ID & Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Member</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Method</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  
                  {isLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-16 h-16">
                              <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentTxns.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No transactions found.</td></tr>
                  ) : (
                    currentTxns.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-gray-300">{txn.transaction_id}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.transaction_date}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-gray-300 whitespace-nowrap">
                        {txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 italic"><FiUser size={14} /> Walk-in Guest</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-800 dark:text-gray-300">{txn.type}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{txn.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getMethodBadge(txn.payment_method)}>{txn.payment_method}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-normal text-lg tracking-tight ${Number(txn.amount) > 0 ? 'text-slate-800 dark:text-gray-300' : 'text-red-500'}`}>
                          {Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(txn.status)}>{txn.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                        <button onClick={() => handlePrintReceipt(txn)} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm">
                          <FiPrinter size={16} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleOpenEditModal(txn)} disabled={deletingId === txn.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"><FiEdit2 size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => handleDelete(txn.id)} disabled={deletingId === txn.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50">{deletingId === txn.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            {/* --- ADDED BOTTOM PAGINATION HERE --- */}
            {totalPages > 1 && (
              <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTxns.length)} of {filteredTxns.length} Entries
                </span>
                <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
                  <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
                  {generatePageNumbers()}
                  <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
                </div>
              </div>
            )}
            
          </div>

          {/* --- ADD / EDIT TRANSACTION MODAL --- */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                
                <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">
                    {isEditing ? `Edit Transaction` : 'Record New Transaction'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
                </div>
                
                <form onSubmit={handleSaveTransaction} className="flex flex-col max-h-[80vh]">
                  <div className="p-6 overflow-y-auto space-y-5">
                    
                    <div>
                      <label className={labelClass}>Member</label>
                      <select required={formData.member_id !== ''} value={formData.member_id} onChange={(e) => setFormData({...formData, member_id: e.target.value})} className={inputClass}>
                        <option value="">-- Select Member (Walk-in) --</option>
                        {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Transaction Date</label>
                        <input type="date" required value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Transaction Type</label>
                        <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className={inputClass}>
                          <option>Subscription Payment</option>
                          <option>Fee</option>
                          <option>Refund</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    {formData.type === 'Subscription Payment' && (
                      <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-500/30 animate-in fade-in slide-in-from-top-2">
                        <label className={`${labelClass} text-amber-700 dark:text-amber-500`}><FiTag className="inline mr-1" /> Select Plan to Auto-Fill Price</label>
                        <select 
                          className={`${inputClass} border-amber-300 focus:ring-amber-600`}
                          onChange={(e) => handlePlanSelection(e.target.value)}
                        >
                          <option value="">-- Select a Database Plan --</option>
                          {plansList.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Amount (&#8369;)</label>
                        <input type="number" step="0.01" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={inputClass}>
                          <option>Complete</option>
                          <option>Pending</option>
                          <option>Failed</option>
                          <option>Refunded</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Payment Method</label>
                        <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className={inputClass}>
                          <option>Cash</option>
                          <option>Gcash</option>
                          <option>Card</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Reference</label>
                        <input type="text" placeholder="e.g. GCash Ref / Receipt No." value={formData.reference_number} onChange={(e) => setFormData({...formData, reference_number: e.target.value})} className={inputClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Description / Notes</label>
                      <input type="text" placeholder="Brief details about the transaction" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={inputClass} />
                    </div>

                  </div>
                  
                  <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
                    <button type="submit" disabled={isSaving} className={primaryButtonClass}>
                      {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                      {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Record Transaction')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- CUSTOM CONFIRM MODAL --- */}
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                    <FiAlertCircle size={32} />
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
      </div>
    </>
  );
}

=== api.js ===
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Automatically attach the Sanctum token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

=== App.jsx ===
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Subscriptions from './pages/Subscriptions';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import SecurityMonitor from './pages/SecurityMonitor';
import GestureMonitor from './pages/GestureMonitor';
import AdminProfile from './pages/AdminProfile';

function App() {
  // Check if token exists in local storage
  const isAuthenticated = !!localStorage.getItem('admin_token');

  return (
    <Routes>
      {/* If logged in, don't show login page; go straight to Overview */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/Overview" replace /> : <Login />} />
      
      {/* Protect the entire Layout. If NOT authenticated, force them back to /login */}
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/Overview" replace />} />
        <Route path="Overview" element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="security" element={<SecurityMonitor />} />
        <Route path="gesture" element={<GestureMonitor />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}
export default App;

=== index.css ===
@import "tailwindcss";

@theme {
  /* Primary Accents */
  --color-brand-red: #A60303;
  --color-brand-crimson: #A61F2B;
  --color-brand-gold: #F2B705;
  --color-brand-orange: #D97A07;
  
  /* Dark Mode Backgrounds & Surfaces */
  --color-brand-dark: #0D0D0D;
  --color-brand-navy: #031226;
  --color-brand-surface: #212226;
  --color-brand-slate: #3F454D;
  
  /* Light Mode Backgrounds */
  --color-brand-light: #F2F2F2;
  --color-brand-white: #FCFCFC;
}

/* Enable manual class-based dark mode switching */
@custom-variant dark (&:is(.dark *));

@layer base {
  body {
    @apply bg-brand-light text-brand-dark transition-colors duration-300;
  }
  
  .dark body {
    @apply bg-brand-dark text-brand-light;
  }
}

/* React Calendar Dark Mode Overrides (Updated for Brand Colors) */
.dark .react-calendar {
  background: transparent;
  border: none;
}
.dark .react-calendar__navigation button:enabled:hover,
.dark .react-calendar__navigation button:enabled:focus {
  background-color: var(--color-brand-surface);
}
.dark .react-calendar__month-view__days__day:hover {
  background-color: var(--color-brand-surface);
}
.dark .react-calendar__tile--active {
  background: var(--color-brand-red) !important; 
  color: white;
}

=== main.jsx ===
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

=== index.html ===
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

=== package.json ===
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@cycjimmy/jsmpeg-player": "^6.1.2",
    "@fullcalendar/daygrid": "^6.1.21",
    "@fullcalendar/interaction": "^6.1.21",
    "@fullcalendar/list": "^6.1.21",
    "@fullcalendar/react": "^6.1.21",
    "@fullcalendar/timegrid": "^6.1.21",
    "@tailwindcss/vite": "^4.3.2",
    "axios": "^1.18.1",
    "react": "^19.2.7",
    "react-avatar-editor": "^15.1.0",
    "react-calendar": "^6.0.1",
    "react-dom": "^19.2.7",
    "react-icons": "^5.7.0",
    "react-router-dom": "^7.18.1",
    "recharts": "^3.9.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "oxlint": "^1.71.0",
    "tailwindcss": "^4.3.2",
    "vite": "^8.1.1"
  }
}

=== vite.config.js ===
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})

