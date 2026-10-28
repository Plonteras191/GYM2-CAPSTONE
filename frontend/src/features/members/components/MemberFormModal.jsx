import React, { useRef, useState } from 'react';
import { FiX, FiSave, FiLoader, FiUpload, FiPlus, FiEdit2 } from 'react-icons/fi';
import AvatarEditor from 'react-avatar-editor';
import CameraCapture from './CameraCapture';
import api from '../../../api';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';

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
  const initialSnapshotRef = useRef('');

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
        profilePicUrl: initialData.profilePicUrl || initialData.profile_pic || null,
        enrolledFaceId: initialData.enrolledFaceId || initialData.enrolled_face_id || null
      } : defaultForm;
      setFormData(initial);
      setProfilePic(null);
      setEditorScale(1.2);
      const initialFaceImage = isEditing && (initialData?.enrolledFaceId || initialData?.enrolled_face_id) ? 'existing_data' : null;
      setFaceImage(initialFaceImage);
      initialSnapshotRef.current = JSON.stringify({ form: initial, faceImage: initialFaceImage });
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
      const aiBase = import.meta.env.VITE_AI_URL || 'http://127.0.0.1:5000';
      fetch(`${aiBase}/refresh_ai`, { method: 'POST' }).catch(() => {});
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
    setFormData({ ...formData, [field]: e.target.value.replace(/[^\p{L}\p{M}\s'-]/gu, '') });
  };
  const handlePhoneChange = (e) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryBtn = "flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-sm";
  const saveMemberBtn = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const saveChangesBtn = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-yellow-400 to-amber-500 px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-black shadow-sm transition-all hover:brightness-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";
  const bmiData = getBmiInfo(formData.height, formData.weight);
  const isDirty = Boolean(profilePic)
    || JSON.stringify({ form: formData, faceImage }) !== initialSnapshotRef.current;
  const unsavedChangesGuard = useUnsavedChangesGuard(isDirty);
  const requestClose = () => unsavedChangesGuard.requestClose(() => {
    stopCamera();
    onClose();
  });

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-2xl dark:border-gray-600 dark:bg-[#252830]">
        
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
        <div className="flex items-center justify-between border-b-2 border-gray-300 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-gray-300">
            {isEditing ? <FiEdit2 size={19} /> : <FiPlus size={20} />}
            {isEditing ? 'Edit Member Profile' : 'Add New Member'}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close member form"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-gray-600 dark:bg-[#252830] dark:text-gray-300 dark:hover:bg-red-500/10"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-100 p-4 dark:bg-[#191b22] sm:p-5">
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            {/* Profile Pic */}
            <div className="flex min-h-[18rem] flex-col items-center gap-3 rounded-xl border-2 border-gray-300 bg-white p-4 text-center shadow-sm dark:border-gray-600 dark:bg-[#252830]">
              <h4 className="flex h-6 items-center font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Display Picture</h4>
              {profilePic ? (
                <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
                  <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-amber-500 shadow-lg">
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
                <label className="group relative mt-2 flex flex-1 cursor-pointer items-center justify-center">
                  <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-dashed border-gray-400 bg-white transition-colors group-hover:border-amber-500 dark:border-gray-500 dark:bg-[#252830]">
                    {formData.profilePicUrl ? (
                      <img src={formData.profilePicUrl} alt="Existing Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FiUpload className="text-gray-400 group-hover:text-amber-500" size={24} />
                      </div>
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
          <form id="memberForm" className="space-y-5" onSubmit={handleSave}>
            <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-[#252830]">
              <h4 className="mb-4 border-b-2 border-gray-300 pb-2 text-base font-bold text-slate-800 dark:border-gray-600 dark:text-gray-300">Personal Details</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block"><span className={labelClass}>First Name</span><input type="text" required value={formData.firstName} onChange={e => handleNameChange(e, 'firstName')} className={inputClass} placeholder="Juan" /></label>
                <label className="block"><span className={labelClass}>Last Name</span><input type="text" required value={formData.lastName} onChange={e => handleNameChange(e, 'lastName')} className={inputClass} placeholder="Dela Cruz" /></label>
                <label className="block"><span className={labelClass}>Email</span><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="juan@email.com" /></label>
                <label className="block lg:col-span-2"><span className={labelClass}>Address</span><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={inputClass} placeholder="123 Gym Street, Tagoloan" /></label>
                <label className="block">
                  <span className={labelClass}>Phone Number</span>
                  <input type="text" required value={formData.phone || ''} onChange={handlePhoneChange} className={inputClass} placeholder="09123456789" />
                  <span className="text-[10px] text-gray-400 font-medium float-right mt-1">{(formData.phone || '').length}/11</span>
                </label>
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <label className="block"><span className={labelClass}>Date of Birth</span><input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} /></label>
                  <label className="block"><span className={labelClass}>Height (cm)</span><input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} className={inputClass} placeholder="170" /></label>
                  <label className="block"><span className={labelClass}>Weight (kg)</span><input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} className={inputClass} placeholder="65" /></label>

                  <label className="block min-w-0">
                    <span className={labelClass}>Body Mass Index</span>
                    <div className={`flex min-h-[46px] items-center justify-between gap-3 rounded-xl border-2 p-2.5 shadow-sm ${bmiData.color}`}>
                      <span className="min-w-0 truncate text-sm font-medium">{bmiData.label}</span>
                      <span className="shrink-0 text-sm font-bold tabular-nums">{bmiData.value}</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t-2 border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800 sm:p-5">
          <button type="button" onClick={requestClose} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
          <button form="memberForm" type="submit" disabled={isSaving || ((formData.phone || '').length > 0 && (formData.phone || '').length < 11)} className={isEditing ? saveChangesBtn : saveMemberBtn}>
            {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Member')}
          </button>
        </div>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}