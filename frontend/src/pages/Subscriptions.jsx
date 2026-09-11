import React from 'react';
import { FiTag, FiList, FiCalendar } from 'react-icons/fi';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import SubscriptionsTable from '../features/subscriptions/components/SubscriptionsTable';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import SubscriptionFormModal from '../features/subscriptions/components/SubscriptionFormModal';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import PricingCatalogModal from '../features/subscriptions/components/PricingCatalogModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';

export default function Subscriptions() {
  const {
    activeView, setActiveView,
    isLoading,
    subscriptions,
    membersList,
    plans,
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterPlan, setFilterPlan,
    isModalOpen, setIsModalOpen,
    isPlanModalOpen, setIsPlanModalOpen,
    isAddingPlan, setIsAddingPlan,
    isEditing,
    isSaving,
    deletingId,
    deletingPlanId,
    isEventModalOpen, setIsEventModalOpen,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    formData, setFormData,
    newPlan, setNewPlan,
    loyalDiscount,
    calculatedPrice,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveSubscription,
    handleSaveCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  } = useSubscriptions();

  const secondaryButtonClass = "flex items-center justify-center gap-2 bg-black hover:bg-slate-900 text-gray-200 dark:bg-gray-300 dark:hover:bg-white dark:text-black px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide text-sm";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row justify-end items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto ml-auto">
          <button onClick={() => setIsPlanModalOpen(true)} className={secondaryButtonClass}>
            <FiTag size={16} /> Manage Plans
          </button>
          <div className="flex bg-gray-200 dark:bg-gray-800 rounded-xl p-1 shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setActiveView('list')} 
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'list' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}
            >
              <FiList size={16} /> List
            </button>
            <button 
              onClick={() => setActiveView('calendar')} 
              className={`flex-1 flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'calendar' ? 'bg-white dark:bg-[#252830] text-black dark:text-gray-300 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-300'}`}
            >
              <FiCalendar size={16} /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {activeView === 'list' && (
        <SubscriptionsTable
          subscriptions={subscriptions}
          isLoading={isLoading}
          plans={plans}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPlan={filterPlan}
          setFilterPlan={setFilterPlan}
          deletingId={deletingId}
          onAddSubscription={() => handleOpenAddModal()}
          onEditSubscription={handleOpenEditModal}
          onDeleteSubscription={handleDelete}
        />
      )}

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <SubscriptionsCalendarView
          subscriptions={subscriptions}
          coachEvents={coachEvents}
          showSubscriptions={showSubscriptions}
          setShowSubscriptions={setShowSubscriptions}
          showCoachEvents={showCoachEvents}
          setShowCoachEvents={setShowCoachEvents}
          onOpenEventModal={() => setIsEventModalOpen(true)}
          onDeleteCoachEvent={handleDeleteCoachEvent}
          onDateClick={(info) => {
            setEventForm(prev => ({ ...prev, start_date: info.dateStr, end_date: info.dateStr }));
            setIsEventModalOpen(true);
          }}
        />
      )}

      {/* Coach Event Modal */}
      <CoachEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventForm={eventForm}
        setEventForm={setEventForm}
        recentColors={recentColors}
        onSave={handleSaveCoachEvent}
      />

      {/* Subscription Add / Edit Modal */}
      <SubscriptionFormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        isSaving={isSaving}
        formData={formData}
        setFormData={setFormData}
        membersList={membersList}
        plans={plans}
        recentColors={recentColors}
        loyalDiscount={loyalDiscount}
        calculatedPrice={calculatedPrice}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscription}
      />

      {/* Pricing Catalog Modal */}
      <PricingCatalogModal
        isOpen={isPlanModalOpen}
        isAddingPlan={isAddingPlan}
        setIsAddingPlan={setIsAddingPlan}
        isSaving={isSaving}
        plans={plans}
        newPlan={newPlan}
        setNewPlan={setNewPlan}
        deletingPlanId={deletingPlanId}
        onClose={() => setIsPlanModalOpen(false)}
        onUpdatePlanPrice={handleUpdatePlanPrice}
        onSavePlans={handleSavePlans}
        onAddNewPlan={handleAddNewPlan}
        onDeletePlan={handleDeletePlan}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Confirm"
        isDanger={true}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}