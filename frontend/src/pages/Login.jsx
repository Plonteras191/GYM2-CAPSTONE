import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiLoader, FiAlertCircle } from 'react-icons/fi';

import loginBg from '../assets/Login.jpg';
import { useSystemLogo } from '../hooks/useSystemLogo';

export default function Login() {
  const systemLogo = useSystemLogo();

  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
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

        // Record login device info for notification bell security alert
        const userAgent = navigator.userAgent;
        let deviceType = 'Desktop PC';
        if (/iPad|Tablet/i.test(userAgent)) deviceType = 'Tablet';
        else if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'Mobile Device';
        else if (/Macintosh|Mac OS/i.test(userAgent)) deviceType = 'Mac Device';
        else if (/Windows/i.test(userAgent)) deviceType = 'Windows PC';

        const now = new Date();
        const timeStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const prevDevice = localStorage.getItem('last_active_device');
        const isNewDevice = prevDevice && prevDevice !== deviceType;

        localStorage.setItem('login_device_notif', JSON.stringify({
          id: 'login_' + Date.now(),
          deviceName: deviceType,
          timeStr: timeStr,
          isNewDevice: !!isNewDevice,
          timestamp: Date.now()
        }));
        localStorage.setItem('last_active_device', deviceType);

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
    <div className="min-h-dvh w-full relative bg-[#11100f] text-gray-200 overflow-x-hidden font-sans">

      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_24%_55%,rgba(166,54,22,0.16),transparent_44%),radial-gradient(ellipse_at_78%_18%,rgba(245,158,11,0.07),transparent_36%)]"></div>

      <div className="hidden lg:block absolute top-0 left-0 w-[68%] h-full z-0">
        <div
          className="absolute inset-0 bg-cover mix-blend-screen opacity-55"
          style={{ backgroundImage: `url(${loginBg})`, backgroundPosition: 'calc(-40% + 5px) center' }}
        ></div>
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#11100f]/30 via-55% to-[#11100f] to-100%"></div>
      </div>

      <div className="lg:hidden absolute inset-0 z-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="absolute inset-0 bg-[#11100f]/80" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full">

        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="rounded-full border-2 border-gray-400">
              <img src={systemLogo} alt="System logo" className="w-14 h-14 rounded-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-black italic text-transparent bg-clip-text bg-linear-to-r from-red-500 via-orange-500 to-amber-400 text-[25px] leading-none uppercase tracking-tight">Double Alpha</span>
              <span className="mt-1.5 text-[15px] font-bold uppercase tracking-[0.28em] text-gray-100">Fitness</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-5 py-8 sm:px-10 sm:py-12 lg:p-12 relative z-10">

          <div className="max-w-105 w-full space-y-2 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pointer-events-auto">

            <div className="flex flex-col items-center lg:hidden mb-8 sm:mb-10">
              <div className="p-1 rounded-full border-2 border-amber-500/50 bg-slate-950/50 shadow-[0_0_28px_rgba(245,158,11,0.18)]">
                <img src={systemLogo} alt="System logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md p-1 object-cover" />
              </div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Double Alpha Fitness</p>
            </div>

            <div className="text-left mb-8 sm:mb-10 border-l-4 border-amber-500 pl-4 sm:pl-5 py-1">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                System <span className="text-transparent bg-clip-text bg-linear-to-r from-yellow-500 to-amber-500">Login</span>
              </h2>
              <p className="text-slate-400 mt-2.5 font-medium text-sm leading-relaxed tracking-wide">
                Enter your administrator credentials to secure access to the hub.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in fade-in">
                  <FiAlertCircle className="text-red-400 mt-0.5 shrink-0" size={18} />
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
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    autoComplete="username"
                    className={`${inputClass} min-h-12 text-base`}
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
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    autoComplete="current-password"
                    className={`${inputClass} min-h-12 text-base`}
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
                className="mx-1 mt-6 flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-8"
              >
                {isLoading ? <FiLoader className="animate-spin" size={20} /> : <FiLogIn size={20} />}
                {isLoading ? 'Authenticating...' : 'Login'}
              </button>

            </form>

            <div className="pt-8 sm:pt-12 text-center border-t border-slate-800 mt-6 sm:mt-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Double Alpha Fitness v1.0 <br /> Tagoloan Community College Capstone
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}