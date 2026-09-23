=== frontend\src\components\ui\AlertDialog.jsx ===
import React from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function AlertDialog({ isOpen, title, message, onClose, type = 'success' }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className={`mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full ${
          isSuccess 
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
        }`}>
          {isSuccess ? <FiCheckCircle className="w-7 h-7" /> : <FiAlertCircle className="w-7 h-7" />}
        </div>
        
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{message}</p>

        <button
          onClick={onClose}
          className={`mt-6 w-full py-2.5 px-4 text-sm font-semibold text-white rounded-xl shadow-md transition-colors ${
            isSuccess 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
              : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

=== frontend\src\components\ui\Badge.jsx ===
import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'success' | 'danger' | 'warning' | 'info' | 'default'
  size = 'md', // 'sm' | 'md'
  className = ''
}) {
  const baseClasses = "inline-flex items-center justify-center font-bold uppercase tracking-widest border border-solid shadow-sm rounded-full";
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[8px]",
    md: "px-3 py-1 text-[10px]"
  };

  const variantClasses = {
    success: "bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50",
    danger: "bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50",
    warning: "bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50",
    info: "bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50",
    default: "bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
}

=== frontend\src\components\ui\Button.jsx ===
import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon = null,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm tracking-wide";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  const variantClasses = {
    primary: "bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black shadow-amber-900/20 uppercase font-black",
    secondary: "bg-black hover:bg-slate-900 text-gray-200 dark:bg-gray-300 dark:hover:bg-white dark:text-black uppercase",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 uppercase",
    outline: "bg-white dark:bg-[#252830] text-slate-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300 shadow-none"
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <FiLoader className="animate-spin" size={size === 'sm' ? 14 : 18} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}

=== frontend\src\components\ui\ConfirmDialog.jsx ===
import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-colors ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

=== frontend\src\components\ui\DataTable.jsx ===
import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  loadingMessage = "Loading Database...",
  rowKey = "id",
  renderRow,
  className = ""
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.headerClassName || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">
                    {loadingMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              renderRow ? renderRow(item, idx) : (
                <tr key={item[rowKey] || idx} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4 whitespace-nowrap text-sm ${col.cellClassName || ''}`}>
                      {col.render ? col.render(item, idx) : item[col.accessor]}
                    </td>
                  ))}
                </tr>
              )
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

=== frontend\src\components\ui\Modal.jsx ===
import React from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

=== frontend\src\components\ui\Pagination.jsx ===
import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalItems}</span> items
      </p>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

=== frontend\src\components\ui\SearchInput.jsx ===
import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
  containerClassName = "relative w-full sm:w-72"
}) {
  return (
    <div className={containerClassName}>
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm ${className}`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

=== frontend\src\components\Layout.jsx ===
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

=== frontend\src\context\DataCacheContext.jsx ===
import { createContext, useContext, useRef } from 'react';

const DataCacheContext = createContext(null);

/**
 * Global cache for API data with sessionStorage persistence.
 *
 * Pattern: Stale-While-Revalidate + sessionStorage TTL
 *   - In-memory ref  â†’ survives page navigation (no re-fetch on route change)
 *   - sessionStorage â†’ survives page refresh (F5) within the same tab
 *   - TTL (5 min)    â†’ stale entries re-fetch in background; expired ones show spinner
 *
 * sessionStorage clears automatically when the tab is closed, so admin
 * data never lingers between sessions.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_PREFIX = 'gym_cache_';

function readFromStorage(key) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    // Expired? Treat as cache miss â€” caller will re-fetch with spinner
    if (Date.now() - timestamp > TTL_MS) {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeToStorage(key, data) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // sessionStorage quota exceeded or unavailable â€” silently skip
  }
}

function removeFromStorage(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key);
  } catch { /* noop */ }
}

export function DataCacheProvider({ children }) {
  // In-memory ref for navigation caching (same session, no JSON parse overhead)
  const cacheRef = useRef({});

  const getCache = (key) => {
    // 1. Check in-memory first (fastest)
    if (cacheRef.current[key] !== undefined) return cacheRef.current[key];
    // 2. Fall back to sessionStorage (survives refresh)
    const stored = readFromStorage(key);
    if (stored !== null) {
      cacheRef.current[key] = stored; // hydrate memory cache
      return stored;
    }
    return null;
  };

  const setCache = (key, data) => {
    cacheRef.current[key] = data;
    writeToStorage(key, data);
  };

  const invalidateCache = (key) => {
    delete cacheRef.current[key];
    removeFromStorage(key);
  };

  const invalidateAll = () => {
    cacheRef.current = {};
    // Clear only our prefixed keys, not unrelated sessionStorage data
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => sessionStorage.removeItem(k));
  };

  return (
    <DataCacheContext.Provider value={{ getCache, setCache, invalidateCache, invalidateAll }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) {
    throw new Error('useDataCache must be used inside <DataCacheProvider>');
  }
  return ctx;
}

export default DataCacheContext;

=== frontend\src\context\ThemeContext.jsx ===
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

=== frontend\src\features\members\components\CameraCapture.jsx ===
import React from 'react';
import { FiCamera, FiCheckCircle, FiVideoOff } from 'react-icons/fi';

export default function CameraCapture({ isCameraActive, faceImage, videoRef, canvasRef, onStart, onCapture, onStop, onRetake }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
      <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>

      <div className={`mt-2 w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${
        faceImage
          ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
          : isCameraActive
            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            : 'bg-gray-200 dark:bg-[#252830] border-gray-300 dark:border-gray-600 text-gray-400'
      }`}>
        <canvas ref={canvasRef} width="300" height="300" className="hidden" />

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
            <button
              onClick={onRetake}
              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
            >
              Retake
            </button>
          </div>
        ) : isCameraActive ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
        ) : (
          <FiCamera size={32} />
        )}
      </div>

      {!faceImage && (
        <button
          type="button"
          onClick={isCameraActive ? onCapture : onStart}
          className={`mt-1 text-xs font-bold hover:underline px-4 py-1.5 rounded-full transition-colors ${
            isCameraActive
              ? 'bg-amber-500 text-black shadow-md no-underline hover:bg-amber-400'
              : 'text-amber-600 dark:text-amber-500'
          }`}
        >
          {isCameraActive ? 'Capture Photo' : 'Scan Face Data Now'}
        </button>
      )}

      {isCameraActive && (
        <button
          type="button"
          onClick={onStop}
          className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1"
        >
          <FiVideoOff /> Cancel
        </button>
      )}
    </div>
  );
}

=== frontend\src\features\members\components\MemberFormModal.jsx ===
import React, { useRef, useState } from 'react';
import { FiX, FiSave, FiLoader, FiUpload } from 'react-icons/fi';
import AvatarEditor from 'react-avatar-editor';
import CameraCapture from './CameraCapture';
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

const defaultForm = {
  id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active',
  enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
};

export default function MemberFormModal({ isOpen, isEditing, initialData, onClose, onSaved, onShowAlert }) {
  const [formData, setFormData] = useState(initialData || defaultForm);
  const [profilePic, setProfilePic] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorScale, setEditorScale] = useState(1.2);

  const editorRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync initialData when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const initial = initialData ? {
        id: initialData.id || '',
        firstName: initialData.firstName || initialData.first_name || '',
        lastName: initialData.lastName || initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        plan: initialData.plan || 'Walk-in',
        status: initialData.status || 'Active',
        dob: initialData.dob || '',
        height: initialData.height || '',
        weight: initialData.weight || '',
        profilePicUrl: initialData.profilePicUrl || (initialData.profile_pic ? `http://127.0.0.1:8000${initialData.profile_pic}` : null),
        enrolledFaceId: initialData.enrolledFaceId || initialData.enrolled_face_id || null
      } : defaultForm;
      setFormData(initial);
      setProfilePic(null);
      setEditorScale(1.2);
      setFaceImage(isEditing && (initialData?.enrolledFaceId || initialData?.enrolled_face_id) ? 'existing_data' : null);
      setIsCameraActive(false);
    }
  }, [isOpen, initialData, isEditing]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setFaceImage(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      onShowAlert('Camera Error', 'Could not access camera. Please ensure permissions are granted.', 'error');
      setIsCameraActive(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const size = Math.min(video.videoWidth, video.videoHeight);
      const xOff = (video.videoWidth - size) / 2;
      const yOff = (video.videoHeight - size) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, xOff, yOff, size, size, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      setFaceImage(canvas.toDataURL('image/png'));
      stopCamera();
    }
  };

  const getCroppedBlob = () => new Promise(resolve => {
    if (editorRef.current) {
      editorRef.current.getImageScaledToCanvas().toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
    } else resolve(null);
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData();
    fd.append('first_name', formData.firstName || formData.first_name || '');
    fd.append('last_name', formData.lastName || formData.last_name || '');
    fd.append('email', formData.email || '');
    fd.append('phone', formData.phone || '');
    fd.append('address', formData.address || '');
    fd.append('plan', formData.plan || 'Walk-in');
    fd.append('status', formData.status || 'Active');
    if (formData.dob) fd.append('dob', formData.dob);
    if (formData.height) fd.append('height', formData.height);
    if (formData.weight) fd.append('weight', formData.weight);
    if (faceImage && faceImage !== 'existing_data') fd.append('enrolled_face_id', faceImage);
    if (profilePic && editorRef.current) {
      const blob = await getCroppedBlob();
      if (blob) fd.append('profile_pic', blob, 'profile.jpg');
    } else if (profilePic) {
      fd.append('profile_pic', profilePic);
    }

    try {
      if (isEditing) {
        fd.append('_method', 'PUT');
        await api.post(`/members/${formData.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/members', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      fetch('http://127.0.0.1:5000/refresh_ai', { method: 'POST' }).catch(() => {});
      onShowAlert('Success', 'Member profile saved successfully!', 'success');
      stopCamera();
      onSaved();
      onClose();
    } catch (error) {
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat().join('\n');
        onShowAlert('Action Denied', msgs, 'error');
      } else if (error.response?.data?.message) {
        onShowAlert('Server Error', error.response.data.message, 'error');
      } else {
        onShowAlert('Error', 'Failed to save data. Please check your connection.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value.replace(/[^a-zA-Z\s\-ÃƒÂ±Ãƒâ€˜]/g, '') });
  };
  const handlePhoneChange = (e) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryBtn = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const bmiData = getBmiInfo(formData.height, formData.weight);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        
        {/* ADDED: Style block to completely hide the number input spinner arrows */}
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

        {/* Header */}
        <div className="p-6 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">{isEditing ? 'Edit Member Profile' : 'Add New Member'}</h3>
          <button onClick={() => { stopCamera(); onClose(); }} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white dark:bg-[#252830]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Pic */}
            <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
              <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Display Picture</h4>
              {profilePic ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="rounded-full overflow-hidden border-4 border-amber-500 shadow-lg">
                    <AvatarEditor ref={editorRef} image={profilePic} width={150} height={150} border={0} borderRadius={75} color={[255,255,255,0.6]} scale={editorScale} rotate={0} />
                  </div>
                  <div className="w-full max-w-[200px] flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">-</span>
                    <input type="range" min="1" max="3" step="0.01" value={editorScale} onChange={e => setEditorScale(parseFloat(e.target.value))} className="w-full accent-amber-500 cursor-pointer" />
                    <span className="text-xs font-bold text-gray-400">+</span>
                  </div>
                  <button type="button" onClick={() => { setProfilePic(null); setEditorScale(1.2); }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">Cancel / Pick New Image</button>
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
                  <input type="file" accept="image/*" className="hidden" onChange={e => { setProfilePic(e.target.files[0]); setEditorScale(1.2); }} />
                </label>
              )}
            </div>

            {/* Camera Capture */}
            <CameraCapture
              isCameraActive={isCameraActive}
              faceImage={faceImage}
              videoRef={videoRef}
              canvasRef={canvasRef}
              onStart={startCamera}
              onCapture={captureFace}
              onStop={stopCamera}
              onRetake={() => { setFaceImage(null); startCamera(); }}
            />
          </div>

          {/* Personal Details Form */}
          <form id="memberForm" className="space-y-6" onSubmit={handleSave}>
            <div>
              <h4 className="text-lg font-bold border-b-2 border-gray-200 dark:border-gray-700/50 pb-2 mb-4 text-slate-800 dark:text-gray-300">Personal Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <label className="block"><span className={labelClass}>First Name</span><input type="text" required value={formData.firstName} onChange={e => handleNameChange(e, 'firstName')} className={inputClass} placeholder="Juan" /></label>
                <label className="block"><span className={labelClass}>Last Name</span><input type="text" required value={formData.lastName} onChange={e => handleNameChange(e, 'lastName')} className={inputClass} placeholder="Dela Cruz" /></label>
                <label className="block"><span className={labelClass}>Email</span><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="juan@email.com" /></label>
                <label className="block lg:col-span-2"><span className={labelClass}>Address</span><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={inputClass} placeholder="123 Gym Street, Tagoloan" /></label>
                <label className="block">
                  <span className={labelClass}>Phone Number</span>
                  <input type="text" required value={formData.phone || ''} onChange={handlePhoneChange} className={inputClass} placeholder="09123456789" />
                  <span className="text-[10px] text-gray-400 font-medium float-right mt-1">{(formData.phone || '').length}/11</span>
                </label>
                <label className="block"><span className={labelClass}>Date of Birth</span><input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} /></label>
                <label className="block"><span className={labelClass}>Height (cm)</span><input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} className={inputClass} placeholder="170" /></label>
                <label className="block"><span className={labelClass}>Weight (kg)</span><input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} className={inputClass} placeholder="65" /></label>

                {/* BMI Display */}
                <div className="md:col-span-2 lg:col-span-3 bg-slate-100 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-xs">Body Mass Index (BMI)</span>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm mt-1.5 w-fit ${bmiData.color}`}>
                      {bmiData.label}
                    </span>
                  </div>
                  <span className="font-bold text-2xl text-slate-900 dark:text-gray-300">{bmiData.value}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
          <button type="button" onClick={() => { stopCamera(); onClose(); }} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
          <button form="memberForm" type="submit" disabled={isSaving || ((formData.phone || '').length > 0 && (formData.phone || '').length < 11)} className={primaryBtn}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Member')}
          </button>
        </div>
      </div>
    </div>
  );
}

=== frontend\src\features\members\components\MemberProfileModal.jsx ===
import React, { useState } from 'react';
import {
  FiX, FiMapPin, FiPhone, FiChevronLeft, FiChevronRight, 
  FiChevronDown, FiChevronUp, FiLock
} from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
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
  
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

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
        await api.post(`/members/${member.id}/assign-task`, { 
          exercise: ex.name.toUpperCase(),
          sets: ex.sets,
          reps: ex.reps 
        }).catch(() => {});
      }
      onShowAlert('Plan Saved', `âœ… Weekly routine saved! Today's tasks (${dayName}) have been dispatched to the AI for monitoring.`, 'success');
      const res = await api.get(`/members/${member.id}/workouts`);
      setWorkouts(res.data);
    } catch { onShowAlert('Error', 'Failed to assign workout plan.', 'error'); }
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
    const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, exercises: [] };
    acc[dateStr].exercises.push(log);
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const workoutsPerPage = 5;
  const totalWorkoutPages = Math.ceil(groupedWorkouts.length / workoutsPerPage);
  const currentGroupedWorkouts = groupedWorkouts.slice((workoutPage - 1) * workoutsPerPage, workoutPage * workoutsPerPage);

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
            <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mt-4 mb-4">
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
            <div className="flex-1 p-1 flex flex-col min-h-0 overflow-hidden">

              {/* ATTENDANCE CALENDAR */}
              {activeTab === 'attendance' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-0">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#252830] shadow-sm relative flex-1 overflow-hidden flex flex-col min-h-0">
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
                        background: linear-gradient(to right, #facc15, #f59e0b) !important;
                        color: #000000 !important; 
                        border: none !important;
                        border-radius: 0.75rem !important;
                        font-weight: 700 !important;
                        font-size: 0.875rem !important;
                        padding: 0.625rem 1.5rem !important;
                        box-shadow: 0 10px 15px -3px rgba(120, 53, 15, 0.2) !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.025em !important;
                        opacity: 1 !important;
                        text-shadow: none !important;
                        margin: 0 4px !important;
                      }
                      
                      .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000 !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; transition: all 0.2s !important; margin: 0 4px !important; }
                      .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
                      
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
                        white-space: normal !important; 
                        overflow: visible !important;   
                      }
                      /* Hide the calendar scrollbar */
                      .fc-scroller { overflow: hidden !important; }
                    `}</style>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={attendanceEvents}
                        height="auto" 
                        headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
                        dateClick={(info) => {
                          console.log('Clicked to add manual attendance on:', info.dateStr);
                        }}
                        eventClick={(info) => {
                          console.log('Clicked to edit/delete log ID:', info.event.extendedProps.logId);
                        }}
                        eventContent={(eventInfo) => (
                          <div className="flex items-center gap-1 w-full px-1">
                            <svg className="w-3.5 h-3.5 text-[#11a839] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-600 dark:text-slate-300 font-bold text-[11px] leading-tight flex-1">
                              Time In <span className="font-medium opacity-80 whitespace-nowrap">({eventInfo.event.extendedProps.timeIn})</span>
                            </span>
                          </div>
                        )}
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
                            <div key={i} className="flex flex-col bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-100 dark:border-amber-500/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img src={`/dataset/videos/${String(ex.id).padStart(4, '0')}.gif`} className="w-10 h-10 rounded border border-amber-200 dark:border-amber-500/30 object-cover flex-shrink-0" onError={e => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23fcd34d" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%2378350f" font-weight="bold">NA</text></svg>'; }} alt={ex.name} />
                                  <span className="font-bold text-xs text-amber-900 dark:text-amber-400 truncate block">{ex.name.toUpperCase()}</span>
                                </div>
                                <button onClick={() => { const arr = [...weeklyRoutine[activeDay]]; arr.splice(i, 1); setWeeklyRoutine({ ...weeklyRoutine, [activeDay]: arr }); }} className="text-[10px] text-red-500 hover:text-red-700 font-black px-2 py-1 bg-red-100/50 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/30 rounded transition-colors flex-shrink-0">X</button>
                              </div>
                              
                              {/* --- REPS & SETS INPUTS --- */}
                              <div className="flex items-center gap-4 mt-3 pl-[3.25rem]">
                                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-500">
                                  Sets: 
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={ex.sets || ''} 
                                    onChange={(e) => updateExerciseDetail(i, 'sets', e.target.value)} 
                                    className="w-14 px-2 py-1 rounded bg-white dark:bg-[#1a1c23] border border-amber-200 dark:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500 text-black dark:text-gray-200 shadow-sm text-center" 
                                  />
                                </label>
                                <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-500">
                                  Reps: 
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={ex.reps || ''} 
                                    onChange={(e) => updateExerciseDetail(i, 'reps', e.target.value)} 
                                    className="w-14 px-2 py-1 rounded bg-white dark:bg-[#1a1c23] border border-amber-200 dark:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500 text-black dark:text-gray-200 shadow-sm text-center" 
                                  />
                                </label>
                              </div>
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

=== frontend\src\features\members\components\MemberTable.jsx ===
import React from 'react';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiLoader, FiUsers,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const getStatusBadge = (status) => {
  const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
  if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
  if (status === 'Inactive') return <span className={`${base} bg-slate-50 text-slate-700 border-slate-500 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/50`}>Inactive</span>;
  return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
};

const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();

export default function MemberTable({
  members,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  deletingId,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewProfile,
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const indexOfFirst = (currentPage - 1) * itemsPerPage;
  const currentMembers = members.slice(indexOfFirst, indexOfFirst + itemsPerPage);

  const primaryBtn = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div />
        <button onClick={onAddMember} className={primaryBtn}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-sm border-2 border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
            <FiUsers size={18} />
            <span>{members.length} TOTAL MEMBERS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                {['Member Details', 'Phone Number', 'Address', 'Membership Plan', 'Customer Since', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest${i === 6 ? ' text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full" />
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
                          <img src={member.profilePicUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-sm" />
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
                      <button onClick={() => onViewProfile(member)} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
                        <FiEye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onEditMember(member)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => onDeleteMember(member.id)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingId === member.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirst + 1} to {Math.min(indexOfFirst + itemsPerPage, members.length)} of {members.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft size={18} />
              </button>
              {generatePageNumbers()}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

=== frontend\src\features\members\hooks\useMembers.js ===
import { useState, useEffect, useMemo, useCallback } from 'react';
import memberService from '../../../services/memberService';
import api from '../../../api';
import { useDataCache } from '../../../context/DataCacheContext';

const defaultForm = {
  id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active',
  enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
};

export function useMembers() {
  const { getCache, setCache, invalidateCache } = useDataCache();
  const [members, setMembers] = useState(() => getCache('members') || []);
  const [isLoading, setIsLoading] = useState(() => !getCache('members'));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal & selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Dialog feedback states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const loadMembers = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const data = await memberService.getAll();
      setMembers(data);
      setCache('members', data);
    } catch (error) {
      console.error("Failed to load members", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to load members list.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    // Stale-while-revalidate: if cache hit -> already showing data instantly,
    // just background-refresh. If cache miss -> show spinner and fetch.
    const hasCached = !!getCache('members');
    loadMembers(!hasCached);
  }, [loadMembers, getCache]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (m.phone && m.phone.includes(searchTerm));
      const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, filterStatus]);

  const handleAddMember = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditMember = (member) => {
    setFormData(member);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleViewProfile = (member) => {
    setSelectedProfile(member);
    setIsProfileOpen(true);
  };

  const handleDeleteMember = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Member',
      message: 'Are you sure you want to completely remove this member? All associated data will be lost.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Explicit dialog kill
        setDeletingId(id);
        try {
          await api.delete(`/members/${id}`);
        } catch (error) {
          // If backend throws an empty parsing error despite successful deletion, suppress it.
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally {
          setDeletingId(null);
          invalidateCache('members');
          invalidateCache('dashboard');
          loadMembers(false);
        }
      }
    });
  };

  const showAlert = (title, message, type = 'success') => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  return {
    members,
    filteredMembers,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    loadMembers,
    isFormOpen,
    setIsFormOpen,
    isEditing,
    formData,
    isProfileOpen,
    setIsProfileOpen,
    selectedProfile,
    deletingId,
    confirmDialog,
    setConfirmDialog,
    alertDialog,
    setAlertDialog,
    handleAddMember,
    handleEditMember,
    handleViewProfile,
    handleDeleteMember,
    showAlert
  };
}

export default useMembers;

=== frontend\src\features\subscriptions\components\CoachEventModal.jsx ===
import React from 'react';
import { FiX, FiSave } from 'react-icons/fi';

export default function CoachEventModal({
  isOpen,
  onClose,
  eventForm,
  setEventForm,
  recentColors,
  onSave
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex flex-col">
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-bold text-black dark:text-gray-300">Add Coach Event</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="p-6 space-y-4">
          <label className="block">
            <span className={labelClass}>Event Title</span>
            <input 
              type="text" 
              required 
              value={eventForm.title} 
              onChange={e => setEventForm({ ...eventForm, title: e.target.value })} 
              placeholder="e.g. CrossFit WOD" 
              className={inputClass} 
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Start Date</span>
              <input 
                type="date" 
                required 
                value={eventForm.start_date} 
                onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>End Date</span>
              <input 
                type="date" 
                required 
                value={eventForm.end_date} 
                onChange={e => setEventForm({ ...eventForm, end_date: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Start Time</span>
              <input 
                type="time" 
                required 
                value={eventForm.start_time} 
                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>End Time</span>
              <input 
                type="time" 
                required 
                value={eventForm.end_time} 
                onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })} 
                className={inputClass} 
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Location</span>
              <input 
                type="text" 
                required 
                value={eventForm.location} 
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })} 
                className={inputClass} 
              />
            </label>
            <label className="block">
              <span className={labelClass}>Banner Color</span>
              <div className="flex gap-2 mt-1 items-center">
                <input 
                  type="color" 
                  value={eventForm.color} 
                  onChange={e => setEventForm({ ...eventForm, color: e.target.value })} 
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 bg-transparent p-1" 
                />
                <div className="flex flex-wrap gap-1.5 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">
                  {recentColors.map(c => (
                    <button 
                      type="button" 
                      key={c} 
                      onClick={() => setEventForm({ ...eventForm, color: c })} 
                      className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" 
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs"
            >
              Cancel
            </button>
            <button type="submit" className={primaryButtonClass + " !text-xs !px-5"}>
              <FiSave size={16} /> Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

=== frontend\src\features\subscriptions\components\PricingCatalogModal.jsx ===
import React from 'react';
import { FiX, FiPlus, FiSave, FiTrash2, FiLoader } from 'react-icons/fi';

export default function PricingCatalogModal({
  isOpen,
  isAddingPlan,
  setIsAddingPlan,
  isSaving,
  plans,
  newPlan,
  setNewPlan,
  deletingPlanId,
  onClose,
  onUpdatePlanPrice,
  onSavePlans,
  onAddNewPlan,
  onDeletePlan
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
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
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto">
          {isAddingPlan ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-500/50 flex flex-col gap-5 mb-2 animate-in fade-in slide-in-from-top-2 relative shadow-inner">
              <button 
                onClick={() => setIsAddingPlan(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 shadow-sm" 
                title="Cancel New Plan"
              >
                <FiX size={16} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
                <FiPlus className="stroke-[3px]" size={20} />
                <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-gray-300">Create Custom Plan</h4>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className={labelClass}>Plan Name</span>
                  <input 
                    type="text" 
                    value={newPlan.name} 
                    onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} 
                    placeholder="e.g. Student Promo" 
                    className={inputClass} 
                  />
                </label>
                <div className="flex gap-4">
                  <label className="block w-1/2">
                    <span className={labelClass}>Duration (Day/s)</span>
                    <input 
                      type="number" 
                      value={newPlan.duration_days} 
                      onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })} 
                      className={inputClass} 
                      placeholder="30" 
                    />
                  </label>
                  <label className="block w-1/2">
                    <span className={labelClass}>Price (&#8369;)</span>
                    <input 
                      type="number" 
                      value={newPlan.price} 
                      onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} 
                      className={inputClass} 
                      placeholder="0.00" 
                    />
                  </label>
                </div>
              </div>
              <button onClick={onAddNewPlan} disabled={isSaving} className={primaryButtonClass + " mt-2 shadow-amber-500/30 w-full"}>
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
              <p className="text-sm text-amber-600 dark:text-amber-500 font-bold mt-1 cursor-pointer hover:underline" onClick={() => setIsAddingPlan(true)}>
                Click 'New Plan' to create one!
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 group transition-all hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-black dark:text-gray-300">{plan.name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{plan.duration_days} Day/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-black dark:text-gray-300 font-bold text-lg px-2">&#8369;</span>
                  <input 
                    type="number" 
                    value={plan.price} 
                    onChange={(e) => onUpdatePlanPrice(plan.id, e.target.value)} 
                    className="w-24 px-3 py-2 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl text-right font-bold text-black dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                  />
                  <button 
                    onClick={() => onDeletePlan(plan.id)} 
                    disabled={deletingPlanId === plan.id} 
                    title="Delete Plan" 
                    className="inline-flex items-center justify-center p-2 ml-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                  >
                    {deletingPlanId === plan.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 mt-auto">
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
          >
            Close
          </button>
          <button onClick={onSavePlans} disabled={isSaving || plans.length === 0} className={primaryButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Saving...' : 'Save Updated Prices'}
          </button>
        </div>
      </div>
    </div>
  );
}

=== frontend\src\features\subscriptions\components\SubscriptionFormModal.jsx ===
import React from 'react';
import { FiX, FiTag, FiCheckCircle, FiSave, FiLoader } from 'react-icons/fi';

export default function SubscriptionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  plans,
  recentColors,
  loyalDiscount,
  calculatedPrice,
  onClose,
  onSave
}) {
  if (!isOpen) return null;

  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));
  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold text-black dark:text-gray-300">{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h3>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <FiX size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#252830]">
          <form id="subForm" className="space-y-5" onSubmit={onSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Select Member</span>
                <select 
                  required 
                  value={formData.member_id} 
                  onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">Choose Member</option>
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
                      <button 
                        type="button" 
                        key={c} 
                        onClick={() => setFormData({ ...formData, color: c })} 
                        className="w-6 h-6 rounded-full border border-gray-400 dark:border-gray-500 shadow-sm transition-transform hover:scale-110" 
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Plan</span>
                <select 
                  required 
                  value={formData.plan_type} 
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} 
                  className={inputClass}
                >
                  <option value="">Select a Plan</option>
                  {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Payment Method</span>
                <select 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} 
                  className={inputClass}
                >
                  <option value="Cash">Cash</option>
                  <option value="Gcash">Gcash</option>
                  <option value="Card">Card</option>
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
              <input 
                type="text" 
                value={formData.reference_number} 
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
                className={inputClass} 
                placeholder="Receipt or Transaction #" 
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className={labelClass}>Start Date</span>
                <input 
                  type="date" 
                  required 
                  value={formData.start_date} 
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                  className={inputClass} 
                />
              </label>
              <label className="block">
                <span className={labelClass}>Expiration Date (Auto-calculated)</span>
                <input 
                  type="date" 
                  value={formData.end_date} 
                  disabled 
                  className="mt-1 w-full p-2.5 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium" 
                />
              </label>
            </div>
          </form>
        </div>
        <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSaving} 
            className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
          >
            Cancel
          </button>
          <button form="subForm" type="submit" disabled={isSaving} className={primaryButtonClass}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Subscription')}
          </button>
        </div>
      </div>
    </div>
  );
}

=== frontend\src\features\subscriptions\components\SubscriptionsCalendarView.jsx ===
import React from 'react';
import { FiFilter, FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export default function SubscriptionsCalendarView({
  subscriptions,
  coachEvents,
  showSubscriptions,
  setShowSubscriptions,
  showCoachEvents,
  setShowCoachEvents,
  onOpenEventModal,
  onDeleteCoachEvent,
  onDateClick
}) {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedH = h % 12 || 12;
    return `${formattedH}:${minutes} ${ampm}`;
  };

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
  }

  if (showCoachEvents) {
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
  }

  const activeSubsLegend = uniqueLatestActiveSubs.filter(s => {
    const planName = (s.plan_type || '').toLowerCase();
    if (planName.includes('walk') || planName.includes('daily') || planName === 'none') return false;
    return true;
  }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const sortedCoachEvents = [...coachEvents].sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
  // Filter out events that have already passed (based on end_date, or start_date if single day)
  const upcomingCoachEvents = sortedCoachEvents.filter(ev => (ev.end_date || ev.start_date) >= todayStr);

  return (
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
          
          /* EXACT MATCH TO "ADD MEMBER" BUTTON - HIGHEST SPECIFICITY */
          .fc .fc-button.fc-button-primary.fc-today-button,
          .dark .fc .fc-button.fc-button-primary.fc-today-button,
          .fc .fc-button.fc-button-primary.fc-today-button:disabled,
          .dark .fc .fc-button.fc-button-primary.fc-today-button:disabled {
            background: linear-gradient(to right, #facc15, #f59e0b) !important;
            border: none !important;
            color: #000000 !important; 
            font-weight: 700 !important;
            font-size: 0.875rem !important;
            border-radius: 0.75rem !important;
            padding: 0.625rem 1.5rem !important;
            box-shadow: 0 10px 15px -3px rgba(120, 53, 15, 0.2) !important;
            text-transform: uppercase !important;
            letter-spacing: 0.025em !important;
            opacity: 1 !important;
            text-shadow: none !important;
            margin: 0 4px !important;
          }
          
          .fc .fc-button.fc-button-primary.fc-today-button:hover,
          .dark .fc .fc-button.fc-button-primary.fc-today-button:hover {
            color: #000000 !important; 
          }
          
          .fc .fc-button.fc-button-primary.fc-today-button:not(:disabled):hover,
          .dark .fc .fc-button.fc-button-primary.fc-today-button:not(:disabled):hover {
            background: linear-gradient(to right, #fde047, #fbbf24) !important;
          }

          .fc .fc-button.fc-button-primary.fc-today-button:disabled,
          .dark .fc .fc-button.fc-button-primary.fc-today-button:disabled {
            opacity: 0.7 !important;
            cursor: not-allowed !important;
          }

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
          dateClick={onDateClick}
        />
      </div>

      <div className="w-full xl:w-[340px] flex flex-col gap-6 flex-shrink-0">
        <div className="bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3">
            <FiFilter className="text-amber-500" /> View Filters
          </h3>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showSubscriptions} 
                onChange={e => setShowSubscriptions(e.target.checked)} 
                className="w-4 h-4 accent-amber-500 cursor-pointer" 
              />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Client Subscriptions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={showCoachEvents} 
                onChange={e => setShowCoachEvents(e.target.checked)} 
                className="w-4 h-4 accent-amber-500 cursor-pointer" 
              />
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
            <h3 className="text-base font-bold text-black dark:text-gray-300">Event Plans</h3>
            <button 
              onClick={onOpenEventModal} 
              className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-3 py-1.5 rounded-lg font-bold shadow-md shadow-amber-900/20 transition-all active:scale-95 uppercase tracking-wider text-[10px]"
            >
              <FiPlus size={12} strokeWidth={3} /> Add New
            </button>
          </div>
          
          <div className="overflow-y-auto hidden-scrollbar space-y-3 flex-1 pr-1">
            {upcomingCoachEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No scheduled events.</p>
            ) : (
              upcomingCoachEvents.map((ev) => (
                <div 
                  key={ev.id} 
                  className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group p-3.5 flex justify-between items-center transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600" 
                  style={{ borderLeft: `5px solid ${ev.color || '#eab308'}` }}
                >
                  <button 
                    onClick={() => onDeleteCoachEvent(ev.id)} 
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-md hover:bg-red-600 hover:scale-110" 
                    title="Delete Event"
                  >
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
  );
}

=== frontend\src\features\subscriptions\components\SubscriptionsTable.jsx ===
import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiList, FiChevronLeft, FiChevronRight, FiLoader } from 'react-icons/fi';

export default function SubscriptionsTable({
  subscriptions,
  isLoading,
  plans,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterPlan,
  setFilterPlan,
  deletingId,
  onAddSubscription,
  onEditSubscription,
  onDeleteSubscription
}) {
  const filteredDropdownPlans = plans.filter(p => !p.name.toLowerCase().includes('daily') && !p.name.toLowerCase().includes('walk'));

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
        <button 
          key={i} 
          onClick={() => setCurrentPage(i)} 
          className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') return <span className={`${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    return <span className={`${base} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by member name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm" 
            />
          </div>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
          <select 
            value={filterPlan} 
            onChange={(e) => setFilterPlan(e.target.value)} 
            className="w-full sm:w-40 px-4 py-2.5 bg-gray-50 dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-black dark:text-gray-300 font-medium transition-all shadow-sm"
          >
            <option value="All">All Plans</option>
            {filteredDropdownPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={onAddSubscription} className={primaryButtonClass}>
          <FiPlus size={18} strokeWidth={3} /> Add Subscription
        </button>
      </div>

      <div className="bg-white dark:bg-[#252830] rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
            <FiList size={18} />
            <span>{filteredSubs.length} TOTAL SUBSCRIPTIONS</span>
          </div>
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
            <button onClick={goToPrevPage} disabled={currentPage === 1 || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <FiChevronLeft size={18} />
            </button>
            {generatePageNumbers()}
            <button onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <FiChevronRight size={18} />
            </button>
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
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
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
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No subscriptions found.</td></tr>
              ) : (
                currentSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm" style={{ backgroundColor: sub.color }}></div>
                    </td>
                    <td className="px-6 py-4 font-medium text-black dark:text-gray-300 whitespace-nowrap">
                      {sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member'}
                    </td>
                    <td className="px-6 py-4 text-sm text-black dark:text-gray-300 font-normal whitespace-nowrap">{sub.plan_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-normal text-black dark:text-gray-300">{sub.start_date}</div>
                      <div className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">to {sub.end_date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      <button 
                        onClick={() => onEditSubscription(sub)} 
                        disabled={deletingId === sub.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                      >
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onDeleteSubscription(sub.id)} 
                        disabled={deletingId === sub.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
                      >
                        {deletingId === sub.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

=== frontend\src\features\subscriptions\hooks\useSubscriptions.js ===
import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { useDataCache } from '../../../context/DataCacheContext';

export function useSubscriptions() {
  const { getCache, setCache, invalidateCache } = useDataCache();

  const cachedData = getCache('subscriptions_data');
  const [activeView, setActiveView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(!cachedData);
  
  const [subscriptions, setSubscriptions] = useState(cachedData?.subscriptions || []);
  const [membersList, setMembersList] = useState(cachedData?.membersList || []);
  const [plans, setPlans] = useState(cachedData?.plans || []); 
  
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

  // Dialogs
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

  // Cleaned default form fields
  const defaultForm = {
    id: '', member_id: '', plan_type: '', start_date: new Date().toISOString().split('T')[0], 
    end_date: '', payment_method: 'Cash', color: '#f59e0b', reference_number: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', duration_days: 30 });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [subsResponse, membersResponse, plansResponse] = await Promise.all([
        api.get('/memberships'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      const newSubs = Array.isArray(subsResponse.data) ? subsResponse.data : [];
      const newMembers = Array.isArray(membersResponse.data) ? membersResponse.data : [];
      const newPlans = Array.isArray(plansResponse.data) ? plansResponse.data : [];
      setSubscriptions(newSubs);
      setMembersList(newMembers);
      setPlans(newPlans);
      setCache('subscriptions_data', { subscriptions: newSubs, membersList: newMembers, plans: newPlans });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('subscriptions_data');
    fetchData(!hasCached);
  }, [fetchData, getCache]);

  // Safely auto-calculate end_date using integer conversion to prevent date string concatenation errors
  useEffect(() => {
    if (!formData.start_date || !formData.plan_type) return;
    const start = new Date(formData.start_date);
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (selectedPlan) {
      let expiry = new Date(start);
      expiry.setDate(start.getDate() + parseInt(selectedPlan.duration_days || 0, 10));
      setFormData(prev => ({ ...prev, end_date: expiry.toISOString().split('T')[0] }));
    }
  }, [formData.plan_type, formData.start_date, plans]);

  // Auto calculate loyalty discount safely
  const [loyalDiscount, setLoyalDiscount] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (!formData.member_id || !formData.plan_type) return;
    const selectedPlan = plans.find(p => p.name === formData.plan_type);
    if (!selectedPlan) return;

    let finalPrice = Number(selectedPlan.price);
    let discount = 0;

    if (finalPrice > 300) {
      const pastSubs = subscriptions.filter(s => s.member_id === parseInt(formData.member_id, 10)).length;
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
      end_date: sub.end_date, payment_method: sub.payment_method, color: sub.color || '#f59e0b', reference_number: sub.reference_number || ''
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingId(id);
        try {
          await api.delete(`/memberships/${id}`);
        } catch (error) {
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally {
          setSubscriptions(prev => prev.filter(s => s.id !== id));
          setDeletingId(null);
          invalidateCache('subscriptions_data');
          invalidateCache('dashboard');
          fetchData(false); 
        }
      }
    });
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      
      // STRICT PAYLOAD FILTERING: 
      // Emptry strings ("") are actively intercepted and converted into standard SQL "null" values 
      // to completely bypass database Unique Constraint duplication errors that trigger 500 crashes.
      const cleanRef = formData.reference_number?.trim() || null;
      const cleanNotes = formData.notes?.trim() || null;
      const memberId = formData.member_id ? parseInt(formData.member_id, 10) : null;
      const amt = parseFloat(calculatedPrice) || 0;

      const payload = { 
        member_id: memberId,
        plan_type: formData.plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        payment_method: formData.payment_method,
        reference_number: cleanRef,
        amount: amt,
        color: formData.color,
        status: 'Active',
        auto_renew: 0,
        notes: cleanNotes
      };
      
      if (isEditing) {
        await api.put(`/memberships/${formData.id}`, payload);
      } else {
        await api.post('/memberships', payload);
      }

      if (memberId && formData.plan_type) {
        const memberData = new FormData();
        memberData.append('plan', formData.plan_type);
        memberData.append('status', 'Active');
        memberData.append('_method', 'PUT');
        await api.post(`/members/${memberId}`, memberData).catch(() => {});
      }
      saveRecentColor(formData.color);
      
      invalidateCache('subscriptions_data');
      invalidateCache('members');
      invalidateCache('dashboard');
      await fetchData(false); 
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Subscription saved successfully!', type: 'success' });
    } catch (error) { 
      console.error("Failed to save:", error); 
      const errorMsg = error.response?.data?.message || 'Failed to save subscription. Ensure fields are formatted correctly.';
      setAlertDialog({ isOpen: true, title: 'Error', message: errorMsg, type: 'error' });
    } finally { setIsSaving(false); }
  };

  const handleSaveCoachEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...eventForm, id: Date.now() };
    setCoachEvents(prev => [...prev, newEvent]);
    saveRecentColor(eventForm.color);
    setIsEventModalOpen(false);
  };

  const handleDeleteCoachEvent = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Coach Event',
      message: 'Are you sure you want to permanently delete this scheduled coaching event?',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setCoachEvents(prev => prev.filter(ev => ev.id !== id));
      }
    });
  };

  const handleUpdatePlanPrice = (id, newPrice) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, price: Number(newPrice) } : p));
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingPlanId(id); 
        try {
          await api.delete(`/plans/${id}`);
        } catch (error) { 
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally { 
          setPlans(prev => prev.filter(p => p.id !== id));
          setDeletingPlanId(null); 
        }
      }
    });
  };

  return {
    activeView, setActiveView,
    isLoading,
    subscriptions, setSubscriptions,
    membersList,
    plans, setPlans,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterPlan, setFilterPlan,
    isModalOpen, setIsModalOpen,
    isPlanModalOpen, setIsPlanModalOpen,
    isAddingPlan, setIsAddingPlan,
    isEditing,
    isSaving,
    deletingId,
    deletingPlanId,
    isEventModalOpen, setIsEventModalOpen,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    formData, setFormData,
    newPlan, setNewPlan,
    loyalDiscount,
    calculatedPrice,
    fetchData,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveSubscription,
    handleSaveCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  };
}

=== frontend\src\features\transactions\components\PrintableTransactionReport.jsx ===
import React from 'react';

export default function PrintableTransactionReport({
  filteredTxns,
  totalIncome,
  totalRefunds,
  netRevenue,
  pendingAmount
}) {
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
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {totalIncome.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {totalRefunds.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black border-r-2 border-black">&#8369; {netRevenue.toLocaleString()}</td>
              <td className="py-4 text-2xl font-black">&#8369; {pendingAmount.toLocaleString()}</td>
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
              const amtStr = Number(txn.amount) > 0 ? `\u20B1 ${Number(txn.amount).toLocaleString()}` : `-\u20B1 ${Math.abs(Number(txn.amount)).toLocaleString()}`;
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
    </>
  );
}

=== frontend\src\features\transactions\components\TransactionFormModal.jsx ===
import React from 'react';
import { FiX, FiTag, FiSave, FiLoader } from 'react-icons/fi';

export default function TransactionFormModal({
  isOpen,
  isEditing,
  isSaving,
  formData,
  setFormData,
  membersList,
  plansList,
  onClose,
  onSave,
  onPlanSelection
}) {
  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-[#1e1e1e] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        
        <div className="p-5 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">
            {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
          </h3>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={onSave} className="flex flex-col max-h-[80vh]">
          <div className="p-6 overflow-y-auto space-y-5">
            
            <div>
              <label className={labelClass}>Member</label>
              <select 
                required={formData.member_id !== ''} 
                value={formData.member_id} 
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} 
                className={inputClass}
              >
                <option value="">-- Select A Member --</option>
                {membersList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Transaction Date</label>
                <input 
                  type="date" 
                  required 
                  value={formData.transaction_date} 
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })} 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Transaction Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                  className={inputClass}
                >
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
                  onChange={(e) => onPlanSelection(e.target.value)}
                >
                  <option value="">-- Select A Subscription --</option>
                  {plansList.map(p => <option key={p.id} value={p.name}>{p.name} (&#8369;{p.price})</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Amount (&#8369;)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                  className={inputClass}
                >
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
                <select 
                  value={formData.payment_method} 
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} 
                  className={inputClass}
                >
                  <option>Cash</option>
                  <option>Gcash</option>
                  <option>Card</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Reference</label>
                <input 
                  type="text" 
                  placeholder="e.g. GCash Ref / Receipt No." 
                  value={formData.reference_number} 
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
                  className={inputClass} 
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description / Notes</label>
              <input 
                type="text" 
                placeholder="Brief details about the transaction" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                className={inputClass} 
              />
            </div>

          </div>
          
          <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSaving} 
              className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={primaryButtonClass}>
              {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
              {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Record Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

=== frontend\src\features\transactions\components\TransactionStats.jsx ===
import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock } from 'react-icons/fi';

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-[#252830] p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1 hover:shadow-md duration-200">
    <div className={`p-4 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-normal text-slate-900 dark:text-gray-300 mt-1">{value}</h3>
    </div>
  </div>
);

export default function TransactionStats({ totalIncome, totalRefunds, netRevenue, pendingAmount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Income" 
        value={`\u20B1 ${totalIncome.toLocaleString()}`} 
        icon={<FiTrendingUp size={28} strokeWidth={2.5} />} 
        colorClass="bg-emerald-700 text-white shadow-lg shadow-emerald-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Refunds" 
        value={`\u20B1 ${totalRefunds.toLocaleString()}`} 
        icon={<FiTrendingDown size={28} strokeWidth={2.5} />} 
        colorClass="bg-red-800 text-white shadow-lg shadow-red-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Net Revenue" 
        value={`\u20B1 ${netRevenue.toLocaleString()}`} 
        icon={<FiDollarSign size={28} strokeWidth={2.5} />} 
        colorClass="bg-blue-800 text-white shadow-lg shadow-blue-700/40 dark:shadow-none" 
      />
      <StatCard 
        title="Pending" 
        value={`\u20B1 ${pendingAmount.toLocaleString()}`} 
        icon={<FiClock size={28} strokeWidth={2.5} />} 
        colorClass="bg-amber-700 text-white shadow-lg shadow-amber-600/40 dark:shadow-none" 
      />
    </div>
  );
}

=== frontend\src\features\transactions\components\TransactionTable.jsx ===
import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2, 
  FiPrinter, FiUser, FiChevronLeft, FiChevronRight, FiList, FiLoader 
} from 'react-icons/fi';

