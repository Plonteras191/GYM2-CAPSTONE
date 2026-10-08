import { useEffect, useState } from 'react';
import { 
  FiUser, FiMail, FiLock, FiSave, FiShield, 
  FiEye, FiEyeOff,
  FiCheck, FiX, FiCamera, FiLoader, FiCheckCircle, FiAlertCircle,
  FiZoomIn, FiZoomOut
} from 'react-icons/fi';

import api from '../api';
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

  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-sm";
  const labelClass = "text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300 flex items-center gap-2 mb-2";
  const primaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-gray-400 dark:border-gray-600 pb-3">
              <FiUser className="text-black dark:text-gray-300 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Account Details</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-1 flex-col space-y-5">
              <div className="flex items-center gap-4 pb-4">
                <div className="relative shrink-0 group">
                  <img
                    src={images.profile || systemLogo}
                    alt="System logo"
                    className="h-20 w-20 rounded-full border-2 border-slate-900 bg-white object-cover p-1 shadow-md dark:border-white dark:bg-[#252830]"
                  />
                  <label className="absolute bottom-0 right-0 flex cursor-pointer items-center justify-center rounded-full bg-yellow-500 p-2 text-black shadow-lg transition-transform hover:bg-yellow-400 active:scale-95">
                    <FiCamera size={15} />
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFileSelect(e, 'profile')} />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="break-words font-bold text-slate-800 dark:text-gray-300">{adminData.name}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-300">System Administrator</p>
                </div>
              </div>

              <label className="block">
                <span className={labelClass}><FiUser size={14} className="text-gray-500 dark:text-gray-300"/> Full Name</span>
                <input 
                  type="text" 
                  value={adminData.name} 
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  className={inputClass} 
                  required 
                />
              </label>
              <label className="block">
                <span className={labelClass}><FiMail size={14} className="text-gray-500 dark:text-gray-300"/> Email Address</span>
                <input type="email" value={adminData.email} onChange={(e) => setAdminData({...adminData, email: e.target.value})} className={inputClass} required />
              </label>
              
              <div className="mt-auto flex justify-end pt-2">
                <button type="submit" disabled={isSavingProfile} className={`${primaryButtonClass} w-full sm:w-auto`}>
                  {isSavingProfile ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingProfile ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
        </div>

        <div className="flex h-full flex-col bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-gray-400 dark:border-gray-600 pb-3">
              <FiShield className="text-black dark:text-gray-300 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Security</h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">Use your current password to set a new one. New passwords must be at least 8 characters.</p>
            <form onSubmit={handleSavePassword} className="flex flex-1 flex-col space-y-5">
              
              <label className="block relative">
                <span className={labelClass}><FiLock size={14} className="text-gray-500 dark:text-gray-300"/> Current Password</span>
                <div className="relative">
                  <input type={showPass.current ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className={inputClass} required />
                  <button type="button" onClick={() => togglePass('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
                    {showPass.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-gray-500 dark:text-gray-300"/> New Password</span>
                  <div className="relative">
                    <input type={showPass.new ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className={inputClass} minLength={8} required />
                    <button type="button" onClick={() => togglePass('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
                      {showPass.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-gray-500 dark:text-gray-300"/> Confirm New Password</span>
                  <div className="relative">
                    <input type={showPass.confirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className={inputClass} minLength={8} required />
                    <button type="button" onClick={() => togglePass('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-200">
                      {showPass.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="mt-auto flex justify-end pt-2">
                <button type="submit" disabled={isSavingSecurity} className={`${primaryButtonClass} w-full sm:w-auto`}>
                  {isSavingSecurity ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingSecurity ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
        </div>
      </div>

      {imageModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-[#1e1e1e]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">
                Preview system logo
              </h3>
              <button onClick={handleCloseImageModal} className="text-gray-500 hover:text-red-500 transition-colors dark:text-gray-300">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-slate-100 dark:bg-[#1a1c23]">
              
              <div
                className={`relative flex h-64 w-64 touch-none items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-black/10 shadow-inner dark:border-slate-700 dark:bg-black/30 ${zoomLevel > 100 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
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
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>

              <div className="mt-6 flex w-full max-w-xs items-center gap-3 text-gray-500 dark:text-gray-300">
                <FiZoomOut size={20} />
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="1"
                  value={zoomLevel}
                  onChange={handleZoomChange}
                  aria-label="Zoom system logo"
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300 accent-amber-500 dark:bg-slate-700"
                />
                <FiZoomIn size={20} />
                <span className="w-12 text-right text-xs font-semibold">{zoomLevel}%</span>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 font-medium text-center">
                Zoom to resize, then drag the image to adjust its position. Apply Image saves your crop.
              </p>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex justify-end gap-3">
              <button onClick={handleCloseImageModal} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              
              <button onClick={handleApplyImage} disabled={isSavingLogo || !imageDimensions.width} className={primaryButtonClass}>
                {isSavingLogo ? <FiLoader className="animate-spin" size={18} /> : <FiCheck size={18} />}
                {isSavingLogo ? 'Saving...' : 'Apply Image'}
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
              <p className="text-gray-500 dark:text-gray-300 font-medium whitespace-pre-line">{alertDialog.message}</p>
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