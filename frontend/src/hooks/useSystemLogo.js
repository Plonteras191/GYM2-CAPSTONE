import { useEffect, useState } from 'react';
import api from '../api';
import defaultLogo from '../assets/logo.png';
import { getMediaUrl } from '../utils/mediaUrl';

export const notifySystemLogoChanged = (logoUrl) => {
  window.dispatchEvent(new CustomEvent('admin-branding-updated', { detail: logoUrl }));
};

export function useSystemLogo() {
  const [logoUrl, setLogoUrl] = useState(defaultLogo);

  useEffect(() => {
    let active = true;
    const handleLogoChange = (event) => setLogoUrl(getMediaUrl(event.detail) || defaultLogo);

    window.addEventListener('admin-branding-updated', handleLogoChange);
    api.get('/branding')
      .then(({ data }) => {
        if (active) setLogoUrl(getMediaUrl(data.logo_url) || defaultLogo);
      })
      .catch((error) => {
        console.error('Failed to load system logo:', error);
      });

    return () => {
      active = false;
      window.removeEventListener('admin-branding-updated', handleLogoChange);
    };
  }, []);

  return logoUrl;
}