export default function TransactionTable({
  transactions,
  isLoading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  isExporting,
  deletingId,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
  onPrintReceipt
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTxns = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => setCurrentPage(i)} 
          className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

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
    if ((method || '').toLowerCase() === 'gcash') return `${base} bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50`;
    if ((method || '').toLowerCase() === 'cash') return `${base} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`;
    return `${base} bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500`;
  };

  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  const exportButtonClass = "flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-gray-300 dark:hover:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <button onClick={onAddTransaction} className={primaryButtonClass}>
          <FiPlus size={18} strokeWidth={3} /> Record Transaction
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by ID or Member Name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm" 
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)} 
            className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          >
            <option value="All">All Types</option>
            <option value="Subscription Payment">Subscription Payment</option>
            <option value="Fee">Fee (Walk-in)</option>
            <option value="Refund">Refund</option>
            <option value="Other">Other</option>
          </select>

          <button onClick={onExportCSV} disabled={isExporting} className={exportButtonClass} title="Download table data to a spreadsheet">
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
            <span>{transactions.length} TOTAL TRANSACTIONS</span>
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
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">No transactions found.</td>
                </tr>
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
                      <button 
                        onClick={() => onPrintReceipt(txn)} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm"
                      >
                        <FiPrinter size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onEditTransaction(txn)} 
                        disabled={deletingId === txn.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 dark:hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"
                      >
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => onDeleteTransaction(txn.id)} 
                        disabled={deletingId === txn.id} 
                        className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-sm disabled:opacity-50"
                      >
                        {deletingId === txn.id ? <FiLoader size={16} className="animate-spin" strokeWidth={2.5} /> : <FiTrash2 size={16} strokeWidth={2.5} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, transactions.length)} of {transactions.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronLeft size={18} />
              </button>
              {generatePageNumbers()}
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

=== frontend\src\features\transactions\hooks\useTransactions.js ===
import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import logo from '../../../assets/logo.png';
import { useDataCache } from '../../../context/DataCacheContext';

export function useTransactions() {
  const { getCache, setCache, invalidateCache } = useDataCache();

  const cachedData = getCache('transactions_data');
  const [transactions, setTransactions] = useState(cachedData?.transactions || []);
  const [membersList, setMembersList] = useState(cachedData?.membersList || []);
  const [plansList, setPlansList] = useState(cachedData?.plansList || []);
  const [isLoading, setIsLoading] = useState(!cachedData);
  
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

  // Dialogs
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [txnRes, memRes, plansRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/members'),
        api.get('/plans') 
      ]);
      const newTxns = Array.isArray(txnRes.data) ? txnRes.data : (txnRes.data?.data || []);
      const newMembers = Array.isArray(memRes.data) ? memRes.data : [];
      const newPlans = Array.isArray(plansRes.data) ? plansRes.data : [];
      setTransactions(newTxns);
      setMembersList(newMembers);
      setPlansList(newPlans);
      setCache('transactions_data', { transactions: newTxns, membersList: newMembers, plansList: newPlans });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('transactions_data');
    fetchData(!hasCached);
  }, [fetchData, getCache]);

  const handlePlanSelection = (planName) => {
    const selectedPlan = plansList.find(p => p.name === planName);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        amount: selectedPlan.price,
        description: `${selectedPlan.name} Plan Payment`
      }));
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
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); 
        setDeletingId(id);
        try {
          await api.delete(`/transactions/${id}`);
        } catch (error) {
          console.warn("API threw an error, catching silently to prevent stuck popup.", error);
        } finally {
          setTransactions(prev => prev.filter(t => t.id !== id));
          setDeletingId(null);
          invalidateCache('transactions_data');
          invalidateCache('dashboard');
          fetchData(false);
        }
      }
    });
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        ...formData, 
        member_id: formData.member_id ? parseInt(formData.member_id, 10) : null,
        reference_number: formData.reference_number ? formData.reference_number : null,
        description: formData.description ? formData.description : null,
        amount: parseFloat(formData.amount)
      };

      if (!isEditing) delete payload.id;
      
      if (isEditing) {
        await api.put(`/transactions/${formData.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      invalidateCache('transactions_data');
      invalidateCache('dashboard');
      await fetchData(false);
      setIsModalOpen(false);
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Transaction recorded successfully!', type: 'success' });
    } catch (error) {
      console.error("Failed to save transaction:", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Error saving transaction data. Make sure all required fields are filled.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTxns = transactions.filter(txn => {
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-in Guest';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) || (txn.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

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
    const memberId = txn.member ? String(txn.member.id).padStart(4, '0') : 'N/A';
    const memberName = txn.member ? `${txn.member.first_name} ${txn.member.last_name}` : 'Walk-In Guest';

    const isSubPayment = txn.type === 'Subscription Payment';

    // Phase 1: Try to extract the plan from the description first
    let matchedPlan = plansList.find(p => txnDesc.toLowerCase().includes(p.name.toLowerCase()));

    // Phase 2: Pull real exact subscription dates to prevent matching errors
    const subsCache = getCache('subscriptions_data');
    const memberSubs = (subsCache?.subscriptions || [])
        .filter(s => s.member_id === txn.member_id)
        .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
    const latestSub = memberSubs[0];

    // Phase 3: If no plan matched the text description, rely on the actual user subscription data 
    if (!matchedPlan && latestSub) {
        matchedPlan = plansList.find(p => p.name.toLowerCase() === latestSub.plan_type.toLowerCase());
    }
    
    // Phase 4: Extreme Fallback to member profile plan string
    if (!matchedPlan && memberPlan && !memberPlan.toLowerCase().includes('walk')) {
        matchedPlan = plansList.find(p => p.name.toLowerCase() === memberPlan.toLowerCase());
    }

    // Force Walk-In logic completely preventing "Walk-In" bugs for subscription buyers
    const isWalkIn = !isSubPayment && (txn.type === 'Fee' || !txn.member || memberPlan.toLowerCase().includes('walk') || txnDesc.toLowerCase().includes('walk'));

    let membershipPlan = 'Walk-In';
    if (!isWalkIn) {
        if (matchedPlan) {
            membershipPlan = matchedPlan.name;
        } else if (isSubPayment) {
            membershipPlan = 'Subscription';
        } else {
            membershipPlan = memberPlan === 'Without Coach' ? 'Without Coach (Open Gym)' : memberPlan;
        }
    }

    let basePrice = Number(txn.amount);
    let discountAmount = 0;
    let itemName = isWalkIn ? 'Walk-In Access' : 'Subscription Bill';

    if (isSubPayment && matchedPlan) {
        if (Number(matchedPlan.price) > Number(txn.amount)) {
            basePrice = Number(matchedPlan.price);
            discountAmount = basePrice - Number(txn.amount);
        }
        itemName = `${matchedPlan.name} Bill`;
    }

    const now = new Date();
    const printDate = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const printTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    let validThru = 'N/A';
    if (isWalkIn) {
        const walkInDate = new Date(txn.transaction_date + 'T00:00:00');
        const formattedWalkInDate = walkInDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        validThru = `${formattedWalkInDate} (9:00 AM - 9:30 PM)`;
    } else if (isSubPayment || matchedPlan) {
        let subStart = txn.transaction_date;
        let subEnd = null;

        // Force exactly matched date tracking overriding transaction records
        if (latestSub) {
            subStart = latestSub.start_date;
            subEnd = latestSub.end_date;
        }

        if (!subEnd && matchedPlan) {
            const startDate = new Date(subStart + 'T00:00:00');
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + parseInt(matchedPlan.duration_days || 0, 10));
            subEnd = endDate.toISOString().split('T')[0];
        }

        if (subStart && subEnd) {
            const sDate = new Date(subStart + 'T00:00:00');
            const eDate = new Date(subEnd + 'T00:00:00');
            const startFmt = sDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            const endFmt = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            validThru = `${startFmt} - ${endFmt} (9:00 AM - 9:30 PM)`;
        }
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

  const totalIncome = transactions.filter(t => Number(t.amount) > 0 && t.status === 'Complete').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalRefunds = transactions.filter(t => t.type === 'Refund').reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const netRevenue = totalIncome - totalRefunds;
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    transactions,
    membersList,
    plansList,
    isLoading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    isModalOpen, setIsModalOpen,
    isEditing,
    formData, setFormData,
    isSaving,
    isExporting,
    deletingId,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    filteredTxns,
    totalIncome,
    totalRefunds,
    netRevenue,
    pendingAmount,
    handlePlanSelection,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveTransaction,
    handleExportCSV,
    handlePrintReceipt
  };
}

=== frontend\src\hooks\usePrefetch.js ===
import { useEffect, useRef } from 'react';
import api from '../api';
import { useDataCache } from '../context/DataCacheContext';

/**
 * App-level background prefetcher.
 *
 * Fires ALL page API calls in parallel the moment the app loads.
 * Results are stored in the cache so every page after the first one
 * loads INSTANTLY â€” data is already there before the user even clicks.
 *
 * This runs silently in the background and never blocks the UI.
 * It only runs ONCE per session (skips if cache already has data).
 */
export function usePrefetch() {
  const { getCache, setCache } = useDataCache();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Don't prefetch more than once per session
    if (hasPrefetched.current) return;

    // If cache is already populated (e.g. from sessionStorage after refresh),
    // no need to prefetch â€” everything is already fast.
    const alreadyCached =
      getCache('dashboard') &&
      getCache('members') &&
      getCache('subscriptions_data') &&
      getCache('transactions_data');

    if (alreadyCached) {
      hasPrefetched.current = true;
      return;
    }

    hasPrefetched.current = true;

    const currentMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Fire ALL requests in parallel â€” none block each other
    const prefetchAll = async () => {
      await Promise.allSettled([

        // Dashboard
        (async () => {
          if (getCache('dashboard')) return;
          try {
            const res = await api.get('/dashboard');
            const data = res.data;
            setCache('dashboard', {
              stats: data.stats,
              salesData: data.salesData,
              recentMembers: data.recentMembers.map(m => `${m.first_name} ${m.last_name}`),
              recentTxns: data.recentTxns.map(t => ({
                type: t.type,
                amount: t.amount,
                method: t.payment_method,
                memberName: t.member
                  ? `${t.member.first_name} ${t.member.last_name}`
                  : 'Walk-in Guest',
              })),
              expiringSoon: data.expiringSoon.map(sub => ({
                name: sub.member
                  ? `${sub.member.first_name} ${sub.member.last_name}`
                  : 'Unknown Member',
                days: Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24)),
              })),
              rawCalendarEvents: data.calendarEvents || [],
            });
          } catch { /* silently ignore â€” page will fetch itself */ }
        })(),

        // Members list (shared by Members, Subscriptions, Transactions pages)
        (async () => {
          if (getCache('members')) return;
          try {
            const res = await api.get('/members');
            const data = Array.isArray(res.data) ? res.data : [];
            setCache('members', data);
          } catch { /* silently ignore */ }
        })(),

        // Subscriptions data (memberships + members + plans)
        (async () => {
          if (getCache('subscriptions_data')) return;
          try {
            const [subsRes, membersRes, plansRes] = await Promise.all([
              api.get('/memberships'),
              api.get('/members'),
              api.get('/plans'),
            ]);
            setCache('subscriptions_data', {
              subscriptions: Array.isArray(subsRes.data) ? subsRes.data : [],
              membersList: Array.isArray(membersRes.data) ? membersRes.data : [],
              plans: Array.isArray(plansRes.data) ? plansRes.data : [],
            });
          } catch { /* silently ignore */ }
        })(),

        // Transactions data
        (async () => {
          if (getCache('transactions_data')) return;
          try {
            const [txnRes, membersRes, plansRes] = await Promise.all([
              api.get('/transactions'),
              api.get('/members'),
              api.get('/plans'),
            ]);
            setCache('transactions_data', {
              transactions: Array.isArray(txnRes.data) ? txnRes.data : (txnRes.data?.data || []),
              membersList: Array.isArray(membersRes.data) ? membersRes.data : [],
              plansList: Array.isArray(plansRes.data) ? plansRes.data : [],
            });
          } catch { /* silently ignore */ }
        })(),

        // Reports (default: current month â€” the most common view)
        (async () => {
          const reportKey = `reports_${currentMonthStart}_${today}`;
          if (getCache(reportKey)) return;
          try {
            const res = await api.get(`/reports?start=${currentMonthStart}&end=${today}`);
            setCache(reportKey, res.data);
          } catch { /* silently ignore */ }
        })(),

      ]);
    };

    // Small delay so the current page's own fetch gets priority
    const timer = setTimeout(prefetchAll, 300);
    return () => clearTimeout(timer);
  }, [getCache, setCache]);
}

=== frontend\src\pages\AdminProfile.jsx ===
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

=== frontend\src\pages\Dashboard.jsx ===
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import api from '../api'; 
import { useDataCache } from '../context/DataCacheContext';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FiUsers, FiCheckCircle, FiDollarSign, FiFileText, 
  FiAlertCircle, FiLoader 
} from 'react-icons/fi';

export default function Dashboard() {
  const { getCache, setCache } = useDataCache();

  const cachedDash = getCache('dashboard');
  const [isLoading, setIsLoading] = useState(!cachedDash);
  const [salesData, setSalesData] = useState(cachedDash?.salesData || []);
  const [stats, setStats] = useState(cachedDash?.stats || { revenue: 0, members: 0, activeSubs: 0, reports: 0 });
  const [recentMembers, setRecentMembers] = useState(cachedDash?.recentMembers || []);
  const [recentTxns, setRecentTxns] = useState(cachedDash?.recentTxns || []);
  const [expiringSoon, setExpiringSoon] = useState(cachedDash?.expiringSoon || []);
  const [rawCalendarEvents, setRawCalendarEvents] = useState(cachedDash?.rawCalendarEvents || []);

  // Fetch coach events stored in local storage from Subscriptions page
  const [coachEvents, setCoachEvents] = useState(() => {
    const saved = localStorage.getItem('coach_events');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchDashboardData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const response = await api.get('/dashboard');
      const data = response.data;

      const newStats = data.stats;
      const newSalesData = data.salesData;
      const newRecentMembers = data.recentMembers.map(m => `${m.first_name} ${m.last_name}`);
      const newRecentTxns = data.recentTxns.map(t => ({
        type: t.type,
        amount: t.amount,
        method: t.payment_method,
        memberName: t.member ? `${t.member.first_name} ${t.member.last_name}` : 'Walk-in Guest'
      }));
      const newExpiringSoon = data.expiringSoon.map(sub => {
        const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return {
          name: sub.member ? `${sub.member.first_name} ${sub.member.last_name}` : 'Unknown Member',
          days: daysLeft
        };
      });
      const newRawCalendarEvents = data.calendarEvents || [];

      setStats(newStats);
      setSalesData(newSalesData);
      setRecentMembers(newRecentMembers);
      setRecentTxns(newRecentTxns);
      setExpiringSoon(newExpiringSoon);
      setRawCalendarEvents(newRawCalendarEvents);

      setCache('dashboard', {
        stats: newStats,
        salesData: newSalesData,
        recentMembers: newRecentMembers,
        recentTxns: newRecentTxns,
        expiringSoon: newExpiringSoon,
        rawCalendarEvents: newRawCalendarEvents,
      });

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setCache]);

  useEffect(() => {
    const hasCached = !!getCache('dashboard');
    fetchDashboardData(!hasCached);
  }, [fetchDashboardData, getCache]);

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

=== frontend\src\pages\GestureMonitor.jsx ===
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

=== frontend\src\pages\Login.jsx ===
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
            window.location.href = '/overview'; 
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

=== frontend\src\pages\Members.jsx ===
import React from 'react';
import { useMembers } from '../features/members/hooks/useMembers';
import MemberTable from '../features/members/components/MemberTable';
import MemberFormModal from '../features/members/components/MemberFormModal';
import MemberProfileModal from '../features/members/components/MemberProfileModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Members() {
  const {
    filteredMembers,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    loadMembers,
    isFormOpen,
    setIsFormOpen,
    isEditing,
    formData,
    isProfileOpen,
    setIsProfileOpen,
    selectedProfile,
    deletingId,
    confirmDialog,
    setConfirmDialog,
    alertDialog,
    setAlertDialog,
    handleAddMember,
    handleEditMember,
    handleViewProfile,
    handleDeleteMember,
    showAlert
  } = useMembers();

  return (
    <>
      <MemberTable
        members={filteredMembers}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        deletingId={deletingId}
        onAddMember={handleAddMember}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onViewProfile={handleViewProfile}
      />

      <MemberFormModal
        isOpen={isFormOpen}
        isEditing={isEditing}
        initialData={formData}
        onClose={() => setIsFormOpen(false)}
        onSaved={loadMembers}
        onShowAlert={showAlert}
      />

      <MemberProfileModal
        isOpen={isProfileOpen}
        member={selectedProfile}
        onClose={() => setIsProfileOpen(false)}
        onShowAlert={showAlert}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirm"
        isDanger={true}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

=== frontend\src\pages\Reports.jsx ===
import { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, FiDownload, FiPrinter, FiFileText, 
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiClock, FiActivity, FiLoader
} from 'react-icons/fi';
import api from '../api';
import { useLocation } from 'react-router-dom';
import { useDataCache } from '../context/DataCacheContext';

export default function Reports() {
  const { getCache, setCache } = useDataCache();
  const location = useLocation();
  const [reportType, setReportType] = useState(location.state?.defaultTab || 'Payments');
  
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(currentMonthStart); 
  const [endDate, setEndDate] = useState(today); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isExporting, setIsExporting] = useState(false);

  // Cache key includes date range so changing dates correctly re-fetches
  const cacheKey = `reports_${startDate}_${endDate}`;
  const [isLoading, setIsLoading] = useState(!getCache(cacheKey));
  const [reportData, setReportData] = useState(() => getCache(cacheKey));

  const fetchReports = useCallback(async () => {
    const cached = getCache(cacheKey);
    if (!cached) setIsLoading(true);
    try {
      const res = await api.get(`/reports?start=${startDate}&end=${endDate}`);
      setReportData(res.data);
      setCache(cacheKey, res.data);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, cacheKey, getCache, setCache]);

  useEffect(() => {
    // Check if the cached version for this date range exists
    const cached = getCache(cacheKey);
    if (cached) {
      setReportData(cached);
      setIsLoading(false);
    }
    fetchReports();
  }, [fetchReports, cacheKey, getCache]);

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

=== frontend\src\pages\SecurityMonitor.jsx ===
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

=== frontend\src\pages\Subscriptions.jsx ===
import React from 'react';
import { FiTag, FiList, FiCalendar } from 'react-icons/fi';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import SubscriptionsTable from '../features/subscriptions/components/SubscriptionsTable';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import SubscriptionFormModal from '../features/subscriptions/components/SubscriptionFormModal';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import PricingCatalogModal from '../features/subscriptions/components/PricingCatalogModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Subscriptions() {
  const {
    activeView, setActiveView,
    isLoading,
    subscriptions,
    membersList,
    plans,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterPlan, setFilterPlan,
    isModalOpen, setIsModalOpen,
    isPlanModalOpen, setIsPlanModalOpen,
    isAddingPlan, setIsAddingPlan,
    isEditing,
    isSaving,
    deletingId,
    deletingPlanId,
    isEventModalOpen, setIsEventModalOpen,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    formData, setFormData,
    newPlan, setNewPlan,
    loyalDiscount,
    calculatedPrice,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveSubscription,
    handleSaveCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  } = useSubscriptions();

  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-gray-200 dark:bg-gray-300 dark:hover:bg-white dark:text-black px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
          <button onClick={() => setIsPlanModalOpen(true)} className={secondaryButtonClass}>
            <FiTag size={16} /> Manage Plans
          </button>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1 shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setActiveView('list')} 
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'list' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}
            >
              <FiList size={16} /> List
            </button>
            <button 
              onClick={() => setActiveView('calendar')} 
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'calendar' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}
            >
              <FiCalendar size={16} /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {activeView === 'list' && (
        <SubscriptionsTable
          subscriptions={subscriptions}
          isLoading={isLoading}
          plans={plans}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPlan={filterPlan}
          setFilterPlan={setFilterPlan}
          deletingId={deletingId}
          onAddSubscription={() => handleOpenAddModal()}
          onEditSubscription={handleOpenEditModal}
          onDeleteSubscription={handleDelete}
        />
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <SubscriptionsCalendarView
          subscriptions={subscriptions}
          coachEvents={coachEvents}
          showSubscriptions={showSubscriptions}
          setShowSubscriptions={setShowSubscriptions}
          showCoachEvents={showCoachEvents}
          setShowCoachEvents={setShowCoachEvents}
          onOpenEventModal={() => setIsEventModalOpen(true)}
          onDeleteCoachEvent={handleDeleteCoachEvent}
          onDateClick={(info) => {
            setEventForm(prev => ({ ...prev, start_date: info.dateStr, end_date: info.dateStr }));
            setIsEventModalOpen(true);
          }}
        />
      )}

      {/* Coach Event Modal */}
      <CoachEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventForm={eventForm}
        setEventForm={setEventForm}
        recentColors={recentColors}
        onSave={handleSaveCoachEvent}
      />

      {/* Subscription Add / Edit Modal */}
      <SubscriptionFormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        isSaving={isSaving}
        formData={formData}
        setFormData={setFormData}
        membersList={membersList}
        plans={plans}
        recentColors={recentColors}
        loyalDiscount={loyalDiscount}
        calculatedPrice={calculatedPrice}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscription}
      />

      {/* Pricing Catalog Modal */}
      <PricingCatalogModal
        isOpen={isPlanModalOpen}
        isAddingPlan={isAddingPlan}
        setIsAddingPlan={setIsAddingPlan}
        isSaving={isSaving}
        plans={plans}
        newPlan={newPlan}
        setNewPlan={setNewPlan}
        deletingPlanId={deletingPlanId}
        onClose={() => setIsPlanModalOpen(false)}
        onUpdatePlanPrice={handleUpdatePlanPrice}
        onSavePlans={handleSavePlans}
        onAddNewPlan={handleAddNewPlan}
        onDeletePlan={handleDeletePlan}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirm"
        isDanger={true}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}

=== frontend\src\pages\Transactions.jsx ===
import React from 'react';
import { useTransactions } from '../features/transactions/hooks/useTransactions';
import TransactionStats from '../features/transactions/components/TransactionStats';
import TransactionTable from '../features/transactions/components/TransactionTable';
import TransactionFormModal from '../features/transactions/components/TransactionFormModal';
import PrintableTransactionReport from '../features/transactions/components/PrintableTransactionReport';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Transactions() {
  const {
    membersList,
    plansList,
    isLoading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    isModalOpen, setIsModalOpen,
    isEditing,
    formData, setFormData,
    isSaving,
    isExporting,
    deletingId,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    filteredTxns,
    totalIncome,
    totalRefunds,
    netRevenue,
    pendingAmount,
    handlePlanSelection,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveTransaction,
    handleExportCSV,
    handlePrintReceipt
  } = useTransactions();

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:m-0 animate-in fade-in duration-300">
        
        {/* Printable Report View (Visible only during window.print()) */}
        <PrintableTransactionReport
          filteredTxns={filteredTxns}
          totalIncome={totalIncome}
          totalRefunds={totalRefunds}
          netRevenue={netRevenue}
          pendingAmount={pendingAmount}
        />

        {/* Regular UI (Hidden during window.print()) */}
        <div className="print:hidden space-y-6">
          <TransactionStats
            totalIncome={totalIncome}
            totalRefunds={totalRefunds}
            netRevenue={netRevenue}
            pendingAmount={pendingAmount}
          />

          <TransactionTable
            transactions={filteredTxns}
            isLoading={isLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            isExporting={isExporting}
            deletingId={deletingId}
            onAddTransaction={handleOpenAddModal}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={handleDelete}
            onExportCSV={handleExportCSV}
            onPrintReceipt={handlePrintReceipt}
          />

          <TransactionFormModal
            isOpen={isModalOpen}
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            setFormData={setFormData}
            membersList={membersList}
            plansList={plansList}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveTransaction}
            onPlanSelection={handlePlanSelection}
          />

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            confirmText="Confirm"
            isDanger={true}
          />

          <AlertDialog
            isOpen={alertDialog.isOpen}
            title={alertDialog.title}
            message={alertDialog.message}
            type={alertDialog.type}
            onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
          />
        </div>
      </div>
    </>
  );
}

=== frontend\src\services\memberService.js ===
import api from '../api';

export const memberService = {
  async getAll() {
    const response = await api.get('/members');
    const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return dataArray.map(dbMember => ({
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
  },

  async create(formData) {
    const data = new FormData();
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('address', formData.address || '');
    data.append('plan', formData.plan);
    data.append('status', formData.status);
    if (formData.dob) data.append('dob', formData.dob);
    if (formData.height) data.append('height', formData.height);
    if (formData.weight) data.append('weight', formData.weight);
    if (formData.profilePicFile) data.append('profile_pic', formData.profilePicFile);

    return await api.post('/members', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async update(id, formData) {
    const data = new FormData();
    data.append('_method', 'PUT');
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('address', formData.address || '');
    data.append('plan', formData.plan);
    data.append('status', formData.status);
    if (formData.dob) data.append('dob', formData.dob);
    if (formData.height) data.append('height', formData.height);
    if (formData.weight) data.append('weight', formData.weight);
    if (formData.profilePicFile) data.append('profile_pic', formData.profilePicFile);

    return await api.post(`/members/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async delete(id) {
    return await api.delete(`/members/${id}`);
  },

  async getWorkouts(memberId) {
    const response = await api.get(`/members/${memberId}/workouts`);
    return response.data;
  },

  async assignTask(memberId, exerciseName) {
    return await api.post(`/members/${memberId}/assign-task`, { exercise: exerciseName.toUpperCase() });
  },

  async manualVerifyWorkout(logId) {
    return await api.put(`/workouts/${logId}/manual-verify`);
  }
};

export default memberService;

=== frontend\src\services\subscriptionService.js ===
import api from '../api';

export const subscriptionService = {
  async getAll() {
    const res = await api.get('/memberships');
    return Array.isArray(res.data) ? res.data : [];
  },

  async create(payload) {
    return await api.post('/memberships', payload);
  },

  async update(id, payload) {
    return await api.put(`/memberships/${id}`, payload);
  },

  async delete(id) {
    return await api.delete(`/memberships/${id}`);
  },

  async getPlans() {
    const res = await api.get('/plans');
    return Array.isArray(res.data) ? res.data : [];
  },

  async createPlan(plan) {
    return await api.post('/plans', plan);
  },

  async bulkUpdatePlans(plans) {
    return await api.post('/plans/bulk-update', { plans });
  },

  async deletePlan(id) {
    return await api.delete(`/plans/${id}`);
  },

  async updateMemberPlan(memberId, planType) {
    const fd = new FormData();
    fd.append('plan', planType);
    fd.append('status', 'Active');
    fd.append('_method', 'PUT');
    return await api.post(`/members/${memberId}`, fd);
  }
};

export default subscriptionService;

=== frontend\src\services\transactionService.js ===
import api from '../api';

export const transactionService = {
  async getAll() {
    const res = await api.get('/transactions');
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  }
};

export default transactionService;

=== frontend\src\api.js ===
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

=== frontend\src\App.jsx ===
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
      {/* If logged in, don't show login page; go straight to overview */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : <Login />} />
      
      {/* Protect the entire Layout. If NOT authenticated, force them back to /login */}
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Dashboard />} />
        <Route path="Overview" element={<Navigate to="/overview" replace />} />
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

