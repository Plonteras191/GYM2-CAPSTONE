import { useState, useEffect, useMemo, useCallback } from 'react';
import memberService from '../../../services/memberService';
import api from '../../../api';

const defaultForm = {
  id: '', firstName: '', lastName: '', email: '', phone: '', address: '', plan: 'Walk-in', status: 'Active',
  enrolledFaceId: null, profilePicUrl: null, dob: '', height: '', weight: ''
};

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal & selection states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Dialog feedback states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members", error);
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to load members list.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const fullName = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (m.phone && m.phone.includes(searchTerm));
      const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchTerm, filterStatus]);

  const handleAddMember = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditMember = (member) => {
    setFormData(member);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleViewProfile = (member) => {
    setSelectedProfile(member);
    setIsProfileOpen(true);
  };

  const handleDeleteMember = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Member',
      message: 'Are you sure you want to completely remove this member? All associated data will be lost.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        try {
          await api.delete(`/members/${id}`);
          await loadMembers();
        } catch (error) {
          const msg = error.response?.data?.message || 'Failed to connect to the server or database.';
          setAlertDialog({ isOpen: true, title: 'Action Denied', message: msg, type: 'error' });
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const showAlert = (title, message, type = 'success') => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  return {
    members,
    filteredMembers,
    isLoading,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    loadMembers,
    isFormOpen,
    setIsFormOpen,
    isEditing,
    formData,
    isProfileOpen,
    setIsProfileOpen,
    selectedProfile,
    deletingId,
    confirmDialog,
    setConfirmDialog,
    alertDialog,
    setAlertDialog,
    handleAddMember,
    handleEditMember,
    handleViewProfile,
    handleDeleteMember,
    showAlert
  };
}

export default useMembers;
