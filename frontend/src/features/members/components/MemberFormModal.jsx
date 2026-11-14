import React, { useRef, useState } from 'react';
import { FiX, FiSave, FiLoader, FiUpload, FiUserPlus, FiEdit2, FiAlertCircle } from 'react-icons/fi';
import AvatarEditor from 'react-avatar-editor';
import CameraCapture from './CameraCapture';
import api from '../../../api';
import { aiEngineFetch } from '../../../utils/aiEngine';
import useUnsavedChangesGuard from '../../../components/ui/useUnsavedChangesGuard.jsx';
import { formatNumber } from '../../../utils/numberFormat';
import Button from '../../../components/ui/Button';
import { fieldClass, labelClass } from '../../../components/ui/field';

// The first view is also used as the profile picture, so keep Front first.
// Side views are slight turns: the face recognizer cannot use full profiles.
// "Chin down" matches how ceiling-mounted CCTV sees members.
const FACE_CAPTURE_VIEWS = [
  { label: 'Front', instruction: 'Face the camera and look straight ahead.' },
  { label: 'Chin down', instruction: 'Keep facing the camera and tilt your chin down slightly.' },
  { label: 'Left', instruction: 'Turn your head slightly to your left (about 30°), both eyes visible.' },
  { label: 'Right', instruction: 'Turn your head slightly to your right (about 30°), both eyes visible.' },
];

const getBmiInfo = (height, weight) => {
  if (!height || !weight) return { value: 'N/A', label: 'Need Data', color: 'bg-hover text-ink-2 border-line-strong' };
  const bmi = formatNumber(weight / Math.pow(height / 100, 2), { maximumFractionDigits: 1 });
  const n = parseFloat(bmi);
  if (n < 16) return { value: bmi, label: 'Severe Thinness', color: 'bg-negative-soft text-negative border-negative/40' };
  if (n < 17) return { value: bmi, label: 'Moderate Thin', color: 'bg-warn-soft text-warn border-warn/40 dark:bg-warn-soft dark:text-warn dark:border-warn/40' };
  if (n < 18.5) return { value: bmi, label: 'Mild Thinness', color: 'bg-warn-soft text-warn border-warn/40' };
  if (n < 25) return { value: bmi, label: 'Normal', color: 'bg-positive-soft text-positive border-positive/40' };
  if (n < 30) return { value: bmi, label: 'Overweight', color: 'bg-warn-soft text-warn border-warn/40' };
  if (n < 35) return { value: bmi, label: 'Obese Class I', color: 'bg-warn-soft text-warn border-warn/40 dark:bg-warn-soft dark:text-warn dark:border-warn/40' };
  if (n < 40) return { value: bmi, label: 'Obese Class II', color: 'bg-negative-soft text-negative border-negative/40' };
  return { value: bmi, label: 'Obese Class III', color: 'bg-negative-soft text-negative border-negative/40' };
};

const defaultForm = {
  id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active',
  enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
};

/* ── Presentation helpers ── */
const Required = () => <span aria-hidden="true" className="ml-0.5 text-negative">*</span>;

const FieldError = ({ children }) => (
  <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-negative">
    <FiAlertCircle size={13} aria-hidden="true" className="shrink-0" /> {children}
  </span>
);