=== frontend\src\index.css ===
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

=== frontend\src\main.jsx ===
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DataCacheProvider } from './context/DataCacheContext.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DataCacheProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </DataCacheProvider>
    </BrowserRouter>
  </StrictMode>,
)

=== frontend\.oxlintrc.json ===
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

=== frontend\index.html ===
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/src/assets/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Double Alpha Fitness</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

=== frontend\package-lock.json ===
{
  "name": "frontend",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "frontend",
      "version": "0.0.0",
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
    },
    "node_modules/@cycjimmy/jsmpeg-player": {
      "version": "6.1.2",
      "resolved": "https://registry.npmjs.org/@cycjimmy/jsmpeg-player/-/jsmpeg-player-6.1.2.tgz",
      "integrity": "sha512-U9DBDe5fxHmbwQww9rFxMLNI2Wlg7DhPzI7AVFpq8GehiUP7+NwuMPXpP4zAd52sgkxtOqOeMjgE5g0ZLnQZ0w==",
      "license": "MIT"
    },
    "node_modules/@emnapi/core": {
      "version": "1.11.3",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.11.3.tgz",
      "integrity": "sha512-zLpS5asjEb7lq8jYLq37N6XKaE41DIexlY1rF/z4/tIl3wo13Sqm28fRyfIsKZD+NZ8mM5RoKkpW/rBcuoSZSg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.2.3",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/core/node_modules/@emnapi/wasi-threads": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.3.tgz",
      "integrity": "sha512-ELEBe8PsLvvJ6QMr0zLt8ffvOHW/dc1m3CEzNMg7aJUv3bMaoDtw2TXyDAwkYBuroxxuHEwhRTLJSe5sya547g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.11.3",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.3.tgz",
      "integrity": "sha512-Xz4Tpyki7XyrpbUK1jR1AhdAdaXyhhY4lZ3neLodmhpuWfy2PAQN5B46sAiU4liOXGLkHypn/qU+jvfWSCYYLA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.2.tgz",
      "integrity": "sha512-c95qOXkHdydNKhscBTebqEC1CVAZpyqOfVfBzQ1qgzyl3gfeldUjIggDbIZgDKsHLgnsM+igH7TJ/eAasaVuMA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@fullcalendar/core": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/core/-/core-6.1.21.tgz",
      "integrity": "sha512-t3u/+sqh3Iq7TWtUnVLcGDUE6OWZh0UD3c04bI/l7lSLAgAKr3kngBmhHiQD1QXpwC8ZN5iNqG7a7gOVixhSKQ==",
      "license": "MIT",
      "peer": true,
      "dependencies": {
        "preact": "~10.12.1"
      }
    },
    "node_modules/@fullcalendar/daygrid": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/daygrid/-/daygrid-6.1.21.tgz",
      "integrity": "sha512-QYb1y40RGYLlOxKpYWg8O+7njEnKnFG8Tt7qjnubJGR35s1phQg67E+81y2TyAbbm59p2JFOCXGDk9t6KDujIA==",
      "license": "MIT",
      "peerDependencies": {
        "@fullcalendar/core": "~6.1.21"
      }
    },
    "node_modules/@fullcalendar/interaction": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/interaction/-/interaction-6.1.21.tgz",
      "integrity": "sha512-WPYpqtljDWmU0Xm2cOtFrLlocgxv7cgkOppj34Q6OUUat8a6Cnd6kYo2JR+irP223PE5lBYHFNp1qh7SIpJc0w==",
      "license": "MIT",
      "peerDependencies": {
        "@fullcalendar/core": "~6.1.21"
      }
    },
    "node_modules/@fullcalendar/list": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/list/-/list-6.1.21.tgz",
      "integrity": "sha512-2rpIhs5pJmV7jyk4oX4bckNqurt6iHcsweE3FDYDdNpmRukPrARnyQYcaVFNVw2bnBFeR/jQW/St2MlauxF3GQ==",
      "license": "MIT",
      "peerDependencies": {
        "@fullcalendar/core": "~6.1.21"
      }
    },
    "node_modules/@fullcalendar/react": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/react/-/react-6.1.21.tgz",
      "integrity": "sha512-TLpmGUd5k/PMdCh8XbeFC9PW9wuGvMms1oCxWgXyjK3EFPXAAd0PLfcvwKdyxoAS5eK1E4RJFkjMHvsYHpimcg==",
      "license": "MIT",
      "peerDependencies": {
        "@fullcalendar/core": "~6.1.21",
        "react": "^16.7.0 || ^17 || ^18 || ^19",
        "react-dom": "^16.7.0 || ^17 || ^18 || ^19"
      }
    },
    "node_modules/@fullcalendar/timegrid": {
      "version": "6.1.21",
      "resolved": "https://registry.npmjs.org/@fullcalendar/timegrid/-/timegrid-6.1.21.tgz",
      "integrity": "sha512-2DnShx/jallGmb8QCkr6pAOu/zuPhJrP7+uTrAtSnbqsX7GF3lTxqSeNGkTQwsgF5g/ia8udhQ+JNYaE+TN1cQ==",
      "license": "MIT",
      "dependencies": {
        "@fullcalendar/daygrid": "~6.1.21"
      },
      "peerDependencies": {
        "@fullcalendar/core": "~6.1.21"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.5.tgz",
      "integrity": "sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==",
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "1.1.6",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.1.6.tgz",
      "integrity": "sha512-ZLv/JdUfkvOy9eCnnBaGfiO+XimbjebAeO+MRQqD/B+FR1tnRN0tpKSJHRbE8sFfS6aqsXZ67TQjfwfsxULVbg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@tybys/wasm-util": "^0.10.3"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "peerDependencies": {
        "@emnapi/core": "^1.7.1",
        "@emnapi/runtime": "^1.7.1"
      }
    },
    "node_modules/@oxc-project/types": {
      "version": "0.138.0",
      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.138.0.tgz",
      "integrity": "sha512-1a7ZKmrRTCoN1XMZ4L0PyyqrMnrNlLyPuOkdSX2MZg7IiIGRUyurNhAm73ptDOraoBcIordsIGKNPKUzy3ZmfA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/Boshen"
      }
    },
    "node_modules/@oxlint/binding-android-arm-eabi": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-android-arm-eabi/-/binding-android-arm-eabi-1.72.0.tgz",
      "integrity": "sha512-zhCmvn+1Mj3UchAc/90i99S0t7jJUsHmFVSPg4UWrjO8b8eaSGwscgO6QAUtvHBstkjQwBttQNswEnAF1mIQdA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-android-arm64": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-android-arm64/-/binding-android-arm64-1.72.0.tgz",
      "integrity": "sha512-mtH+aY/ozv1eZoCUC2owjFAtyNBKHpJHygKeEu9zXXnQGW1Q2/qOpvx+I+Lf23+TvTz66F4iiXUbl2cGvoLPCQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-darwin-arm64": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-darwin-arm64/-/binding-darwin-arm64-1.72.0.tgz",
      "integrity": "sha512-EvnajNPDtfknB3ZieeOOyDTwJn9QXDiwfnF4ZDQqART6RG6hjY4WigQcZdGoK2dkB3e1vrmEzN9aYbQCUkh/gQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-darwin-x64": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-darwin-x64/-/binding-darwin-x64-1.72.0.tgz",
      "integrity": "sha512-ZkCdEa/G80A7vEHfeCDz/+L3m33DE73v32mDKhgOIgz8Uwf0DFcK7+uu6qC+7LEhmz5fpOe1osWKyjSNMydFIQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-freebsd-x64": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-freebsd-x64/-/binding-freebsd-x64-1.72.0.tgz",
      "integrity": "sha512-NroXv2vh+sxVY1uya/rM5pjhx1hm8BzlYpx9q67QP0Xhw5MH2bf5GJylpvLEC+781p1Xli/317EoV9AlGwViag==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-arm-gnueabihf": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.72.0.tgz",
      "integrity": "sha512-0NDywYgfj279Ou/BcQuCYSj7NJwBfmWn5qc5uGO/Ny7fUWmXyIpvawqX/8acQlWG6IXelJsJhj+JAy6sjsKj0A==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-arm-musleabihf": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-arm-musleabihf/-/binding-linux-arm-musleabihf-1.72.0.tgz",
      "integrity": "sha512-4vpXB06h65Ezsy4hRyrGjGrfa1SkVPii09yaajiYhmVpgsFiLD+KNxIx/BNAY+XiO+i1yqp9HHdwqM8VTqa5XQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-arm64-gnu": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.72.0.tgz",
      "integrity": "sha512-immaN4g2ZGFiOkKrvRX9LvzZdd2GkQM5wR+UyzYyUuyhUTXGQ4HKUJH18xp4G8OfhCVaVAJfKZxwE1r8+4hhaQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-arm64-musl": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.72.0.tgz",
      "integrity": "sha512-JGHS9Mnr7iWyyLDxgCv1MhzVpAckgptg00F2gnxt/GD7lQ2SW1BRcxHqhSTaSdDpjWRrBkBxMMh4+Hn3aVtExg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-ppc64-gnu": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.72.0.tgz",
      "integrity": "sha512-AOYgBZqxNshrg83P9v0RYv+m8s10Cqkj4/PxXFDhcS3k7FqsIG5+CxErshZCIN7G8iy4Y+VGfAsuEdar8AcbBg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-riscv64-gnu": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-riscv64-gnu/-/binding-linux-riscv64-gnu-1.72.0.tgz",
      "integrity": "sha512-QMybPS5ij3/vrKG67mqzHwW++91sYxK/PPUVi6SBtNCEzW4niS52fVBdXbQ6nou0wWbUPEpx8Sl/ZjtgE3clXA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-riscv64-musl": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-riscv64-musl/-/binding-linux-riscv64-musl-1.72.0.tgz",
      "integrity": "sha512-gOc3W7JV0PXRpIL7stUlLe3Wa9Gp0Kdlup87IT3gHDvPKck2xNgMIl/Gs2lldYY2lyXZDC4rWi3hmoLUobkgbQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-s390x-gnu": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.72.0.tgz",
      "integrity": "sha512-rpGxph+FjjHcYI5q6uxB3Az+tnfmEnDbSA8+PK9ZE/VzyUAkvBOMeuY7ZQMhu5mpZH7YQDsTdW6Cx4kV/msc6w==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-x64-gnu": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.72.0.tgz",
      "integrity": "sha512-WND+uhf/Ko13SLqQMWQUgsZuLvYYEvL0ZKgg0tgGYfLqxG7l8Ju123fHDMJyYSDl5E3bUbpFUuii/OvMreFQzw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-linux-x64-musl": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-linux-x64-musl/-/binding-linux-x64-musl-1.72.0.tgz",
      "integrity": "sha512-SrpbrUL70nG9vh6zP4/oKHWgLuHquwsr7MW9XOn0olBVgh10Uqr8qscKhQoBGEn6olK/IUpn5GSKcdQ5AjUhGA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-openharmony-arm64": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-openharmony-arm64/-/binding-openharmony-arm64-1.72.0.tgz",
      "integrity": "sha512-qkrsEn6NmgFKr7U/QnezQMb+q/vzAy0Dd9Y95gQGQTyjzDLN+HRZMuM5u70iyH4nBLCfKBzhjMsYCehKay2jyg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-win32-arm64-msvc": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.72.0.tgz",
      "integrity": "sha512-LWR6ZlFZph+KPjXv8opgZsXRDCdrdQe8VL8Cg9zxCoBS73h6znzZpydVgmdnwj8mB9AuSM5jxEgDJDpQkjboeg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-win32-ia32-msvc": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-win32-ia32-msvc/-/binding-win32-ia32-msvc-1.72.0.tgz",
      "integrity": "sha512-yt6HEh7IsHvtjRWtmeZRX134eaXKHq5Gnqlf1xBJdJl1JtdoRUEJw3nAxpZoUDS860cX/foKbztO441anVBtVQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@oxlint/binding-win32-x64-msvc": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/@oxlint/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.72.0.tgz",
      "integrity": "sha512-b2eKFD2hX7tIwmo/cyH6TDq8vzWRZ2qNHrzoGntUTmq0h3zQh/uX3eTSHCwI8OB/ADQfJCRelLItK8BsxuucDA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@reduxjs/toolkit": {
      "version": "2.12.0",
      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "@standard-schema/utils": "^0.3.0",
        "immer": "^11.0.0",
        "redux": "^5.0.1",
        "redux-thunk": "^3.1.0",
        "reselect": "^5.1.0"
      },
      "peerDependencies": {
        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
      },
      "peerDependenciesMeta": {
        "react": {
          "optional": true
        },
        "react-redux": {
          "optional": true
        }
      }
    },
    "node_modules/@rolldown/binding-android-arm64": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.1.4.tgz",
      "integrity": "sha512-EZLpf/8y7GXkkra90ML47kzik/GMP3EMcE9bPyHmRfxLC6z9+aW5A8poCsoxjrT5GfEcNAAvWwUHjvP1pUQkfw==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-arm64": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.1.4.tgz",
      "integrity": "sha512-aUi+HBvmYb7j8krl1+qJgkG8C17fO79gk3c+jPw4S8glRFc1DTija9S3EyaTSQUm5GJXYKDAsugBEhFHH2vYiQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-x64": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.1.4.tgz",
      "integrity": "sha512-F7hHC3gwY11+vByKPRWqwGbeXWVgKmL+pTGCinaEhdihzBV2aQ0fvZOch9cXYUOKuKKq429HeYXOqQLc7wFCEg==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-freebsd-x64": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.1.4.tgz",
      "integrity": "sha512-sI5yw+7s92SK6odiEhD5lKCBlWcpjHS5qyqpVQbZAJ0fIzEUXrmbl3DH2ybR3PZogulNJF+COLtmA8hUfvkCCQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm-gnueabihf": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.1.4.tgz",
      "integrity": "sha512-mCi0OKgEieFircrtVYmQAFGszRtMnZ6fpZAXrxanXAu7lqZcsK1E1RAaZNG0uKAnxox3B1f4EyQNnoyMfN1vAA==",
      "cpu": [
        "arm"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-gnu": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.1.4.tgz",
      "integrity": "sha512-B9Ial3Kv5sh0SHnB1g/QWcUQCEvCF6QKGAl4zXypYj65mVI+B4AhFBwPtSN7pDrJeIx8Z7zdy4ntx+wQABom7w==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-musl": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.1.4.tgz",
      "integrity": "sha512-lZVym0PuHE1KZ22gmFTC15lAkrg9iTszR617oYRB/iPY1A56ywoJzVKOJBKaot5RiikCObmur6pogpse3gRcng==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-ppc64-gnu": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.1.4.tgz",
      "integrity": "sha512-t2DNiLJWNTbnEHyUzTumldML6ET4/g16467LZoDDJ3tSxGvguL5/NyC2lCsNKuyRycg9XeDQF5SSv+TNOhQEXg==",
      "cpu": [
        "ppc64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-s390x-gnu": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.1.4.tgz",
      "integrity": "sha512-0WIRnL1Uw4BvTZRLQt+PVgo6ZKTJadlC2btP+/EOXv2f/DWbY0rEgl+y834mIVwP1FkTlWVTrGGJXf12lru7EQ==",
      "cpu": [
        "s390x"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-gnu": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.1.4.tgz",
      "integrity": "sha512-JWtGshGfX+oENAKonoNkqEJX+7hC8yfhi9GUyPX1VX4mdh1y5r+ZiJLR5XzAB0aoP6s/PcILsGjKq8O0mm24bw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-musl": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.1.4.tgz",
      "integrity": "sha512-rT6yQcxUuXs4CnbofqwHRRV0iem349rLMYpTjkgQGLjrY4ado/eDzwPZPTCgTOlF6Nkp8NEv70yLMTn6qkWxsQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-openharmony-arm64": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.1.4.tgz",
      "integrity": "sha512-KXMGoboq5cyaCQjDA4GLuRiOwBQ0EyFnJoVViLeZ45/3rFItRODEr+NdsBcVpll40hhNArlm/speWGRvj08LzA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-wasm32-wasi": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-wasm32-wasi/-/binding-wasm32-wasi-1.1.4.tgz",
      "integrity": "sha512-5K83rb36oJiY7BCyE9zLZtGcPV4g5wvq+xwdO0XPIwDVZI8cyB/AUjkNXGb92/rnmezEkjMOpgY61rtwjQtFwg==",
      "cpu": [
        "wasm32"
      ],
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "1.11.1",
        "@emnapi/runtime": "1.11.1",
        "@napi-rs/wasm-runtime": "^1.1.6"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.11.1.tgz",
      "integrity": "sha512-RSvbQmHzdKzNsLYa/wHrbc3KN4sYLKAdPZxqiM2HATqv/SBk2/ENSHpvXGaLOMcsAyz0poEGqkmmKYG3OWiJEQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.2.2",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@rolldown/binding-wasm32-wasi/node_modules/@emnapi/runtime": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.1.tgz",
      "integrity": "sha512-vgj7R3y3Wgx24IQaGPA/R6YFXLHVMOZ0uVEyIQPaWs+rd1AzfEMXlAC22FYwO1XkKR6NPsq7mUandH8oIRdZFw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@rolldown/binding-win32-arm64-msvc": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.1.4.tgz",
      "integrity": "sha512-PnWBtw3TV5KOg69HQQDR0mnQuyCmSGR2pAB4DC1rPF808fgKeTUMj2EOEyKATpgiuxuR5APQmiDO7PDgEjTFSA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-x64-msvc": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.1.4.tgz",
      "integrity": "sha512-M1lpniBePobTfsa7Ks9a199e1akxsXn+GYBUKsEzv3YFzOm1HJAMNwKI3qr0Zq+mxwx9gOZoTdP1yXRYsZUocQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.1.tgz",
      "integrity": "sha512-2j9bGt5Jh8hj+vPtgzPtl72j0yRxHAyumoo6TNfAjsLB04UtpSvPbPcDcBMxz7n+9CYB0c1GxQFxYRg2jimqGw==",
      "license": "MIT"
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@standard-schema/utils": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
      "license": "MIT"
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.3.2.tgz",
      "integrity": "sha512-yWP/sqEcBLaD8JuA6zNwxoYKr75qxTioYwlRwekj5Jr/I5GXnoJfjetH/psLUIv74cYTH2lBUEzBkinthoYcBg==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.5",
        "enhanced-resolve": "5.21.6",
        "jiti": "^2.7.0",
        "lightningcss": "1.32.0",
        "magic-string": "^0.30.21",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.3.2"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.3.2.tgz",
      "integrity": "sha512-z8ZgnzX8gdNoWLBLqBPoh/sjnxkwvf9ZuWjnO0l0yIzbLa5/9S+eC5QxGZKRobVHIC3/1BoMWjHblqWjcgFgag==",
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.3.2",
        "@tailwindcss/oxide-darwin-arm64": "4.3.2",
        "@tailwindcss/oxide-darwin-x64": "4.3.2",
        "@tailwindcss/oxide-freebsd-x64": "4.3.2",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.3.2",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.3.2",
        "@tailwindcss/oxide-linux-arm64-musl": "4.3.2",
        "@tailwindcss/oxide-linux-x64-gnu": "4.3.2",
        "@tailwindcss/oxide-linux-x64-musl": "4.3.2",
        "@tailwindcss/oxide-wasm32-wasi": "4.3.2",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.3.2",
        "@tailwindcss/oxide-win32-x64-msvc": "4.3.2"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.3.2.tgz",
      "integrity": "sha512-WHxqIuHpvZ5VtdX6GTl1Ik/Vp2YuN42Et+0CdeaVd/frQ9jAvGmvR8vLT+jk3e8/Q3x8kECB9+R17pgpp2BulA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.3.2.tgz",
      "integrity": "sha512-GZypeUY/IDJW3877KeM+O67vbXr3MBnbtEL4aYhNErv/JWZhye2vGSWWG9tB6iiqR2MqRNkY8IOUy4NdSZV26w==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.3.2.tgz",
      "integrity": "sha512-UIIzmefR6KO1sDU7MzRqAxC8iBpft/VhkGjTjnhoS6k7Z3rQ9wEgA1ODSiyH/tcSYssulNm4Ci3hOeK1jH7ccQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.3.2.tgz",
      "integrity": "sha512-GN+uAmcI6DNspnCDwtOAZrTz6oukJnp337qZvxqCGLd3BHBzJpO0ZbTLRvJNdztOeAmTzewewGIMPb0tk2R4WA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.3.2.tgz",
      "integrity": "sha512-4ABn7qSbdHRwTiDiuWNegCyb5+2FJ4vKIKc3DmKrvAFw7MU1Lm11dIkTPwUaFdTzc7IsOpDbqBrlh0x6y36U/w==",
      "cpu": [
        "arm"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.3.2.tgz",
      "integrity": "sha512-wDgEIGwoM8w8pufh9LVt1PahDgNdKXrLC2qfAnV3vAmococ9RWbxeAw4pxPttd/TsJfwjyLf90Dg1y9y8I6Emw==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.3.2.tgz",
      "integrity": "sha512-J5Nuk0uZQIiMTJj3LEx4sAA9tMFUoXQZFv1J6An+QGYe53HKRJuFDi0rpq/tuouCZeAbOBY3kQ6g8qeD4TUjtA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.3.2.tgz",
      "integrity": "sha512-kqCZpSKOBEJO4mz7OqWoofBZeXTAwaVGPj0ErAj7CojmhKpWVWVOnrt9dE8odoIraZq4oj3ausM37kXi+Tow8w==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.3.2.tgz",
      "integrity": "sha512-cixpqbh2toJDmkuCRI68nXA8ZxNmdK9Y+9v5h3MC3ZQKy/0BO8AWzlkWyRM7JAFSGBlfig4YVTPsK6MVgqz1uw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.2.tgz",
      "integrity": "sha512-4ec2Z/LOmRsAgU23CS4xeJfcJlmRg94A/XrbGRCF1gyU/zdDfRLYDVsS+ynSZCmGNxQ1jQriQOKMQeQxBA3Isw==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.11.1",
        "@emnapi/runtime": "^1.11.1",
        "@emnapi/wasi-threads": "^1.2.2",
        "@napi-rs/wasm-runtime": "^1.1.4",
        "@tybys/wasm-util": "^0.10.2",
        "tslib": "^2.8.1"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.3.2.tgz",
      "integrity": "sha512-Zyr/M0+XcYZu3bZrUytc7TXvrk0ftWfl8gN2MwekNDzhqhKRUucMPSeOzM0o0wH5AWOU49BsKRrfKxI2atCPMQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.3.2.tgz",
      "integrity": "sha512-QI9BO7KlNZsp2GuO0jwAAj5jCDABOKXRkCk2XuKTSaNEFSdfzqswYVTtCHBNKHLsqyjFyFkqlDiwkNbTYSssMQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/vite": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/@tailwindcss/vite/-/vite-4.3.2.tgz",
      "integrity": "sha512-eHpMeX4JXfVNJDEcsouTeCBubJBTcTLigeaw/NTUW6PB5ATKKXdyonnXgTBX2VuRbjz1hjfz6C5XAhr52ImQXA==",
      "license": "MIT",
      "dependencies": {
        "@tailwindcss/node": "4.3.2",
        "@tailwindcss/oxide": "4.3.2",
        "tailwindcss": "4.3.2"
      },
      "peerDependencies": {
        "vite": "^5.2.0 || ^6 || ^7 || ^8"
      }
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.10.3",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.3.tgz",
      "integrity": "sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/d3-array": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.2.tgz",
      "integrity": "sha512-hOLWVbm7uRza0BYXpIIW5pxfrKe0W+D5lrFiAEYR+pb6w3N2SwSMaJbXdUfSEv+dT4MfHBLtn5js0LAWaO6otw==",
      "license": "MIT"
    },
    "node_modules/@types/d3-color": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz",
      "integrity": "sha512-iO90scth9WAbmgv7ogoq57O9YpKmFBbmoEoCHDB2xMBY0+/KVrqAaCDyCE16dUspeOvIxFFRI+0sEtqDqy2b4A==",
      "license": "MIT"
    },
    "node_modules/@types/d3-ease": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz",
      "integrity": "sha512-NcV1JjO5oDzoK26oMzbILE6HW7uVXOHLQvHshBUW4UMdZGfiY6v5BeQwh9a9tCzv+CeefZQHJt5SRgK154RtiA==",
      "license": "MIT"
    },
    "node_modules/@types/d3-interpolate": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz",
      "integrity": "sha512-mgLPETlrpVV1YRJIglr4Ez47g7Yxjl1lj7YKsiMCb27VJH9W8NVM6Bb9d8kkpG/uAQS5AmbA48q2IAolKKo1MA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-color": "*"
      }
    },
    "node_modules/@types/d3-path": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.1.tgz",
      "integrity": "sha512-VMZBYyQvbGmWyWVea0EHs/BwLgxc+MKi1zLDCONksozI4YJMcTt8ZEuIR4Sb1MMTE8MMW49v0IwI5+b7RmfWlg==",
      "license": "MIT"
    },
    "node_modules/@types/d3-scale": {
      "version": "4.0.9",
      "resolved": "https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.9.tgz",
      "integrity": "sha512-dLmtwB8zkAeO/juAMfnV+sItKjlsw2lKdZVVy6LRr0cBmegxSABiLEpGVmSJJ8O08i4+sGR6qQtb6WtuwJdvVw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-time": "*"
      }
    },
    "node_modules/@types/d3-shape": {
      "version": "3.1.8",
      "resolved": "https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.1.8.tgz",
      "integrity": "sha512-lae0iWfcDeR7qt7rA88BNiqdvPS5pFVPpo5OfjElwNaT2yyekbM0C9vK+yqBqEmHr6lDkRnYNoTBYlAgJa7a4w==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-path": "*"
      }
    },
    "node_modules/@types/d3-time": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.4.tgz",
      "integrity": "sha512-yuzZug1nkAAaBlBBikKZTgzCeA+k1uy4ZFwWANOfKw5z5LRhV0gNA7gNkKm7HoK+HRN0wX3EkxGk0fpbWhmB7g==",
      "license": "MIT"
    },
    "node_modules/@types/d3-timer": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz",
      "integrity": "sha512-Ps3T8E8dZDam6fUyNiMkekK3XUsaUEik+idO9/YjPtfj2qruF8tFBXS7XhtE4iIXBLxhmLjP3SXpLhVf21I9Lw==",
      "license": "MIT"
    },
    "node_modules/@types/react": {
      "version": "19.2.17",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.2.17.tgz",
      "integrity": "sha512-MXfmqaVPEVgkBT/aY0aGCkRWWtByiYQXo3xdQ8r5RzuFrPiRn8Gar2tQdXSUQ2GKV3bkXckek89V8wQBY2Q/Aw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.2.3",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz",
      "integrity": "sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.2.0"
      }
    },
    "node_modules/@types/use-sync-external-store": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
      "license": "MIT"
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-6.0.3.tgz",
      "integrity": "sha512-vmFvco5/QuC2f9Oj+wTk0+9XeDFkHxSamwZKYc7MxYwKICfvUvlMhqKI0VuICPltGqh1neqBKDvO4kes1ya8vg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@rolldown/pluginutils": "^1.0.1"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "peerDependencies": {
        "@rolldown/plugin-babel": "^0.1.7 || ^0.2.0",
        "babel-plugin-react-compiler": "^1.0.0",
        "vite": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "@rolldown/plugin-babel": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        }
      }
    },
    "node_modules/@wojtekmaj/date-utils": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/@wojtekmaj/date-utils/-/date-utils-2.0.2.tgz",
      "integrity": "sha512-Do66mSlSNifFFuo3l9gNKfRMSFi26CRuQMsDJuuKO/ekrDWuTTtE4ZQxoFCUOG+NgxnpSeBq/k5TY8ZseEzLpA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/wojtekmaj/date-utils?sponsor=1"
      }
    },
    "node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "license": "MIT",
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT"
    },
    "node_modules/axios": {
      "version": "1.18.1",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.18.1.tgz",
      "integrity": "sha512-3nTvFlvpn9Zu/RkHUqtc7/+al4UpRW5az71ap5zccp6e8RAYEzhMTecX8Dz1wWDYrPpUoB1HAQEGEAEvUr7S9g==",
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.16.0",
        "form-data": "^4.0.5",
        "https-proxy-agent": "^5.0.1",
        "proxy-from-env": "^2.1.0"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/cookie": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/d3-array": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/d3-array/-/d3-array-3.2.4.tgz",
      "integrity": "sha512-tdQAmyA18i4J7wprpYq8ClcxZy3SC31QMeByyCFyRt7BVHdREQZ5lpzoe5mFEYZUWe+oq8HBvk9JjpibyEV4Jg==",
      "license": "ISC",
      "dependencies": {
        "internmap": "1 - 2"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-color": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz",
      "integrity": "sha512-zg/chbXyeBtMQ1LbD/WSoW2DpC3I0mpmPdW+ynRTj/x2DAWYrIY7qeZIHidozwV24m4iavr15lNwIwLxRmOxhA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-ease": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz",
      "integrity": "sha512-wR/XK3D3XcLIZwpbvQwQ5fK+8Ykds1ip7A2Txe0yxncXSdq1L9skcG7blcedkOX+ZcgxGAmLX1FrRGbADwzi0w==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-format": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/d3-format/-/d3-format-3.1.2.tgz",
      "integrity": "sha512-AJDdYOdnyRDV5b6ArilzCPPwc1ejkHcoyFarqlPqT7zRYjhavcT3uSrqcMvsgh2CgoPbK3RCwyHaVyxYcP2Arg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-interpolate": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz",
      "integrity": "sha512-3bYs1rOD33uo8aqJfKP3JWPAibgw8Zm2+L9vBKEHJ2Rg+viTR7o5Mmv5mZcieN+FRYaAOWX5SJATX6k1PWz72g==",
      "license": "ISC",
      "dependencies": {
        "d3-color": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-p3KP5HCf/bvjBSSKuXid6Zqijx7wIfNW+J/maPs+iwR35at5JCbLUT0LzF1cnjbCHWhqzQTIN2Jpe8pRebIEFQ==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-scale": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/d3-scale/-/d3-scale-4.0.2.tgz",
      "integrity": "sha512-GZW464g1SH7ag3Y7hXjf8RoUuAFIqklOAq3MRl4OaWabTFJY9PN/E1YklhXLh+OQ3fM9yS2nOkCoS+WLZ6kvxQ==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2.10.0 - 3",
        "d3-format": "1 - 3",
        "d3-interpolate": "1.2.0 - 3",
        "d3-time": "2.1.1 - 3",
        "d3-time-format": "2 - 4"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-SaLBuwGm3MOViRq2ABk3eLoxwZELpH6zhl3FbAoJ7Vm1gofKx6El1Ib5z23NUEhF9AsGl7y+dzLe5Cw2AArGTA==",
      "license": "ISC",
      "dependencies": {
        "d3-path": "^3.1.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-time/-/d3-time-3.1.0.tgz",
      "integrity": "sha512-VqKjzBLejbSMT4IgbmVgDjpkYrNWUYJnbCGo874u7MMKIWsILRX+OpX/gTk8MqjpT1A/c6HY2dCA77ZN0lkQ2Q==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time-format": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/d3-time-format/-/d3-time-format-4.1.0.tgz",
      "integrity": "sha512-dJxPBlzC7NugB2PDLwo9Q8JiTR3M3e4/XANkreKSUxF8vvXKqm1Yfq4Q5dl8budlunRVlUUaDUgFt7eA8D6NLg==",
      "license": "ISC",
      "dependencies": {
        "d3-time": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-timer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz",
      "integrity": "sha512-ndfJ/JxxMd3nw31uyKoY2naivF+r29V+Lc0svZxe1JvvIRmi8hUsrMvdOwgS1o6uBHmiz91geQ0ylPP0aj1VUA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decimal.js-light": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/decimal.js-light/-/decimal.js-light-2.5.1.tgz",
      "integrity": "sha512-qIMFpTMZmny+MMIitAB6D7iVPEorVw6YQRWkvarTkT4tBeSLLiHzcwj6q0MmYSFCiVpiqPJTJEYIrpcPzVEIvg==",
      "license": "MIT"
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/enhanced-resolve": {
      "version": "5.21.6",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.21.6.tgz",
      "integrity": "sha512-aNnGCvbJ/RIyWo1IuhNdVjnNF+EjH9wpzpNHt+ci/m9He9LJvUN8wrCcXjp9cWsGNAuvSpVFTx/vraAFQ8qGjQ==",
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.3.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-toolkit": {
      "version": "1.49.0",
      "resolved": "https://registry.npmjs.org/es-toolkit/-/es-toolkit-1.49.0.tgz",
      "integrity": "sha512-G5iZ6Pc/FNRY/soKZHC+TxGDD83rHUDXxzaWhGCX44vAv/tMs56WMusnm/KMNK+luUPsgA9U28cGr4RDlSzL2g==",
      "license": "MIT",
      "workspaces": [
        "docs",
        "benchmarks"
      ]
    },
    "node_modules/eventemitter3": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.4.tgz",
      "integrity": "sha512-mlsTRyGaPBjPedk6Bvw+aqbsXDtoAyAzm5MO7JgU+yVRyMQ5O8bD4Kcci7BS85f93veegeCPkL8R4GLClnjLFw==",
      "license": "MIT"
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/follow-redirects": {
      "version": "1.16.0",
      "resolved": "https://registry.npmjs.org/follow-redirects/-/follow-redirects-1.16.0.tgz",
      "integrity": "sha512-y5rN/uOsadFT/JfYwhxRS5R7Qce+g3zG97+JrtFZlC9klX/W5hD7iiLzScI4nZqUS7DNUdhPgw4xI8W2LuXlUw==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/form-data": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.6.tgz",
      "integrity": "sha512-vKatAh4SlVfgbv+YtmhiRjhEMJsYpsG1Y2rMQtR+SVSbytsSD1YGzDIcrAJmdFec88u/+VoGmxnl+80gL1tRCQ==",
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.4",
        "mime-types": "^2.1.35"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-user-locale": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/get-user-locale/-/get-user-locale-3.0.0.tgz",
      "integrity": "sha512-iJfHSmdYV39UUBw7Jq6GJzeJxUr4U+S03qdhVuDsR9gCEnfbqLy9gYDJFBJQL1riqolFUKQvx36mEkp2iGgJ3g==",
      "license": "MIT",
      "dependencies": {
        "memoize": "^10.0.0"
      },
      "funding": {
        "url": "https://github.com/wojtekmaj/get-user-locale?sponsor=1"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "license": "ISC"
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
      "license": "MIT",
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/immer": {
      "version": "11.1.9",
      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.9.tgz",
      "integrity": "sha512-sc/z0Cyti70bZa0ZU4sWfAElfovFb9Ni8tArJZLuklYWxegPiK3pDOql1Rq5H0FIRAW9LSQRG6OX4KqBldbhBA==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/immer"
      }
    },
    "node_modules/internmap": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/internmap/-/internmap-2.0.3.tgz",
      "integrity": "sha512-5Hh7Y1wQbvY5ooGgPbDaL5iYLAPzMTUrjMulskHLH6wnv/A+1q5rgEaiuqEjB+oxGXIVZs1FF+R/KPN3ZSQYYg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/jiti": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz",
      "integrity": "sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==",
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "license": "MIT"
    },
    "node_modules/lightningcss": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.32.0",
        "lightningcss-darwin-arm64": "1.32.0",
        "lightningcss-darwin-x64": "1.32.0",
        "lightningcss-freebsd-x64": "1.32.0",
        "lightningcss-linux-arm-gnueabihf": "1.32.0",
        "lightningcss-linux-arm64-gnu": "1.32.0",
        "lightningcss-linux-arm64-musl": "1.32.0",
        "lightningcss-linux-x64-gnu": "1.32.0",
        "lightningcss-linux-x64-musl": "1.32.0",
        "lightningcss-win32-arm64-msvc": "1.32.0",
        "lightningcss-win32-x64-msvc": "1.32.0"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
      "cpu": [
        "arm"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
      "cpu": [
        "arm64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
      "cpu": [
        "x64"
      ],
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/memoize": {
      "version": "10.2.0",
      "resolved": "https://registry.npmjs.org/memoize/-/memoize-10.2.0.tgz",
      "integrity": "sha512-DeC6b7QBrZsRs3Y02A6A7lQyzFbsQbqgjI6UW0GigGWV+u1s25TycMr0XHZE4cJce7rY/vyw2ctMQqfDkIhUEA==",
      "license": "MIT",
      "dependencies": {
        "mimic-function": "^5.0.1"
      },
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sindresorhus/memoize?sponsor=1"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mimic-function": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/mimic-function/-/mimic-function-5.0.1.tgz",
      "integrity": "sha512-VP79XUPxV2CigYP3jWwAUFSku2aKqBH7uTAapFWCBqutsbmDo96KY5o8uh6U+/YSIn5OxJnXp73beVkpqMIGhA==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.15",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.15.tgz",
      "integrity": "sha512-y7Wygv/7mEOvxTuEQDB8StXdMRBWf1kR/tlhAzBRUFkB2jfcLOAxO/SHmOO2zgz1pVgK29/kyupn059/bCHdjA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/oxlint": {
      "version": "1.72.0",
      "resolved": "https://registry.npmjs.org/oxlint/-/oxlint-1.72.0.tgz",
      "integrity": "sha512-1rhdZIP/EvoI91ABIwNU5Q8+bWf8mjrS5UzIOZld4d4bXxJvtlUhlQvaoTogIGin/qdErMOrwaIJvCSIAKTLhA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "oxlint": "bin/oxlint"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/Boshen"
      },
      "optionalDependencies": {
        "@oxlint/binding-android-arm-eabi": "1.72.0",
        "@oxlint/binding-android-arm64": "1.72.0",
        "@oxlint/binding-darwin-arm64": "1.72.0",
        "@oxlint/binding-darwin-x64": "1.72.0",
        "@oxlint/binding-freebsd-x64": "1.72.0",
        "@oxlint/binding-linux-arm-gnueabihf": "1.72.0",
        "@oxlint/binding-linux-arm-musleabihf": "1.72.0",
        "@oxlint/binding-linux-arm64-gnu": "1.72.0",
        "@oxlint/binding-linux-arm64-musl": "1.72.0",
        "@oxlint/binding-linux-ppc64-gnu": "1.72.0",
        "@oxlint/binding-linux-riscv64-gnu": "1.72.0",
        "@oxlint/binding-linux-riscv64-musl": "1.72.0",
        "@oxlint/binding-linux-s390x-gnu": "1.72.0",
        "@oxlint/binding-linux-x64-gnu": "1.72.0",
        "@oxlint/binding-linux-x64-musl": "1.72.0",
        "@oxlint/binding-openharmony-arm64": "1.72.0",
        "@oxlint/binding-win32-arm64-msvc": "1.72.0",
        "@oxlint/binding-win32-ia32-msvc": "1.72.0",
        "@oxlint/binding-win32-x64-msvc": "1.72.0"
      },
      "peerDependencies": {
        "oxlint-tsgolint": ">=0.22.1",
        "vite-plus": "*"
      },
      "peerDependenciesMeta": {
        "oxlint-tsgolint": {
          "optional": true
        },
        "vite-plus": {
          "optional": true
        }
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.5.tgz",
      "integrity": "sha512-RvwwcruNjI1ncT5xRakeyS9Lf8lcItv34KD+aif+VH9kduAyfYBipGh12274xtenIPZ119/R9BdTBa8gAwSh0A==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.16",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.16.tgz",
      "integrity": "sha512-vuwillviilfKZsg0VGj5R/YwwcHx4SLsIOI/7K6mQkWx+l5cUHTjj5g0AasTBcyXsbfTgrwsUNmVUb5xVwyPwg==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.12",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/preact": {
      "version": "10.12.1",
      "resolved": "https://registry.npmjs.org/preact/-/preact-10.12.1.tgz",
      "integrity": "sha512-l8386ixSsBdbreOAkqtrwqHwdvR35ID8c3rKPa8lCWuO86dBi32QWHV4vfsZK1utLLFMvw+Z5Ad4XLkZzchscg==",
      "license": "MIT",
      "peer": true,
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/preact"
      }
    },
    "node_modules/proxy-from-env": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/proxy-from-env/-/proxy-from-env-2.1.0.tgz",
      "integrity": "sha512-cJ+oHTW1VAEa8cJslgmUZrc+sjRKgAKl3Zyse6+PV38hZe/V6Z14TbCuXcan9F9ghlz4QrFr2c92TNF82UkYHA==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/react": {
      "version": "19.2.7",
      "resolved": "https://registry.npmjs.org/react/-/react-19.2.7.tgz",
      "integrity": "sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKtaaV+WlAN36mpT4hcRpwbf3fY56ar2oIXzsBpOAiIRHAdY0OlQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-avatar-editor": {
      "version": "15.1.0",
      "resolved": "https://registry.npmjs.org/react-avatar-editor/-/react-avatar-editor-15.1.0.tgz",
      "integrity": "sha512-Zto7u9l6Wd5LPPtjeFJ+7uwoT4bs01OSgkN2kxD18lWl8IiZ0GY3nWCbKPx4qIU7Au1vENsMJm19rfVWHHayaQ==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^0.14.0 || ^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^0.14.0 || ^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/react-calendar": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/react-calendar/-/react-calendar-6.0.1.tgz",
      "integrity": "sha512-b8E61W7qk/He9XEbtbQBjnALPuGmxeglsotgZyAShqN1vHMzXWjl4g7WI5tRF93RE4Wbo0c0BKN3vTQhrBojpg==",
      "license": "MIT",
      "dependencies": {
        "@wojtekmaj/date-utils": "^2.0.2",
        "clsx": "^2.0.0",
        "get-user-locale": "^3.0.0",
        "warning": "^4.0.0"
      },
      "funding": {
        "url": "https://github.com/wojtekmaj/react-calendar?sponsor=1"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-dom": {
      "version": "19.2.7",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.7.tgz",
      "integrity": "sha512-t0BRVXvbiE/o20Hfw669rLbMCDWtYZLvmJigy2f0MxsXF+71pxhR3xOkspmsO8h3ZlNzyibAmtCa3l4lYKk6gQ==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.27.0"
      },
      "peerDependencies": {
        "react": "^19.2.7"
      }
    },
    "node_modules/react-icons": {
      "version": "5.7.0",
      "resolved": "https://registry.npmjs.org/react-icons/-/react-icons-5.7.0.tgz",
      "integrity": "sha512-LBLy340Rzqy6+/yVhZKT3B/QpP1BZaesGqasf09HPOBzRarcDIFH0WwXlXQfE7q7ipxK4MSiC5DIBWURCny6fw==",
      "license": "MIT",
      "peerDependencies": {
        "react": "*"
      }
    },
    "node_modules/react-is": {
      "version": "19.2.7",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-19.2.7.tgz",
      "integrity": "sha512-kZFnouyVv7eP/Phmrlo9FK+zcAdriZJvzxXHF1Sl1P377WSGe2G/JxVolhTrB/jeV47lKImhNUsijjHAAbcl/A==",
      "license": "MIT",
      "peer": true
    },
    "node_modules/react-redux": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
      "license": "MIT",
      "dependencies": {
        "@types/use-sync-external-store": "^0.0.6",
        "use-sync-external-store": "^1.4.0"
      },
      "peerDependencies": {
        "@types/react": "^18.2.25 || ^19",
        "react": "^18.0 || ^19",
        "redux": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "redux": {
          "optional": true
        }
      }
    },
    "node_modules/react-router": {
      "version": "7.18.1",
      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.1.tgz",
      "integrity": "sha512-GDLgg3i3uM0aeJO3Fm+TCS+sDQ7gu12T6x0qdTEzcwqEfleci7JwugVNIF3U//0FWKnJT7ptG+20B2jfDqnZAg==",
      "license": "MIT",
      "dependencies": {
        "cookie": "^1.0.1",
        "set-cookie-parser": "^2.6.0"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      },
      "peerDependenciesMeta": {
        "react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/react-router-dom": {
      "version": "7.18.1",
      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.1.tgz",
      "integrity": "sha512-KaZh+X/6UtEp28x51AUYZDMg9NGoz2ja3dNHa+ta/tk40vCzKhQ/RypCWBMLbmDr6//E24Vv5uPsrqXFozdkAg==",
      "license": "MIT",
      "dependencies": {
        "react-router": "7.18.1"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      }
    },
    "node_modules/recharts": {
      "version": "3.9.1",
      "resolved": "https://registry.npmjs.org/recharts/-/recharts-3.9.1.tgz",
      "integrity": "sha512-WMcwlXcB7l+BbxiEdyClkG+1sxrMHNZpzT577LEvU4+rXPd8oTAy1wXk72hnk2KOOmxuLvw3z5DtXT7HEAydtg==",
      "license": "MIT",
      "workspaces": [
        "www"
      ],
      "dependencies": {
        "@reduxjs/toolkit": "^1.9.0 || 2.x.x",
        "clsx": "^2.1.1",
        "decimal.js-light": "^2.5.1",
        "es-toolkit": "^1.39.3",
        "eventemitter3": "^5.0.1",
        "immer": "^11.1.8",
        "react-redux": "8.x.x || 9.x.x",
        "reselect": "5.2.0",
        "tiny-invariant": "^1.3.3",
        "use-sync-external-store": "^1.2.2",
        "victory-vendor": "^37.0.2"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-is": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/redux": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
      "license": "MIT"
    },
    "node_modules/redux-thunk": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
      "license": "MIT",
      "peerDependencies": {
        "redux": "^5.0.0"
      }
    },
    "node_modules/reselect": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.2.0.tgz",
      "integrity": "sha512-AgZ3UOZm3YndfrJ4OYjgrT7bmCm/1iqkjvEfH/oYjzh6PD2qw4QuT3jjnXIrpdt4MTpMXclMT3lXbmRY+XRakw==",
      "license": "MIT"
    },
    "node_modules/rolldown": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.1.4.tgz",
      "integrity": "sha512-IjZYiLxZwpnhwhdBH2ugdTGVSdhCQUmLxLoqyjiL0JxYjyRst+5a0P3xfrTxJ5F638j4Mvvw5FAX5XE6eHpXbA==",
      "license": "MIT",
      "dependencies": {
        "@oxc-project/types": "=0.138.0",
        "@rolldown/pluginutils": "^1.0.0"
      },
      "bin": {
        "rolldown": "bin/cli.mjs"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "optionalDependencies": {
        "@rolldown/binding-android-arm64": "1.1.4",
        "@rolldown/binding-darwin-arm64": "1.1.4",
        "@rolldown/binding-darwin-x64": "1.1.4",
        "@rolldown/binding-freebsd-x64": "1.1.4",
        "@rolldown/binding-linux-arm-gnueabihf": "1.1.4",
        "@rolldown/binding-linux-arm64-gnu": "1.1.4",
        "@rolldown/binding-linux-arm64-musl": "1.1.4",
        "@rolldown/binding-linux-ppc64-gnu": "1.1.4",
        "@rolldown/binding-linux-s390x-gnu": "1.1.4",
        "@rolldown/binding-linux-x64-gnu": "1.1.4",
        "@rolldown/binding-linux-x64-musl": "1.1.4",
        "@rolldown/binding-openharmony-arm64": "1.1.4",
        "@rolldown/binding-wasm32-wasi": "1.1.4",
        "@rolldown/binding-win32-arm64-msvc": "1.1.4",
        "@rolldown/binding-win32-x64-msvc": "1.1.4"
      }
    },
    "node_modules/scheduler": {
      "version": "0.27.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
      "license": "MIT"
    },
    "node_modules/set-cookie-parser": {
      "version": "2.7.2",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
      "license": "MIT"
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.3.2.tgz",
      "integrity": "sha512-WtctNNSH8A9jlMIqxzuYumOHU5uGZyRv0Q5svQl+oEPy5w84YpBxdb7MdqyiSPQge5jTJ6zFQLq0PFygdccSBA==",
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.3.3.tgz",
      "integrity": "sha512-uxc/zpqFg6x7C8vOE7lh6Lbda8eEL9zmVm/PLeTPBRhh1xCgdWaQ+J1CUieGpIfm2HdtsUpRv+HshiasBMcc6A==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tiny-invariant": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/tiny-invariant/-/tiny-invariant-1.3.3.tgz",
      "integrity": "sha512-+FbBPE1o9QAYvviau/qC5SE3caw21q3xkvWKBtja5vgqOWIHHJ3ioaq1VPfn/Szqctz2bU/oYeKd9/z5BL+PVg==",
      "license": "MIT"
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD",
      "optional": true
    },
    "node_modules/use-sync-external-store": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.6.0.tgz",
      "integrity": "sha512-Pp6GSwGP/NrPIrxVFAIkOQeyw8lFenOHijQWkUTrDvrF4ALqylP2C/KCkeS9dpUM3KvYRQhna5vt7IL95+ZQ9w==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/victory-vendor": {
      "version": "37.3.6",
      "resolved": "https://registry.npmjs.org/victory-vendor/-/victory-vendor-37.3.6.tgz",
      "integrity": "sha512-SbPDPdDBYp+5MJHhBCAyI7wKM3d5ivekigc2Dk2s7pgbZ9wIgIBYGVw4zGHBml/qTFbexrofXW6Gu4noGxrOwQ==",
      "license": "MIT AND ISC",
      "dependencies": {
        "@types/d3-array": "^3.0.3",
        "@types/d3-ease": "^3.0.0",
        "@types/d3-interpolate": "^3.0.1",
        "@types/d3-scale": "^4.0.2",
        "@types/d3-shape": "^3.1.0",
        "@types/d3-time": "^3.0.0",
        "@types/d3-timer": "^3.0.0",
        "d3-array": "^3.1.6",
        "d3-ease": "^3.0.1",
        "d3-interpolate": "^3.0.1",
        "d3-scale": "^4.0.2",
        "d3-shape": "^3.1.0",
        "d3-time": "^3.0.0",
        "d3-timer": "^3.0.1"
      }
    },
    "node_modules/vite": {
      "version": "8.1.3",
      "resolved": "https://registry.npmjs.org/vite/-/vite-8.1.3.tgz",
      "integrity": "sha512-Ds+gBRbj0lwRO2Y5hwnUBdxSwlAve9LeRyU4sNnAr0ewW0gWF0n5bgXgUzbgZ49MV9BVUAQUFYVcDUcilUExMA==",
      "license": "MIT",
      "dependencies": {
        "lightningcss": "^1.32.0",
        "picomatch": "^4.0.4",
        "postcss": "^8.5.16",
        "rolldown": "~1.1.3",
        "tinyglobby": "^0.2.17"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "@vitejs/devtools": "^0.3.0",
        "esbuild": "^0.27.0 || ^0.28.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "@vitejs/devtools": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/warning": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/warning/-/warning-4.0.3.tgz",
      "integrity": "sha512-rpJyN222KWIvHJ/F53XSZv0Zl/accqHR8et1kpaMTD/fLCRxtV8iX8czMzY7sVZupTI3zcUTg8eycS2kNF9l6w==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.0.0"
      }
    }
  }
}

=== frontend\package.json ===
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

=== frontend\vite.config.js ===
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})

