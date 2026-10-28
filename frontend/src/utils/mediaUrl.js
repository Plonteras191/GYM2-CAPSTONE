/**
 * Helper to resolve media and asset URLs (profile pictures, branding logos, etc.)
 * across development and production environments.
 * 
 * If a relative path is received (e.g., /profiles/abc.jpg) and VITE_API_BASE_URL
 * points to a remote backend (e.g., https://my-backend.up.railway.app/api),
 * this prepends the backend origin so assets load correctly on Vercel.
 */
export function getMediaUrl(path) {
  if (!path) return '';

  if (
    typeof path !== 'string' ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${origin}${cleanPath}`;
  }

  return path;
}
