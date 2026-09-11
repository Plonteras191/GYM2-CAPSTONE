import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiCamera, 
  FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiUsers, FiUpload,
  FiLoader, FiSave, FiX, FiCheckCircle, FiVideoOff, FiEye,
  FiActivity, FiCalendar, FiClock, FiMail, FiPhone, FiMapPin, FiLock, FiList, FiAlertCircle
} from 'react-icons/fi';
import api from '../api';
import AvatarEditor from 'react-avatar-editor';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const getBmiInfo = (height, weight) => {
  if (!height || !weight) return { value: 'N/A', label: 'Need Data', color: 'bg-slate-50 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-500' };
  
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const numBmi = parseFloat(bmi);

  if (numBmi < 16) return { value: bmi, label: 'Severe Thinness', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  if (numBmi >= 16 && numBmi < 17) return { value: bmi, label: 'Moderate Thin', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (numBmi >= 17 && numBmi < 18.5) return { value: bmi, label: 'Mild Thinness', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (numBmi >= 18.5 && numBmi < 25) return { value: bmi, label: 'Normal', color: 'bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50' };
  if (numBmi >= 25 && numBmi < 30) return { value: bmi, label: 'Overweight', color: 'bg-amber-50 text-amber-700 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/50' };
  if (numBmi >= 30 && numBmi < 35) return { value: bmi, label: 'Obese Class I', color: 'bg-orange-50 text-orange-700 border-orange-500 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/50' };
  if (numBmi >= 35 && numBmi < 40) return { value: bmi, label: 'Obese Class II', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
  return { value: bmi, label: 'Obese Class III', color: 'bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50' };
};

const getTaskStatus = (log) => {
  const isAssigned = log.exercise.startsWith('ASSIGNED: ');
  if (!isAssigned) return 'VERIFIED';
  
  const logDate = new Date(log.created_at);
  const now = new Date();
  
  const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (logDay < todayDay) return 'MISSED';
  
  if (logDay.getTime() === todayDay.getTime()) {
      const isPast930PM = now.getHours() > 21 || (now.getHours() === 21 && now.getMinutes() >= 30);
      if (isPast930PM) return 'MISSED';
      return 'PENDING';
  }
  
  return 'PENDING';
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [coachNotes, setCoachNotes] = useState('');
  
  const [activeProfileTab, setActiveProfileTab] = useState('workouts');
  const [profileAttendance, setProfileAttendance] = useState([]);
  const [profileWorkouts, setProfileWorkouts] = useState([]);
  
  const [workoutPage, setWorkoutPage] = useState(1);
  const [expandedDate, setExpandedDate] = useState(null);

  const [exercisesLib, setExercisesLib] = useState([]);
  const [exSearch, setExSearch] = useState('');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const defaultRoutine = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
  const [weeklyRoutine, setWeeklyRoutine] = useState(defaultRoutine);
  const [activeDay, setActiveDay] = useState('Monday');

  // --- CUSTOM POPUP MODALS STATE ---
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleManualVerify = async (logId) => {
    try {
      await api.put(`/workouts/${logId}/manual-verify`);
      const workRes = await api.get(`/members/${selectedProfile.id}/workouts`);
      setProfileWorkouts(workRes.data);
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const handleAssignWeeklyPlan = async () => {
    localStorage.setItem(`routine_${selectedProfile.id}`, JSON.stringify(weeklyRoutine));
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaysExercises = weeklyRoutine[currentDayName] || [];

    try {
        for (let ex of todaysExercises) {
            await api.post(`/members/${selectedProfile.id}/assign-task`, { exercise: ex.name.toUpperCase() }).catch(()=>{});
        }
        setAlertDialog({ 
            isOpen: true, 
            title: 'Plan Saved', 
            message: `✅ Weekly routine saved! Today's tasks (${currentDayName}) have been dispatched to the AI for monitoring.`, 
            type: 'success' 
        });
        
        const workRes = await api.get(`/members/${selectedProfile.id}/workouts`);
        setProfileWorkouts(workRes.data);
    } catch (error) {
        console.error("Failed to assign plan", error);
        setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to assign workout plan.', type: 'error' });
    }
  };

  const handleAddExercise = (ex) => {
      if(!weeklyRoutine[activeDay].some(e => e.id === ex.id)) {
          setWeeklyRoutine({...weeklyRoutine, [activeDay]: [...weeklyRoutine[activeDay], ex]});
      }
  };

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const defaultForm = {
    id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active', 
    enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
  };
  const [formData, setFormData] = useState(defaultForm);
  const [profilePic, setProfilePic] = useState(null);
  const editorRef = useRef(null);
  const [editorScale, setEditorScale] = useState(1.2);

  const fetchMembers = async () => {
    setIsLoadingData(true);
    try {
      const response = await api.get('/members');
      const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const formattedMembers = dataArray.map(dbMember => ({
        id: dbMember.id,
        firstName: dbMember.first_name,
        lastName: dbMember.last_name,
        email: dbMember.email,
        phone: dbMember.phone,
        address: dbMember.address || '',
        plan: dbMember.plan,
        status: dbMember.status,
        enrolledFaceId: dbMember.enrolled_face_id,
        profilePicUrl: dbMember.profile_pic ? `http://127.0.0.1:8000${dbMember.profile_pic}` : null,
        dob: dbMember.dob || '',
        height: dbMember.height || '',
        weight: dbMember.weight || '',
        customerSince: new Date(dbMember.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }));
      setMembers(formattedMembers);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    fetchMembers();
    
    // Fetch frontend exercise dictionary for the Coach Plan tab
    fetch('/dataset/data/exercises.json')
      .then(res => res.json())
      .then(data => {
        if (data.data) setExercisesLib(data.data);
        else setExercisesLib(data);
      })
      .catch(err => console.error("Could not load local exercises", err));

    return () => stopCamera();
  }, []);

  const handleOpenAddModal = () => {
    setFormData(defaultForm);
    setProfilePic(null);
    setFaceImage(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setFormData(member);
    setProfilePic(null);
    setFaceImage(member.enrolledFaceId ? 'existing_data' : null); 
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Member',
      message: 'Are you sure you want to completely remove this member? All associated data will be lost.',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await api.delete(`/members/${id}`); 
          setMembers(members.filter(m => m.id !== id)); 
        } catch (error) {
          console.error("Failed to delete member:", error);
          if (error.response && error.response.data && error.response.data.message) {
            setAlertDialog({ isOpen: true, title: 'Action Denied', message: error.response.data.message, type: 'error' });
          } else {
            setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to connect to the server or database.', type: 'error' });
          }
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const getCroppedImageBlob = () => {
    return new Promise((resolve) => {
      if (editorRef.current) {
        const canvas = editorRef.current.getImageScaledToCanvas();
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8); 
      } else {
        resolve(null);
      }
    });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append('first_name', formData.firstName);
    formDataToSend.append('last_name', formData.lastName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('plan', formData.plan);
    formDataToSend.append('status', formData.status);
    
    if (formData.dob) formDataToSend.append('dob', formData.dob);
    if (formData.height) formDataToSend.append('height', formData.height);
    if (formData.weight) formDataToSend.append('weight', formData.weight);
    
    if (faceImage && faceImage !== 'existing_data') {
      formDataToSend.append('enrolled_face_id', faceImage);
    }

    if (profilePic && editorRef.current) {
      const croppedBlob = await getCroppedImageBlob();
      if (croppedBlob) {
        formDataToSend.append('profile_pic', croppedBlob, 'profile.jpg'); 
      }
    } else if (profilePic) {
      formDataToSend.append('profile_pic', profilePic);
    }

    try {
      if (isEditing) {
        formDataToSend.append('_method', 'PUT');
        await api.post(`/members/${formData.id}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/members', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await fetchMembers(); 
      handleCloseModal();
      
      fetch('http://127.0.0.1:5000/refresh_ai', { method: 'POST' }).catch(() => {});
      setAlertDialog({ isOpen: true, title: 'Success', message: 'Member profile saved successfully!', type: 'success' });

    } catch (error) {
      console.error("Failed to save member:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
        setAlertDialog({ isOpen: true, title: 'Action Denied', message: errorMessages, type: 'error' });
      } else if (error.response && error.response.data && error.response.data.message) {
        setAlertDialog({ isOpen: true, title: 'Server Error', message: error.response.data.message, type: 'error' });
      } else {
        setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save data. Please check your connection.', type: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (e, field) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-Z\s-ñÑ]/g, '');
    setFormData({ ...formData, [field]: lettersOnly });
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, phone: digitsOnly });
  };

  const startCamera = async () => {
    setFaceImage(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setAlertDialog({ isOpen: true, title: 'Camera Error', message: 'Could not access camera. Please ensure permissions are granted.', type: 'error' });
      setIsCameraActive(false);
    }
  };

  const captureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const size = Math.min(video.videoWidth, video.videoHeight);
      const xOffset = (video.videoWidth - size) / 2;
      const yOffset = (video.videoHeight - size) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, xOffset, yOffset, size, size, 0, 0, canvas.width, canvas.height);
      context.restore();
      const imageData = canvas.toDataURL('image/png');
      setFaceImage(imageData);
      stopCamera();
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button key={i} onClick={() => setCurrentPage(i)} className={`px-3 py-1 rounded-md font-bold shadow-sm transition-colors ${currentPage === i ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' : 'hover:text-slate-900 dark:hover:text-white font-medium text-slate-500 dark:text-gray-400'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  const getStatusBadge = (status) => {
    const badgeBase = "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-solid shadow-sm";
    if (status === 'Active') {
      return <span className={`${badgeBase} bg-green-50 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50`}>Active</span>;
    }
    if (status === 'Inactive') {
      return <span className={`${badgeBase} bg-slate-50 text-slate-700 border-slate-500 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/50`}>Inactive</span>;
    }
    return <span className={`${badgeBase} bg-red-50 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50`}>Expired</span>;
  };

  const getInitials = (first, last) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm";
  const labelClass = "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400 mb-2";
  const primaryButtonClass = "flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";
  
  const formBmiData = getBmiInfo(formData.height, formData.weight);

  const groupedWorkouts = Object.values(profileWorkouts.reduce((acc, log) => {
    const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, exercises: [] };
    acc[dateStr].exercises.push(log);
    return acc;
  }, {})).sort((a, b) => new Date(b.date) - new Date(a.date));

  const workoutsPerPage = 5; 
  const totalWorkoutPages = Math.ceil(groupedWorkouts.length / workoutsPerPage);
  const currentGroupedWorkouts = groupedWorkouts.slice((workoutPage - 1) * workoutsPerPage, workoutPage * workoutsPerPage);

  const toggleDropdownRow = (dateStr) => {
      setExpandedDate(prev => prev === dateStr ? null : dateStr);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div></div>
        <button onClick={handleOpenAddModal} className={primaryButtonClass}>
          <FiPlus size={18} strokeWidth={3} /> Add Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#252830] p-5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
          <input 
            type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-gray-300 font-medium transition-all shadow-sm">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-sm border-2 border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b-2 border-gray-300 dark:border-gray-600 gap-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-gray-300 font-bold text-sm tracking-wide">
            <FiUsers size={18} />
            <span>{filteredMembers.length} TOTAL MEMBERS</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Member Details</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Address</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Membership Plan</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Customer Since</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
              {isLoadingData ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-amber-200 dark:border-amber-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">Loading Database...</p>
                    </div>
                  </td>
                </tr>
              ) : currentMembers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No members found in the database.
                  </td>
                </tr>
              ) : (
                currentMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-b border-gray-200 dark:border-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {member.profilePicUrl ? (
                          <img 
                            src={member.profilePicUrl} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-sm" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border-2 border-gray-300 dark:border-gray-600 flex-shrink-0 shadow-sm">
                            {getInitials(member.firstName, member.lastName)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-gray-300">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-gray-300 font-normal whitespace-nowrap">{member.phone}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-gray-300 font-normal truncate max-w-[150px]">{member.address || '-'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-gray-400 whitespace-nowrap">{member.plan}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-gray-400 font-normal whitespace-nowrap">{member.customerSince}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(member.status)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      
                      <button onClick={async () => { 
                          setSelectedProfile(member);
                          setCoachNotes(localStorage.getItem(`notes_${member.id}`) || '');
                          
                          // Auto-load their saved weekly plan
                          const savedRoutine = localStorage.getItem(`routine_${member.id}`);
                          if(savedRoutine) setWeeklyRoutine(JSON.parse(savedRoutine));
                          else setWeeklyRoutine(defaultRoutine);
                          setActiveDay('Monday');

                          setIsProfileModalOpen(true); 
                          setActiveProfileTab('workouts'); 
                          setWorkoutPage(1); 
                          setExpandedDate(null); 
                          
                          try {
                            const attRes = await api.get(`/members/${member.id}/attendance`);
                            setProfileAttendance(attRes.data);

                            const workRes = await api.get(`/members/${member.id}/workouts`);
                            setProfileWorkouts(workRes.data);
                          } catch (err) { console.error("Failed to load profile logs", err); }

                        }} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-blue-600 dark:text-blue-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm">
                        <FiEye size={16} strokeWidth={2.5} />
                      </button>

                      <button onClick={() => handleOpenEditModal(member)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-amber-600 dark:text-amber-400 border-2 border-gray-300 dark:border-gray-600 hover:border-amber-50 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        <FiEdit2 size={16} strokeWidth={2.5} />
                      </button>
                      
                      <button onClick={() => handleDelete(member.id)} disabled={deletingId === member.id} className="inline-flex items-center justify-center p-2 bg-white dark:bg-[#252830] text-red-600 dark:text-red-400 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-sm disabled:opacity-50">
                        {deletingId === member.id ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} strokeWidth={2.5} />}</button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- ADDED BOTTOM PAGINATION HERE --- */}
        {totalPages > 1 && (
          <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredMembers.length)} of {filteredMembers.length} Entries
            </span>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600 shadow-inner">
              <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronLeft size={18} /></button>
              {generatePageNumbers()}
              <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><FiChevronRight size={18} /></button>
            </div>
          </div>
        )}

      </div>

      {/* --- ADD / EDIT MEMBER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600">
            <div className="p-6 border-b-2 border-gray-300 dark:border-gray-600 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-gray-300">{isEditing ? `Edit Member Profile` : `Add New Member`}</h3>
              <button onClick={handleCloseModal} disabled={isSaving} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><FiX size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-white dark:bg-[#252830] hidden-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
                  <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Display Picture</h4>
                  
                  {profilePic ? (
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="rounded-full overflow-hidden border-4 border-amber-500 shadow-lg">
                        <AvatarEditor
                          ref={editorRef}
                          image={profilePic}
                          width={150}
                          height={150}
                          border={0}
                          borderRadius={75}
                          color={[255, 255, 255, 0.6]}
                          scale={editorScale}
                          rotate={0}
                        />
                      </div>
                      
                      <div className="w-full max-w-[200px] flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">-</span>
                        <input 
                          type="range" 
                          min="1" max="3" step="0.01" 
                          value={editorScale} 
                          onChange={(e) => setEditorScale(parseFloat(e.target.value))} 
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-400">+</span>
                      </div>

                      <button type="button" onClick={() => { setProfilePic(null); setEditorScale(1.2); }} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">
                        Cancel / Pick New Image
                      </button>
                    </div>
                  ) : (
                    <label className="relative group cursor-pointer mt-2">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-[#252830] group-hover:border-amber-500 transition-colors overflow-hidden">
                        
                        {formData.profilePicUrl ? (
                          <img src={formData.profilePicUrl} alt="Existing Profile" className="w-full h-full object-cover" />
                        ) : (
                          <FiUpload className="text-gray-400 group-hover:text-amber-500" size={24} />
                        )}

                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          setProfilePic(e.target.files[0]);
                          setEditorScale(1.2);
                      }} />
                    </label>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3">
                  <h4 className="font-bold text-slate-800 dark:text-gray-200 uppercase tracking-wide text-sm">Facial Recognition</h4>
                  <div className={`mt-2 w-32 h-32 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${faceImage ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : isCameraActive ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-gray-200 dark:bg-[#252830] border-gray-300 dark:border-gray-600 text-gray-400'}`}>
                     <canvas ref={canvasRef} width="300" height="300" className="hidden"></canvas>
                     {faceImage ? (
                       <div className="relative w-full h-full group">
                         {faceImage === 'existing_data' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-green-500">
                              <FiCheckCircle size={32} />
                              <span className="text-[10px] font-bold mt-2 uppercase tracking-widest">Data Saved</span>
                            </div>
                         ) : (
                            <img src={faceImage} alt="Captured Face" className="w-full h-full object-cover" />
                         )}
                         <button onClick={() => { setFaceImage(null); startCamera(); }} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">Retake</button>
                       </div>
                     ) : isCameraActive ? (
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                     ) : (
                       <FiCamera size={32} />
                     )}
                  </div>
                  {!faceImage && <button type="button" onClick={isCameraActive ? captureFace : startCamera} className={`mt-1 text-xs font-bold hover:underline px-4 py-1.5 rounded-full transition-colors ${isCameraActive ? 'bg-amber-500 text-black shadow-md no-underline hover:bg-amber-400' : 'text-amber-600 dark:text-amber-500'}`}>{isCameraActive ? 'Capture Photo' : 'Scan Face Data Now'}</button>}
                  {isCameraActive && <button type="button" onClick={stopCamera} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1 mt-1"><FiVideoOff /> Cancel</button>}
                </div>
              </div>

              <form id="memberForm" className="space-y-6" onSubmit={handleSaveMember}>
                <div>
                  <h4 className="text-lg font-bold border-b-2 border-gray-200 dark:border-gray-700/50 pb-2 mb-4 text-slate-800 dark:text-gray-300">Personal Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <label className="block"><span className={labelClass}>First Name</span><input type="text" required value={formData.firstName} onChange={(e) => handleNameChange(e, 'firstName')} className={inputClass} placeholder="Juan" /></label>
                    <label className="block"><span className={labelClass}>Last Name</span><input type="text" required value={formData.lastName} onChange={(e) => handleNameChange(e, 'lastName')} className={inputClass} placeholder="Dela Cruz" /></label>
                    <label className="block"><span className={labelClass}>Email</span><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="juan@email.com" /></label>
                    
                    <label className="block lg:col-span-2"><span className={labelClass}>Address</span><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={inputClass} placeholder="123 Gym Street, Tagoloan" /></label>
                    <label className="block"><span className={labelClass}>Phone Number</span><input type="text" required value={formData.phone} onChange={handlePhoneChange} className={inputClass} placeholder="09171234567" /><span className="text-[10px] text-gray-400 font-medium float-right mt-1">{formData.phone.length}/11</span></label>
                    
                    {/* ANTHROPOMETRICS */}
                    <label className="block"><span className={labelClass}>Date of Birth</span><input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Height (cm)</span><input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className={inputClass} placeholder="170" /></label>
                    <label className="block"><span className={labelClass}>Weight (kg)</span><input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className={inputClass} placeholder="65" /></label>
                    
                    {/* Dynamic BMI Display */}
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-100 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-xs">Body Mass Index (BMI)</span>
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-solid shadow-sm mt-1.5 w-fit ${formBmiData.color}`}>
                          {formBmiData.label}
                        </span>
                      </div>
                      <span className="font-bold text-2xl text-slate-900 dark:text-gray-300">
                        {formBmiData.value}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 uppercase tracking-wide text-sm">Cancel</button>
              <button form="memberForm" type="submit" disabled={isSaving || (formData.phone.length > 0 && formData.phone.length < 11)} className={primaryButtonClass}>
                {isSaving ? <FiLoader className="animate-spin" size={18} /> : <FiSave size={18} />}
                {isSaving ? 'Processing...' : (isEditing ? 'Save Changes' : 'Save Member')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- COMPREHENSIVE PROFILE LIBRARY MODAL --- */}
      {isProfileModalOpen && selectedProfile && (() => {
        const profileBmiData = getBmiInfo(selectedProfile.height, selectedProfile.weight);
        
        // Maps the attendance data so FullCalendar can render it
        const attendanceEvents = profileAttendance.map(log => ({
            id: log.id,
            title: `Checked In: ${log.time_in}`,
            date: log.date,
            color: '#10b981' // Green
        }));

        return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:p-8 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#252830] rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border-2 border-gray-300 dark:border-gray-600 relative">
            
            <div className="absolute top-4 right-4 z-20">
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-black/10 dark:bg-white/10 hover:bg-red-500 hover:text-white rounded-full transition-colors text-slate-700 dark:text-gray-300 backdrop-blur-md">
                <FiX size={24} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
              
              {/* Left Sidebar: Profile Summary */}
              <div className="w-full lg:w-[32%] bg-gray-50 dark:bg-[#1a1c23] border-r-2 border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center flex-shrink-0 overflow-y-auto hidden-scrollbar">
                
                <div className="relative mb-4 group mt-2">
                  {selectedProfile.profilePicUrl ? (
                    <img src={selectedProfile.profilePicUrl} alt="Avatar" className="w-36 h-36 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg" />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-4xl border-4 border-white dark:border-gray-600 shadow-lg">
                      {getInitials(selectedProfile.firstName, selectedProfile.lastName)}
                    </div>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 dark:text-gray-300 text-center tracking-tight">
                  {selectedProfile.firstName} {selectedProfile.lastName}
                </h2>
                <p className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest text-xs mt-1 mb-6">
                  {selectedProfile.plan}
                </p>

                <div className="w-full space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <FiMapPin className="text-amber-500 flex-shrink-0" size={16} />
                    <span className="truncate">{selectedProfile.address || 'No Address Provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-[#252830] p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <FiPhone className="text-amber-500 flex-shrink-0" size={16} />
                    <span>{selectedProfile.phone}</span>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm mb-6">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Body Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Age</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-gray-300">{calculateAge(selectedProfile.dob)}</p>
                    </div>
                    {/* Enlarged BMI Display */}
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">BMI</p>
                      <p className={`text-4xl font-black leading-none my-1.5 text-slate-900 dark:text-gray-300 tracking-tighter`}>
                        {profileBmiData.value}
                      </p>
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-solid shadow-sm ${profileBmiData.color}`}>
                        {profileBmiData.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Height</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{selectedProfile.height || '-'} cm</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Weight</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-gray-300">{selectedProfile.weight || '-'} kg</p>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Account Status</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${selectedProfile.enrolledFaceId ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <FiCamera size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Face ID</p>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{selectedProfile.enrolledFaceId ? 'Active & Synced' : 'Not Enrolled'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${selectedProfile.status === 'Active' ? 'bg-green-500' : (selectedProfile.status === 'Inactive' ? 'bg-slate-500' : 'bg-red-500')}`}>
                        <FiCheckCircle size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-gray-300">Membership</p>
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{selectedProfile.status === 'Active' ? 'Valid Access' : (selectedProfile.status === 'Inactive' ? 'Inactive Account' : 'Expired/Suspended')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* --- COACH NOTES --- */}
                <div className="w-full bg-white dark:bg-[#252830] rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm mt-6 mb-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Coach Notes</h4>
                  <textarea 
                    className="w-full bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 text-slate-800 dark:text-gray-300 transition-colors min-h-[100px]" 
                    placeholder="Add Additional Notes here..."
                    value={coachNotes}
                    onChange={(e) => {
                      setCoachNotes(e.target.value);
                      localStorage.setItem(`notes_${selectedProfile.id}`, e.target.value);
                    }}
                  ></textarea>
                </div>

              </div>

              {/* Right Content: Tabs & Data */}
              <div className="w-full lg:w-[68%] flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
                
                {/* Tabs */}
                <div className="flex items-center gap-6 px-8 pt-6 border-b-2 border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto hidden-scrollbar">
                  <button onClick={() => setActiveProfileTab('workouts')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'workouts' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Workout Logs
                    {activeProfileTab === 'workouts' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                  <button onClick={() => setActiveProfileTab('attendance')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'attendance' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Attendance Calendar
                    {activeProfileTab === 'attendance' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                  <button onClick={() => setActiveProfileTab('plan')} className={`pb-4 font-bold tracking-wide transition-colors whitespace-nowrap relative ${activeProfileTab === 'plan' ? 'text-amber-500' : 'text-gray-500 hover:text-slate-800 dark:hover:text-white'}`}>
                    Coach's Training Plan
                    {activeProfileTab === 'plan' && <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 rounded-t-full"></div>}
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 p-8 flex flex-col min-h-0 overflow-hidden">

                  {/* OVERHAULED ATTENDANCE DATA (Calendar View) */}
                  {activeProfileTab === 'attendance' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col min-h-0">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-[#252830] shadow-sm relative flex-1 overflow-hidden flex flex-col min-h-0">
                          <style>{`
                            .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-list-event-hover-bg-color: rgba(0,0,0,0.05); color: #4b5563; }
                            .dark .fc { --fc-border-color: #4b5563; --fc-neutral-text-color: #d1d5db; --fc-today-bg-color: rgba(245, 158, 11, 0.1); color: #d1d5db; }
                            
                            /* Amber-Gradient Buttons exactly matching the Dashboard */
                            .fc .fc-button-primary { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #000000 !important; text-transform: capitalize !important; font-weight: 700 !important; border-radius: 8px !important; padding: 6px 16px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; transition: all 0.2s ease !important; margin: 0 4px !important; }
                            .dark .fc .fc-button-primary { background-color: #1e293b !important; border-color: #374151 !important; color: #d1d5db !important; }
                            .fc .fc-button-primary:hover { background-color: #e2e8f0 !important; color: #000000 !important; }
                            .dark .fc .fc-button-primary:hover { background-color: #334155 !important; color: #ffffff !important; }
                            .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:disabled { background: linear-gradient(to right, #fbbf24, #f59e0b) !important; border-color: transparent !important; color: #000 !important; box-shadow: 0 4px 10px -2px rgba(245, 158, 11, 0.3) !important; opacity: 1 !important; }
                            
                            .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 800 !important; text-transform: uppercase; color: #000000; }
                            .dark .fc-toolbar-title { color: #d1d5db !important; }
                            .fc-scrollgrid { border: none !important; }
                            .dark .fc-scrollgrid { border-color: #334155 !important; }
                            .fc-theme-standard th { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; padding: 12px 0 !important; }
                            .dark .fc-theme-standard th { border-color: #334155 !important; }
                            .fc-theme-standard td { border: none !important; border-bottom: 1px solid var(--fc-border-color) !important; border-right: 1px solid var(--fc-border-color) !important; }
                            .dark .fc-theme-standard td { border-color: #334155 !important; }
                            .fc-theme-standard td:last-child { border-right: none !important; }
                            .fc-col-header-cell-cushion { font-weight: 700 !important; font-size: 0.8rem !important; color: #0f172a !important; text-decoration: none !important; padding: 4px 0 !important;}
                            .dark .fc-col-header-cell-cushion { color: #f8fafc !important; }
                            .fc-daygrid-day-number { font-weight: 600; font-size: 0.8rem; padding: 8px !important; color: #475569 !important; text-decoration: none !important; }
                            .dark .fc-daygrid-day-number { color: #cbd5e1 !important; }
                            
                            .fc-daygrid-event { border-radius: 6px !important; padding: 2px 4px !important; margin: 2px !important; border: 1px solid rgba(255,255,255,0.2) !important; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important; transition: transform 0.1s ease, box-shadow 0.1s ease; }
                            .fc-daygrid-event:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 4px 8px rgba(0,0,0,0.25) !important; z-index: 5; }
                            .fc-daygrid-event-dot { display: none !important; } 
                            .fc-event-main { color: #ffffff !important; font-weight: 800 !important; font-size: 0.65rem !important; letter-spacing: 0.03em; text-shadow: 0px 1px 2px rgba(0,0,0,0.8) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2 !important; }

                            /* Ã°Å¸â€ Â´ NEW: Completely nuke all internal scrollbars to force a clean fit */
                            .fc-scroller::-webkit-scrollbar { display: none !important; }
                            .fc-scroller { -ms-overflow-style: none; scrollbar-width: none; overflow: hidden !important; }
                          `}</style>
                          <div className="flex-1 min-h-0 overflow-hidden">
                              <FullCalendar
                                plugins={[dayGridPlugin]}
                                initialView="dayGridMonth"
                                events={attendanceEvents}
                                height="100%"
                                contentHeight="100%"
                                expandRows={true}
                                headerToolbar={{
                                  left: 'prev,next',
                                  center: 'title',
                                  right: 'today'
                                }}
                              />
                          </div>
                      </div>
                    </div>
                  )}

                  {/* REAL WORKOUTS DATA ACCORDION */}
                  {activeProfileTab === 'workouts' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col gap-4 min-h-0">
                      
                      {/* Pagination Controls */}
                      {totalWorkoutPages > 1 && (
                          <div className="flex justify-end flex-shrink-0">
                              <div className="flex items-center gap-2 bg-white dark:bg-[#1a1c23] border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
                                  <button onClick={() => setWorkoutPage(p => Math.max(1, p - 1))} disabled={workoutPage === 1} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronLeft size={16} /></button>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300">Page {workoutPage} of {totalWorkoutPages}</span>
                                  <button onClick={() => setWorkoutPage(p => Math.min(totalWorkoutPages, p + 1))} disabled={workoutPage === totalWorkoutPages} className="p-1 text-slate-500 hover:text-amber-500 disabled:opacity-30"><FiChevronRight size={16} /></button>
                              </div>
                          </div>
                      )}

                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto shadow-sm flex-1 hidden-scrollbar bg-white dark:bg-[#252830]">
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a1c23] border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <tr>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Date</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Exercises Logged</th>
                              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 w-1/4 text-center">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {currentGroupedWorkouts.length === 0 ? (
                               <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">No workout history logged yet.</td></tr>
                            ) : (
                               currentGroupedWorkouts.map((group, idx) => {
                                  const isExpanded = expandedDate === group.date;

                                  const totalTasks = group.exercises.length;
                                  const verifiedTasks = group.exercises.filter(log => getTaskStatus(log) === 'VERIFIED').length;
                                  
                                  // Check if today for biometric lock
                                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) === group.date;
                                  const hasFaceIdToday = isToday ? profileAttendance.some(att => att.date === new Date().toISOString().split('T')[0]) : true;

                                  let groupBadge;
                                  if (verifiedTasks === totalTasks) {
                                      groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">VERIFIED</span>;
                                  } else if (verifiedTasks > 0 && verifiedTasks < totalTasks) {
                                      groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">INCOMPLETE</span>;
                                  } else {
                                      const hasPending = group.exercises.some(log => getTaskStatus(log) === 'PENDING');
                                      if (hasPending) {
                                          groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">PENDING</span>;
                                      } else {
                                          groupBadge = <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-red-50 text-red-700 border border-red-500/30 dark:bg-red-500/10 dark:text-red-400">MISSED</span>;
                                      }
                                  }

                                  return (
                                     <React.Fragment key={idx}>
                                       <tr onClick={() => toggleDropdownRow(group.date)} className="hover:bg-gray-50 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer group">
                                         <td className="px-6 py-4 whitespace-nowrap text-center">
                                           <div className="font-bold text-slate-800 dark:text-gray-200 text-sm flex items-center justify-center">
                                               {group.date}
                                           </div>
                                         </td>
                                         <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                                              {group.exercises.length} Exercises Recorded
                                            </span>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex items-center justify-center gap-3">
                                               {groupBadge}
                                               {isExpanded ? <FiChevronUp className="text-gray-400" size={18} /> : <FiChevronDown className="text-gray-400 group-hover:text-amber-500 transition-colors" size={18} />}
                                           </div>
                                         </td>
                                       </tr>

                                       {/* --- EXPANDED ROW CONTENT (THE BADGES) --- */}
                                       {isExpanded && (
                                          <tr className="bg-gray-50/50 dark:bg-[#1a1c23]/50 shadow-inner">
                                            <td colSpan="3" className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-2">
                                              <div className="flex flex-wrap gap-2 justify-center">
                                                  {group.exercises.map(log => {
                                                      const taskStatus = getTaskStatus(log);
                                                      const exName = log.exercise.replace('ASSIGNED: ', '');
                                                      const timeFormatted = new Date(log.created_at).toLocaleTimeString('en-US', { timeStyle: 'short' });
                                                      
                                                      let badgeClass = '';
                                                      if (taskStatus === 'VERIFIED') {
                                                          badgeClass = 'bg-white border-green-200 text-green-700 dark:bg-[#252830] dark:border-green-500/50 dark:text-green-400';
                                                      } else if (taskStatus === 'PENDING') {
                                                          badgeClass = 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400';
                                                      } else {
                                                          badgeClass = 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400';
                                                      }

                                                      return (
                                                          <div key={log.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm ${badgeClass}`}>
                                                              <span>{exName}</span>
                                                              <span className="opacity-60 font-medium ml-0.5 border-l pl-1.5 border-current">({timeFormatted})</span>
                                                              {taskStatus === 'PENDING' && (
                                                                  hasFaceIdToday ? (
                                                                      <button onClick={() => handleManualVerify(log.id)} className="ml-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px] transition-colors active:scale-95 shadow-sm" title="Manually Verify">
                                                                          VERIFY
                                                                      </button>
                                                                  ) : (
                                                                      <span className="ml-1 opacity-50 cursor-not-allowed" title="Locked: No Face ID Today"><FiLock size={12}/></span>
                                                                  )
                                                              )}
                                                              {taskStatus === 'MISSED' && (
                                                                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 rounded text-[9px]">MISSED</span>
                                                              )}
                                                              {taskStatus === 'VERIFIED' && (
                                                                  <span className="ml-1.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-500/20 rounded text-[9px]">VERIFIED</span>
                                                              )}
                                                          </div>
                                                      )
                                                  })}
                                              </div>
                                            </td>
                                          </tr>
                                       )}
                                     </React.Fragment>
                                  );
                               })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. THE MULTI-SELECT WEEKLY SCHEDULE ASSIGNER */}
                  {activeProfileTab === 'plan' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 h-full relative min-h-0">
                      
                      {/* --- ABSOLUTE INSET WRAPPER PREVENTS HEIGHT BLOWOUT --- */}
                      <div className="absolute inset-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#252830] shadow-sm flex flex-col sm:flex-row overflow-hidden">
                         
                         {/* Left: Exercise Library */}
                         <div className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1a1c23]/50 h-full">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                               <input type="text" placeholder="Search Exercise Library..." value={exSearch} onChange={e=>setExSearch(e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-[#252830] border border-gray-200 dark:border-gray-700 rounded outline-none text-slate-800 dark:text-gray-300 font-medium shadow-sm" />
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto hidden-scrollbar space-y-2">
                               {exercisesLib.filter(ex => ex.name.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 50).map(ex => {
                                   const exId = String(ex.id).padStart(4, '0');
                                   return (
                                     <div key={ex.id} className="flex items-center bg-white dark:bg-[#1a1c23] p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group">
                                        <img 
                                          src={`/dataset/videos/${exId}.gif`} 
                                          alt={ex.name} 
                                          className="w-12 h-12 rounded object-cover flex-shrink-0 bg-gray-100 dark:bg-black" 
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23f1f5f9" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%2394a3b8" font-weight="bold">NO PREVIEW</text></svg>';
                                          }} 
                                        />
                                        <div className="flex-1 min-w-0 px-3">
                                           <span className="font-bold text-[11px] text-slate-800 dark:text-gray-200 truncate block" title={ex.name}>{ex.name.toUpperCase()}</span>
                                        </div>
                                        <button onClick={() => handleAddExercise(ex)} className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg font-black transition-colors flex-shrink-0">
                                            +
                                        </button>
                                     </div>
                                   )
                               })}
                            </div>
                         </div>

                         {/* Right: Selected Routine */}
                         <div className="w-full sm:w-1/2 flex flex-col bg-white dark:bg-[#252830] h-full">
                            <div className="flex w-full overflow-x-auto hidden-scrollbar border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-[#1a1c23]/50">
                               {daysOfWeek.map(day => (
                                  <button key={day} onClick={() => setActiveDay(day)} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeDay === day ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-white dark:bg-[#252830]' : 'border-transparent text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'}`}>
                                     {day.substring(0,3)}
                                  </button>
                               ))}
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto hidden-scrollbar space-y-2 bg-gray-50/30 dark:bg-black/10">
                               {weeklyRoutine[activeDay].length === 0 ? <p className="text-xs text-center text-gray-400 mt-6 font-medium">No exercises assigned for {activeDay}</p> : 
                                 weeklyRoutine[activeDay].map((ex, i) => (
                                   <div key={i} className="flex justify-between items-center bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg border border-amber-100 dark:border-amber-500/30 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img 
                                          src={`/dataset/videos/${String(ex.id).padStart(4, '0')}.gif`} 
                                          className="w-8 h-8 rounded border border-amber-200 dark:border-amber-500/30 object-cover flex-shrink-0" 
                                          onError={(e) => { 
                                            e.target.onerror = null; 
                                            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23fcd34d" rx="4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="%2378350f" font-weight="bold">NA</text></svg>'; 
                                          }}
                                        />
                                        <span className="font-bold text-xs text-amber-900 dark:text-amber-400 truncate block">{ex.name.toUpperCase()}</span>
                                      </div>
                                      <button onClick={() => {
                                         const newDayArr = [...weeklyRoutine[activeDay]];
                                         newDayArr.splice(i, 1);
                                         setWeeklyRoutine({...weeklyRoutine, [activeDay]: newDayArr});
                                      }} className="text-[10px] text-red-500 hover:text-red-700 font-black px-2 py-1 bg-red-100/50 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/30 rounded transition-colors flex-shrink-0">X</button>
                                   </div>
                                 ))
                               }
                            </div>
                            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1c23]/50 flex-shrink-0">
                               <button onClick={handleAssignWeeklyPlan} className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-md active:scale-95 transition-all">
                                 Save Weekly Plan
                               </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
        );
      })()}

      {/* --- CUSTOM CONFIRM MODAL --- */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#252830] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden border-2 border-red-500/30">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-500/30">
                <FiAlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-gray-200 uppercase tracking-wide">{confirmDialog.title}</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium">{confirmDialog.message}</p>
            </div>
            <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-center gap-3">
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide text-xs">Cancel</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 uppercase tracking-wide text-xs">
                Confirm
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
              <p className="text-slate-500 dark:text-gray-400 font-medium whitespace-pre-line">{alertDialog.message}</p>
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