=== backend\app\Http\Controllers\Admin\DashboardController.php ===
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Member\Membership;
use App\Models\Member\Transaction;
use App\Models\Tracking\WorkoutLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Top Stats Cards
        $totalIncome = Transaction::where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $totalRefunds = Transaction::where('type', 'Refund')->sum('amount');
        $netRevenue = $totalIncome - abs($totalRefunds);

        $totalMembers = Member::count();
        $activeSubs = Membership::where('status', 'Active')->count();

        // 2. Recent Activity (Middle Grid)
        $recentMembers = Member::orderBy('created_at', 'desc')->take(5)->get();
        $recentTxns = Transaction::with('member:id,first_name,last_name')->orderBy('created_at', 'desc')->take(5)->get();

        // 3. Expiring Soon Alerts
        $expiringSoon = Membership::with('member:id,first_name,last_name')
            ->where('status', 'Active')
            ->whereBetween('end_date', [Carbon::now(), Carbon::now()->addDays(7)])
            ->orderBy('end_date', 'asc')
            ->get();

        // 4. Calendar Events (Pulling directly from Subscriptions)
        $calendarEvents = Membership::with('member:id,first_name,last_name')->get();

        // 5. Dynamic Sales Chart (Last 6 Months of Revenue)
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $txnsForChart = Transaction::where('status', 'Complete')
            ->where('type', '!=', 'Refund')
            ->where('created_at', '>=', $sixMonthsAgo)
            ->get();

        $salesData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthName = $month->format('M');
            
            $monthlyTotal = $txnsForChart->filter(function($txn) use ($month) {
                return Carbon::parse($txn->created_at)->format('Y-m') === $month->format('Y-m');
            })->sum('amount');

            $salesData[] = [
                'name' => $monthName,
                'revenue' => $monthlyTotal
            ];
        }

        return response()->json([
            'stats' => [
                'revenue' => $netRevenue,
                'members' => $totalMembers,
                'activeSubs' => $activeSubs,
                'reports' => Transaction::count() // Example: showing total lifetime transactions as "reports"
            ],
            'salesData' => $salesData,
            'recentMembers' => $recentMembers,
            'recentTxns' => $recentTxns,
            'expiringSoon' => $expiringSoon,
            'calendarEvents' => $calendarEvents
        ]);
    }

    public function notifications()
    {
        $activeMembers = Member::where('status', 'Active')->get();
        $activeSubsMemberIds = Membership::where('status', 'Active')
            ->where('end_date', '>=', Carbon::now()->toDateString())
            ->pluck('member_id')
            ->toArray();

        $alerts = collect();

        // Alert 1: Missing Subscriptions
        // The System will only alert the coach if the user has been registered for more than 30 days.
        $oneMonthAgo = Carbon::now()->subDays(30);

        foreach ($activeMembers as $member) {
            if (!in_array($member->id, $activeSubsMemberIds)) {
                // Check if they are past the 1-month grace period
                if ($member->created_at < $oneMonthAgo) {
                    $alerts->push([
                        'id' => 'sub_' . $member->id,
                        'member_name' => $member->first_name . ' ' . $member->last_name,
                        'message' => 'Active for >1 month but has no valid subscription plan.'
                    ]);
                }
            }
        }

        // Alert 2: Unverified CCTV Tasks (The Snitch!)
        $uncompletedTasks = WorkoutLog::with('member:id,first_name,last_name')
            ->where('date', Carbon::today())
            ->where('exercise', 'LIKE', 'ASSIGNED: %')
            ->get();

        foreach ($uncompletedTasks as $task) {
            if ($task->member) {
                $exerciseName = str_replace('ASSIGNED: ', '', $task->exercise);
                $alerts->push([
                    'id' => 'task_' . $task->id,
                    'member_name' => $task->member->first_name . ' ' . $task->member->last_name,
                    'message' => "Assigned to do {$exerciseName} today, but the CCTV AI has not verified it yet."
                ]);
            }
        }

        return response()->json($alerts);
    }
}

=== backend\app\Http\Controllers\Admin\PlanController.php ===
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gym\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    // 1. Get all plans
    public function index()
    {
        return response()->json(Plan::all());
    }

    // 2. Add a brand new plan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'price' => 'required|numeric',
            'duration_days' => 'required|integer'
        ]);

        $plan = Plan::create($validated);
        return response()->json(['message' => 'Plan added successfully!', 'plan' => $plan]);
    }

    // 3. Delete a plan
    public function destroy($id)
    {
        Plan::findOrFail($id)->delete();
        return response()->json(['message' => 'Plan deleted!']);
    }

    // 4. Bulk update all prices from the Modal
    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'plans' => 'required|array',
            'plans.*.id' => 'required|exists:plans,id',
            'plans.*.price' => 'required|numeric'
        ]);

        foreach ($request->plans as $planData) {
            Plan::where('id', $planData['id'])->update(['price' => $planData['price']]);
        }

        return response()->json(['message' => 'Plan prices updated successfully!']);
    }
}

=== backend\app\Http\Controllers\Admin\ReportController.php ===
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member\Transaction;
use App\Models\Member\Membership;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Get dates from React, or default to this month
        $start = $request->query('start', Carbon::now()->startOfMonth()->toDateString());
        $end   = $request->query('end',   Carbon::now()->toDateString());

        $startDateTime = $start . ' 00:00:00';
        $endDateTime   = $end   . ' 23:59:59';

        // 1. Transactions in date range (only needed columns)
        $txns = Transaction::select(
                'id', 'transaction_id', 'transaction_date', 'member_id',
                'type', 'description', 'payment_method', 'amount', 'status'
            )
            ->with('member:id,first_name,last_name')
            ->whereBetween('transaction_date', [$start, $end])
            ->orderBy('transaction_date', 'desc')
            ->get();

        // 2. Memberships created in date range
        $memberships = Membership::select(
                'id', 'member_id', 'plan_type', 'start_date', 'end_date',
                'status', 'created_at'
            )
            ->with('member:id,first_name,last_name')
            ->whereBetween('created_at', [$startDateTime, $endDateTime])
            ->orderBy('created_at', 'desc')
            ->get();

        // 3. New member signups count
        $newSignups = Member::whereBetween('created_at', [$startDateTime, $endDateTime])->count();

        // 4. Active / Expired membership counts
        $statusCounts = Membership::select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('status', ['Active', 'Expired'])
            ->groupBy('status')
            ->pluck('total', 'status');
        $activeCount  = $statusCounts['Active']  ?? 0;
        $expiredCount = $statusCounts['Expired'] ?? 0;

        // 5. Attendance records in date range
        $attendances = Attendance::select('id', 'member_id', 'date', 'time_in')
            ->with('member:id,first_name,last_name,plan')
            ->whereBetween('date', [$start, $end])
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();

        // Build KPIs
        $totalIncome   = $txns->where('status', 'Complete')->where('amount', '>', 0)->sum('amount');
        $refunds       = $txns->where('type', 'Refund')->sum('amount');
        $netRevenue    = $totalIncome - abs($refunds);
        $pendingAmount = $txns->where('status', 'Pending')->sum('amount');
        $totalCheckIns = $attendances->count();

        // Map rows
        $paymentRows = $txns->map(fn($t) => [
            $t->transaction_id,
            $t->transaction_date,
            $t->member ? "{$t->member->first_name} {$t->member->last_name}" : 'Walk-in Guest',
            $t->type . ($t->description ? " ({$t->description})" : ''),
            $t->payment_method,
            'â‚± ' . number_format($t->amount, 2),
            $t->status,
        ]);

        $membershipRows = $memberships->map(fn($m) => [
            $m->member ? "{$m->member->first_name} {$m->member->last_name}" : 'Unknown Member',
            $m->plan_type,
            $m->start_date,
            $m->end_date,
            $m->status,
        ]);

        $attendanceRows = $attendances->map(function ($a) {
            $name       = $a->member ? "{$a->member->first_name} {$a->member->last_name}" : 'Unknown Face';
            $memberType = ($a->member && $a->member->plan && $a->member->plan !== 'None')
                ? $a->member->plan
                : 'Walk-in Guest';
            return [$a->date . ' / ' . $a->time_in, $name, $memberType, 'Verified'];
        });

        return response()->json([
            'Payments' => [
                'kpis' => [
                    ['label' => 'Total Income',  'value' => 'â‚± ' . number_format($totalIncome, 2),   'trend' => 'Live'],
                    ['label' => 'Refunds',        'value' => 'â‚± ' . number_format(abs($refunds), 2),  'trend' => 'Live'],
                    ['label' => 'Net Revenue',    'value' => 'â‚± ' . number_format($netRevenue, 2),    'trend' => 'Live'],
                    ['label' => 'Pending',        'value' => 'â‚± ' . number_format($pendingAmount, 2), 'trend' => 'Live'],
                ],
                'columns' => ['Txn ID', 'Date', 'Member', 'Details', 'Method', 'Amount', 'Status'],
                'rows'    => $paymentRows,
            ],
            'Memberships' => [
                'kpis' => [
                    ['label' => 'New Signups',   'value' => (string) $newSignups,   'trend' => 'Live'],
                    ['label' => 'Total Active',  'value' => (string) $activeCount,  'trend' => 'Live'],
                    ['label' => 'Total Expired', 'value' => (string) $expiredCount, 'trend' => 'Live'],
                ],
                'columns' => ['Member', 'Plan', 'Start Date', 'Expiry Date', 'Status'],
                'rows'    => $membershipRows,
            ],
            'Attendance' => [
                'kpis' => [
                    ['label' => 'Total Check-ins',   'value' => (string) $totalCheckIns, 'trend' => 'Live'],
                    ['label' => 'Avg. Daily Visits',  'value' => 'Tracking Active',       'trend' => 'Live'],
                    ['label' => 'System Status',      'value' => 'Online',                'trend' => 'Live'],
                ],
                'columns' => ['Date / Time', 'Member', 'Member Type', 'Status'],
                'rows'    => $attendanceRows,
            ],
        ]);
    }
}

=== backend\app\Http\Controllers\AI\AttendanceController.php ===
<?php

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Tracking\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * 1. The AI Attendance Logger: Python CCTV service hits this when a member is recognized.
     */
    public function logAttendance(Request $request)
    {
        $now = Carbon::now();
        $today = $now->toDateString();

        // RULE 1: Enforce Gym Operating Hours (9:00 AM to 9:30 PM)
        $openingTime = Carbon::createFromTime(9, 0, 0);
        $closingTime = Carbon::createFromTime(21, 30, 0);

        if (!$now->between($openingTime, $closingTime)) {
            return response()->json(['status' => 'ignored', 'message' => 'Outside gym operating hours.']);
        }

        $memberId = $request->member_id;

        // RULE 2: Enforce the "Once-a-Day" check-in rule
        $alreadyLogged = Attendance::where('member_id', $memberId)
                                   ->where('date', $today)
                                   ->exists(); 

        if (!$alreadyLogged) {
            Attendance::create([
                'member_id' => $memberId,
                'date' => $today,
                'time_in' => $now->toTimeString(),
            ]);
            return response()->json(['status' => 'logged', 'message' => 'Attendance recorded!']);
        }

        return response()->json(['status' => 'ignored', 'message' => 'Already logged today.']);
    }

    /**
     * 2. Retrieve recent attendance history for a specific member.
     */
    public function getMemberAttendance($id)
    {
        return Attendance::where('member_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->take(10)
            ->get();
    }

    /**
     * 3. Live Dashboard: Lightweight route that only grabs TODAY'S attendance check-ins.
     */
    public function getTodayAttendance()
    {
        return Attendance::with('member:id,first_name,last_name')
            ->where('date', Carbon::now()->toDateString())
            ->orderBy('time_in', 'desc')
            ->get();
    }
}

