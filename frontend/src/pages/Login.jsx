import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiLoader, FiAlertCircle, FiX } from 'react-icons/fi';

import loginBg from '../assets/Login.jpg';
import { useSystemLogo } from '../hooks/useSystemLogo';

// Same base URL as the axios client in api.js (VITE_API_BASE_URL on Vercel).
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

export default function Login() {
  const systemLogo = useSystemLogo();

  const [credentials, setCredentials] = useState(() => {
    const savedEmail = localStorage.getItem('remembered_admin_email');
    return { email: savedEmail || '', password: '' };
  });
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_admin') === 'true');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState('request');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirmation, setRecoveryConfirmation] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [loginChallengeId, setLoginChallengeId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  const requestRecovery = async () => {
    setRecoveryLoading(true);
    setRecoveryMessage('');
    try {
      const response = await fetch(`${API_BASE}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: credentials.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Recovery email could not be sent.');
      setRecoveryStep('verify');
      setRecoveryMessage(data.verification_pin
        ? `${data.message} Enter PIN: ${data.verification_pin}`
        : data.message);
    } catch (error) {
      setRecoveryMessage(error.message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const resetPassword = async event => {
    event.preventDefault();
    setRecoveryLoading(true);
    setRecoveryMessage('');
    try {
      const verifyResponse = await fetch(`${API_BASE}/auth/password-reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: credentials.email, pin: recoveryPin }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.message || 'That PIN is invalid or expired.');
      const response = await fetch(`${API_BASE}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          pin: recoveryPin,
          password: recoveryPassword,
          password_confirmation: recoveryConfirmation,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset failed.');
      setRecoveryOpen(false);
      setRecoveryStep('request');
      setRecoveryMessage('');
      setErrorMsg('Password reset successfully. You can now log in.');
    } catch (error) {
      setRecoveryMessage(error.message);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setLoginMessage('');

    try {
      if (loginChallengeId) {
        const verifyResponse = await fetch(`${API_BASE}/auth/login/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ challenge_id: loginChallengeId, pin: loginPin }),
        });
        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) throw new Error(verifyData.message || 'Login verification failed.');
        await finishLogin(verifyData);
        return;
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.status === 202) {
        setLoginChallengeId(data.challenge_id);
        setLoginMessage(data.verification_pin
          ? `${data.message} Enter PIN: ${data.verification_pin}`
          : `A verification PIN was sent to ${data.email}. Check the administrator Gmail before continuing.`);
      } else if (response.ok) {
        await finishLogin(data);
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

  const finishLogin = async data => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    (rememberMe ? localStorage : sessionStorage).setItem('admin_token', data.token);
    localStorage.setItem('admin_name', data.admin.name);
    if (rememberMe) {
      localStorage.setItem('remember_admin', 'true');
      localStorage.setItem('remembered_admin_email', credentials.email);
    } else {
      localStorage.removeItem('remember_admin');
      localStorage.removeItem('remembered_admin_email');
    }

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
      timeStr,
      isNewDevice: !!isNewDevice,
      timestamp: Date.now()
    }));
    localStorage.setItem('last_active_device', deviceType);
    window.location.href = '/overview';
  };

  // Dark-ground field styles for the login screen only.
  const inputClass = "w-full rounded-xl border border-white/15 bg-white/[0.06] py-3.5 pl-12 pr-10 font-medium text-white placeholder:text-white/40 transition-[border-color,box-shadow,background-color] duration-200 hover:bg-white/[0.09] focus:border-brand-gold focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand-gold/25";
  const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-white/60";
  const goldButton = "press flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gold px-4 font-semibold text-brand-dark shadow-[inset_0_-1px_0_rgb(13_13_13/0.15)] hover:bg-brand-gold-500 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-brand-dark font-sans text-white">

      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_24%_55%,rgb(166_3_3/0.18),transparent_44%),radial-gradient(ellipse_at_78%_18%,rgb(242_183_5/0.08),transparent_36%)]"></div>

      <div className="absolute left-0 top-0 z-0 hidden h-full w-[68%] lg:block">
        <div
          className="absolute inset-0 bg-cover opacity-55 mix-blend-screen"
          style={{ backgroundImage: `url(${loginBg})`, backgroundPosition: 'calc(-40% + 5px) center' }}
        ></div>
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-brand-dark/30 via-55% to-brand-dark to-100%"></div>
      </div>

      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 lg:hidden" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="absolute inset-0 bg-brand-dark/80" />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full">

        <div className="pointer-events-none hidden flex-col justify-between p-14 lg:flex lg:w-1/2">
          <div className="rise pointer-events-auto flex items-center gap-4" style={{ '--i': 0 }}>
            <div className="rounded-full bg-white ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-dark">
              <img src={systemLogo} alt="System logo" className="h-14 w-14 rounded-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="bg-linear-to-r from-brand-red-300 to-brand-orange-300 bg-clip-text pr-1 font-brand text-[1.75rem] font-extrabold uppercase italic leading-none tracking-tight text-transparent">Double Alpha</span>
              <span className="mt-1.5 text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Fitness</span>
            </div>
          </div>
          <p className="rise text-xs font-medium text-white/40" style={{ '--i': 6 }}>Member records, packages, payments and attendance in one place.</p>
        </div>

        <div className="relative z-10 flex w-full flex-col items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:w-1/2 lg:p-12">

          <div className="pointer-events-auto w-full max-w-105">

            <div className="rise mb-8 flex flex-col items-center sm:mb-10 lg:hidden" style={{ '--i': 0 }}>
              <div className="rounded-full bg-white ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-dark">
                <img src={systemLogo} alt="System logo" className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Double Alpha Fitness</p>
            </div>

            <div className="rise mb-8 sm:mb-10" style={{ '--i': 1 }}>
              <h2 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight text-white sm:text-5xl">
                System <span className="text-brand-gold">Login</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Enter your administrator credentials to secure access to the hub.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">

              {errorMsg && (
                <div role="alert" className="animate-in fade-in slide-in-from-top-2 flex items-start gap-3 rounded-xl border border-brand-red-300/30 bg-brand-red-300/10 p-4">
                  <FiAlertCircle className="mt-0.5 shrink-0 text-brand-red-300" size={18} />
                  <p className="text-sm font-semibold text-brand-red-300">{errorMsg}</p>
                </div>
              )}

              <div className="rise" style={{ '--i': 2 }}>
                <label htmlFor="login-email" className={labelClass}>Email</label>
                <div className="group relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/40 transition-colors group-focus-within:text-brand-gold" />
                  <input
                    id="login-email"
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

              <div className="rise" style={{ '--i': 3 }}>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-[0.08em] text-white/60">Password</label>
                  {!loginChallengeId && <button type="button" onClick={() => setRecoveryOpen(true)} className="link-draw text-xs font-semibold text-white/60 transition-colors hover:text-brand-gold">Forgot password?</button>}
                </div>
                <div className="group relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/40 transition-colors group-focus-within:text-brand-gold" />
                  <input
                    id="login-password"
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="press absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white/50 transition-colors hover:text-white"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {loginChallengeId && (
                <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                  <label htmlFor="login-pin" className={labelClass}>6-digit verification code</label>
                  <input
                    id="login-pin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={loginPin}
                    onChange={event => setLoginPin(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    className={`${inputClass} min-h-12 pl-4 pr-4 text-center font-display text-2xl tracking-[0.45em]`}
                  />
                  <p className="text-xs font-medium text-white/60">Enter the code sent to your administrator email.</p>
                  <p className="text-xs font-medium text-brand-gold">{loginMessage}</p>
                </div>
              )}

              {!loginChallengeId && <div className="rise flex items-center gap-3 pt-1" style={{ '--i': 4 }}>
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={event => setRememberMe(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-white/30 bg-white/10 accent-brand-gold"
                />
                <label htmlFor="remember" className="cursor-pointer select-none text-sm font-medium text-white/70 transition-colors hover:text-white">
                  Remember me
                </label>
              </div>}

              <div className="rise pt-2 sm:pt-4" style={{ '--i': 5 }}>
                <button type="submit" disabled={isLoading} className={goldButton}>
                  {isLoading ? <FiLoader className="animate-spin" size={19} /> : <FiLogIn size={19} />}
                  {isLoading ? (loginChallengeId ? 'Verifying…' : 'Authenticating…') : (loginChallengeId ? 'Verify and Login' : 'Login')}
                </button>
              </div>

            </form>

            <div className="rise mt-8 border-t border-white/10 pt-8 text-center sm:mt-10 sm:pt-10" style={{ '--i': 6 }}>
              <p className="text-xs font-medium leading-relaxed text-white/40">
                Double Alpha Fitness v1.0 <br /> Tagoloan Community College Capstone
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
    {recoveryOpen && (
      <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/70 p-4 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="recovery-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 w-full max-w-md rounded-2xl border border-night-line bg-night-panel p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="recovery-title" className="font-display text-2xl font-semibold text-white">Forgot Password</h2>
            <button type="button" onClick={() => setRecoveryOpen(false)} className="press rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close recovery"><FiX size={20} /></button>
          </div>
          {recoveryStep === 'request' ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">Enter the administrator email saved in Admin Profile to receive a six-digit PIN.</p>
              <input type="email" value={credentials.email} onChange={event => setCredentials({ ...credentials, email: event.target.value })} className={`${inputClass} pl-4`} placeholder="Coach recovery email" aria-label="Recovery email" />
              <button type="button" onClick={requestRecovery} disabled={recoveryLoading} className={goldButton}>
                {recoveryLoading ? 'Sending…' : 'Send Recovery PIN'}
              </button>
            </div>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <p className="text-sm leading-relaxed text-white/60">Enter the PIN sent to the administrator email, then choose a new password.</p>
              <label htmlFor="recovery-pin" className={labelClass}>6-digit recovery code</label>
              <input
                id="recovery-pin"
                required
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={recoveryPin}
                onChange={event => setRecoveryPin(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                autoComplete="one-time-code"
                className={`${inputClass} pl-4 pr-4 text-center font-display text-2xl tracking-[0.45em]`}
                placeholder="6-digit code"
              />
              <input required minLength={8} type="password" value={recoveryPassword} onChange={event => setRecoveryPassword(event.target.value)} className={`${inputClass} pl-4`} placeholder="New password" aria-label="New password" />
              <input required minLength={8} type="password" value={recoveryConfirmation} onChange={event => setRecoveryConfirmation(event.target.value)} className={`${inputClass} pl-4`} placeholder="Confirm new password" aria-label="Confirm new password" />
              <button type="submit" disabled={recoveryLoading} className={goldButton}>
                {recoveryLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
          {recoveryMessage && <p className="mt-4 rounded-lg border border-night-line bg-night-field p-3 text-sm font-medium text-white/80">{recoveryMessage}</p>}
        </div>
      </div>
    )}
    </>
  );
}
