import { useEffect, useState } from 'react';
import { FiUser, FiSave, FiShield, FiEye, FiEyeOff, FiCheck, FiX, FiCamera, FiZoomIn, FiZoomOut } from 'react-icons/fi';

import api from '../api';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import AlertDialog from '../components/ui/AlertDialog';
import { fieldClass, labelClass } from '../components/ui/field';
import { notifySystemLogoChanged, useSystemLogo } from '../hooks/useSystemLogo';

const getErrorMessage = (error, fallback) => {
  const errors = error.response?.data?.errors;
  const firstValidationError = errors ? Object.values(errors).flat()[0] : null;
  return firstValidationError || error.response?.data?.message || fallback;
};

const PREVIEW_SIZE = 256;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createCroppedImage = (imageUrl, zoom, position) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
    const scale = Math.max(PREVIEW_SIZE / image.naturalWidth, PREVIEW_SIZE / image.naturalHeight);
    const sourceSize = PREVIEW_SIZE / (scale * zoom);
    const sourceX = image.naturalWidth / 2 - position.x / (scale * zoom) - sourceSize / 2;
    const sourceY = image.naturalHeight / 2 - position.y / (scale * zoom) - sourceSize / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('Unable to prepare the cropped logo.'));
      return;
    }
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to create the cropped logo image.'));
        return;
      }
      resolve(new File([blob], 'system-logo.png', { type: 'image/png' }));
    }, 'image/png');
  };
  image.onerror = () => reject(new Error('Unable to read the selected image.'));
  image.src = imageUrl;
});