=== backend\app\Http\Controllers\Auth\AuthController.php ===
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Auth\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validate the incoming data from React
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Find the admin in the database
        $admin = Admin::where('email', $request->email)->first();

        // 3. Check if the admin exists and the password is correct
        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password. Please try again.'],
            ]);
        }

        // 4. Generate a secure Sanctum token
        $token = $admin->createToken('admin-token')->plainTextToken;

        // 5. Send the token back to React
        return response()->json([
            'admin' => $admin,
            'token' => $token,
            'message' => 'Authentication successful'
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}

=== backend\app\Http\Controllers\Member\MemberController.php ===
<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::orderBy('created_at', 'desc')->get();
        $oneMonthAgo = Carbon::now()->subDays(30);

        // --- THE AI INACTIVITY AUDITOR ---
        foreach ($members as $member) {
            // Only audit members that are currently active
            if ($member->status === 'Active') {
                // Find the absolute last time the AI saw them
                $lastAttendance = Attendance::where('member_id', $member->id)->orderBy('date', 'desc')->first();
                
                // If they have no logs yet, use the day their account was created
                $lastActiveDate = $lastAttendance ? Carbon::parse($lastAttendance->date) : $member->created_at;

                // If it has been more than 30 days, silently demote them
                if ($lastActiveDate->lt($oneMonthAgo)) {
                    $member->status = 'Inactive';
                    $member->save();
                }
            }
        }

        return response()->json($members);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:members,email',
            'phone' => 'required|string|max:15',
            'plan' => 'required|string',
            'status' => 'required|string',
            'profile_pic' => 'nullable|image|max:51200',
            'enrolled_face_id' => 'nullable',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        if ($request->hasFile('profile_pic')) {
            $file = $request->file('profile_pic');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('profiles'), $filename);
            $validatedData['profile_pic'] = '/profiles/' . $filename;
        }

        if ($request->filled('enrolled_face_id') && strpos($request->enrolled_face_id, 'data:image') === 0) {
            if (!File::exists(public_path('faces'))) {
                File::makeDirectory(public_path('faces'), 0755, true);
            }
            $imageParts = explode(";base64,", $request->enrolled_face_id);
            $imageBase64 = base64_decode($imageParts[1]);
            $faceFilename = time() . '_face_' . uniqid() . '.png';
            file_put_contents(public_path('faces/' . $faceFilename), $imageBase64);
            $validatedData['enrolled_face_id'] = '/faces/' . $faceFilename;
        }

        $member = Member::create($validatedData);

        return response()->json(['message' => 'Member created successfully', 'member' => $member], 201);
    }

    public function update(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:members,email,' . $member->id,
            'phone' => 'sometimes|required|string|max:15',
            'plan' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'profile_pic' => 'nullable|image|max:51200',
            'enrolled_face_id' => 'nullable',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'weight' => 'nullable|numeric',
            'address' => 'nullable|string'
        ]);

        if ($request->hasFile('profile_pic')) {
            if ($member->profile_pic) {
                $oldPath = public_path($member->profile_pic);
                if (File::exists($oldPath)) {
                    File::delete($oldPath);
                }
            }
            $file = $request->file('profile_pic');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('profiles'), $filename);
            $validatedData['profile_pic'] = '/profiles/' . $filename;
        }

        if ($request->filled('enrolled_face_id') && strpos($request->enrolled_face_id, 'data:image') === 0) {
            if ($member->enrolled_face_id) {
                $oldFacePath = public_path($member->enrolled_face_id);
                if (File::exists($oldFacePath)) {
                    File::delete($oldFacePath);
                }
            }
            if (!File::exists(public_path('faces'))) {
                File::makeDirectory(public_path('faces'), 0755, true);
            }
            $imageParts = explode(";base64,", $request->enrolled_face_id);
            $imageBase64 = base64_decode($imageParts[1]);
            $faceFilename = time() . '_face_' . uniqid() . '.png';
            file_put_contents(public_path('faces/' . $faceFilename), $imageBase64);
            $validatedData['enrolled_face_id'] = '/faces/' . $faceFilename;
        }

        $member->update($validatedData);

        return response()->json(['message' => 'Member updated successfully', 'member' => $member]);
    }
    
    public function destroy($id)
    {
        try {
            $member = Member::findOrFail($id);

            if ($member->profile_pic) {
                $picPath = public_path($member->profile_pic);
                if (File::exists($picPath)) {
                    File::delete($picPath);
                }
            }

            if ($member->enrolled_face_id) {
                $facePath = public_path($member->enrolled_face_id);
                if (File::exists($facePath)) {
                    File::delete($facePath);
                }
            }

            $member->delete();

            return response()->json(['message' => 'Member and associated files deleted successfully.']);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == "23000") {
                return response()->json([
                    'message' => 'Cannot delete this member because they have existing subscriptions or transactions tied to them. Please delete their records in the Subscriptions/Transactions tab first.'
                ], 400);
            }
            
            return response()->json(['message' => 'A database error occurred while trying to delete.'], 500);
        }
    }
}

=== backend\app\Http\Controllers\Member\MembershipController.php ===
<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Membership;
use App\Models\Member\Member;
use App\Models\Member\Transaction;
use App\Models\Gym\Plan;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MembershipController extends Controller
{
    public function index()
    {
        $memberships = Membership::with(['member:id,first_name,last_name', 'plan'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($memberships);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'member_id' => 'required|exists:members,id',
            'plan_id' => 'nullable|exists:plans,id',
            'plan_type' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'status' => 'required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'required|string',
            'color' => 'required|string',
            'notes' => 'nullable|string'
        ]);

        // If plan_id is provided, resolve Plan catalog entity & auto-calculate end_date if missing
        $plan = null;
        if (!empty($request->plan_id)) {
            $plan = Plan::find($request->plan_id);
        } elseif (!empty($request->plan_type)) {
            $plan = Plan::where('name', $request->plan_type)->first();
        }

        if ($plan) {
            $validatedData['plan_id'] = $plan->id;
            $validatedData['plan_type'] = $plan->name;
            if (empty($validatedData['end_date']) && $plan->duration_days) {
                $validatedData['end_date'] = Carbon::parse($request->start_date)->addDays($plan->duration_days)->toDateString();
            }
        }

        // Fallback for end_date if still missing
        if (empty($validatedData['end_date'])) {
            $validatedData['end_date'] = Carbon::parse($request->start_date)->addDays(30)->toDateString();
        }

        // Fallback for plan_type if missing
        if (empty($validatedData['plan_type'])) {
            $validatedData['plan_type'] = 'General Pass';
        }

        $membership = Membership::create($validatedData);

        // ðŸš¨ CAPSTONE RULE: Auto-Update the Member's Profile Plan & Status!
        $member = Member::find($request->member_id);
        if ($member) {
            $member->update([
                'plan' => $validatedData['plan_type'],
                'status' => 'Active'
            ]);
        }

        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        
        Transaction::create([
            'transaction_id' => 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT),
            'transaction_date' => now()->toDateString(),
            'member_id' => $request->member_id,
            'type' => 'Subscription Payment',
            'description' => $validatedData['plan_type'] . ' Auto-Billed',
            'payment_method' => $request->payment_method,
            'amount' => $request->amount ?? ($plan ? $plan->price : 0),
            'status' => 'Complete',
            'reference_number' => $request->reference_number
        ]);

        return response()->json(['message' => 'Subscription and Transaction created', 'membership' => $membership], 201);
    }

    public function update(Request $request, $id)
    {
        $membership = Membership::findOrFail($id);

        $validatedData = $request->validate([
            'plan_id' => 'nullable|exists:plans,id',
            'plan_type' => 'sometimes|required|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date',
            'status' => 'sometimes|required|string',
            'auto_renew' => 'boolean',
            'payment_method' => 'sometimes|required|string',
            'color' => 'sometimes|required|string',
            'notes' => 'nullable|string'
        ]);

        if (!empty($request->plan_id)) {
            $plan = Plan::find($request->plan_id);
            if ($plan) {
                $validatedData['plan_type'] = $plan->name;
            }
        }

        $membership->update($validatedData);
        return response()->json(['message' => 'Subscription updated successfully', 'membership' => $membership]);
    }

    public function destroy($id)
    {
        $membership = Membership::findOrFail($id);
        $membership->delete();
        return response()->json(['message' => 'Subscription deleted successfully']);
    }
}

=== backend\app\Http\Controllers\Member\TransactionController.php ===
<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::select(
                'id', 'transaction_id', 'transaction_date', 'member_id',
                'type', 'description', 'payment_method', 'amount', 'status',
                'reference_number', 'created_at'
            )
            ->with('member:id,first_name,last_name')
            ->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();
        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'transaction_date' => 'required|date',
            'member_id' => 'nullable|exists:members,id',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        // Auto-generate the TXN-001 format
        $latest = Transaction::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;
        $validatedData['transaction_id'] = 'TXN-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        $transaction = Transaction::create($validatedData);
        return response()->json(['message' => 'Transaction saved', 'transaction' => $transaction], 201);
    }

    public function update(Request $request, $id)
    {
        $transaction = Transaction::findOrFail($id);
        $validatedData = $request->validate([
            'transaction_date' => 'required|date',
            'member_id' => 'nullable|exists:members,id',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'payment_method' => 'required|string',
            'amount' => 'required|numeric',
            'status' => 'required|string',
            'reference_number' => 'nullable|string'
        ]);

        $transaction->update($validatedData);
        return response()->json(['message' => 'Transaction updated', 'transaction' => $transaction]);
    }

    public function destroy($id)
    {
        Transaction::findOrFail($id)->delete();
        return response()->json(['message' => 'Transaction deleted']);
    }
}

=== backend\app\Http\Controllers\Controller.php ===
<?php

namespace App\Http\Controllers;

abstract class Controller
{
    //
}

=== backend\app\Models\Auth\Admin.php ===
<?php

namespace App\Models\Auth;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}

=== backend\app\Models\Auth\User.php ===
<?php

namespace App\Models\Auth;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}

=== backend\app\Models\Gym\Exercise.php ===
<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'exercise_id', 
        'name', 
        'category', 
        'body_part', 
        'equipment', 
        'gif_path'
    ];
}

=== backend\app\Models\Gym\Plan.php ===
<?php

namespace App\Models\Gym;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Membership;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'price', 
        'duration_days'
    ];

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }
}

=== backend\app\Models\Member\Member.php ===
<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name', 
        'last_name', 
        'email', 
        'phone', 
        'plan', 
        'status',
        'enrolled_face_id', 
        'profile_pic', 
        'dob', 
        'height', 
        'weight', 
        'address'
    ];

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    public function activeMembership()
    {
        return $this->hasOne(Membership::class)->where('status', 'Active')->latestOfMany();
    }
}

=== backend\app\Models\Member\Membership.php ===
<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Gym\Plan;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'plan_id',
        'plan_type',
        'start_date',
        'end_date',
        'status',
        'auto_renew',
        'payment_method',
        'color',
        'notes'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}

=== backend\app\Models\Member\Transaction.php ===
<?php

namespace App\Models\Member;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'transaction_date', 'member_id', 'type', 
        'description', 'payment_method', 'amount', 'status', 'reference_number'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}

=== backend\app\Models\Tracking\Attendance.php ===
<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Member;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'date',
        'time_in',
        'time_out'
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}

=== backend\app\Models\Tracking\WorkoutLog.php ===
<?php

namespace App\Models\Tracking;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Member\Member;

class WorkoutLog extends Model
{
    use HasFactory;

    protected $fillable = ['member_id', 'exercise', 'date'];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}

=== backend\app\Providers\AppServiceProvider.php ===
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

=== backend\bootstrap\app.php ===
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

=== backend\bootstrap\providers.php ===
<?php

use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
];

=== backend\config\app.php ===
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "UTC" by default as it is suitable for most use cases.
    |
    */

    'timezone' => 'Asia/Manila',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];

=== backend\config\auth.php ===
<?php

use App\Models\User;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | This option defines the default authentication "guard" and password
    | reset "broker" for your application. You may change these values
    | as required, but they're a perfect start for most applications.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | Next, you may define every authentication guard for your application.
    | Of course, a great default configuration has been defined for you
    | which utilizes session storage plus the Eloquent user provider.
    |
    | All authentication guards have a user provider, which defines how the
    | users are actually retrieved out of your database or other storage
    | system used by the application. Typically, Eloquent is utilized.
    |
    | Supported: "session"
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication guards have a user provider, which defines how the
    | users are actually retrieved out of your database or other storage
    | system used by the application. Typically, Eloquent is utilized.
    |
    | If you have multiple user tables or models you may configure multiple
    | providers to represent the model / table. These providers may then
    | be assigned to any extra authentication guards you have defined.
    |
    | Supported: "database", "eloquent"
    |
    */

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', User::class),
        ],

        // 'users' => [
        //     'driver' => 'database',
        //     'table' => 'users',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | These configuration options specify the behavior of Laravel's password
    | reset functionality, including the table utilized for token storage
    | and the user provider that is invoked to actually retrieve users.
    |
    | The expiry time is the number of minutes that each reset token will be
    | considered valid. This security feature keeps tokens short-lived so
    | they have less time to be guessed. You may change this as needed.
    |
    | The throttle setting is the number of seconds a user must wait before
    | generating more password reset tokens. This prevents the user from
    | quickly generating a very large amount of password reset tokens.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may define the number of seconds before a password confirmation
    | window expires and users are asked to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];

=== backend\config\cache.php ===
<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache store that will be used by the
    | framework. This connection is utilized if another isn't explicitly
    | specified when running a cache operation inside the application.
    |
    */

    'default' => env('CACHE_STORE', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Cache Stores
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the cache "stores" for your application as
    | well as their drivers. You may even define multiple stores for the
    | same cache driver to group types of items stored in your caches.
    |
    | Supported drivers: "array", "database", "file", "memcached",
    |                    "redis", "dynamodb", "octane",
    |                    "failover", "null"
    |
    */

    'stores' => [

        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'database' => [
            'driver' => 'database',
            'connection' => env('DB_CACHE_CONNECTION'),
            'table' => env('DB_CACHE_TABLE', 'cache'),
            'lock_connection' => env('DB_CACHE_LOCK_CONNECTION'),
            'lock_table' => env('DB_CACHE_LOCK_TABLE'),
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],

        'memcached' => [
            'driver' => 'memcached',
            'persistent_id' => env('MEMCACHED_PERSISTENT_ID'),
            'sasl' => [
                env('MEMCACHED_USERNAME'),
                env('MEMCACHED_PASSWORD'),
            ],
            'options' => [
                // Memcached::OPT_CONNECT_TIMEOUT => 2000,
            ],
            'servers' => [
                [
                    'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                    'port' => env('MEMCACHED_PORT', 11211),
                    'weight' => 100,
                ],
            ],
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => env('REDIS_CACHE_CONNECTION', 'cache'),
            'lock_connection' => env('REDIS_CACHE_LOCK_CONNECTION', 'default'),
        ],

        'dynamodb' => [
            'driver' => 'dynamodb',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
            'endpoint' => env('DYNAMODB_ENDPOINT'),
        ],

        'octane' => [
            'driver' => 'octane',
        ],

        'failover' => [
            'driver' => 'failover',
            'stores' => [
                'database',
                'array',
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    |
    | When utilizing the APC, database, memcached, Redis, and DynamoDB cache
    | stores, there might be other applications using the same cache. For
    | that reason, you may prefix every cache key to avoid collisions.
    |
    */

    'prefix' => env('CACHE_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-cache-'),

];

=== backend\config\database.php ===
<?php

use Illuminate\Support\Str;
use Pdo\Mysql;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    'default' => env('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
            'busy_timeout' => null,
            'journal_mode' => null,
            'synchronous' => null,
            'transaction_mode' => 'DEFERRED',
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                (PHP_VERSION_ID >= 80500 ? Mysql::ATTR_SSL_CA : PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'mariadb' => [
            'driver' => 'mariadb',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                (PHP_VERSION_ID >= 80500 ? Mysql::ATTR_SSL_CA : PDO::MYSQL_ATTR_SSL_CA) => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => env('DB_SSLMODE', 'prefer'),
        ],

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-database-'),
            'persistent' => env('REDIS_PERSISTENT', false),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
            'max_retries' => env('REDIS_MAX_RETRIES', 3),
            'backoff_algorithm' => env('REDIS_BACKOFF_ALGORITHM', 'decorrelated_jitter'),
            'backoff_base' => env('REDIS_BACKOFF_BASE', 100),
            'backoff_cap' => env('REDIS_BACKOFF_CAP', 1000),
        ],

    ],

];

=== backend\config\filesystems.php ===
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];

=== backend\config\logging.php ===
<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    |
    | This option defines the default log channel that is utilized to write
    | messages to your logs. The value provided here should match one of
    | the channels present in the list of "channels" configured below.
    |
    */

    'default' => env('LOG_CHANNEL', 'stack'),

    /*
    |--------------------------------------------------------------------------
    | Deprecations Log Channel
    |--------------------------------------------------------------------------
    |
    | This option controls the log channel that should be used to log warnings
    | regarding deprecated PHP and library features. This allows you to get
    | your application ready for upcoming major versions of dependencies.
    |
    */

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    |
    | Here you may configure the log channels for your application. Laravel
    | utilizes the Monolog PHP logging library, which includes a variety
    | of powerful log handlers and formatters that you're free to use.
    |
    | Available drivers: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog", "custom", "stack"
    |
    */

    'channels' => [

        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', (string) env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'replace_placeholders' => true,
        ],

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => env('LOG_SLACK_USERNAME', env('APP_NAME', 'Laravel')),
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
            'level' => env('LOG_LEVEL', 'critical'),
            'replace_placeholders' => true,
        ],

        'papertrail' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class),
            'handler_with' => [
                'host' => env('PAPERTRAIL_URL'),
                'port' => env('PAPERTRAIL_PORT'),
                'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'),
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'handler_with' => [
                'stream' => 'php://stderr',
            ],
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => env('LOG_LEVEL', 'debug'),
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
            'replace_placeholders' => true,
        ],

        'errorlog' => [
            'driver' => 'errorlog',
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

    ],

];

=== backend\config\mail.php ===
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Mailer
    |--------------------------------------------------------------------------
    |
    | This option controls the default mailer that is used to send all email
    | messages unless another mailer is explicitly specified when sending
    | the message. All additional mailers can be configured within the
    | "mailers" array. Examples of each type of mailer are provided.
    |
    */

    'default' => env('MAIL_MAILER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Mailer Configurations
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the mailers used by your application plus
    | their respective settings. Several examples have been configured for
    | you and you are free to add your own as your application requires.
    |
    | Laravel supports a variety of mail "transport" drivers that can be used
    | when delivering an email. You may specify which one you're using for
    | your mailers below. You may also add additional mailers if needed.
    |
    | Supported: "smtp", "sendmail", "mailgun", "ses", "ses-v2",
    |            "postmark", "resend", "log", "array",
    |            "failover", "roundrobin"
    |
    */

    'mailers' => [

        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
            // 'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            // 'client' => [
            //     'timeout' => 5,
            // ],
        ],

        'resend' => [
            'transport' => 'resend',
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
            'retry_after' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Global "From" Address
    |--------------------------------------------------------------------------
    |
    | You may wish for all emails sent by your application to be sent from
    | the same address. Here you may specify a name and address that is
    | used globally for all emails that are sent by your application.
    |
    */

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', env('APP_NAME', 'Laravel')),
    ],

];

=== backend\config\queue.php ===
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Queue Connection Name
    |--------------------------------------------------------------------------
    |
    | Laravel's queue supports a variety of backends via a single, unified
    | API, giving you convenient access to each backend using identical
    | syntax for each. The default queue connection is defined below.
    |
    */

    'default' => env('QUEUE_CONNECTION', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Queue Connections
    |--------------------------------------------------------------------------
    |
    | Here you may configure the connection options for every queue backend
    | used by your application. An example configuration is provided for
    | each backend supported by Laravel. You're also free to add more.
    |
    | Drivers: "sync", "database", "beanstalkd", "sqs", "redis",
    |          "deferred", "background", "failover", "null"
    |
    */

    'connections' => [

        'sync' => [
            'driver' => 'sync',
        ],

        'database' => [
            'driver' => 'database',
            'connection' => env('DB_QUEUE_CONNECTION'),
            'table' => env('DB_QUEUE_TABLE', 'jobs'),
            'queue' => env('DB_QUEUE', 'default'),
            'retry_after' => (int) env('DB_QUEUE_RETRY_AFTER', 90),
            'after_commit' => false,
        ],

        'beanstalkd' => [
            'driver' => 'beanstalkd',
            'host' => env('BEANSTALKD_QUEUE_HOST', 'localhost'),
            'queue' => env('BEANSTALKD_QUEUE', 'default'),
            'retry_after' => (int) env('BEANSTALKD_QUEUE_RETRY_AFTER', 90),
            'block_for' => 0,
            'after_commit' => false,
        ],

        'sqs' => [
            'driver' => 'sqs',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'prefix' => env('SQS_PREFIX', 'https://sqs.us-east-1.amazonaws.com/your-account-id'),
            'queue' => env('SQS_QUEUE', 'default'),
            'suffix' => env('SQS_SUFFIX'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'after_commit' => false,
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
            'queue' => env('REDIS_QUEUE', 'default'),
            'retry_after' => (int) env('REDIS_QUEUE_RETRY_AFTER', 90),
            'block_for' => null,
            'after_commit' => false,
        ],

        'deferred' => [
            'driver' => 'deferred',
        ],

        'background' => [
            'driver' => 'background',
        ],

        'failover' => [
            'driver' => 'failover',
            'connections' => [
                'database',
                'deferred',
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Job Batching
    |--------------------------------------------------------------------------
    |
    | The following options configure the database and table that store job
    | batching information. These options can be updated to any database
    | connection and table which has been defined by your application.
    |
    */

    'batching' => [
        'database' => env('DB_CONNECTION', 'sqlite'),
        'table' => 'job_batches',
    ],

    /*
    |--------------------------------------------------------------------------
    | Failed Queue Jobs
    |--------------------------------------------------------------------------
    |
    | These options configure the behavior of failed queue job logging so you
    | can control how and where failed jobs are stored. Laravel ships with
    | support for storing failed jobs in a simple file or in a database.
    |
    | Supported drivers: "database-uuids", "dynamodb", "file", "null"
    |
    */

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        'database' => env('DB_CONNECTION', 'sqlite'),
        'table' => 'failed_jobs',
    ],

];

=== backend\config\sanctum.php ===
<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort(),
        // Sanctum::currentRequestHost(),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. This will override any values set in the token's
    | "expires_at" attribute, but first-party sessions are not affected.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens in order to take advantage of numerous
    | security scanning initiatives maintained by open source platforms
    | that notify developers if they commit tokens into repositories.
    |
    | See: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
    |
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];

=== backend\config\services.php ===
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];

=== backend\config\session.php ===
<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Session Driver
    |--------------------------------------------------------------------------
    |
    | This option determines the default session driver that is utilized for
    | incoming requests. Laravel supports a variety of storage options to
    | persist session data. Database storage is a great default choice.
    |
    | Supported: "file", "cookie", "database", "memcached",
    |            "redis", "dynamodb", "array"
    |
    */

    'driver' => env('SESSION_DRIVER', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Session Lifetime
    |--------------------------------------------------------------------------
    |
    | Here you may specify the number of minutes that you wish the session
    | to be allowed to remain idle before it expires. If you want them
    | to expire immediately when the browser is closed then you may
    | indicate that via the expire_on_close configuration option.
    |
    */

    'lifetime' => (int) env('SESSION_LIFETIME', 120),

    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),

    /*
    |--------------------------------------------------------------------------
    | Session Encryption
    |--------------------------------------------------------------------------
    |
    | This option allows you to easily specify that all of your session data
    | should be encrypted before it's stored. All encryption is performed
    | automatically by Laravel and you may use the session like normal.
    |
    */

    'encrypt' => env('SESSION_ENCRYPT', false),

    /*
    |--------------------------------------------------------------------------
    | Session File Location
    |--------------------------------------------------------------------------
    |
    | When utilizing the "file" session driver, the session files are placed
    | on disk. The default storage location is defined here; however, you
    | are free to provide another location where they should be stored.
    |
    */

    'files' => storage_path('framework/sessions'),

    /*
    |--------------------------------------------------------------------------
    | Session Database Connection
    |--------------------------------------------------------------------------
    |
    | When using the "database" or "redis" session drivers, you may specify a
    | connection that should be used to manage these sessions. This should
    | correspond to a connection in your database configuration options.
    |
    */

    'connection' => env('SESSION_CONNECTION'),

    /*
    |--------------------------------------------------------------------------
    | Session Database Table
    |--------------------------------------------------------------------------
    |
    | When using the "database" session driver, you may specify the table to
    | be used to store sessions. Of course, a sensible default is defined
    | for you; however, you're welcome to change this to another table.
    |
    */

    'table' => env('SESSION_TABLE', 'sessions'),

    /*
    |--------------------------------------------------------------------------
    | Session Cache Store
    |--------------------------------------------------------------------------
    |
    | When using one of the framework's cache driven session backends, you may
    | define the cache store which should be used to store the session data
    | between requests. This must match one of your defined cache stores.
    |
    | Affects: "dynamodb", "memcached", "redis"
    |
    */

    'store' => env('SESSION_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Session Sweeping Lottery
    |--------------------------------------------------------------------------
    |
    | Some session drivers must manually sweep their storage location to get
    | rid of old sessions from storage. Here are the chances that it will
    | happen on a given request. By default, the odds are 2 out of 100.
    |
    */

    'lottery' => [2, 100],

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Name
    |--------------------------------------------------------------------------
    |
    | Here you may change the name of the session cookie that is created by
    | the framework. Typically, you should not need to change this value
    | since doing so does not grant a meaningful security improvement.
    |
    */

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug((string) env('APP_NAME', 'laravel')).'-session'
    ),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Path
    |--------------------------------------------------------------------------
    |
    | The session cookie path determines the path for which the cookie will
    | be regarded as available. Typically, this will be the root path of
    | your application, but you're free to change this when necessary.
    |
    */

    'path' => env('SESSION_PATH', '/'),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Domain
    |--------------------------------------------------------------------------
    |
    | This value determines the domain and subdomains the session cookie is
    | available to. By default, the cookie will be available to the root
    | domain without subdomains. Typically, this shouldn't be changed.
    |
    */

    'domain' => env('SESSION_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | HTTPS Only Cookies
    |--------------------------------------------------------------------------
    |
    | By setting this option to true, session cookies will only be sent back
    | to the server if the browser has a HTTPS connection. This will keep
    | the cookie from being sent to you when it can't be done securely.
    |
    */

    'secure' => env('SESSION_SECURE_COOKIE'),

    /*
    |--------------------------------------------------------------------------
    | HTTP Access Only
    |--------------------------------------------------------------------------
    |
    | Setting this value to true will prevent JavaScript from accessing the
    | value of the cookie and the cookie will only be accessible through
    | the HTTP protocol. It's unlikely you should disable this option.
    |
    */

    'http_only' => env('SESSION_HTTP_ONLY', true),

    /*
    |--------------------------------------------------------------------------
    | Same-Site Cookies
    |--------------------------------------------------------------------------
    |
    | This option determines how your cookies behave when cross-site requests
    | take place, and can be used to mitigate CSRF attacks. By default, we
    | will set this value to "lax" to permit secure cross-site requests.
    |
    | See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value
    |
    | Supported: "lax", "strict", "none", null
    |
    */

    'same_site' => env('SESSION_SAME_SITE', 'lax'),

    /*
    |--------------------------------------------------------------------------
    | Partitioned Cookies
    |--------------------------------------------------------------------------
    |
    | Setting this value to true will tie the cookie to the top-level site for
    | a cross-site context. Partitioned cookies are accepted by the browser
    | when flagged "secure" and the Same-Site attribute is set to "none".
    |
    */

    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),

];

=== backend\database\factories\UserFactory.php ===
<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}

=== backend\database\migrations\0001_01_01_000000_create_users_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};

=== backend\database\migrations\0001_01_01_000001_create_cache_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration')->index();
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};

=== backend\database\migrations\0001_01_01_000002_create_jobs_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
    }
};

=== backend\database\migrations\2026_07_08_105157_create_admins_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password'); // Automatically hashed by Laravel
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};

=== backend\database\migrations\2026_07_08_105158_create_members_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('plan')->default('None'); 
            $table->string('status')->default('Active'); 
            $table->longText('enrolled_face_id')->nullable(); // Stores the WebRTC face capture
            $table->string('profile_pic')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};

=== backend\database\migrations\2026_07_08_110011_create_face_encodings_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('face_encodings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->longText('encoding_blob'); // Stores the facial array data from Python
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('face_encodings');
    }
};

=== backend\database\migrations\2026_07_08_110011_create_memberships_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->string('plan_type'); // e.g., Monthly, With Coach
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status')->default('Active');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->nullable();
            $table->string('color')->default('#f59e0b'); // Matches your calendar colors
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};

=== backend\database\migrations\2026_07_08_110011_create_payments_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('txn_id')->unique(); // e.g., TXN-001
            $table->foreignId('member_id')->nullable()->constrained('members')->onDelete('set null');
            $table->string('guest_name')->nullable(); // For walk-ins
            $table->string('type'); // Subscription Payment, Fee, Refund
            $table->string('description')->nullable();
            $table->string('method'); // Cash, Gcash, Card
            $table->decimal('amount', 10, 2); 
            $table->string('status')->default('Complete');
            $table->string('reference_no')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

=== backend\database\migrations\2026_07_08_110012_create_exercise_sessions_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('exercise_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('total_reps')->default(0);
            $table->string('camera_id')->default('Cam 01');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercise_sessions');
    }
};

=== backend\database\migrations\2026_07_08_110012_create_gesture_logs_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('gesture_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('session_id')->nullable()->constrained('exercise_sessions')->onDelete('cascade');
            $table->string('exercise_type'); // e.g., Bicep Curl
            $table->decimal('confidence_score', 5, 2); // e.g., 98.50
            $table->integer('rep_count');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gesture_logs');
    }
};

=== backend\database\migrations\2026_07_08_110813_create_personal_access_tokens_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};

=== backend\database\migrations\2026_07_10_110041_create_memberships_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Add this line to drop the stubborn existing table first!
        Schema::dropIfExists('memberships');

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade'); 
            $table->foreignId('plan_id')->nullable()->constrained('plans')->onDelete('set null');
            $table->string('plan_type'); 
            $table->date('start_date');
            $table->date('end_date'); 
            $table->string('status')->default('Active');
            $table->boolean('auto_renew')->default(false);
            $table->string('payment_method')->default('Cash');
            $table->string('color')->default('#f59e0b');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }
};

=== backend\database\migrations\2026_07_11_123032_create_plans_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->integer('duration_days');
            $table->timestamps();
        });

        // Auto-insert the default gym plans so the database isn't empty!
        \Illuminate\Support\Facades\DB::table('plans')->insert([
            ['name' => 'Daily', 'price' => 50, 'duration_days' => 1],
            ['name' => 'Monthly', 'price' => 600, 'duration_days' => 30],
            ['name' => 'Annual', 'price' => 6000, 'duration_days' => 365],
            ['name' => 'With Coach', 'price' => 2500, 'duration_days' => 30],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

=== backend\database\migrations\2026_07_12_034727_create_transactions_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique(); // To store "TXN-001" format
            $table->date('transaction_date');
            
            // Nullable foreign key for walk-in guests!
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete(); 
            
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('payment_method');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('Complete');
            $table->string('reference_number')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

=== backend\database\migrations\2026_07_19_044804_create_attendances_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->time('time_in');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};

=== backend\database\migrations\2026_07_28_143901_add_body_metrics_to_members_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Adding the missing anthropometric columns
            $table->date('dob')->nullable();
            $table->decimal('height', 5, 2)->nullable(); // e.g., 170.50 cm
            $table->decimal('weight', 5, 2)->nullable(); // e.g., 65.50 kg
        });
    }

    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Drop them if we ever need to rollback
            $table->dropColumn(['dob', 'height', 'weight']);
        });
    }
};

=== backend\database\migrations\2026_08_13_075921_create_workout_logs_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->string('exercise');
            $table->date('date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_logs');
    }
};

=== backend\database\migrations\2026_09_04_121022_create_exercises_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('exercise_id')->unique(); // Matches the "0001" ID
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('body_part')->nullable();
            $table->string('equipment')->nullable();
            $table->string('gif_path'); // This maps to your frontend videos!
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exercises');
    }
};

=== backend\database\migrations\2026_09_05_221343_add_address_to_members_table.php ===
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('members', function (Blueprint $table) {
            $table->text('address')->nullable();
        });
    }
    public function down(): void {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('address');
        });
    }
};

