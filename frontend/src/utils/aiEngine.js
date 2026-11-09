/**
 * Base URL of the Python Gesture Engine.
 *
 * Set VITE_AI_URL for any deployed build (e.g. Vercel). Without it, the
 * dashboard assumes the engine runs on the same computer as the browser.
 */
export const AI_BASE = (import.meta.env.VITE_AI_URL || '').trim().replace(/\/+$/, '')
  || (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? `http://${window.location.hostname}:5000`
    : 'http://127.0.0.1:5000');

/**
 * fetch() against the Gesture Engine with the admin's Sanctum token attached.
 * The engine's control endpoints (/refresh_ai, /switch_camera) require it.
 */
export function aiEngineFetch(path, options = {}) {
  const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${AI_BASE}${path}`, { ...options, headers });
}
