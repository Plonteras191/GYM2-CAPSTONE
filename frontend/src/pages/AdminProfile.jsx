import { useState } from 'react';
import { 
  FiUser, FiMail, FiLock, FiSave, FiShield, 
  FiEye, FiEyeOff, FiUpload, FiImage, FiLayout,
  FiZoomIn, FiZoomOut, FiCheck, FiX, FiCamera, FiLoader
} from 'react-icons/fi';

import logo from '../assets/logo.png'; 

export default function AdminProfile() {
  // --- 1. STATE MANAGEMENT ---
  const [adminData, setAdminData] = useState({
    name: 'Fustino Padera Anasco Jr.',
    email: 'admin@doublealpha.fit',
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  const [images, setImages] = useState({
    profile: logo,
    logo: logo,
    cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop' 
  });

  // BACKEND INTEGRATION: Loading States to prevent spam-clicking
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // --- 2. INPUT HANDLERS ---
  const handleNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[0-9]/g, '');
    setAdminData({ ...adminData, name: lettersOnly });
  };

  const togglePass = (field) => {
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // --- 3. IMAGE CUSTOMIZATION & DRAG STATE ---
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    type: null, 
    tempUrl: null,
    rawFile: null // BACKEND INTEGRATION: Stores the actual file object for the database
  });
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imagePos, setImagePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setImageModal({ isOpen: true, type, tempUrl, rawFile: file });
      setZoomLevel(100); 
      setImagePos({ x: 0, y: 0 }); 
    }
    e.target.value = null; 
  };

  const handleApplyImage = async () => {
    // BACKEND TODO: Handle Image Upload here
    // Example: 
    // const formData = new FormData(); 
    // formData.append('image', imageModal.rawFile);
    // await axios.post('/api/upload', formData);
    
    setImages((prev) => ({ ...prev, [imageModal.type]: imageModal.tempUrl }));
    setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
  };

  const handleCloseImageModal = () => {
    setImageModal({ isOpen: false, type: null, tempUrl: null, rawFile: null });
  };

  // Drag Handlers
  const handleMouseDown = (e) => { setIsDragging(true); setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y }); };
  const handleMouseMove = (e) => { if (isDragging) setImagePos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => { setIsDragging(false); };

  // --- 4. BACKEND-READY SUBMIT HANDLERS ---
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true); // Triggers loading spinner
    
    try {
      // BACKEND TODO: Replace setTimeout with your actual API endpoint
      // const response = await axios.put('/api/admin/profile', adminData);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated network delay
      alert(`Profile updated successfully for ${adminData.name}!`);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSavingProfile(false); // Turns off loading spinner
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Error: New passwords do not match!");
      return;
    }
    
    setIsSavingSecurity(true);
    
    try {
      // BACKEND TODO: Replace setTimeout with your actual API endpoint
      // await axios.put('/api/admin/security', { current: passwords.current, new: passwords.new });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Security update: Password changed successfully!");
      setPasswords({ current: '', new: '', confirm: '' }); // Clear fields on success
    } catch (error) {
      console.error("Error saving password:", error);
      alert("Failed to update password.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setIsSavingBranding(true);
    
    try {
      // BACKEND TODO: Send 'images' data via API
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("System Branding updated successfully!");
    } catch (error) {
      console.error("Error saving branding:", error);
    } finally {
      setIsSavingBranding(false);
    }
  };

  // --- 5. REUSABLE TAILWIND CLASSES (Fully Light/Dark Compatible) ---
  const inputClass = "w-full p-2.5 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-sm";
  const labelClass = "text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-2";
  
  // UNIFIED BRAND BUTTON: Gradient Yellow-to-Amber
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* --- HEADER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN: Profile Picture --- */}
        <div className="lg:col-span-1 bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center h-fit">
          <div className="relative mb-4 group">
            <img 
              src={images.profile} 
              alt="Admin Profile" 
              className="w-36 h-36 rounded-full object-cover border-4 border-slate-900 dark:border-white bg-white dark:bg-[#252830] p-1 shadow-md transition-transform group-hover:scale-105" 
            />
            
            <label className="absolute bottom-0 right-0 bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center">
              <FiCamera size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'profile')} />
            </label>
          </div>
          
          <h3 className="font-bold text-lg text-slate-800 dark:text-gray-300 mt-2">{adminData.name}</h3>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">System Administrator</p>
        </div>

        {/* --- RIGHT COLUMN: Forms --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Account Details Form */}
          <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
              <FiUser className="text-slate-900 dark:text-gray-300 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Account Details</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <label className="block">
                <span className={labelClass}><FiUser size={14} className="text-slate-400"/> Full Name</span>
                <input 
                  type="text" 
                  value={adminData.name} 
                  onChange={handleNameChange} 
                  className={inputClass} 
                  required 
                />
              </label>
              <label className="block">
                <span className={labelClass}><FiMail size={14} className="text-slate-400"/> Email Address</span>
                <input type="email" value={adminData.email} onChange={(e) => setAdminData({...adminData, email: e.target.value})} className={inputClass} required />
              </label>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingProfile} className={primaryButtonClass}>
                  {isSavingProfile ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingProfile ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. Security Form */}
          <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3">
              <FiShield className="text-red-500 text-xl" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">Security</h3>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Update your administrative password. It will be securely hashed before storage.</p>
            <form onSubmit={handleSavePassword} className="space-y-5">
              
              <label className="block relative">
                <span className={labelClass}><FiLock size={14} className="text-slate-400"/> Current Password</span>
                <div className="relative">
                  <input type={showPass.current ? "text" : "password"} value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className={inputClass} required />
                  <button type="button" onClick={() => togglePass('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {showPass.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-slate-400"/> New Password</span>
                  <div className="relative">
                    <input type={showPass.new ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className={inputClass} required />
                    <button type="button" onClick={() => togglePass('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPass.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="block relative">
                  <span className={labelClass}><FiLock size={14} className="text-slate-400"/> Confirm New Password</span>
                  <div className="relative">
                    <input type={showPass.confirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className={inputClass} required />
                    <button type="button" onClick={() => togglePass('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPass.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSavingSecurity} className={primaryButtonClass}>
                  {isSavingSecurity ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />} 
                  {isSavingSecurity ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* --- BOTTOM SECTION: System Branding --- */}
      <div className="bg-white dark:bg-[#252830] p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm mt-6">
        
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-3">
          <FiLayout className="text-slate-900 dark:text-gray-300 text-xl" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300">System Branding</h3>
        </div>

        <form onSubmit={handleSaveBranding} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-3">
            <span className={labelClass}><FiImage size={14} className="text-slate-400"/> Sidebar Logo</span>
            <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
              <img 
                src={images.logo} 
                alt="App Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-900 dark:border-white bg-white dark:bg-[#252830] p-0.5" 
              />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recommended: 256x256 PNG</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#252830] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <FiUpload /> Choose New Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'logo')} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className={labelClass}><FiImage size={14} className="text-slate-400"/> Dashboard Cover Photo</span>
            <div className="flex flex-col gap-3 p-4 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-[#1e1e1e]">
              <img src={images.cover} alt="Dashboard Cover" className="w-full h-24 rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
              <div className="flex justify-between items-center w-full">
                <p className="text-xs font-medium text-slate-500">Wide format (1920x400)</p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#252830] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <FiUpload /> Change Cover
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'cover')} />
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <button type="submit" disabled={isSavingBranding} className={primaryButtonClass}>
              {isSavingBranding ? <FiLoader className="animate-spin" size={18} /> : <FiCheck size={18} />} 
              {isSavingBranding ? 'Applying...' : 'Apply Branding Changes'}
            </button>
          </div>

        </form>
      </div>

      {/* =========================================
          IMAGE CUSTOMIZATION MODAL (Backend Ready)
          ========================================= */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50 dark:bg-[#1e1e1e]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-gray-300 capitalize">
                Adjust {imageModal.type} Photo
              </h3>
              <button onClick={handleCloseImageModal} className="text-slate-400 hover:text-red-500 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center bg-slate-100 dark:bg-[#1a1c23]">
              
              <div 
                className={`relative overflow-hidden bg-black/10 dark:bg-black/30 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center cursor-move
                ${imageModal.type === 'cover' ? 'w-full aspect-video rounded-xl' : 'w-64 h-64 rounded-full'}
              `}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={imageModal.tempUrl} 
                  alt="Preview" 
                  className="relative pointer-events-none" 
                  style={{ 
                    transform: `translate(${imagePos.x}px, ${imagePos.y}px) scale(${zoomLevel / 100})`,
                    userSelect: 'none'
                  }}
                  draggable="false"
                />
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>

              <div className="w-full max-w-xs mt-6 flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <FiZoomOut size={20} />
                <input 
                  type="range" 
                  min="100" max="250" 
                  value={zoomLevel} 
                  onChange={(e) => setZoomLevel(e.target.value)}
                  className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <FiZoomIn size={20} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium text-center">
                Drag image to reposition & use slider to zoom.
              </p>
            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1e1e1e] flex justify-end gap-3">
              <button onClick={handleCloseImageModal} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              
              <button onClick={handleApplyImage} className={primaryButtonClass}>
                <FiCheck size={18} /> Apply Image
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}