function FormSection({ step, title, hint, children }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[13px] font-medium text-brand-white dark:bg-brand-gold dark:text-brand-dark">{step}</span>
        <div className="min-w-0">
          <h4 className="text-base font-medium leading-tight text-ink">{title}</h4>
          {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function MemberFormModal({ isOpen, isEditing, initialData, onClose, onSaved, onShowAlert }) {
  const [formData, setFormData] = useState(initialData || defaultForm);
  const [profilePic, setProfilePic] = useState(null);
  const [faceImage, setFaceImage] = useState(null);
  const [capturedFaceViews, setCapturedFaceViews] = useState([]);
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorScale, setEditorScale] = useState(1.2);
  const [invalidFields, setInvalidFields] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
      setInvalidFields({});
      setHasAttemptedSubmit(false);
      setProfilePic(null);
      setEditorScale(1.2);
      const initialFaceImage = isEditing && (initialData?.enrolledFaceId || initialData?.enrolled_face_id) ? 'existing_data' : null;
      setFaceImage(initialFaceImage);
      setCapturedFaceViews([]);
      setBiometricConsent(false);
      initialSnapshotRef.current = JSON.stringify({ form: initial, faceImage: initialFaceImage, capturedFaceViews: [] });
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
    if (faceImage === 'existing_data') {
      setFaceImage(null);
      setCapturedFaceViews([]);
    }
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
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
      ctx.drawImage(video, xOff, yOff, size, size, 0, 0, canvas.width, canvas.height);
      if (capturedFaceViews.length + 1 === FACE_CAPTURE_VIEWS.length) {
        setFaceImage(null);
      }
      setCapturedFaceViews(views => [...views, canvas.toDataURL('image/png')]);
      stopCamera();
    }
  };

  const combineFaceViews = async () => {
    const images = await Promise.all(capturedFaceViews.map(source => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('A captured face image could not be loaded.'));
      image.src = source;
    })));
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300 * images.length;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the face enrollment image.');
    images.forEach((image, index) => context.drawImage(image, 0, index * 300, 300, 300));
    return canvas.toDataURL('image/png');
  };

  const getCroppedBlob = () => new Promise(resolve => {
    if (editorRef.current) {
      editorRef.current.getImageScaledToCanvas().toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
    } else resolve(null);
  });

  const getFrontViewBlob = () => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not prepare the front-view profile picture.'));
        return;
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob(blob => blob
        ? resolve(blob)
        : reject(new Error('Could not create the front-view profile picture.')), 'image/jpeg', 0.85);
    };
    image.onerror = () => reject(new Error('The captured front view could not be loaded.'));
    image.src = capturedFaceViews[0];
  });

  const handleSave = async (e) => {
    e.preventDefault();
    const hasExistingEnrollment = faceImage === 'existing_data';
    const hasNewEnrollment = capturedFaceViews.length === FACE_CAPTURE_VIEWS.length;
    if (!hasExistingEnrollment && !hasNewEnrollment) {
      onShowAlert('Face Capture Required', `Capture all ${FACE_CAPTURE_VIEWS.length} face views (${FACE_CAPTURE_VIEWS.map(view => view.label.toLowerCase()).join(', ')}) before saving this member.`, 'error');
      return;
    }

    if (hasNewEnrollment && !biometricConsent) {
      onShowAlert('Consent Required', 'Tick the consent box to confirm the member agrees to face enrollment before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', formData.firstName || formData.first_name || '');
      fd.append('last_name', formData.lastName || formData.last_name || '');
      fd.append('email', formData.email || '');
      fd.append('phone', formData.phone || '');
      fd.append('address', formData.address || '');
      fd.append('plan', formData.plan || 'Walk-in');
      fd.append('status', formData.status === 'Inactive' ? 'Inactive' : 'Active');
      if (formData.dob) fd.append('dob', formData.dob);
      if (formData.height) fd.append('height', formData.height);
      if (formData.weight) fd.append('weight', formData.weight);
      if (profilePic && editorRef.current) {
        const blob = await getCroppedBlob();
        if (blob) fd.append('profile_pic', blob, 'profile.jpg');
      } else if (profilePic) {
        fd.append('profile_pic', profilePic);
      } else if (hasNewEnrollment) {
        const frontViewBlob = await getFrontViewBlob();
        fd.append('profile_pic', frontViewBlob, 'profile-front.jpg');
      }

      if (hasNewEnrollment) {
        fd.append('enrolled_face_id', await combineFaceViews());
        fd.append('biometric_consent', '1');
      }
      if (isEditing) {
        fd.append('_method', 'PUT');
        await api.post(`/members/${formData.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/members', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      aiEngineFetch('/refresh_ai', { method: 'POST' }).catch(() => {});
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
    const value = e.target.value.replace(/[^\p{L}\p{M}\s'-]/gu, '');
    const normalizedValue = field === 'firstName'
      ? value.toLocaleLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase()}`)
      : value;
    setFormData({ ...formData, [field]: normalizedValue });
  };
  const handlePhoneChange = (e) => {
    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
  };
  const handleAddressChange = (e) => {
    const value = e.target.value.replace(/[^\p{L}\p{M}\d\s,'#./-]/gu, '');
    setFormData({
      ...formData,
      address: value.toLocaleLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toLocaleUpperCase()}`),
    });
  };
  const trackFieldValidity = (field, input) => {
    if (!hasAttemptedSubmit) return;
    setInvalidFields(previous => ({ ...previous, [field]: !input.checkValidity() }));
  };

  const inputClass = fieldClass;
  const getInputClass = field => `${fieldClass}${invalidFields[field] ? ' !border-negative !ring-2 !ring-negative/20' : ''}`;
  const bmiData = getBmiInfo(formData.height, formData.weight);
  const isDirty = Boolean(profilePic)
    || JSON.stringify({ form: formData, faceImage, capturedFaceViews }) !== initialSnapshotRef.current;
  const unsavedChangesGuard = useUnsavedChangesGuard(isOpen && isDirty);
  const requestClose = () => unsavedChangesGuard.requestClose(() => {
    stopCamera();
    onClose();
  });

  if (!isOpen) return null;

  const phoneLength = (formData.phone || '').length;

  return (
    <>
    <div className="animate-fade-in fixed inset-0 z-60 flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-form-title"
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
      >

        {/* Hide the number input spinner arrows */}
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
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="member-form-title" className="flex items-center gap-2.5 text-xl font-medium tracking-[-0.01em] text-ink">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warn-soft text-warn">
                {isEditing ? <FiEdit2 size={17} /> : <FiUserPlus size={18} />}
              </span>
              {isEditing ? 'Edit member' : 'Register a member'}
            </h3>
            <p className="mt-1.5 text-[13px] text-muted">
              Fields marked <span className="text-negative">*</span> are required. Face photos are needed for camera check-in.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            aria-label="Close member form"
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:border-negative/40 hover:bg-negative-soft hover:text-negative disabled:opacity-50"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-canvas p-4 sm:p-6">
          <FormSection step={1} title="Photos" hint="A profile photo and the face photos used for camera check-in.">
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              {/* Profile photo */}
              <div className="flex min-h-72 flex-col gap-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
                <div>
                  <h4 className="text-[15px] font-medium text-ink">Profile photo</h4>
                  <p className="mt-0.5 text-[13px] text-muted">Optional. The front face photo is used if you skip this.</p>
                </div>
                {profilePic ? (
                  <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
                    <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full ring-4 ring-brand-gold/40">
                      <AvatarEditor ref={editorRef} image={profilePic} width={150} height={150} border={0} borderRadius={75} color={[255,255,255,0.6]} scale={editorScale} rotate={0} />
                    </div>
                    <div className="flex w-full max-w-52 items-center gap-2.5 text-muted">
                      <span aria-hidden="true" className="text-sm">−</span>
                      <input type="range" min="1" max="3" step="0.01" value={editorScale} onChange={e => setEditorScale(parseFloat(e.target.value))} aria-label="Zoom profile photo" className="w-full cursor-pointer accent-brand-gold" />
                      <span aria-hidden="true" className="text-sm">+</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { setProfilePic(null); setEditorScale(1.2); }}>Choose a different photo</Button>
                  </div>
                ) : (
                  <label className="group flex flex-1 cursor-pointer flex-col items-center justify-center gap-3">
                    <span className="h-40 w-40 overflow-hidden rounded-full border-2 border-dashed border-line-strong bg-field transition-[border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-focus">
                      {formData.profilePicUrl ? (
                        <img src={formData.profilePicUrl} alt="Current profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted transition-colors group-hover:text-warn">
                          <FiUpload size={26} />
                        </span>
                      )}
                    </span>
                    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-2 transition-colors group-hover:bg-hover group-hover:text-ink">
                      <FiUpload size={14} aria-hidden="true" /> {formData.profilePicUrl ? 'Upload a new photo' : 'Upload a photo'}
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={e => { setProfilePic(e.target.files[0]); setEditorScale(1.2); }} />
                  </label>
                )}
              </div>

              {/* Face photos for check-in */}
              <CameraCapture
                isCameraActive={isCameraActive}
                faceImage={faceImage}
                capturedViews={capturedFaceViews}
                captureViews={FACE_CAPTURE_VIEWS}
                videoRef={videoRef}
                canvasRef={canvasRef}
                onStart={startCamera}
                onCapture={captureFace}
                onStop={stopCamera}
                onRetake={() => { setCapturedFaceViews([]); startCamera(); }}
              />
              {faceImage !== 'existing_data' && (
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors md:col-span-2 ${biometricConsent ? 'border-positive/40 bg-positive-soft' : 'border-line bg-panel hover:bg-field'}`}>
                  <input
                    type="checkbox"
                    checked={biometricConsent}
                    onChange={e => setBiometricConsent(e.target.checked)}
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 cursor-pointer accent-brand-gold"
                  />
                  <span className="text-[13px] leading-snug text-ink-2">
                    <span className="font-medium text-ink">The member agrees to face photos.<Required /></span>{' '}
                    The gym stores them only for attendance and workout monitoring (Data Privacy Act of 2012, RA 10173).
                  </span>
                </label>
              )}
            </div>
          </FormSection>

          <form id="memberForm" className="space-y-4" onSubmit={handleSave} onInvalidCapture={event => {
            // Our own message shows under each field, so hide the browser's bubble
            // (the save is still blocked) and move to the first field to fix.
            event.preventDefault();
            const firstInvalid = event.currentTarget.querySelector(':invalid');
            if (firstInvalid === event.target) {
              event.target.focus();
              event.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
            setHasAttemptedSubmit(true);
            const field = event.target.name;
            if (field) setInvalidFields(previous => ({ ...previous, [field]: true }));
          }}>
            <FormSection step={2} title="Personal details" hint="Used to find the member and to contact them.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className={labelClass}>First name<Required /></span>
                  <input name="firstName" type="text" required value={formData.firstName} onChange={e => { handleNameChange(e, 'firstName'); trackFieldValidity('firstName', e.currentTarget); }} aria-invalid={Boolean(invalidFields.firstName)} className={getInputClass('firstName')} placeholder="Juan" />
                  {invalidFields.firstName && <FieldError>Enter the member's first name.</FieldError>}
                </label>
                <label className="block">
                  <span className={labelClass}>Last name<Required /></span>
                  <input name="lastName" type="text" required value={formData.lastName} onChange={e => { handleNameChange(e, 'lastName'); trackFieldValidity('lastName', e.currentTarget); }} aria-invalid={Boolean(invalidFields.lastName)} className={getInputClass('lastName')} placeholder="Dela Cruz" />
                  {invalidFields.lastName && <FieldError>Enter the member's last name.</FieldError>}
                </label>
                <label className="block">
                  <span className={labelClass}>Email<Required /></span>
                  <input name="email" type="email" required value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); trackFieldValidity('email', e.currentTarget); }} aria-invalid={Boolean(invalidFields.email)} className={getInputClass('email')} placeholder="juan@email.com" />
                  {invalidFields.email && <FieldError>Enter a valid email address.</FieldError>}
                </label>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>Address</span>
                  <input type="text" value={formData.address} onChange={handleAddressChange} className={inputClass} placeholder="123 Gym Street, Tagoloan" />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink-2">Phone number<Required /></span>
                    <span className={`text-xs tabular-nums ${phoneLength === 11 ? 'text-positive' : 'text-muted'}`}>{phoneLength} of 11 digits</span>
                  </span>
                  <input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{11}" minLength={11} maxLength={11} required value={formData.phone || ''} onChange={e => { handlePhoneChange(e); trackFieldValidity('phone', e.currentTarget); }} aria-invalid={Boolean(invalidFields.phone)} className={`${getInputClass('phone')} tabular-nums`} placeholder="09123456789" />
                  {invalidFields.phone && <FieldError>Enter all 11 digits of the phone number.</FieldError>}
                </label>
                {isEditing && (
                  <label className="block">
                    <span className={labelClass}>Member status</span>
                    <select
                      name="status"
                      value={formData.status === 'Inactive' ? 'Inactive' : 'Active'}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <span className="mt-1.5 block text-xs text-muted">
                      Set automatically: Inactive after 1 month without a visit, Active again on check-in.
                    </span>
                  </label>
                )}
              </div>
            </FormSection>

            <FormSection step={3} title="Body measurements" hint="Optional. Height and weight work out the body mass index (BMI).">
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="block"><span className={labelClass}>Date of birth</span><input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} /></label>
                <label className="block">
                  <span className={labelClass}>Height (cm)</span>
                  <input type="number" min="1" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} className={`${inputClass} tabular-nums`} placeholder="170" />
                  {Number(formData.height) > 0 && (
                    <span className="mt-1.5 block text-xs text-muted">
                      About {Math.floor(Math.round(Number(formData.height) / 2.54) / 12)} ft {Math.round(Number(formData.height) / 2.54) % 12} in
                    </span>
                  )}
                </label>
                <label className="block"><span className={labelClass}>Weight (kg)</span><input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} className={`${inputClass} tabular-nums`} placeholder="65" /></label>

                <div className="block min-w-0">
                  <span className={labelClass}>Body mass index</span>
                  <div aria-live="polite" className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-200 ${bmiData.color}`}>
                    <span className="min-w-0 truncate text-sm font-medium">{bmiData.label === 'Need Data' ? 'Add height and weight' : bmiData.label}</span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{bmiData.value === 'N/A' ? '—' : bmiData.value}</span>
                  </div>
                </div>
              </div>
            </FormSection>
          </form>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button variant="outline" onClick={requestClose} disabled={isSaving} className="w-full sm:w-auto">Cancel</Button>
          <Button
            form="memberForm"
            type="submit"
            size="lg"
            disabled={isSaving || (phoneLength > 0 && phoneLength < 11)}
            icon={isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving…' : (isEditing ? 'Save changes' : 'Save member')}
          </Button>
        </div>
      </div>
    </div>
    {unsavedChangesGuard.dialog}
    </>
  );
}
