import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMembers } from '../features/members/hooks/useMembers';
import MemberTable from '../features/members/components/MemberTable';
import MemberFormModal from '../features/members/components/MemberFormModal';
import MemberProfileModal from '../features/members/components/MemberProfileModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Members() {
  const location = useLocation();
  const navigate = useNavigate();
  const openedMemberIdRef = React.useRef(null);
  // Which tab the profile opens on: the member list's "Training plan" link and the
  // Packages page open it directly on the plan.
  const [profileTab, setProfileTab] = React.useState('workouts');
  const {
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
  } = useMembers();

  React.useEffect(() => {
    const requestedMemberId = location.state?.memberId;
    if (!requestedMemberId || openedMemberIdRef.current === requestedMemberId) return;
    const member = filteredMembers.find(item => String(item.id) === String(requestedMemberId));
    if (member) {
      openedMemberIdRef.current = requestedMemberId;
      setProfileTab(location.state?.tab || 'workouts');
      handleViewProfile(member);
    }
  }, [location.state?.memberId, location.state?.tab, filteredMembers, handleViewProfile]);

  const openProfile = (member) => {
    setProfileTab('workouts');
    handleViewProfile(member);
  };
  const openTrainingPlan = (member) => {
    setProfileTab('plan');
    handleViewProfile(member);
  };

  React.useEffect(() => {
    if (location.state?.searchTerm) setSearchTerm(location.state.searchTerm);
  }, [location.key, location.state, setSearchTerm]);

  // "Register a member" on the Overview opens the form straight away. The request
  // is cleared afterwards so Back or a refresh does not open it again.
  React.useEffect(() => {
    if (!location.state?.openRegister) return;
    handleAddMember();
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, handleAddMember, navigate]);

  return (
    <>
      <MemberTable
        members={filteredMembers}
        allMembers={members}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        deletingId={deletingId}
        onAddMember={handleAddMember}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onViewProfile={openProfile}
        onOpenTrainingPlan={openTrainingPlan}
      />

      <MemberFormModal
        isOpen={isFormOpen}
        isEditing={isEditing}
        initialData={formData}
        onClose={() => setIsFormOpen(false)}
        onSaved={loadMembers}
        onShowAlert={showAlert}
      />

      <MemberProfileModal
        isOpen={isProfileOpen}
        member={selectedProfile}
        initialTab={profileTab}
        onClose={() => setIsProfileOpen(false)}
        onShowAlert={showAlert}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirm"
        isDanger={true}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}