=== backend\database\migrations\2026_09_11_000000_add_performance_indexes.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Optimization Migration
 * 
 * Adds database indexes to columns used in WHERE, ORDER BY, and JOIN clauses
 * on the transactions, memberships, and attendances tables.
 *
 * WITHOUT indexes: MySQL does a full table scan on every query â€” O(n)
 * WITH indexes:    MySQL uses B-tree lookup â€” O(log n), dramatically faster
 *
 * This migration is SAFE â€” it only adds indexes, no data is modified or deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        // â”€â”€ TRANSACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // transaction_date: used in ORDER BY and whereBetween in both
        //   TransactionController and ReportController
        // member_id: used in eager load JOIN (with('member'))
        Schema::table('transactions', function (Blueprint $table) {
            if (!$this->indexExists('transactions', 'transactions_transaction_date_index')) {
                $table->index('transaction_date', 'transactions_transaction_date_index');
            }
            if (!$this->indexExists('transactions', 'transactions_member_id_index')) {
                $table->index('member_id', 'transactions_member_id_index');
            }
            if (!$this->indexExists('transactions', 'transactions_status_index')) {
                $table->index('status', 'transactions_status_index');
            }
        });

        // â”€â”€ MEMBERSHIPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // status: used in WHERE status='Active'/'Expired' queries
        // member_id: used in eager load JOIN (with('member'))
        // created_at: used in whereBetween in ReportController
        // start_date / end_date: used in dashboard expiring-soon query
        Schema::table('memberships', function (Blueprint $table) {
            if (!$this->indexExists('memberships', 'memberships_status_index')) {
                $table->index('status', 'memberships_status_index');
            }
            if (!$this->indexExists('memberships', 'memberships_member_id_index')) {
                $table->index('member_id', 'memberships_member_id_index');
            }
            if (!$this->indexExists('memberships', 'memberships_end_date_index')) {
                $table->index('end_date', 'memberships_end_date_index');
            }
            if (!$this->indexExists('memberships', 'memberships_created_at_index')) {
                $table->index('created_at', 'memberships_created_at_index');
            }
        });

        // â”€â”€ ATTENDANCES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // date: used in ORDER BY and whereBetween in ReportController
        // member_id: used in eager load JOIN (with('member'))
        Schema::table('attendances', function (Blueprint $table) {
            if (!$this->indexExists('attendances', 'attendances_date_index')) {
                $table->index('date', 'attendances_date_index');
            }
            if (!$this->indexExists('attendances', 'attendances_member_id_index')) {
                $table->index('member_id', 'attendances_member_id_index');
            }
        });

        // â”€â”€ MEMBERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // status: used in WHERE status='Active' filter queries
        // created_at: used in whereBetween for new signups in ReportController
        Schema::table('members', function (Blueprint $table) {
            if (!$this->indexExists('members', 'members_status_index')) {
                $table->index('status', 'members_status_index');
            }
            if (!$this->indexExists('members', 'members_created_at_index')) {
                $table->index('created_at', 'members_created_at_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndexIfExists('transactions_transaction_date_index');
            $table->dropIndexIfExists('transactions_member_id_index');
            $table->dropIndexIfExists('transactions_status_index');
        });

        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndexIfExists('memberships_status_index');
            $table->dropIndexIfExists('memberships_member_id_index');
            $table->dropIndexIfExists('memberships_end_date_index');
            $table->dropIndexIfExists('memberships_created_at_index');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndexIfExists('attendances_date_index');
            $table->dropIndexIfExists('attendances_member_id_index');
        });

        Schema::table('members', function (Blueprint $table) {
            $table->dropIndexIfExists('members_status_index');
            $table->dropIndexIfExists('members_created_at_index');
        });
    }

    /**
     * Check if an index already exists to prevent duplicate index errors.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = \DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = '{$indexName}'");
        return count($indexes) > 0;
    }
};

=== backend\database\migrations\2026_09_22_193611_add_plan_id_to_memberships_table.php ===
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            $table->unsignedBigInteger('plan_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table) {
            //
        });
    }
};

=== backend\database\seeders\DatabaseSeeder.php ===
<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Admin::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('admin123'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );
    }
}

=== backend\database\seeders\ExerciseSeeder.php ===
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercise;
use Illuminate\Support\Facades\File;

class ExerciseSeeder extends Seeder
{
    public function run()
    {
        // Points directly to your frontend dataset!
        $jsonPath = base_path('../frontend/public/dataset/data/exercises.json');

        if (!File::exists($jsonPath)) {
            $this->command->error("JSON file not found at: " . $jsonPath);
            return;
        }

        $json = File::get($jsonPath);
        $exercises = json_decode($json, true);

        // Handle variations in JSON structure
        if (isset($exercises['data'])) {
            $exercises = $exercises['data'];
        }

        $this->command->info('Importing ' . count($exercises) . ' exercises into MySQL...');

        foreach ($exercises as $ex) {
            // Pad the ID to ensure it matches the 4-digit GIF filenames (e.g., "1" becomes "0001")
            $exId = str_pad($ex['id'], 4, '0', STR_PAD_LEFT);
            
            Exercise::updateOrCreate(
                ['exercise_id' => $exId], // Prevents duplicates if you run it twice
                [
                    'name' => $ex['name'] ?? 'Unknown',
                    'category' => $ex['category'] ?? null,
                    'body_part' => $ex['body_part'] ?? null,
                    'equipment' => $ex['equipment'] ?? null,
                    'gif_path' => '/dataset/videos/' . $exId . '.gif', // The magic link!
                ]
            );
        }

        $this->command->info('Success! All 1,300+ exercises are now live in the database.');
    }
}

=== backend\resources\css\app.css ===
@import 'tailwindcss';

@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
@source '../../storage/framework/views/*.php';
@source '../**/*.blade.php';
@source '../**/*.js';

@theme {
    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
        'Segoe UI Symbol', 'Noto Color Emoji';
}

=== backend\resources\js\app.js ===
import './bootstrap';

=== backend\resources\js\bootstrap.js ===
import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

