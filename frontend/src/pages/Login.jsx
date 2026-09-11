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
                    placeholder="••••••••"
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