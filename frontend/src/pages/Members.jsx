import React from 'react';
import { useMembers } from '../features/members/hooks/useMembers';
import MemberTable from '../features/members/components/MemberTable';
import MemberFormModal from '../features/members/components/MemberFormModal';
import MemberProfileModal from '../features/members/components/MemberProfileModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Members() {
  const {
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

  return (
    <>
      <MemberTable
        members={filteredMembers}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        deletingId={deletingId}
        onAddMember={handleAddMember}
        onEditMember={handleEditMember}
        onDeleteMember={handleDeleteMember}
        onViewProfile={handleViewProfile}
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