=== backend\resources\views\welcome.blade.php ===
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        <!-- Styles / Scripts -->
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <style>
                /*! tailwindcss v4.0.7 | MIT License | https://tailwindcss.com */@layer theme{:root,:host{--font-sans:'Instrument Sans',ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-serif:ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--color-red-50:oklch(.971 .013 17.38);--color-red-100:oklch(.936 .032 17.717);--color-red-200:oklch(.885 .062 18.334);--color-red-300:oklch(.808 .114 19.571);--color-red-400:oklch(.704 .191 22.216);--color-red-500:oklch(.637 .237 25.331);--color-red-600:oklch(.577 .245 27.325);--color-red-700:oklch(.505 .213 27.518);--color-red-800:oklch(.444 .177 26.899);--color-red-900:oklch(.396 .141 25.723);--color-red-950:oklch(.258 .092 26.042);--color-orange-50:oklch(.98 .016 73.684);--color-orange-100:oklch(.954 .038 75.164);--color-orange-200:oklch(.901 .076 70.697);--color-orange-300:oklch(.837 .128 66.29);--color-orange-400:oklch(.75 .183 55.934);--color-orange-500:oklch(.705 .213 47.604);--color-orange-600:oklch(.646 .222 41.116);--color-orange-700:oklch(.553 .195 38.402);--color-orange-800:oklch(.47 .157 37.304);--color-orange-900:oklch(.408 .123 38.172);--color-orange-950:oklch(.266 .079 36.259);--color-amber-50:oklch(.987 .022 95.277);--color-amber-100:oklch(.962 .059 95.617);--color-amber-200:oklch(.924 .12 95.746);--color-amber-300:oklch(.879 .169 91.605);--color-amber-400:oklch(.828 .189 84.429);--color-amber-500:oklch(.769 .188 70.08);--color-amber-600:oklch(.666 .179 58.318);--color-amber-700:oklch(.555 .163 48.998);--color-amber-800:oklch(.473 .137 46.201);--color-amber-900:oklch(.414 .112 45.904);--color-amber-950:oklch(.279 .077 45.635);--color-yellow-50:oklch(.987 .026 102.212);--color-yellow-100:oklch(.973 .071 103.193);--color-yellow-200:oklch(.945 .129 101.54);--color-yellow-300:oklch(.905 .182 98.111);--color-yellow-400:oklch(.852 .199 91.936);--color-yellow-500:oklch(.795 .184 86.047);--color-yellow-600:oklch(.681 .162 75.834);--color-yellow-700:oklch(.554 .135 66.442);--color-yellow-800:oklch(.476 .114 61.907);--color-yellow-900:oklch(.421 .095 57.708);--color-yellow-950:oklch(.286 .066 53.813);--color-lime-50:oklch(.986 .031 120.757);--color-lime-100:oklch(.967 .067 122.328);--color-lime-200:oklch(.938 .127 124.321);--color-lime-300:oklch(.897 .196 126.665);--color-lime-400:oklch(.841 .238 128.85);--color-lime-500:oklch(.768 .233 130.85);--color-lime-600:oklch(.648 .2 131.684);--color-lime-700:oklch(.532 .157 131.589);--color-lime-800:oklch(.453 .124 130.933);--color-lime-900:oklch(.405 .101 131.063);--color-lime-950:oklch(.274 .072 132.109);--color-green-50:oklch(.982 .018 155.826);--color-green-100:oklch(.962 .044 156.743);--color-green-200:oklch(.925 .084 155.995);--color-green-300:oklch(.871 .15 154.449);--color-green-400:oklch(.792 .209 151.711);--color-green-500:oklch(.723 .219 149.579);--color-green-600:oklch(.627 .194 149.214);--color-green-700:oklch(.527 .154 150.069);--color-green-800:oklch(.448 .119 151.328);--color-green-900:oklch(.393 .095 152.535);--color-green-950:oklch(.266 .065 152.934);--color-emerald-50:oklch(.979 .021 166.113);--color-emerald-100:oklch(.95 .052 163.051);--color-emerald-200:oklch(.905 .093 164.15);--color-emerald-300:oklch(.845 .143 164.978);--color-emerald-400:oklch(.765 .177 163.223);--color-emerald-500:oklch(.696 .17 162.48);--color-emerald-600:oklch(.596 .145 163.225);--color-emerald-700:oklch(.508 .118 165.612);--color-emerald-800:oklch(.432 .095 166.913);--color-emerald-900:oklch(.378 .077 168.94);--color-emerald-950:oklch(.262 .051 172.552);--color-teal-50:oklch(.984 .014 180.72);--color-teal-100:oklch(.953 .051 180.801);--color-teal-200:oklch(.91 .096 180.426);--color-teal-300:oklch(.855 .138 181.071);--color-teal-400:oklch(.777 .152 181.912);--color-teal-500:oklch(.704 .14 182.503);--color-teal-600:oklch(.6 .118 184.704);--color-teal-700:oklch(.511 .096 186.391);--color-teal-800:oklch(.437 .078 188.216);--color-teal-900:oklch(.386 .063 188.416);--color-teal-950:oklch(.277 .046 192.524);--color-cyan-50:oklch(.984 .019 200.873);--color-cyan-100:oklch(.956 .045 203.388);--color-cyan-200:oklch(.917 .08 205.041);--color-cyan-300:oklch(.865 .127 207.078);--color-cyan-400:oklch(.789 .154 211.53);--color-cyan-500:oklch(.715 .143 215.221);--color-cyan-600:oklch(.609 .126 221.723);--color-cyan-700:oklch(.52 .105 223.128);--color-cyan-800:oklch(.45 .085 224.283);--color-cyan-900:oklch(.398 .07 227.392);--color-cyan-950:oklch(.302 .056 229.695);--color-sky-50:oklch(.977 .013 236.62);--color-sky-100:oklch(.951 .026 236.824);--color-sky-200:oklch(.901 .058 230.902);--color-sky-300:oklch(.828 .111 230.318);--color-sky-400:oklch(.746 .16 232.661);--color-sky-500:oklch(.685 .169 237.323);--color-sky-600:oklch(.588 .158 241.966);--color-sky-700:oklch(.5 .134 242.749);--color-sky-800:oklch(.443 .11 240.79);--color-sky-900:oklch(.391 .09 240.876);--color-sky-950:oklch(.293 .066 243.157);--color-blue-50:oklch(.97 .014 254.604);--color-blue-100:oklch(.932 .032 255.585);--color-blue-200:oklch(.882 .059 254.128);--color-blue-300:oklch(.809 .105 251.813);--color-blue-400:oklch(.707 .165 254.624);--color-blue-500:oklch(.623 .214 259.815);--color-blue-600:oklch(.546 .245 262.881);--color-blue-700:oklch(.488 .243 264.376);--color-blue-800:oklch(.424 .199 265.638);--color-blue-900:oklch(.379 .146 265.522);--color-blue-950:oklch(.282 .091 267.935);--color-indigo-50:oklch(.962 .018 272.314);--color-indigo-100:oklch(.93 .034 272.788);--color-indigo-200:oklch(.87 .065 274.039);--color-indigo-300:oklch(.785 .115 274.713);--color-indigo-400:oklch(.673 .182 276.935);--color-indigo-500:oklch(.585 .233 277.117);--color-indigo-600:oklch(.511 .262 276.966);--color-indigo-700:oklch(.457 .24 277.023);--color-indigo-800:oklch(.398 .195 277.366);--color-indigo-900:oklch(.359 .144 278.697);--color-indigo-950:oklch(.257 .09 281.288);--color-violet-50:oklch(.969 .016 293.756);--color-violet-100:oklch(.943 .029 294.588);--color-violet-200:oklch(.894 .057 293.283);--color-violet-300:oklch(.811 .111 293.571);--color-violet-400:oklch(.702 .183 293.541);--color-violet-500:oklch(.606 .25 292.717);--color-violet-600:oklch(.541 .281 293.009);--color-violet-700:oklch(.491 .27 292.581);--color-violet-800:oklch(.432 .232 292.759);--color-violet-900:oklch(.38 .189 293.745);--color-violet-950:oklch(.283 .141 291.089);--color-purple-50:oklch(.977 .014 308.299);--color-purple-100:oklch(.946 .033 307.174);--color-purple-200:oklch(.902 .063 306.703);--color-purple-300:oklch(.827 .119 306.383);--color-purple-400:oklch(.714 .203 305.504);--color-purple-500:oklch(.627 .265 303.9);--color-purple-600:oklch(.558 .288 302.321);--color-purple-700:oklch(.496 .265 301.924);--color-purple-800:oklch(.438 .218 303.724);--color-purple-900:oklch(.381 .176 304.987);--color-purple-950:oklch(.291 .149 302.717);--color-fuchsia-50:oklch(.977 .017 320.058);--color-fuchsia-100:oklch(.952 .037 318.852);--color-fuchsia-200:oklch(.903 .076 319.62);--color-fuchsia-300:oklch(.833 .145 321.434);--color-fuchsia-400:oklch(.74 .238 322.16);--color-fuchsia-500:oklch(.667 .295 322.15);--color-fuchsia-600:oklch(.591 .293 322.896);--color-fuchsia-700:oklch(.518 .253 323.949);--color-fuchsia-800:oklch(.452 .211 324.591);--color-fuchsia-900:oklch(.401 .17 325.612);--color-fuchsia-950:oklch(.293 .136 325.661);--color-pink-50:oklch(.971 .014 343.198);--color-pink-100:oklch(.948 .028 342.258);--color-pink-200:oklch(.899 .061 343.231);--color-pink-300:oklch(.823 .12 346.018);--color-pink-400:oklch(.718 .202 349.761);--color-pink-500:oklch(.656 .241 354.308);--color-pink-600:oklch(.592 .249 .584);--color-pink-700:oklch(.525 .223 3.958);--color-pink-800:oklch(.459 .187 3.815);--color-pink-900:oklch(.408 .153 2.432);--color-pink-950:oklch(.284 .109 3.907);--color-rose-50:oklch(.969 .015 12.422);--color-rose-100:oklch(.941 .03 12.58);--color-rose-200:oklch(.892 .058 10.001);--color-rose-300:oklch(.81 .117 11.638);--color-rose-400:oklch(.712 .194 13.428);--color-rose-500:oklch(.645 .246 16.439);--color-rose-600:oklch(.586 .253 17.585);--color-rose-700:oklch(.514 .222 16.935);--color-rose-800:oklch(.455 .188 13.697);--color-rose-900:oklch(.41 .159 10.272);--color-rose-950:oklch(.271 .105 12.094);--color-slate-50:oklch(.984 .003 247.858);--color-slate-100:oklch(.968 .007 247.896);--color-slate-200:oklch(.929 .013 255.508);--color-slate-300:oklch(.869 .022 252.894);--color-slate-400:oklch(.704 .04 256.788);--color-slate-500:oklch(.554 .046 257.417);--color-slate-600:oklch(.446 .043 257.281);--color-slate-700:oklch(.372 .044 257.287);--color-slate-800:oklch(.279 .041 260.031);--color-slate-900:oklch(.208 .042 265.755);--color-slate-950:oklch(.129 .042 264.695);--color-gray-50:oklch(.985 .002 247.839);--color-gray-100:oklch(.967 .003 264.542);--color-gray-200:oklch(.928 .006 264.531);--color-gray-300:oklch(.872 .01 258.338);--color-gray-400:oklch(.707 .022 261.325);--color-gray-500:oklch(.551 .027 264.364);--color-gray-600:oklch(.446 .03 256.802);--color-gray-700:oklch(.373 .034 259.733);--color-gray-800:oklch(.278 .033 256.848);--color-gray-900:oklch(.21 .034 264.665);--color-gray-950:oklch(.13 .028 261.692);--color-zinc-50:oklch(.985 0 0);--color-zinc-100:oklch(.967 .001 286.375);--color-zinc-200:oklch(.92 .004 286.32);--color-zinc-300:oklch(.871 .006 286.286);--color-zinc-400:oklch(.705 .015 286.067);--color-zinc-500:oklch(.552 .016 285.938);--color-zinc-600:oklch(.442 .017 285.786);--color-zinc-700:oklch(.37 .013 285.805);--color-zinc-800:oklch(.274 .006 286.033);--color-zinc-900:oklch(.21 .006 285.885);--color-zinc-950:oklch(.141 .005 285.823);--color-neutral-50:oklch(.985 0 0);--color-neutral-100:oklch(.97 0 0);--color-neutral-200:oklch(.922 0 0);--color-neutral-300:oklch(.87 0 0);--color-neutral-400:oklch(.708 0 0);--color-neutral-500:oklch(.556 0 0);--color-neutral-600:oklch(.439 0 0);--color-neutral-700:oklch(.371 0 0);--color-neutral-800:oklch(.269 0 0);--color-neutral-900:oklch(.205 0 0);--color-neutral-950:oklch(.145 0 0);--color-stone-50:oklch(.985 .001 106.423);--color-stone-100:oklch(.97 .001 106.424);--color-stone-200:oklch(.923 .003 48.717);--color-stone-300:oklch(.869 .005 56.366);--color-stone-400:oklch(.709 .01 56.259);--color-stone-500:oklch(.553 .013 58.071);--color-stone-600:oklch(.444 .011 73.639);--color-stone-700:oklch(.374 .01 67.558);--color-stone-800:oklch(.268 .007 34.298);--color-stone-900:oklch(.216 .006 56.043);--color-stone-950:oklch(.147 .004 49.25);--color-black:#000;--color-white:#fff;--spacing:.25rem;--breakpoint-sm:40rem;--breakpoint-md:48rem;--breakpoint-lg:64rem;--breakpoint-xl:80rem;--breakpoint-2xl:96rem;--container-3xs:16rem;--container-2xs:18rem;--container-xs:20rem;--container-sm:24rem;--container-md:28rem;--container-lg:32rem;--container-xl:36rem;--container-2xl:42rem;--container-3xl:48rem;--container-4xl:56rem;--container-5xl:64rem;--container-6xl:72rem;--container-7xl:80rem;--text-xs:.75rem;--text-xs--line-height:calc(1/.75);--text-sm:.875rem;--text-sm--line-height:calc(1.25/.875);--text-base:1rem;--text-base--line-height: 1.5 ;--text-lg:1.125rem;--text-lg--line-height:calc(1.75/1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75/1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2/1.5);--text-3xl:1.875rem;--text-3xl--line-height: 1.2 ;--text-4xl:2.25rem;--text-4xl--line-height:calc(2.5/2.25);--text-5xl:3rem;--text-5xl--line-height:1;--text-6xl:3.75rem;--text-6xl--line-height:1;--text-7xl:4.5rem;--text-7xl--line-height:1;--text-8xl:6rem;--text-8xl--line-height:1;--text-9xl:8rem;--text-9xl--line-height:1;--font-weight-thin:100;--font-weight-extralight:200;--font-weight-light:300;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--font-weight-extrabold:800;--font-weight-black:900;--tracking-tighter:-.05em;--tracking-tight:-.025em;--tracking-normal:0em;--tracking-wide:.025em;--tracking-wider:.05em;--tracking-widest:.1em;--leading-tight:1.25;--leading-snug:1.375;--leading-normal:1.5;--leading-relaxed:1.625;--leading-loose:2;--radius-xs:.125rem;--radius-sm:.25rem;--radius-md:.375rem;--radius-lg:.5rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--radius-4xl:2rem;--shadow-2xs:0 1px #0000000d;--shadow-xs:0 1px 2px 0 #0000000d;--shadow-sm:0 1px 3px 0 #0000001a,0 1px 2px -1px #0000001a;--shadow-md:0 4px 6px -1px #0000001a,0 2px 4px -2px #0000001a;--shadow-lg:0 10px 15px -3px #0000001a,0 4px 6px -4px #0000001a;--shadow-xl:0 20px 25px -5px #0000001a,0 8px 10px -6px #0000001a;--shadow-2xl:0 25px 50px -12px #00000040;--inset-shadow-2xs:inset 0 1px #0000000d;--inset-shadow-xs:inset 0 1px 1px #0000000d;--inset-shadow-sm:inset 0 2px 4px #0000000d;--drop-shadow-xs:0 1px 1px #0000000d;--drop-shadow-sm:0 1px 2px #00000026;--drop-shadow-md:0 3px 3px #0000001f;--drop-shadow-lg:0 4px 4px #00000026;--drop-shadow-xl:0 9px 7px #0000001a;--drop-shadow-2xl:0 25px 25px #00000026;--ease-in:cubic-bezier(.4,0,1,1);--ease-out:cubic-bezier(0,0,.2,1);--ease-in-out:cubic-bezier(.4,0,.2,1);--animate-spin:spin 1s linear infinite;--animate-ping:ping 1s cubic-bezier(0,0,.2,1)infinite;--animate-pulse:pulse 2s cubic-bezier(.4,0,.6,1)infinite;--animate-bounce:bounce 1s infinite;--blur-xs:4px;--blur-sm:8px;--blur-md:12px;--blur-lg:16px;--blur-xl:24px;--blur-2xl:40px;--blur-3xl:64px;--perspective-dramatic:100px;--perspective-near:300px;--perspective-normal:500px;--perspective-midrange:800px;--perspective-distant:1200px;--aspect-video:16/9;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4,0,.2,1);--default-font-family:var(--font-sans);--default-font-feature-settings:var(--font-sans--font-feature-settings);--default-font-variation-settings:var(--font-sans--font-variation-settings);--default-mono-font-family:var(--font-mono);--default-mono-font-feature-settings:var(--font-mono--font-feature-settings);--default-mono-font-variation-settings:var(--font-mono--font-variation-settings)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}body{line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1;color:color-mix(in oklab,currentColor 50%,transparent)}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){-webkit-appearance:button;-moz-appearance:button;appearance:button}::file-selector-button{-webkit-appearance:button;-moz-appearance:button;appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}}@layer components;@layer utilities{.absolute{position:absolute}.relative{position:relative}.static{position:static}.inset-0{inset:calc(var(--spacing)*0)}.-mt-\[4\.9rem\]{margin-top:-4.9rem}.-mb-px{margin-bottom:-1px}.mb-1{margin-bottom:calc(var(--spacing)*1)}.mb-2{margin-bottom:calc(var(--spacing)*2)}.mb-4{margin-bottom:calc(var(--spacing)*4)}.mb-6{margin-bottom:calc(var(--spacing)*6)}.-ml-8{margin-left:calc(var(--spacing)*-8)}.flex{display:flex}.hidden{display:none}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.table{display:table}.aspect-\[335\/376\]{aspect-ratio:335/376}.h-1{height:calc(var(--spacing)*1)}.h-1\.5{height:calc(var(--spacing)*1.5)}.h-2{height:calc(var(--spacing)*2)}.h-2\.5{height:calc(var(--spacing)*2.5)}.h-3{height:calc(var(--spacing)*3)}.h-3\.5{height:calc(var(--spacing)*3.5)}.h-14{height:calc(var(--spacing)*14)}.h-14\.5{height:calc(var(--spacing)*14.5)}.min-h-screen{min-height:100vh}.w-1{width:calc(var(--spacing)*1)}.w-1\.5{width:calc(var(--spacing)*1.5)}.w-2{width:calc(var(--spacing)*2)}.w-2\.5{width:calc(var(--spacing)*2.5)}.w-3{width:calc(var(--spacing)*3)}.w-3\.5{width:calc(var(--spacing)*3.5)}.w-\[448px\]{width:448px}.w-full{width:100%}.max-w-\[335px\]{max-width:335px}.max-w-none{max-width:none}.flex-1{flex:1}.shrink-0{flex-shrink:0}.translate-y-0{--tw-translate-y:calc(var(--spacing)*0);translate:var(--tw-translate-x)var(--tw-translate-y)}.transform{transform:var(--tw-rotate-x)var(--tw-rotate-y)var(--tw-rotate-z)var(--tw-skew-x)var(--tw-skew-y)}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.items-center{align-items:center}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.gap-3{gap:calc(var(--spacing)*3)}.gap-4{gap:calc(var(--spacing)*4)}:where(.space-x-1>:not(:last-child)){--tw-space-x-reverse:0;margin-inline-start:calc(calc(var(--spacing)*1)*var(--tw-space-x-reverse));margin-inline-end:calc(calc(var(--spacing)*1)*calc(1 - var(--tw-space-x-reverse)))}.overflow-hidden{overflow:hidden}.rounded-full{border-radius:3.40282e38px}.rounded-sm{border-radius:var(--radius-sm)}.rounded-t-lg{border-top-left-radius:var(--radius-lg);border-top-right-radius:var(--radius-lg)}.rounded-br-lg{border-bottom-right-radius:var(--radius-lg)}.rounded-bl-lg{border-bottom-left-radius:var(--radius-lg)}.border{border-style:var(--tw-border-style);border-width:1px}.border-\[\#19140035\]{border-color:#19140035}.border-\[\#e3e3e0\]{border-color:#e3e3e0}.border-black{border-color:var(--color-black)}.border-transparent{border-color:#0000}.bg-\[\#1b1b18\]{background-color:#1b1b18}.bg-\[\#FDFDFC\]{background-color:#fdfdfc}.bg-\[\#dbdbd7\]{background-color:#dbdbd7}.bg-\[\#fff2f2\]{background-color:#fff2f2}.bg-white{background-color:var(--color-white)}.p-6{padding:calc(var(--spacing)*6)}.px-5{padding-inline:calc(var(--spacing)*5)}.py-1{padding-block:calc(var(--spacing)*1)}.py-1\.5{padding-block:calc(var(--spacing)*1.5)}.py-2{padding-block:calc(var(--spacing)*2)}.pb-12{padding-bottom:calc(var(--spacing)*12)}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-\[13px\]{font-size:13px}.leading-\[20px\]{--tw-leading:20px;line-height:20px}.leading-normal{--tw-leading:var(--leading-normal);line-height:var(--leading-normal)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.text-\[\#1b1b18\]{color:#1b1b18}.text-\[\#706f6c\]{color:#706f6c}.text-\[\#F53003\],.text-\[\#f53003\]{color:#f53003}.text-white{color:var(--color-white)}.underline{text-decoration-line:underline}.underline-offset-4{text-underline-offset:4px}.opacity-100{opacity:1}.shadow-\[0px_0px_1px_0px_rgba\(0\,0\,0\,0\.03\)\,0px_1px_2px_0px_rgba\(0\,0\,0\,0\.06\)\]{--tw-shadow:0px 0px 1px 0px var(--tw-shadow-color,#00000008),0px 1px 2px 0px var(--tw-shadow-color,#0000000f);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\[inset_0px_0px_0px_1px_rgba\(26\,26\,0\,0\.16\)\]{--tw-shadow:inset 0px 0px 0px 1px var(--tw-shadow-color,#1a1a0029);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.\!filter{filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)!important}.filter{filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.delay-300{transition-delay:.3s}.duration-750{--tw-duration:.75s;transition-duration:.75s}.not-has-\[nav\]\:hidden:not(:has(:is(nav))){display:none}.before\:absolute:before{content:var(--tw-content);position:absolute}.before\:top-0:before{content:var(--tw-content);top:calc(var(--spacing)*0)}.before\:top-1\/2:before{content:var(--tw-content);top:50%}.before\:bottom-0:before{content:var(--tw-content);bottom:calc(var(--spacing)*0)}.before\:bottom-1\/2:before{content:var(--tw-content);bottom:50%}.before\:left-\[0\.4rem\]:before{content:var(--tw-content);left:.4rem}.before\:border-l:before{content:var(--tw-content);border-left-style:var(--tw-border-style);border-left-width:1px}.before\:border-\[\#e3e3e0\]:before{content:var(--tw-content);border-color:#e3e3e0}@media (hover:hover){.hover\:border-\[\#1915014a\]:hover{border-color:#1915014a}.hover\:border-\[\#19140035\]:hover{border-color:#19140035}.hover\:border-black:hover{border-color:var(--color-black)}.hover\:bg-black:hover{background-color:var(--color-black)}}@media (width>=64rem){.lg\:-mt-\[6\.6rem\]{margin-top:-6.6rem}.lg\:mb-0{margin-bottom:calc(var(--spacing)*0)}.lg\:mb-6{margin-bottom:calc(var(--spacing)*6)}.lg\:-ml-px{margin-left:-1px}.lg\:ml-0{margin-left:calc(var(--spacing)*0)}.lg\:block{display:block}.lg\:aspect-auto{aspect-ratio:auto}.lg\:w-\[438px\]{width:438px}.lg\:max-w-4xl{max-width:var(--container-4xl)}.lg\:grow{flex-grow:1}.lg\:flex-row{flex-direction:row}.lg\:justify-center{justify-content:center}.lg\:rounded-t-none{border-top-left-radius:0;border-top-right-radius:0}.lg\:rounded-tl-lg{border-top-left-radius:var(--radius-lg)}.lg\:rounded-r-lg{border-top-right-radius:var(--radius-lg);border-bottom-right-radius:var(--radius-lg)}.lg\:rounded-br-none{border-bottom-right-radius:0}.lg\:p-8{padding:calc(var(--spacing)*8)}.lg\:p-20{padding:calc(var(--spacing)*20)}}@media (prefers-color-scheme:dark){.dark\:block{display:block}.dark\:hidden{display:none}.dark\:border-\[\#3E3E3A\]{border-color:#3e3e3a}.dark\:border-\[\#eeeeec\]{border-color:#eeeeec}.dark\:bg-\[\#0a0a0a\]{background-color:#0a0a0a}.dark\:bg-\[\#1D0002\]{background-color:#1d0002}.dark\:bg-\[\#3E3E3A\]{background-color:#3e3e3a}.dark\:bg-\[\#161615\]{background-color:#161615}.dark\:bg-\[\#eeeeec\]{background-color:#eeeeec}.dark\:text-\[\#1C1C1A\]{color:#1c1c1a}.dark\:text-\[\#A1A09A\]{color:#a1a09a}.dark\:text-\[\#EDEDEC\]{color:#ededec}.dark\:text-\[\#F61500\]{color:#f61500}.dark\:text-\[\#FF4433\]{color:#f43}.dark\:shadow-\[inset_0px_0px_0px_1px_\#fffaed2d\]{--tw-shadow:inset 0px 0px 0px 1px var(--tw-shadow-color,#fffaed2d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.dark\:before\:border-\[\#3E3E3A\]:before{content:var(--tw-content);border-color:#3e3e3a}@media (hover:hover){.dark\:hover\:border-\[\#3E3E3A\]:hover{border-color:#3e3e3a}.dark\:hover\:border-\[\#62605b\]:hover{border-color:#62605b}.dark\:hover\:border-white:hover{border-color:var(--color-white)}.dark\:hover\:bg-white:hover{background-color:var(--color-white)}}}@starting-style{.starting\:translate-y-4{--tw-translate-y:calc(var(--spacing)*4);translate:var(--tw-translate-x)var(--tw-translate-y)}}@starting-style{.starting\:translate-y-6{--tw-translate-y:calc(var(--spacing)*6);translate:var(--tw-translate-x)var(--tw-translate-y)}}@starting-style{.starting\:opacity-0{opacity:0}}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}@keyframes pulse{50%{opacity:.5}}@keyframes bounce{0%,to{animation-timing-function:cubic-bezier(.8,0,1,1);transform:translateY(-25%)}50%{animation-timing-function:cubic-bezier(0,0,.2,1);transform:none}}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-rotate-x{syntax:"*";inherits:false;initial-value:rotateX(0)}@property --tw-rotate-y{syntax:"*";inherits:false;initial-value:rotateY(0)}@property --tw-rotate-z{syntax:"*";inherits:false;initial-value:rotateZ(0)}@property --tw-skew-x{syntax:"*";inherits:false;initial-value:skewX(0)}@property --tw-skew-y{syntax:"*";inherits:false;initial-value:skewY(0)}@property --tw-space-x-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-leading{syntax:"*";inherits:false}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@property --tw-content{syntax:"*";inherits:false;initial-value:""}
            </style>
        @endif
    </head>
    <body class="bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] flex p-6 lg:p-8 items-center lg:justify-center min-h-screen flex-col">
        <header class="w-full lg:max-w-4xl max-w-[335px] text-sm mb-6 not-has-[nav]:hidden">
            @if (Route::has('login'))
                <nav class="flex items-center justify-end gap-4">
                    @auth
                        <a
                            href="{{ url('/dashboard') }}"
                            class="inline-block px-5 py-1.5 dark:text-[#EDEDEC] border-[#19140035] hover:border-[#1915014a] border text-[#1b1b18] dark:border-[#3E3E3A] dark:hover:border-[#62605b] rounded-sm text-sm leading-normal"
                        >
                            Dashboard
                        </a>
                    @else
                        <a
                            href="{{ route('login') }}"
                            class="inline-block px-5 py-1.5 dark:text-[#EDEDEC] text-[#1b1b18] border border-transparent hover:border-[#19140035] dark:hover:border-[#3E3E3A] rounded-sm text-sm leading-normal"
                        >
                            Log in
                        </a>

                        @if (Route::has('register'))
                            <a
                                href="{{ route('register') }}"
                                class="inline-block px-5 py-1.5 dark:text-[#EDEDEC] border-[#19140035] hover:border-[#1915014a] border text-[#1b1b18] dark:border-[#3E3E3A] dark:hover:border-[#62605b] rounded-sm text-sm leading-normal">
                                Register
                            </a>
                        @endif
                    @endauth
                </nav>
            @endif
        </header>
        <div class="flex items-center justify-center w-full transition-opacity opacity-100 duration-750 lg:grow starting:opacity-0">
            <main class="flex max-w-[335px] w-full flex-col-reverse lg:max-w-4xl lg:flex-row">
                <div class="text-[13px] leading-[20px] flex-1 p-6 pb-12 lg:p-20 bg-white dark:bg-[#161615] dark:text-[#EDEDEC] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d] rounded-bl-lg rounded-br-lg lg:rounded-tl-lg lg:rounded-br-none">
                    <h1 class="mb-1 font-medium">Let's get started</h1>
                    <p class="mb-2 text-[#706f6c] dark:text-[#A1A09A]">Laravel has an incredibly rich ecosystem. <br>We suggest starting with the following.</p>
                    <ul class="flex flex-col mb-4 lg:mb-6">
                        <li class="flex items-center gap-4 py-2 relative before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A] before:top-1/2 before:bottom-0 before:left-[0.4rem] before:absolute">
                            <span class="relative py-1 bg-white dark:bg-[#161615]">
                                <span class="flex items-center justify-center rounded-full bg-[#FDFDFC] dark:bg-[#161615] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] w-3.5 h-3.5 border dark:border-[#3E3E3A] border-[#e3e3e0]">
                                    <span class="rounded-full bg-[#dbdbd7] dark:bg-[#3E3E3A] w-1.5 h-1.5"></span>
                                </span>
                            </span>
                            <span>
                                Read the
                                <a href="https://laravel.com/docs" target="_blank" class="inline-flex items-center space-x-1 font-medium underline underline-offset-4 text-[#f53003] dark:text-[#FF4433] ml-1">
                                    <span>Documentation</span>
                                    <svg
                                        width="10"
                                        height="11"
                                        viewBox="0 0 10 11"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-2.5 h-2.5"
                                    >
                                        <path
                                            d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                                            stroke="currentColor"
                                            stroke-linecap="square"
                                        />
                                    </svg>
                                </a>
                            </span>
                        </li>
                        <li class="flex items-center gap-4 py-2 relative before:border-l before:border-[#e3e3e0] dark:before:border-[#3E3E3A] before:bottom-1/2 before:top-0 before:left-[0.4rem] before:absolute">
                            <span class="relative py-1 bg-white dark:bg-[#161615]">
                                <span class="flex items-center justify-center rounded-full bg-[#FDFDFC] dark:bg-[#161615] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.03),0px_1px_2px_0px_rgba(0,0,0,0.06)] w-3.5 h-3.5 border dark:border-[#3E3E3A] border-[#e3e3e0]">
                                    <span class="rounded-full bg-[#dbdbd7] dark:bg-[#3E3E3A] w-1.5 h-1.5"></span>
                                </span>
                            </span>
                            <span>
                                Watch video tutorials at
                                <a href="https://laracasts.com" target="_blank" class="inline-flex items-center space-x-1 font-medium underline underline-offset-4 text-[#f53003] dark:text-[#FF4433] ml-1">
                                    <span>Laracasts</span>
                                    <svg
                                        width="10"
                                        height="11"
                                        viewBox="0 0 10 11"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="w-2.5 h-2.5"
                                    >
                                        <path
                                            d="M7.70833 6.95834V2.79167H3.54167M2.5 8L7.5 3.00001"
                                            stroke="currentColor"
                                            stroke-linecap="square"
                                        />
                                    </svg>
                                </a>
                            </span>
                        </li>
                    </ul>
                    <ul class="flex gap-3 text-sm leading-normal">
                        <li>
                            <a href="https://cloud.laravel.com" target="_blank" class="inline-block dark:bg-[#eeeeec] dark:border-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-white dark:hover:border-white hover:bg-black hover:border-black px-5 py-1.5 bg-[#1b1b18] rounded-sm border border-black text-white text-sm leading-normal">
                                Deploy now
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="bg-[#fff2f2] dark:bg-[#1D0002] relative lg:-ml-px -mb-px lg:mb-0 rounded-t-lg lg:rounded-t-none lg:rounded-r-lg aspect-[335/376] lg:aspect-auto w-full lg:w-[438px] shrink-0 overflow-hidden">
                    {{-- Laravel Logo --}}
                    <svg class="w-full text-[#F53003] dark:text-[#F61500] transition-all translate-y-0 opacity-100 max-w-none duration-750 starting:opacity-0 starting:translate-y-6" viewBox="0 0 438 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.2036 -3H0V102.197H49.5189V86.7187H17.2036V-3Z" fill="currentColor" />
                        <path d="M110.256 41.6337C108.061 38.1275 104.945 35.3731 100.905 33.3681C96.8667 31.3647 92.8016 30.3618 88.7131 30.3618C83.4247 30.3618 78.5885 31.3389 74.201 33.2923C69.8111 35.2456 66.0474 37.928 62.9059 41.3333C59.7643 44.7401 57.3198 48.6726 55.5754 53.1293C53.8287 57.589 52.9572 62.274 52.9572 67.1813C52.9572 72.1925 53.8287 76.8995 55.5754 81.3069C57.3191 85.7173 59.7636 89.6241 62.9059 93.0293C66.0474 96.4361 69.8119 99.1155 74.201 101.069C78.5885 103.022 83.4247 103.999 88.7131 103.999C92.8016 103.999 96.8667 102.997 100.905 100.994C104.945 98.9911 108.061 96.2359 110.256 92.7282V102.195H126.563V32.1642H110.256V41.6337ZM108.76 75.7472C107.762 78.4531 106.366 80.8078 104.572 82.8112C102.776 84.8161 100.606 86.4183 98.0637 87.6206C95.5202 88.823 92.7004 89.4238 89.6103 89.4238C86.5178 89.4238 83.7252 88.823 81.2324 87.6206C78.7388 86.4183 76.5949 84.8161 74.7998 82.8112C73.004 80.8078 71.6319 78.4531 70.6856 75.7472C69.7356 73.0421 69.2644 70.1868 69.2644 67.1821C69.2644 64.1758 69.7356 61.3205 70.6856 58.6154C71.6319 55.9102 73.004 53.5571 74.7998 51.5522C76.5949 49.5495 78.738 47.9451 81.2324 46.7427C83.7252 45.5404 86.5178 44.9396 89.6103 44.9396C92.7012 44.9396 95.5202 45.5404 98.0637 46.7427C100.606 47.9451 102.776 49.5487 104.572 51.5522C106.367 53.5571 107.762 55.9102 108.76 58.6154C109.756 61.3205 110.256 64.1758 110.256 67.1821C110.256 70.1868 109.756 73.0421 108.76 75.7472Z" fill="currentColor" />
                        <path d="M242.805 41.6337C240.611 38.1275 237.494 35.3731 233.455 33.3681C229.416 31.3647 225.351 30.3618 221.262 30.3618C215.974 30.3618 211.138 31.3389 206.75 33.2923C202.36 35.2456 198.597 37.928 195.455 41.3333C192.314 44.7401 189.869 48.6726 188.125 53.1293C186.378 57.589 185.507 62.274 185.507 67.1813C185.507 72.1925 186.378 76.8995 188.125 81.3069C189.868 85.7173 192.313 89.6241 195.455 93.0293C198.597 96.4361 202.361 99.1155 206.75 101.069C211.138 103.022 215.974 103.999 221.262 103.999C225.351 103.999 229.416 102.997 233.455 100.994C237.494 98.9911 240.611 96.2359 242.805 92.7282V102.195H259.112V32.1642H242.805V41.6337ZM241.31 75.7472C240.312 78.4531 238.916 80.8078 237.122 82.8112C235.326 84.8161 233.156 86.4183 230.614 87.6206C228.07 88.823 225.251 89.4238 222.16 89.4238C219.068 89.4238 216.275 88.823 213.782 87.6206C211.289 86.4183 209.145 84.8161 207.35 82.8112C205.554 80.8078 204.182 78.4531 203.236 75.7472C202.286 73.0421 201.814 70.1868 201.814 67.1821C201.814 64.1758 202.286 61.3205 203.236 58.6154C204.182 55.9102 205.554 53.5571 207.35 51.5522C209.145 49.5495 211.288 47.9451 213.782 46.7427C216.275 45.5404 219.068 44.9396 222.16 44.9396C225.251 44.9396 228.07 45.5404 230.614 46.7427C233.156 47.9451 235.326 49.5487 237.122 51.5522C238.917 53.5571 240.312 55.9102 241.31 58.6154C242.306 61.3205 242.806 64.1758 242.806 67.1821C242.805 70.1868 242.305 73.0421 241.31 75.7472Z" fill="currentColor" />
                        <path d="M438 -3H421.694V102.197H438V-3Z" fill="currentColor" />
                        <path d="M139.43 102.197H155.735V48.2834H183.712V32.1665H139.43V102.197Z" fill="currentColor" />
                        <path d="M324.49 32.1665L303.995 85.794L283.498 32.1665H266.983L293.748 102.197H314.242L341.006 32.1665H324.49Z" fill="currentColor" />
                        <path d="M376.571 30.3656C356.603 30.3656 340.797 46.8497 340.797 67.1828C340.797 89.6597 356.094 104 378.661 104C391.29 104 399.354 99.1488 409.206 88.5848L398.189 80.0226C398.183 80.031 389.874 90.9895 377.468 90.9895C363.048 90.9895 356.977 79.3111 356.977 73.269H411.075C413.917 50.1328 398.775 30.3656 376.571 30.3656ZM357.02 61.0967C357.145 59.7487 359.023 43.3761 376.442 43.3761C393.861 43.3761 395.978 59.7464 396.099 61.0967H357.02Z" fill="currentColor" />
                    </svg>

                    {{-- Light Mode 12 SVG --}}
                    <svg class="w-[448px] max-w-none relative -mt-[4.9rem] -ml-8 lg:ml-0 lg:-mt-[6.6rem] dark:hidden" viewBox="0 0 440 376" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z" fill="black" />
                            <path d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z" fill="black" />
                            <path d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z" stroke="#1B1B18" stroke-width="1" />
                            <path d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z" stroke="#1B1B18" stroke-width="1" />
                            <path d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z" fill="#F8B803" />
                            <path d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z" fill="#F8B803" />
                            <path d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z" stroke="#1B1B18" stroke-width="1" />
                            <path d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z" stroke="#1B1B18" stroke-width="1" />
                        </g>
                        <g style="mix-blend-mode: hard-light" class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z" fill="#F0ACB8" />
                            <path d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z" fill="#F0ACB8" />
                            <path d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z" stroke="#1B1B18" stroke-width="1" />
                            <path d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z" stroke="#1B1B18" stroke-width="1" />
                        </g>
                        <g style="mix-blend-mode: plus-darker" class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M230.951 281.792L231.282 281.793C238.128 274.907 248.453 265.823 262.256 254.539C275.617 243.256 285.666 234.267 292.402 227.573C299.027 220.688 303.554 213.421 305.983 205.771C308.412 198.12 307.253 190.183 302.504 181.959C297.203 172.778 289.749 165.415 280.142 159.868C270.645 154.13 260.596 151.26 249.995 151.26C239.615 151.26 232.823 154.033 229.621 159.579C226.309 164.934 227.413 172.393 232.935 181.956L168.335 181.954C159.058 165.888 155.082 151.543 156.407 138.92C157.953 126.298 164.247 116.544 175.289 109.659C186.442 102.583 201.294 99.045 219.846 99.0457C239.281 99.0464 258.551 102.585 277.655 109.663C296.649 116.549 313.986 126.303 329.667 138.927C345.349 151.551 357.827 165.895 367.104 181.961C375.718 196.88 379.528 209.981 378.535 221.265C377.762 232.549 374.063 242.399 367.438 250.814C361.033 259.229 351.095 269.557 337.624 281.796L419.782 281.8L448.605 331.719L259.774 331.712L230.951 281.792Z" fill="#F3BEC7" />
                            <path d="M51.8063 152.402L28.9479 152.401L-0.0411453 102.195L85.7608 102.198L218.282 331.711L155.339 331.709L51.8063 152.402Z" fill="#F3BEC7" />
                            <path d="M230.951 281.792L231.282 281.793C238.128 274.907 248.453 265.823 262.256 254.539C275.617 243.256 285.666 234.267 292.402 227.573C299.027 220.688 303.554 213.421 305.983 205.771C308.412 198.12 307.253 190.183 302.504 181.959C297.203 172.778 289.749 165.415 280.142 159.868C270.645 154.13 260.596 151.26 249.995 151.26C239.615 151.26 232.823 154.033 229.621 159.579C226.309 164.934 227.413 172.393 232.935 181.956L168.335 181.954C159.058 165.888 155.082 151.543 156.407 138.92C157.953 126.298 164.247 116.544 175.289 109.659C186.442 102.583 201.294 99.045 219.846 99.0457C239.281 99.0464 258.551 102.585 277.655 109.663C296.649 116.549 313.986 126.303 329.667 138.927C345.349 151.551 357.827 165.895 367.104 181.961C375.718 196.88 379.528 209.981 378.535 221.265C377.762 232.549 374.063 242.399 367.438 250.814C361.033 259.229 351.095 269.557 337.624 281.796L419.782 281.8L448.605 331.719L259.774 331.712L230.951 281.792Z" stroke="#1B1B18" stroke-width="1" />
                            <path d="M51.8063 152.402L28.9479 152.401L-0.0411453 102.195L85.7608 102.198L218.282 331.711L155.339 331.709L51.8063 152.402Z" stroke="#1B1B18" stroke-width="1" />
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M188.467 355.363L188.798 355.363C195.644 348.478 205.969 339.393 219.772 328.11C233.133 316.826 243.181 307.837 249.917 301.144C253.696 297.217 256.792 293.166 259.205 288.991C261.024 285.845 262.455 282.628 263.499 279.341C265.928 271.691 264.768 263.753 260.02 255.529C254.719 246.349 247.265 238.985 237.657 233.438C228.16 227.7 218.111 224.831 207.51 224.83C197.13 224.83 190.339 227.603 187.137 233.149C183.824 238.504 184.929 245.963 190.45 255.527L125.851 255.524C116.574 239.458 112.598 225.114 113.923 212.491C114.615 206.836 116.261 201.756 118.859 197.253C122.061 191.704 126.709 187.03 132.805 183.229C143.958 176.153 158.81 172.615 177.362 172.616C196.797 172.617 216.067 176.156 235.171 183.233C254.164 190.119 271.502 199.874 287.183 212.497C302.864 225.121 315.343 239.466 324.62 255.532C333.233 270.45 337.044 283.551 336.05 294.835C335.46 303.459 333.16 311.245 329.151 318.194C327.915 320.337 326.515 322.4 324.953 324.384C318.549 332.799 308.611 343.127 295.139 355.367L377.297 355.37L406.121 405.289L217.29 405.282L188.467 355.363Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M9.32197 225.972L-13.5365 225.971L-42.5255 175.765L43.2765 175.768L175.798 405.282L112.854 405.279L9.32197 225.972Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M345.247 111.915C329.566 99.2919 312.229 89.5371 293.235 82.6512L235.167 183.228C254.161 190.114 271.498 199.869 287.179 212.492L345.247 111.915Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M382.686 154.964C373.41 138.898 360.931 124.553 345.25 111.93L287.182 212.506C302.863 225.13 315.342 239.475 324.618 255.541L382.686 154.964Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M293.243 82.6472C274.139 75.57 254.869 72.031 235.434 72.0303L177.366 172.607C196.801 172.608 216.071 176.147 235.175 183.224L293.243 82.6472Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M394.118 194.257C395.112 182.973 391.301 169.872 382.688 154.953L324.619 255.53C333.233 270.448 337.044 283.55 336.05 294.834L394.118 194.257Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M235.432 72.0311C216.88 72.0304 202.027 75.5681 190.875 82.6442L132.806 183.221C143.959 176.145 158.812 172.607 177.363 172.608L235.432 72.0311Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M265.59 124.25C276.191 124.251 286.24 127.12 295.737 132.858L237.669 233.435C228.172 227.697 218.123 224.828 207.522 224.827L265.59 124.25Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M295.719 132.859C305.326 138.406 312.78 145.77 318.081 154.95L260.013 255.527C254.712 246.347 247.258 238.983 237.651 233.436L295.719 132.859Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M387.218 217.608C391.227 210.66 393.527 202.874 394.117 194.25L336.049 294.827C335.459 303.451 333.159 311.237 329.15 318.185L387.218 217.608Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M245.211 132.577C248.413 127.03 255.204 124.257 265.584 124.258L207.516 224.835C197.136 224.834 190.345 227.607 187.143 233.154L245.211 132.577Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M318.094 154.945C322.842 163.17 324.002 171.107 321.573 178.757L263.505 279.334C265.934 271.684 264.774 263.746 260.026 255.522L318.094 154.945Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M176.925 96.6737C180.127 91.1249 184.776 86.4503 190.871 82.6499L132.803 183.227C126.708 187.027 122.059 191.702 118.857 197.25L176.925 96.6737Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M387.226 217.606C385.989 219.749 384.59 221.813 383.028 223.797L324.96 324.373C326.522 322.39 327.921 320.326 329.157 318.183L387.226 217.606Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M317.269 188.408C319.087 185.262 320.519 182.045 321.562 178.758L263.494 279.335C262.451 282.622 261.019 285.839 259.201 288.985L317.269 188.408Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M245.208 132.573C241.895 137.928 243 145.387 248.522 154.95L190.454 255.527C184.932 245.964 183.827 238.505 187.14 233.15L245.208 132.573Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M176.93 96.6719C174.331 101.175 172.686 106.255 171.993 111.91L113.925 212.487C114.618 206.831 116.263 201.752 118.862 197.249L176.93 96.6719Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M317.266 188.413C314.853 192.589 311.757 196.64 307.978 200.566L249.91 301.143C253.689 297.216 256.785 293.166 259.198 288.99L317.266 188.413Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M464.198 304.708L435.375 254.789L377.307 355.366L406.13 405.285L464.198 304.708Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M353.209 254.787C366.68 242.548 376.618 232.22 383.023 223.805L324.955 324.382C318.55 332.797 308.612 343.124 295.141 355.364L353.209 254.787Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M435.37 254.787L353.212 254.784L295.144 355.361L377.302 355.364L435.37 254.787Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M183.921 154.947L248.521 154.95L190.453 255.527L125.853 255.524L183.921 154.947Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M171.992 111.914C170.668 124.537 174.643 138.881 183.92 154.947L125.852 255.524C116.575 239.458 112.599 225.114 113.924 212.491L171.992 111.914Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M307.987 200.562C301.251 207.256 291.203 216.244 277.842 227.528L219.774 328.105C233.135 316.821 243.183 307.832 249.919 301.139L307.987 200.562Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M15.5469 75.1797L44.5359 125.386L-13.5321 225.963L-42.5212 175.756L15.5469 75.1797Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M277.836 227.536C264.033 238.82 253.708 247.904 246.862 254.789L188.794 355.366C195.64 348.481 205.965 339.397 219.768 328.113L277.836 227.536Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M275.358 304.706L464.189 304.713L406.12 405.29L217.29 405.283L275.358 304.706Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M44.5279 125.39L67.3864 125.39L9.31834 225.967L-13.5401 225.966L44.5279 125.39Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M101.341 75.1911L233.863 304.705L175.795 405.282L43.2733 175.768L101.341 75.1911ZM15.5431 75.19L-42.525 175.767L43.277 175.77L101.345 75.1932L15.5431 75.19Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M246.866 254.784L246.534 254.784L188.466 355.361L188.798 355.361L246.866 254.784Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M246.539 254.781L275.362 304.701L217.294 405.277L188.471 355.358L246.539 254.781Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M67.3906 125.391L170.923 304.698L112.855 405.275L9.32257 225.967L67.3906 125.391Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                            <path d="M170.921 304.699L233.865 304.701L175.797 405.278L112.853 405.276L170.921 304.699Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="bevel" />
                        </g>
                        <g style="mix-blend-mode: hard-light" class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z" fill="#F0ACB8" />
                            <path d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z" stroke="#1B1B18" stroke-width="1" stroke-linejoin="round" />
                        </g>
                        <g style="mix-blend-mode: hard-light" class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z" fill="#F0ACB8" />
                            <path d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z" stroke="#1B1B18" stroke-width="1" />
                        </g>
                    </svg>

                    {{-- Dark Mode 12 SVG --}}
                    <svg class="w-[448px] max-w-none relative -mt-[4.9rem] -ml-8 lg:ml-0 lg:-mt-[6.6rem] hidden dark:block" viewBox="0 0 440 376" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z" fill="black"/>
                            <path d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z" fill="black"/>
                            <path d="M188.263 355.73L188.595 355.73C195.441 348.845 205.766 339.761 219.569 328.477C232.93 317.193 242.978 308.205 249.714 301.511C256.34 294.626 260.867 287.358 263.296 279.708C265.725 272.058 264.565 264.121 259.816 255.896C254.516 246.716 247.062 239.352 237.454 233.805C227.957 228.067 217.908 225.198 207.307 225.198C196.927 225.197 190.136 227.97 186.934 233.516C183.621 238.872 184.726 246.331 190.247 255.894L125.647 255.891C116.371 239.825 112.395 225.481 113.72 212.858C115.265 200.235 121.559 190.481 132.602 183.596C143.754 176.52 158.607 172.982 177.159 172.983C196.594 172.984 215.863 176.523 234.968 183.6C253.961 190.486 271.299 200.241 286.98 212.864C302.661 225.488 315.14 239.833 324.416 255.899C333.03 270.817 336.841 283.918 335.847 295.203C335.075 306.487 331.376 316.336 324.75 324.751C318.346 333.167 308.408 343.494 294.936 355.734L377.094 355.737L405.917 405.656L217.087 405.649L188.263 355.73Z" stroke="#FF750F" stroke-width="1"/>
                            <path d="M9.11884 226.339L-13.7396 226.338L-42.7286 176.132L43.0733 176.135L175.595 405.649L112.651 405.647L9.11884 226.339Z" stroke="#FF750F" stroke-width="1"/>
                            <path d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z" fill="#391800"/>
                            <path d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z" fill="#391800"/>
                            <path d="M204.592 327.449L204.923 327.449C211.769 320.564 222.094 311.479 235.897 300.196C249.258 288.912 259.306 279.923 266.042 273.23C272.668 266.345 277.195 259.077 279.624 251.427C282.053 243.777 280.893 235.839 276.145 227.615C270.844 218.435 263.39 211.071 253.782 205.524C244.285 199.786 234.236 196.917 223.635 196.916C213.255 196.916 206.464 199.689 203.262 205.235C199.949 210.59 201.054 218.049 206.575 227.612L141.975 227.61C132.699 211.544 128.723 197.2 130.048 184.577C131.593 171.954 137.887 162.2 148.93 155.315C160.083 148.239 174.935 144.701 193.487 144.702C212.922 144.703 232.192 148.242 251.296 155.319C270.289 162.205 287.627 171.96 303.308 184.583C318.989 197.207 331.468 211.552 340.745 227.618C349.358 242.536 353.169 255.637 352.175 266.921C351.403 278.205 347.704 288.055 341.078 296.47C334.674 304.885 324.736 315.213 311.264 327.453L393.422 327.456L422.246 377.375L233.415 377.368L204.592 327.449Z" stroke="#FF750F" stroke-width="1"/>
                            <path d="M25.447 198.058L2.58852 198.057L-26.4005 147.851L59.4015 147.854L191.923 377.368L128.979 377.365L25.447 198.058Z" stroke="#FF750F" stroke-width="1"/>
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4" style="mix-blend-mode:hard-light">
                            <path d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z" fill="#733000"/>
                            <path d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z" fill="#733000"/>
                            <path d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.725 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z" stroke="#FF750F" stroke-width="1"/>
                            <path d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z" stroke="#FF750F" stroke-width="1"/>
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M217.342 305.363L217.673 305.363C224.519 298.478 234.844 289.393 248.647 278.11C262.008 266.826 272.056 257.837 278.792 251.144C285.418 244.259 289.945 236.991 292.374 229.341C294.803 221.691 293.643 213.753 288.895 205.529C283.594 196.349 276.14 188.985 266.532 183.438C257.035 177.7 246.986 174.831 236.385 174.83C226.005 174.83 219.214 177.603 216.012 183.149C212.699 188.504 213.804 195.963 219.325 205.527L154.726 205.524C145.449 189.458 141.473 175.114 142.798 162.491C144.343 149.868 150.637 140.114 161.68 133.229C172.833 126.153 187.685 122.615 206.237 122.616C225.672 122.617 244.942 126.156 264.046 133.233C283.039 140.119 300.377 149.874 316.058 162.497C331.739 175.121 344.218 189.466 353.495 205.532C362.108 220.45 365.919 233.551 364.925 244.835C364.153 256.12 360.454 265.969 353.828 274.384C347.424 282.799 337.486 293.127 324.014 305.367L406.172 305.37L434.996 355.289L246.165 355.282L217.342 305.363Z" stroke="#FF750F" stroke-width="1"/>
                            <path d="M38.197 175.972L15.3385 175.971L-13.6505 125.765L72.1515 125.768L204.673 355.282L141.729 355.279L38.197 175.972Z" stroke="#FF750F" stroke-width="1"/>
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4">
                            <path d="M188.467 355.363L188.798 355.363C195.644 348.478 205.969 339.393 219.772 328.11C233.133 316.826 243.181 307.837 249.917 301.144C253.696 297.217 256.792 293.166 259.205 288.991C261.024 285.845 262.455 282.628 263.499 279.341C265.928 271.691 264.768 263.753 260.02 255.529C254.719 246.349 247.265 238.985 237.657 233.438C228.16 227.7 218.111 224.831 207.51 224.83C197.13 224.83 190.339 227.603 187.137 233.149C183.824 238.504 184.929 245.963 190.45 255.527L125.851 255.524C116.574 239.458 112.598 225.114 113.923 212.491C114.615 206.836 116.261 201.756 118.859 197.253C122.061 191.704 126.709 187.03 132.805 183.229C143.958 176.153 158.81 172.615 177.362 172.616C196.797 172.617 216.067 176.156 235.171 183.233C254.164 190.119 271.502 199.874 287.183 212.497C302.864 225.121 315.343 239.466 324.62 255.532C333.233 270.45 337.044 283.551 336.05 294.835C335.46 303.459 333.16 311.245 329.151 318.194C327.915 320.337 326.515 322.4 324.953 324.384C318.549 332.799 308.611 343.127 295.139 355.367L377.297 355.37L406.121 405.289L217.29 405.282L188.467 355.363Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M9.32197 225.972L-13.5365 225.971L-42.5255 175.765L43.2765 175.768L175.798 405.282L112.854 405.279L9.32197 225.972Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M345.247 111.915C329.566 99.2919 312.229 89.5371 293.235 82.6512L235.167 183.228C254.161 190.114 271.498 199.869 287.179 212.492L345.247 111.915Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M382.686 154.964C373.41 138.898 360.931 124.553 345.25 111.93L287.182 212.506C302.863 225.13 315.342 239.475 324.618 255.541L382.686 154.964Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M293.243 82.6472C274.139 75.57 254.869 72.031 235.434 72.0303L177.366 172.607C196.801 172.608 216.071 176.147 235.175 183.224L293.243 82.6472Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M394.118 194.257C395.112 182.973 391.301 169.872 382.688 154.953L324.619 255.53C333.233 270.448 337.044 283.55 336.05 294.834L394.118 194.257Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M235.432 72.0311C216.88 72.0304 202.027 75.5681 190.875 82.6442L132.806 183.221C143.959 176.145 158.812 172.607 177.363 172.608L235.432 72.0311Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M265.59 124.25C276.191 124.251 286.24 127.12 295.737 132.858L237.669 233.435C228.172 227.697 218.123 224.828 207.522 224.827L265.59 124.25Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M295.719 132.859C305.326 138.406 312.78 145.77 318.081 154.95L260.013 255.527C254.712 246.347 247.258 238.983 237.651 233.436L295.719 132.859Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M387.218 217.608C391.227 210.66 393.527 202.874 394.117 194.25L336.049 294.827C335.459 303.451 333.159 311.237 329.15 318.185L387.218 217.608Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M245.211 132.577C248.413 127.03 255.204 124.257 265.584 124.258L207.516 224.835C197.136 224.834 190.345 227.607 187.143 233.154L245.211 132.577Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M318.094 154.945C322.842 163.17 324.002 171.107 321.573 178.757L263.505 279.334C265.934 271.684 264.774 263.746 260.026 255.522L318.094 154.945Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M176.925 96.6737C180.127 91.1249 184.776 86.4503 190.871 82.6499L132.803 183.227C126.708 187.027 122.059 191.702 118.857 197.25L176.925 96.6737Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M387.226 217.606C385.989 219.749 384.59 221.813 383.028 223.797L324.96 324.373C326.522 322.39 327.921 320.326 329.157 318.183L387.226 217.606Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M317.269 188.408C319.087 185.262 320.519 182.045 321.562 178.758L263.494 279.335C262.451 282.622 261.019 285.839 259.201 288.985L317.269 188.408Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M245.208 132.573C241.895 137.928 243 145.387 248.522 154.95L190.454 255.527C184.932 245.964 183.827 238.505 187.14 233.15L245.208 132.573Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M176.93 96.6719C174.331 101.175 172.686 106.255 171.993 111.91L113.925 212.487C114.618 206.831 116.263 201.752 118.862 197.249L176.93 96.6719Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M317.266 188.413C314.853 192.589 311.757 196.64 307.978 200.566L249.91 301.143C253.689 297.216 256.785 293.166 259.198 288.99L317.266 188.413Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M464.198 304.708L435.375 254.789L377.307 355.366L406.13 405.285L464.198 304.708Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M353.209 254.787C366.68 242.548 376.618 232.22 383.023 223.805L324.955 324.382C318.55 332.797 308.612 343.124 295.141 355.364L353.209 254.787Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M435.37 254.787L353.212 254.784L295.144 355.361L377.302 355.364L435.37 254.787Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M183.921 154.947L248.521 154.95L190.453 255.527L125.853 255.524L183.921 154.947Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M171.992 111.914C170.668 124.537 174.643 138.881 183.92 154.947L125.852 255.524C116.575 239.458 112.599 225.114 113.924 212.491L171.992 111.914Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M307.987 200.562C301.251 207.256 291.203 216.244 277.842 227.528L219.774 328.105C233.135 316.821 243.183 307.832 249.919 301.139L307.987 200.562Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M15.5469 75.1797L44.5359 125.386L-13.5321 225.963L-42.5212 175.756L15.5469 75.1797Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M277.836 227.536C264.033 238.82 253.708 247.904 246.862 254.789L188.794 355.366C195.64 348.481 205.965 339.397 219.768 328.113L277.836 227.536Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M275.358 304.706L464.189 304.713L406.12 405.29L217.29 405.283L275.358 304.706Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M44.5279 125.39L67.3864 125.39L9.31834 225.967L-13.5401 225.966L44.5279 125.39Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M101.341 75.1911L233.863 304.705L175.795 405.282L43.2733 175.768L101.341 75.1911ZM15.5431 75.19L-42.525 175.767L43.277 175.77L101.345 75.1932L15.5431 75.19Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M246.866 254.784L246.534 254.784L188.466 355.361L188.798 355.361L246.866 254.784Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M246.539 254.781L275.362 304.701L217.294 405.277L188.471 355.358L246.539 254.781Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M67.3906 125.391L170.923 304.698L112.855 405.275L9.32257 225.967L67.3906 125.391Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                            <path d="M170.921 304.699L233.865 304.701L175.797 405.278L112.853 405.276L170.921 304.699Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="bevel"/>
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4" style="mix-blend-mode:hard-light">
                            <path d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z" fill="#4B0600"/>
                            <path d="M246.544 254.79L246.875 254.79C253.722 247.905 264.046 238.82 277.849 227.537C291.21 216.253 301.259 207.264 307.995 200.57C314.62 193.685 319.147 186.418 321.577 178.768C324.006 171.117 322.846 163.18 318.097 154.956C312.796 145.775 305.342 138.412 295.735 132.865C286.238 127.127 276.189 124.258 265.588 124.257C255.208 124.257 248.416 127.03 245.214 132.576C241.902 137.931 243.006 145.39 248.528 154.953L183.928 154.951C174.652 138.885 170.676 124.541 172 111.918C173.546 99.2946 179.84 89.5408 190.882 82.6559C202.035 75.5798 216.887 72.0421 235.439 72.0428C254.874 72.0435 274.144 75.5825 293.248 82.6598C312.242 89.5457 329.579 99.3005 345.261 111.924C360.942 124.548 373.421 138.892 382.697 154.958C391.311 169.877 395.121 182.978 394.128 194.262C393.355 205.546 389.656 215.396 383.031 223.811C376.627 232.226 366.688 242.554 353.217 254.794L435.375 254.797L464.198 304.716L275.367 304.709L246.544 254.79Z" stroke="#FF750F" stroke-width="1" stroke-linejoin="round"/>
                        </g>
                        <g class="transition-all delay-300 translate-y-0 opacity-100 duration-750 starting:opacity-0 starting:translate-y-4" style="mix-blend-mode:hard-light">
                            <path d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z" fill="#4B0600"/>
                            <path d="M67.41 125.402L44.5515 125.401L15.5625 75.1953L101.364 75.1985L233.886 304.712L170.942 304.71L67.41 125.402Z" stroke="#FF750F" stroke-width="1"/>
                        </g>
                    </svg>
                    <div class="absolute inset-0 rounded-t-lg lg:rounded-t-none lg:rounded-r-lg shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]"></div>
                </div>
            </main>
        </div>

        @if (Route::has('login'))
            <div class="h-14.5 hidden lg:block"></div>
        @endif
    </body>
</html>

=== backend\routes\api.php ===
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\MembershipController;
use App\Http\Controllers\Member\TransactionController;
use App\Http\Controllers\AI\AttendanceController;

use App\Models\Member\Member;
use App\Models\Tracking\Attendance;
use App\Models\Tracking\WorkoutLog;
use Carbon\Carbon;

// --- 1. AUTHENTICATION ROUTES ---
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    
    Route::get('/admin/me', function (Request $request) {
        return $request->user();
    });
});