export default function AdminProfile() {
  const [adminData, setAdminData] = useState({ name: '', email: '' });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [images, setImages] = useState({ profile: null });
  const systemLogo = useSystemLogo();

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // --- NEW: Custom Alert Modal ---
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  useEffect(() => {
    let active = true;

    api.get('/admin/me')
      .then(({ data }) => {
        if (!active) return;
        setAdminData({ name: data.name, email: data.email });
        if (data.logo_url) setImages({ profile: data.logo_url });
      })
      .catch((error) => {
        if (!active) return;
        setAlertDialog({
          isOpen: true,
          title: 'Unable to load profile',
          message: getErrorMessage(error, 'Please refresh and try again.'),
          type: 'error',
        });
      });

    return () => { active = false; };
  }, []);

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
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, imageX: 0, imageY: 0 });

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setImageModal({ isOpen: true, type, tempUrl, rawFile: file });
      setZoomLevel(100);
      setImagePosition({ x: 0, y: 0 });
      setImageDimensions({ width: 0, height: 0 });
    }
    e.target.value = null; 
  };

  const handleApplyImage = async () => {
    setIsSavingLogo(true);
    try {
      const formData = new FormData();
      const croppedImage = await createCroppedImage(
        imageModal.tempUrl,
        zoomLevel / 100,
        imagePosition
      );
      formData.append('logo', croppedImage);
      const { data } = await api.post('/admin/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages({ profile: data.logo_url });
      notifySystemLogoChanged(data.logo_url);
      if (imageModal.tempUrl) URL.revokeObjectURL(imageModal.tempUrl);
      setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
      setAlertDialog({ isOpen: true, title: 'Logo Updated', message: 'Your new system logo is saved and will remain after refresh.', type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Unable to update logo', message: getErrorMessage(error, 'Please try again.'), type: 'error' });
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleCloseImageModal = () => {
    if (imageModal.tempUrl) URL.revokeObjectURL(imageModal.tempUrl);
    setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
    setIsDraggingImage(false);
  };

  const getDragBounds = (zoom = zoomLevel) => {
    if (!imageDimensions.width || !imageDimensions.height) return { x: 0, y: 0 };
    const scale = Math.max(PREVIEW_SIZE / imageDimensions.width, PREVIEW_SIZE / imageDimensions.height);
    return {
      x: Math.max(0, (imageDimensions.width * scale * zoom / 100 - PREVIEW_SIZE) / 2),
      y: Math.max(0, (imageDimensions.height * scale * zoom / 100 - PREVIEW_SIZE) / 2),
    };
  };

  const handleImagePointerDown = (event) => {
    if (zoomLevel <= 100) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      x: event.clientX,
      y: event.clientY,
      imageX: imagePosition.x,
      imageY: imagePosition.y,
    });
    setIsDraggingImage(true);
  };

  const handleImagePointerMove = (event) => {
    if (!isDraggingImage) return;
    const bounds = getDragBounds();
    setImagePosition({
      x: clamp(dragStart.imageX + event.clientX - dragStart.x, -bounds.x, bounds.x),
      y: clamp(dragStart.imageY + event.clientY - dragStart.y, -bounds.y, bounds.y),
    });
  };

  const handleZoomChange = (event) => {
    const nextZoom = Number(event.target.value);
    const bounds = getDragBounds(nextZoom);
    setZoomLevel(nextZoom);
    setImagePosition((position) => ({
      x: clamp(position.x, -bounds.x, bounds.x),
      y: clamp(position.y, -bounds.y, bounds.y),
    }));
  };

  useEffect(() => {
    if (!images.profile?.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(images.profile);
  }, [images.profile]);
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true); 
    try {
      const formData = new FormData();
      formData.append('name', adminData.name);
      formData.append('email', adminData.email);

      const { data } = await api.post('/admin/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAdminData({ name: data.admin.name, email: data.admin.email });
      localStorage.setItem('admin_name', data.admin.name);
      window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: data.admin.name }));
      setAlertDialog({ isOpen: true, title: 'Profile Updated', message: 'Your account details and logo have been saved.', type: 'success' });
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Unable to update profile', message: getErrorMessage(error, 'Please try again.'), type: 'error' });
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
      await api.post('/admin/password', {
        current_password: passwords.current,
        new_password: passwords.new,
        new_password_confirmation: passwords.confirm,
      });
      setAlertDialog({ isOpen: true, title: 'Security Updated', message: 'Password changed successfully!', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' }); 
    } catch (error) {
      setAlertDialog({ isOpen: true, title: 'Unable to update password', message: getErrorMessage(error, 'Please try again.'), type: 'error' });
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const eyeButton = 'press absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-hover hover:text-ink';

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 lg:space-y-6">

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
        <Panel index={0} title="Account Details" icon={FiUser} bodyClassName="flex flex-col">
          <form onSubmit={handleSaveProfile} className="flex flex-1 flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="group relative shrink-0">
                <img
                  src={images.profile || systemLogo}
                  alt="System logo"
                  className="h-20 w-20 rounded-full bg-white object-cover p-1 ring-2 ring-brand-dark ring-offset-2 ring-offset-panel dark:ring-brand-gold"
                />
                <label className="press absolute -bottom-0.5 -right-0.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-gold text-brand-dark shadow-md ring-2 ring-panel hover:bg-brand-gold-500" title="Change system logo">
                  <FiCamera size={14} />
                  <span className="sr-only">Change system logo</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFileSelect(e, 'profile')} />
                </label>
              </div>
              <div className="min-w-0">
                <p className="break-words font-display text-2xl font-semibold leading-tight text-ink">{adminData.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">System Administrator</p>
              </div>
            </div>

            <label className="block">
              <span className={labelClass}>Full Name</span>
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email Address</span>
              <input type="email" value={adminData.email} onChange={(e) => setAdminData({...adminData, email: e.target.value})} className={fieldClass} required />
            </label>

            <div className="mt-auto flex justify-end pt-1">
              <Button type="submit" disabled={isSavingProfile} isLoading={isSavingProfile} icon={<FiSave size={17} />} className="w-full sm:w-auto">
                {isSavingProfile ? 'Saving…' : 'Update Details'}
              </Button>
            </div>
          </form>
        </Panel>

        <Panel index={1} title="Security" icon={FiShield} bodyClassName="flex flex-col">
          <p className="mb-5 text-sm text-muted">Use your current password to set a new one. New passwords must be at least 8 characters.</p>
          <form onSubmit={handleSavePassword} className="flex flex-1 flex-col gap-5">

            <label className="block">
              <span className={labelClass}>Current Password</span>
              <div className="relative">
                <input type={showPass.current ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className={`${fieldClass} pr-11`} required />
                <button type="button" onClick={() => togglePass('current')} aria-label={showPass.current ? 'Hide password' : 'Show password'} className={eyeButton}>
                  {showPass.current ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </label>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block">
                <span className={labelClass}>New Password</span>
                <div className="relative">
                  <input type={showPass.new ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className={`${fieldClass} pr-11`} minLength={8} required />
                  <button type="button" onClick={() => togglePass('new')} aria-label={showPass.new ? 'Hide password' : 'Show password'} className={eyeButton}>
                    {showPass.new ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className={labelClass}>Confirm New Password</span>
                <div className="relative">
                  <input type={showPass.confirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className={`${fieldClass} pr-11`} minLength={8} required />
                  <button type="button" onClick={() => togglePass('confirm')} aria-label={showPass.confirm ? 'Hide password' : 'Show password'} className={eyeButton}>
                    {showPass.confirm ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-auto flex justify-end pt-1">
              <Button type="submit" disabled={isSavingSecurity} isLoading={isSavingSecurity} icon={<FiSave size={17} />} className="w-full sm:w-auto">
                {isSavingSecurity ? 'Saving…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      {imageModal.isOpen && (
        <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="logo-crop-title" className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">

            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 id="logo-crop-title" className="font-display text-2xl font-semibold text-ink">Preview system logo</h3>
              <button onClick={handleCloseImageModal} aria-label="Close" className="press rounded-lg p-2 text-muted hover:bg-hover hover:text-ink">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center bg-field p-6">
              <div
                className={`relative flex h-64 w-64 touch-none items-center justify-center overflow-hidden rounded-full border border-line bg-brand-dark/10 shadow-inner dark:bg-brand-dark/40 ${zoomLevel > 100 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                onPointerDown={handleImagePointerDown}
                onPointerMove={handleImagePointerMove}
                onPointerUp={() => setIsDraggingImage(false)}
                onPointerCancel={() => setIsDraggingImage(false)}
              >
                <img
                  src={imageModal.tempUrl}
                  alt="Preview"
                  onLoad={(event) => setImageDimensions({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })}
                  className="pointer-events-none h-full w-full select-none object-cover"
                  style={{
                    transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel / 100})`,
                    userSelect: 'none',
                  }}
                  draggable="false"
                />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>

              <div className="mt-6 flex w-full max-w-xs items-center gap-3 text-muted">
                <FiZoomOut size={18} />
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="1"
                  value={zoomLevel}
                  onChange={handleZoomChange}
                  aria-label="Zoom system logo"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-gold"
                />
                <FiZoomIn size={18} />
                <span className="w-12 text-right text-xs font-semibold tabular-nums text-ink-2">{zoomLevel}%</span>
              </div>

              <p className="mt-3 text-center text-xs text-muted">
                Zoom to resize, then drag the image to adjust its position. Apply Image saves your crop.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-line p-4">
              <Button variant="outline" onClick={handleCloseImageModal}>Cancel</Button>
              <Button onClick={handleApplyImage} disabled={isSavingLogo || !imageDimensions.width} isLoading={isSavingLogo} icon={<FiCheck size={17} />}>
                {isSavingLogo ? 'Saving…' : 'Apply Image'}
              </Button>
            </div>

          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />

    </div>
  );
}