// --- 2. MEMBER ROUTES ---
Route::get('/members', [MemberController::class, 'index']);
Route::post('/members', [MemberController::class, 'store']);
Route::put('/members/{id}', [MemberController::class, 'update']);
Route::delete('/members/{id}', [MemberController::class, 'destroy']);

// --- 3. SUBSCRIPTION / MEMBERSHIP ROUTES ---
Route::get('/memberships', [MembershipController::class, 'index']);
Route::post('/memberships', [MembershipController::class, 'store']);
Route::put('/memberships/{id}', [MembershipController::class, 'update']);
Route::delete('/memberships/{id}', [MembershipController::class, 'destroy']);

// --- 4. PLAN ROUTES ---
Route::get('/plans', [PlanController::class, 'index']);
Route::post('/plans', [PlanController::class, 'store']); // Adds a new plan
Route::delete('/plans/{id}', [PlanController::class, 'destroy']); // Deletes a plan
Route::post('/plans/bulk-update', [PlanController::class, 'bulkUpdate']);

// --- 5. TRANSACTION ROUTES ---
Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::put('/transactions/{id}', [TransactionController::class, 'update']);
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

// --- 6. REPORTS ROUTE ---
Route::get('/reports', [ReportController::class, 'index']);

// --- 7. PYTHON AI BRIDGE ROUTES ---
        // 1. The API Bridge: Tells Python who owns which face image
Route::get('/ai/members-faces', function () {
    return Member::whereNotNull('enrolled_face_id')
        ->select('id', 'first_name', 'last_name', 'enrolled_face_id')
        ->get()
        ->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->first_name . ' ' . $member->last_name,
                // Assuming enrolled_face_id stores the filename like "1783...png"
                'image_file' => $member->enrolled_face_id 
            ];
        });
});

        // 2. The Attendance Logger: Python will hit this when it sees a member
Route::post('/ai/log-attendance', [AttendanceController::class, 'logAttendance']);

// --- 8. DASHBOARD ROUTES ---
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/notifications', [DashboardController::class, 'notifications']);

// --- 9. ATTENDANCE ROUTES ---
Route::get('/members/{id}/attendance', [AttendanceController::class, 'getMemberAttendance']);

// --- 10. LIVE DASHBOARD ROUTE ---
Route::get('/attendance/today', [AttendanceController::class, 'getTodayAttendance']);

// --- 11. AI WORKOUT LOGGING PIPELINE (SUPERVISOR MODE) ---

// React Route: Coach Assigns a Task
Route::post('/members/{id}/assign-task', function (Request $request, $id) {
    $request->validate(['exercise' => 'required|string']);
    $exerciseName = strtoupper($request->exercise);

    // Prevent assigning the exact same task twice in one day
    $alreadyAssigned = WorkoutLog::where('member_id', $id)
        ->where('date', Carbon::today())
        ->where('exercise', 'ASSIGNED: ' . $exerciseName)
        ->exists();

    if (!$alreadyAssigned) {
        WorkoutLog::create([
            'member_id' => $id,
            'exercise' => 'ASSIGNED: ' . $exerciseName,
            'date' => Carbon::today(),
        ]);
    }
    return response()->json(['message' => 'Task assigned successfully!']);
});

// Python Route: AI Verifies the Task
Route::post('/ai/log-workout', function (Request $request) {
    $request->validate([
        'member_id' => 'required|exists:members,id',
        'exercise' => 'required|string'
    ]);
    
    $exerciseName = strtoupper($request->exercise);
    
    // Check if there is a PENDING task assigned for this exercise today
    $assignedTask = WorkoutLog::where('member_id', $request->member_id)
        ->where('date', Carbon::today())
        ->where('exercise', 'ASSIGNED: ' . $exerciseName)
        ->first();

    if ($assignedTask) {
        // Task Verified! Strip the "ASSIGNED: " tag to mark it completed
        $assignedTask->update([
            'exercise' => $exerciseName,
            'created_at' => Carbon::now() // Log the exact time it was verified
        ]);
        return response()->json(['status' => 'logged', 'message' => 'Task verified!']);
    }

    // Anti-Spam: Normal unassigned logging
    $recentlyLogged = WorkoutLog::where('member_id', $request->member_id)
        ->where('exercise', $exerciseName)
        ->where('created_at', '>=', Carbon::now()->subMinutes(2))
        ->exists();
        
    if (!$recentlyLogged) {
        WorkoutLog::create([
            'member_id' => $request->member_id,
            'exercise' => $exerciseName,
            'date' => Carbon::today(),
        ]);
        return response()->json(['status' => 'logged']);
    }
    
    return response()->json(['status' => 'ignored']);
});

// React Route: Fetch a specific member's workout history
Route::get('/members/{id}/workouts', function ($id) {
    return WorkoutLog::where('member_id', $id)
        ->orderBy('created_at', 'desc')
        ->take(15) 
        ->get();
});

// React Route: Coach Manually Verifies an Obscure Task (Biometrically Locked)
Route::put('/workouts/{id}/manual-verify', function ($id) {
    $log = WorkoutLog::findOrFail($id);
    
    // Strip the "ASSIGNED: " tag to officially mark it as complete
    $cleanExerciseName = str_replace('ASSIGNED: ', '', $log->exercise);
    
    $log->update([
        'exercise' => $cleanExerciseName,
        'created_at' => Carbon::now() // Log the exact time the coach verified it
    ]);
    
    return response()->json(['message' => 'Task manually verified!']);
});

// --- LIVE GESTURE LOGS ROUTE ---
Route::get('/workouts/live', function () {
    return WorkoutLog::with('member:id,first_name,last_name')
        ->orderBy('created_at', 'desc')
        ->take(15)
        ->get()
        ->map(function ($log) {
            return [
                'id' => $log->id,
                'time' => Carbon::parse($log->created_at)->format('h:i:s A'),
                'name' => $log->member ? $log->member->first_name . ' ' . $log->member->last_name : 'Unknown Athlete',
                'event' => str_replace('ASSIGNED: ', '(Pending) ', $log->exercise)
            ];
        });
});

=== backend\routes\console.php ===
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

=== backend\routes\web.php ===
<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

=== backend\tests\Feature\ExampleTest.php ===
<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}

=== backend\tests\Unit\ExampleTest.php ===
<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_that_true_is_true(): void
    {
        $this->assertTrue(true);
    }
}

=== backend\tests\TestCase.php ===
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    //
}

=== backend\.env ===
APP_NAME=Laravel
APP_ENV=local
APP_KEY=base64:VAja1uL7U4VHPZ0KSt9zJeCjYKL5vWFO3Y4UnirS/DE=
APP_DEBUG=true
APP_URL=http://localhost

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file
# APP_MAINTENANCE_STORE=database

PHP_CLI_SERVER_WORKERS=4

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alpha_gym
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database
# CACHE_PREFIX=

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"

=== backend\composer.json ===
{
    "$schema": "https://getcomposer.org/schema.json",
    "name": "laravel/laravel",
    "type": "project",
    "description": "The skeleton application for the Laravel framework.",
    "keywords": ["laravel", "framework"],
    "license": "MIT",
    "require": {
        "php": "^8.2",
        "laravel/framework": "^12.0",
        "laravel/sanctum": "^4.0",
        "laravel/tinker": "^2.10.1"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pail": "^1.2.2",
        "laravel/pint": "^1.24",
        "laravel/sail": "^1.41",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.6",
        "phpunit/phpunit": "^11.5.50"
    },
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "Database\\Factories\\": "database/factories/",
            "Database\\Seeders\\": "database/seeders/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "setup": [
            "composer install",
            "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
            "@php artisan key:generate",
            "@php artisan migrate --force",
            "npm install",
            "npm run build"
        ],
        "dev": [
            "Composer\\Config::disableProcessTimeout",
            "npx concurrently -c \"#93c5fd,#c4b5fd,#fb7185,#fdba74\" \"php artisan serve\" \"php artisan queue:listen --tries=1 --timeout=0\" \"php artisan pail --timeout=0\" \"npm run dev\" --names=server,queue,logs,vite --kill-others"
        ],
        "test": [
            "@php artisan config:clear --ansi",
            "@php artisan test"
        ],
        "post-autoload-dump": [
            "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi"
        ],
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ],
        "post-root-package-install": [
            "@php -r \"file_exists('.env') || copy('.env.example', '.env');\""
        ],
        "post-create-project-cmd": [
            "@php artisan key:generate --ansi",
            "@php -r \"file_exists('database/database.sqlite') || touch('database/database.sqlite');\"",
            "@php artisan migrate --graceful --ansi"
        ],
        "pre-package-uninstall": [
            "Illuminate\\Foundation\\ComposerScripts::prePackageUninstall"
        ]
    },
    "extra": {
        "laravel": {
            "dont-discover": []
        }
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true,
        "allow-plugins": {
            "pestphp/pest-plugin": true,
            "php-http/discovery": true
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}

=== backend\package.json ===
{
    "$schema": "https://www.schemastore.org/package.json",
    "private": true,
    "type": "module",
    "scripts": {
        "build": "vite build",
        "dev": "vite"
    },
    "devDependencies": {
        "@tailwindcss/vite": "^4.0.0",
        "axios": "^1.11.0",
        "concurrently": "^9.0.1",
        "laravel-vite-plugin": "^2.0.0",
        "tailwindcss": "^4.0.0",
        "vite": "^7.0.7"
    }
}

=== backend\vite.config.js ===
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

=== Gesture Engine\config\settings.py ===
import os

# Base directory of the AI Vision & Gesture Engine component
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Backend API Configuration
LARAVEL_API = os.getenv("LARAVEL_API_URL", "http://127.0.0.1:8000/api")

# Directory Paths
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')

# File Paths
WORKOUT_MODEL_PATH = os.path.join(MODELS_DIR, 'workout_model.pkl')
DATASET_CSV_PATH = os.path.join(DATASETS_DIR, 'custom_workout_dataset.csv')

# Camera Stream Configuration
DEFAULT_CCTV_URL = os.getenv('CCTV_URL', 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101')

# OpenCV Environment Flags
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

=== Gesture Engine\scripts\auto_scraper.py ===
import os
import cv2
import json
import mediapipe as mp
import numpy as np
import pandas as pd

DATASET_JSON = r"C:\Users\THUNDEROBOT\OneDrive\Desktop\gym2\frontend\public\dataset\data\exercises.json"
GIF_FOLDER = r"C:\Users\THUNDEROBOT\OneDrive\Desktop\gym2\frontend\public\dataset\videos"

# ðŸš¨ THE TARGET LIST: Broadened keywords to ensure we catch the GIFs!
TARGET_EXERCISES = [
    "squat", "curl", "jumping jack", "push up", "lunge", 
    "crunch", "plank", "high knee", "burpee", "deadlift",
    "mountain climber", "sit up", "russian twist"
]

mp_pose = mp.solutions.pose
dataset = []

print("ðŸš€ INITIALIZING NORMALIZED AI SCRAPER...")

try:
    with open(DATASET_JSON, 'r', encoding='utf-8') as f:
        all_exercises = json.load(f)
        if isinstance(all_exercises, dict) and 'data' in all_exercises:
            all_exercises = all_exercises['data']
except FileNotFoundError:
    print(f"âŒ ERROR: Could not find exercises.json at {DATASET_JSON}")
    exit()

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    for target in TARGET_EXERCISES:
        
        matched_exercise = None
        for ex in all_exercises:
            if target.lower() in ex.get('name', '').lower():
                matched_exercise = ex
                break 
                
        if not matched_exercise:
            continue
            
        ex_name = matched_exercise.get('name')
        ex_id = str(matched_exercise.get('id')).zfill(4) 
        
        gif_path = None
        for filename in os.listdir(GIF_FOLDER):
            if filename.startswith(ex_id) and filename.endswith('.gif'):
                gif_path = os.path.join(GIF_FOLDER, filename)
                break
                
        if not gif_path:
            continue

        cap = cv2.VideoCapture(gif_path)
        frames_extracted = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break 
                
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # ðŸš¨ THE CAPSTONE FIX: Translation Invariance (Normalization)
                # We use the Nose (landmark 0) as the anchor point (0,0)
                origin_x, origin_y, origin_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
                
                pose_row = list(np.array([[lm.x - origin_x, lm.y - origin_y, lm.z - origin_z, lm.visibility] for lm in landmarks]).flatten())
                
                # Tag the math data with the clean generic target name
                pose_row.append(target.upper()) 
                dataset.append(pose_row)
                frames_extracted += 1
                
        cap.release()
        print(f"  âœ… Extracted {frames_extracted} frames for {target.upper()}")

if len(dataset) > 0:
    landmarks_columns = []
    for i in range(1, 34):
        landmarks_columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
    landmarks_columns.append('class_label')
    df = pd.DataFrame(dataset, columns=landmarks_columns)
    df.to_csv('custom_workout_dataset.csv', index=False)
    print("\nâœ… NORMALIZED DATASET SAVED! Run train_model.py!")

=== Gesture Engine\scripts\collect_data.py ===
import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import os
import time

# Force TCP for CCTV
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

# --- CONFIGURATION ---
# Change this variable to the name of the exercise you are about to perform!
EXERCISE_NAME = "IDLE"  
FRAMES_TO_COLLECT = 300 # It will record 300 frames of you doing the exercise
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/102'

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Create an empty list to hold your body coordinates
dataset = []

print(f"âš ï¸ GET READY! Starting data collection for {EXERCISE_NAME} in 5 seconds...")
time.sleep(5)

# Open the CCTV Camera!
print("Connecting to CCTV...")
cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    frames_collected = 0
    
    while cap.isOpened() and frames_collected < FRAMES_TO_COLLECT:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame. Make sure CCTV is online.")
            break
            
        # Recolor image to RGB for MediaPipe
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        
        # Make detection
        results = pose.process(image)
        
        # Recolor back to BGR for OpenCV display
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # Extract landmarks and save them to the dataset
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            
            # Grab the coordinates of all 33 joints
            landmarks = results.pose_landmarks.landmark
            
            # Flatten the X, Y, Z, and Visibility data into a single row
            pose_row = list(np.array([[landmark.x, landmark.y, landmark.z, landmark.visibility] for landmark in landmarks]).flatten())
            
            # Append the name of the exercise to the end of the row as the "Label"
            pose_row.append(EXERCISE_NAME)
            dataset.append(pose_row)
            
            frames_collected += 1
            
        # Display the UI
        cv2.putText(image, f"Recording {EXERCISE_NAME}: {frames_collected}/{FRAMES_TO_COLLECT}", 
                    (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
                    
        cv2.imshow('AI Dataset Collector', image)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()

# --- SAVE TO SPREADSHEET ---
if frames_collected > 0:
    # Dynamically create the column names for all 33 joints (x, y, z, v)
    landmarks_columns = []
    for i in range(1, 34):
        landmarks_columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
    landmarks_columns.append('class_label') # The final column is the name of the exercise

    # Save the recorded data to a CSV file!
    df = pd.DataFrame(dataset, columns=landmarks_columns)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    datasets_dir = os.path.join(base_dir, 'datasets')
    os.makedirs(datasets_dir, exist_ok=True)
    dataset_csv_path = os.path.join(datasets_dir, 'custom_workout_dataset.csv')

    # If the file already exists, append to it. If not, create a new one.
    if os.path.exists(dataset_csv_path):
        df.to_csv(dataset_csv_path, mode='a', header=False, index=False)
    else:
        df.to_csv(dataset_csv_path, index=False)

    print(f"\nâœ… SUCCESS! {frames_collected} frames of {EXERCISE_NAME} have been successfully injected into '{dataset_csv_path}'!")
else:
    print("\nâŒ FAILED to collect any frames. Make sure you are visible to the camera.")

=== Gesture Engine\scripts\test_cam.py ===
import os
# Force OpenCV to use strict TCP FFMPEG pipeline before loading anything else
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
import cv2

# Your specific Hikvision Camera
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/102'

print("Attempting to connect to HIKVISION camera via Python...")
cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)

if not cap.isOpened():
    print("ERROR: OpenCV completely failed to open the camera stream. Check IP/Credentials.")
else:
    print("SUCCESS: Camera opened! Waiting for video frames...")
    while True:
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print("ERROR: Connected, but the camera sent a dead/blank frame.")
            break
            
        cv2.imshow("Direct Python CCTV Test", frame)
        
        # Press 'q' on your keyboard to close the window
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()

=== Gesture Engine\scripts\train_model.py ===
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)

DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'custom_workout_dataset.csv')
if not os.path.exists(DATASET_PATH):
    DATASET_PATH = os.path.join(BASE_DIR, 'custom_workout_dataset.csv')

MODEL_OUTPUT_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
MODEL_OUTPUT_PATH = os.path.join(MODEL_OUTPUT_DIR, 'workout_model.pkl')

print("ðŸ§  [PHASE 2] INITIALIZING AI TRAINING PROTOCOL...")

try:
    # 1. Load the dataset you just collected
    print(f"Loading dataset from '{DATASET_PATH}'...")
    df = pd.read_csv(DATASET_PATH)
    
    # 2. Separate the coordinates (Features) from the exercise names (Labels)
    X = df.drop('class_label', axis=1) # The 33 joint coordinates
    y = df['class_label']              # The name of the exercise

    # 3. Split the data: 80% for training the AI, 20% for testing its accuracy
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training AI on {len(X_train)} frames of data...")
    print(f"Classes found: {y.unique()}")

    # 4. Create and Train the Random Forest Neural Network
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # 5. Give the AI a test to see how smart it is
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nâœ… TRAINING COMPLETE!")
    print(f"ðŸŽ¯ AI Accuracy Score: {accuracy * 100:.2f}%")

    # 6. Save the trained brain to a .pkl file!
    with open(MODEL_OUTPUT_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"ðŸ’¾ Model successfully saved to '{MODEL_OUTPUT_PATH}'")
    print("You are now ready to plug this brain into gesture_engine.py!")

except FileNotFoundError:
    print(f"âŒ ERROR: Could not find dataset at '{DATASET_PATH}'. Did you run collect_data.py first?")
except Exception as e:
    print(f"âŒ ERROR: {e}")
    print("Did you make sure to record at least TWO different exercises so the AI can learn the difference?")

=== Gesture Engine\gesture_engine.py ===
import sys
import os

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Force TCP but instruct FFMPEG to discard corrupted packets instead of crashing
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"

import cv2
import face_recognition
import mediapipe as mp
import pandas as pd
import pickle
from flask import Flask, Response, jsonify
from flask_cors import CORS
import threading
import time
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

LARAVEL_API = "http://127.0.0.1:8000/api"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWN_FACES_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'backend', 'public'))
CCTV_URL = 'rtsp://admin:Jheval07012004@192.168.1.45:554/Streaming/Channels/101'

known_face_encodings = []
known_face_ids = []
known_face_names = []
logged_today = {}
workout_cooldowns = {} # Prevents API spam!

shared_faces = []
face_memory_cache = {}
shared_pose_landmarks = None

# --- NEW: LEAN HYBRID VARIABLES ---
current_workout = "IDLE"
workout_buffer = [] # Used to smooth out flickering AI guesses
ml_model = None

# Load the AI Brain!
model_paths = [
    os.path.join(BASE_DIR, 'models', 'workout_model.pkl'),
    os.path.join(BASE_DIR, 'workout_model.pkl')
]

for m_path in model_paths:
    if os.path.exists(m_path):
        try:
            with open(m_path, 'rb') as f:
                ml_model = pickle.load(f)
            print(f"ðŸ§  [SUCCESS] Machine Learning Workout Brain Loaded from '{m_path}'!")
            break
        except Exception as e:
            print(f"âš ï¸ Could not load model from '{m_path}': {e}")

if ml_model is None:
    print("âŒ [WARNING] 'workout_model.pkl' not found. Ensure you ran train_model.py.")

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=1)

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(min_detection_confidence=0.3, model_selection=1)

current_raw_frame = None
latest_security_frame = None
latest_gesture_frame = None

def load_registered_faces():
    global known_face_encodings, known_face_ids, known_face_names
    known_face_encodings.clear()
    known_face_ids.clear()
    known_face_names.clear()
    
    print("\n" + "="*50)
    print("ðŸš€ [CAPSTONE READY] HIGH-ACCURACY AI ENGINE...")
    print("[SYNC] Fetching registered members from Laravel...")
    try:
        response = requests.get(f"{LARAVEL_API}/ai/members-faces")
        members = response.json()
        
        for member in members:
            raw_path = member['image_file']
            if raw_path.startswith('/'): raw_path = raw_path[1:] 
            filepath = os.path.normpath(os.path.join(KNOWN_FACES_DIR, raw_path)) 
            
            if os.path.exists(filepath):
                try:
                    image = face_recognition.load_image_file(filepath)
                    encodings = face_recognition.face_encodings(image, num_jitters=3)
                    
                    if len(encodings) > 0:
                        known_face_encodings.append(encodings[0])
                        known_face_ids.append(member['id'])
                        known_face_names.append(member['name'])
                        print(f"  [SUCCESS] VIP Face Loaded: {member['name']}")
                except Exception as img_err:
                    print(f"  [ERROR] Could not process image: {img_err}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Laravel: {e}")
    print("="*50 + "\n")

load_registered_faces()

def auto_adjust_lighting(cv2_frame):
    gray = cv2.cvtColor(cv2_frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

def log_attendance_to_laravel(member_id, name):
    current_time = time.time()
    if member_id in logged_today and (current_time - logged_today[member_id]) < 10.0:
        return 
        
    logged_today[member_id] = current_time
    
    try:
        res = requests.post(f"{LARAVEL_API}/ai/log-attendance", json={"member_id": member_id})
        if res.json().get('status') == 'logged':
            print(f"\n>>> [ATTENDANCE SUCCESS] Logged: {name}!\n")
    except Exception:
        pass

def log_workout_to_laravel(athlete_name, exercise):
    member_id = None
    if athlete_name in known_face_names:
        idx = known_face_names.index(athlete_name)
        member_id = known_face_ids[idx]
    
    if not member_id: return

    # Python Cooldown: Prevent API spam! 20 seconds between saving identical exercises.
    key = f"{member_id}_{exercise}"
    if key in workout_cooldowns and (time.time() - workout_cooldowns[key]) < 20:
        return

    workout_cooldowns[key] = time.time()
    
    try:
        res = requests.post(f"{LARAVEL_API}/ai/log-workout", json={"member_id": member_id, "exercise": exercise})
        if res.json().get('status') == 'logged':
            print(f"\nðŸ’ª [WORKOUT VERIFIED IN DATABASE] {athlete_name} performed {exercise}!\n")
    except Exception:
        pass

def camera_reader_thread():
    global current_raw_frame
    cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    while True:
        success = cap.grab()
        if success:
            success, frame = cap.retrieve()
            if success and frame is not None:
                current_raw_frame = frame  
        else:
            time.sleep(0.5)
            cap.release()
            cap = cv2.VideoCapture(CCTV_URL, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

def face_ai_worker():
    global current_raw_frame, shared_faces, face_memory_cache
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.1)
            continue
            
        frame = current_raw_frame.copy()
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        if np.mean(scan_frame) < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        face_results = face_detector.process(rgb_scan_frame)
        temp_faces = []
        
        if face_results.detections:
            h, w, _ = frame.shape
            for detection in face_results.detections:
                bboxC = detection.location_data.relative_bounding_box
                xmin, ymin = int(bboxC.xmin * w), int(bboxC.ymin * h)
                box_w, box_h = int(bboxC.width * w), int(bboxC.height * h)
                
                pad_y, pad_x = int(box_h * 0.25), int(box_w * 0.25)
                top, left = max(0, ymin - pad_y), max(0, xmin - pad_x)
                bottom, right = min(h, ymin + box_h + pad_y), min(w, xmin + box_w + pad_x)
                
                if bottom - top > 15 and right - left > 15:
                    name, color = "Unknown", (0, 0, 255)
                    box_center_x, box_center_y = left + (right - left) // 2, top + (bottom - top) // 2
                    
                    for mem_name, data in list(face_memory_cache.items()):
                        if time.time() - data['time'] < 3.0:
                            m_top, m_right, m_bottom, m_left = data['box']
                            m_center_x, m_center_y = m_left + (m_right - m_left) // 2, m_top + (m_bottom - m_top) // 2
                            if abs(box_center_x - m_center_x) < 250 and abs(box_center_y - m_center_y) < 250:
                                name, color = mem_name, (0, 255, 0)
                                break
                    try:
                        if name == "Unknown":
                            face_crop = frame[top:bottom, left:right]
                            enhanced_face = auto_adjust_lighting(face_crop)
                            encodings = face_recognition.face_encodings(enhanced_face)
                            if len(encodings) > 0 and known_face_encodings:
                                distances = face_recognition.face_distance(known_face_encodings, encodings[0])
                                if len(distances) > 0:
                                    best_match = np.argmin(distances)
                                    if distances[best_match] < 0.65: 
                                        member_id = known_face_ids[best_match]
                                        name = known_face_names[best_match]
                                        color = (0, 255, 0)
                                        threading.Thread(target=log_attendance_to_laravel, args=(member_id, name), daemon=True).start()
                        
                        if name != "Unknown":
                            face_memory_cache[name] = {"box": (top, right, bottom, left), "time": time.time()}

                    except Exception:
                        pass 

                    temp_faces.append(((top, right, bottom, left), name, color))
                    
        shared_faces = temp_faces
        time.sleep(0.05)

def gesture_ai_worker():
    global current_raw_frame, shared_pose_landmarks
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.01)
            continue
            
        frame = current_raw_frame.copy()
        scan_frame = cv2.resize(frame, (0, 0), fx=0.75, fy=0.75)
        
        if np.mean(scan_frame) < 90:
            scan_frame = cv2.convertScaleAbs(scan_frame, alpha=1.2, beta=30)
            
        rgb_scan_frame = cv2.cvtColor(scan_frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_scan_frame)
        shared_pose_landmarks = results.pose_landmarks
        time.sleep(0.01)

def video_stream_worker():
    global latest_security_frame, latest_gesture_frame, current_raw_frame, shared_faces, shared_pose_landmarks
    global current_workout, ml_model, workout_buffer
    
    while True:
        if current_raw_frame is None:
            time.sleep(0.01)
            continue
            
        frame = current_raw_frame.copy()
        sec_frame = frame.copy()  
        gest_frame = frame.copy() 
        h, w, _ = frame.shape

        active_athlete = "Scanning Face..."

        # --- DRAW SKELETON & RUN AUTO-DETECTION ---
        if shared_pose_landmarks:
            
            # 1. UPGRADED VISUALS: Custom Skeleton (Red Joints, White Bones)
            landmark_style = mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=3)
            connection_style = mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2)
            
            mp_drawing.draw_landmarks(
                gest_frame, 
                shared_pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=landmark_style,
                connection_drawing_spec=connection_style
            )
            
            try:
                landmarks = shared_pose_landmarks.landmark
                
                # 2. UPGRADED VISUALS: Dynamic Pink Bounding Box (Like the reference image)
                x_coords = [lm.x * w for lm in landmarks]
                y_coords = [lm.y * h for lm in landmarks]
                x_min, x_max = int(min(x_coords)), int(max(x_coords))
                y_min, y_max = int(min(y_coords)), int(max(y_coords))
                
                pad = 25 # Padding around the body
                cv2.rectangle(gest_frame, (max(0, x_min - pad), max(0, y_min - pad)), 
                              (min(w, x_max + pad), min(h, y_max + pad)), 
                              (255, 0, 255), 2) # 255,0,255 is the BGR code for Pink/Magenta
                
                # --- ACTIVE ATHLETE BINDING MATH ---
                nose_x = int(landmarks[mp_pose.PoseLandmark.NOSE.value].x * w)
                nose_y = int(landmarks[mp_pose.PoseLandmark.NOSE.value].y * h)
                
                for (top, right, bottom, left), name, color in shared_faces:
                    if left - 50 <= nose_x <= right + 50 and top - 50 <= nose_y <= bottom + 100:
                        active_athlete = name
                        break

                # =======================================================
                # 1. MACHINE LEARNING CLASSIFIER (Verification Mode)
                # =======================================================
                if ml_model:
                    # ðŸš¨ THE CAPSTONE FIX: Normalize live camera coordinates to match training data
                    origin_x, origin_y, origin_z = landmarks[0].x, landmarks[0].y, landmarks[0].z
                    pose_row = list(np.array([[lm.x - origin_x, lm.y - origin_y, lm.z - origin_z, lm.visibility] for lm in landmarks]).flatten())
                    
                    columns = []
                    for i in range(1, 34):
                        columns.extend([f'x{i}', f'y{i}', f'z{i}', f'v{i}'])
                    
                    X = pd.DataFrame([pose_row], columns=columns)
                    
                    # Make the prediction!
                    prediction = ml_model.predict(X)[0]
                    prob = ml_model.predict_proba(X)[0]
                    confidence = max(prob)
                    
                    # Restored high threshold because the AI is now mathematically locked-in!
                    if confidence > 0.45:
                        workout_buffer.append(prediction)
                    else:
                        workout_buffer.append("IDLE")
                        
                    # SMOOTHING FILTER: Needs 7 frames of steady classification to verify
                    if len(workout_buffer) > 7:
                        workout_buffer.pop(0)
                        
                    smoothed_prediction = max(set(workout_buffer), key=workout_buffer.count)
                    
                    # Trigger verification log ONLY when the AI locks onto a new steady movement
                    if current_workout != smoothed_prediction:
                        current_workout = smoothed_prediction
                        
                        if current_workout != "IDLE" and active_athlete != "Scanning Face..." and active_athlete != "Unknown":
                            threading.Thread(target=log_workout_to_laravel, args=(active_athlete, current_workout), daemon=True).start()

            except Exception as e:
                pass

            # --- DRAW THE CLEAN IDENTIFICATION HUD ---
            overlay = gest_frame.copy()
            box_w = 480
            box_h = 90
            box_x1 = w - box_w - 20
            box_y1 = 20
            
            cv2.rectangle(overlay, (box_x1, box_y1), (box_x1 + box_w, box_y1 + box_h), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, gest_frame, 0.3, 0, gest_frame)
            
            athlete_color = (0, 255, 0) if active_athlete != "Scanning Face..." and active_athlete != "Unknown" else (0, 0, 255)

            cv2.putText(gest_frame, f"ATHLETE:  {active_athlete}", (box_x1 + 20, box_y1 + 40), cv2.FONT_HERSHEY_DUPLEX, 0.6, athlete_color, 1)
            
            # ðŸš¨ THE FIX: Added the live confidence percentage to the screen!
            cv2.putText(gest_frame, f"EXERCISE: {current_workout} ({int(confidence*100)}%)", (box_x1 + 20, box_y1 + 75), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 200, 0), 1)

        # --- DRAW FACES ON SECURITY FEED ---
        for (top, right, bottom, left), name, color in shared_faces:
            cv2.rectangle(sec_frame, (left, top), (right, bottom), color, 3)
            cv2.rectangle(sec_frame, (left, max(0, top - 35)), (right, top), color, cv2.FILLED)
            cv2.putText(sec_frame, name, (left + 6, max(20, top - 10)), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

        _, sec_buffer = cv2.imencode('.jpg', sec_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        _, gest_buffer = cv2.imencode('.jpg', gest_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        latest_security_frame = sec_buffer.tobytes()
        latest_gesture_frame = gest_buffer.tobytes()

        time.sleep(0.06)

threading.Thread(target=camera_reader_thread, daemon=True).start()
threading.Thread(target=face_ai_worker, daemon=True).start()
threading.Thread(target=gesture_ai_worker, daemon=True).start()
threading.Thread(target=video_stream_worker, daemon=True).start()

def stream_generator(feed_type):
    last_sent = None
    while True:
        frame_data = latest_security_frame if feed_type == 'sec' else latest_gesture_frame
        if frame_data is None or frame_data == last_sent:
            time.sleep(0.01)
            continue
        last_sent = frame_data
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_data + b'\r\n')

@app.route('/security_feed')
def security_feed():
    return Response(stream_generator('sec'), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/gesture_feed')
def gesture_feed():
    return Response(stream_generator('gest'), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/refresh_ai', methods=['POST'])
def refresh_ai():
    load_registered_faces()
    return jsonify({"message": "Synced!"})

if __name__ == '__main__':
    print("\n[SYSTEM] CAPSTONE-READY AI ENGINE ONLINE")
    app.run(host='0.0.0.0', port=5000, threaded=True, debug=False)

=== Gesture Engine\main.py ===
"""
AI Vision & Gesture Engine - Entry Point
Double Alpha Fitness Gym Management System
"""

import sys
import os

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure the root folder of AI Vision Engine is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from gesture_engine import app

if __name__ == '__main__':
    print("ðŸš€ [STARTUP] Starting AI Vision & Gesture Engine Microservice...")
    print("ðŸŒ Listening on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

=== Gesture Engine\pyrightconfig.json ===
{
  "pythonVersion": "3.10",
  "venvPath": ".",
  "venv": "venv",
  "include": [
    "."
  ],
  "exclude": [
    "venv"
  ]
}

=== Gesture Engine\requirements.txt ===
flask==3.0.0
flask-cors==4.0.0
opencv-python==4.8.1.78
numpy==1.26.2
requests==2.31.0
mediapipe==0.10.35
face_recognition==1.3.0

