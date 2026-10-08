import React from 'react';
import { FiTag, FiList, FiCalendar, FiFilter } from 'react-icons/fi';
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

  const secondaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-black px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-gray-300 shadow-sm transition-colors hover:bg-gray-900 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-300 dark:text-black dark:hover:bg-gray-200";

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex w-full flex-col items-stretch gap-3">
        <div className="ml-auto flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button onClick={() => setIsPlanModalOpen(true)} className={`${secondaryButtonClass} self-end sm:self-auto`}>
            <FiTag size={16} /> Manage Plans
          </button>
          <div className="flex w-full rounded-xl border border-gray-300 bg-gray-100 p-1 shadow-sm dark:border-[#393e4f] dark:bg-[#191b22] sm:w-auto">
            <button 
              onClick={() => setActiveView('list')} 
              className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${activeView === 'list' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-300 dark:hover:bg-[#252833]'}`}
            >
              <FiList size={16} /> List
            </button>
            <button 
              onClick={() => setActiveView('calendar')} 
              className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${activeView === 'calendar' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-300 dark:hover:bg-[#252833]'}`}
            >
              <FiCalendar size={16} /> Calendar
            </button>
          </div>
        </div>
      </div>

      {activeView === 'calendar' && (
        <div className="xl:hidden bg-white dark:bg-[#252833] p-4 sm:p-5 rounded-2xl border-2 border-gray-300 dark:border-[#393e4f] shadow-sm">
          <h3 className="text-base font-bold text-black dark:text-gray-300 flex items-center gap-2 mb-3 border-b border-gray-400 dark:border-gray-600 pb-2">
            <FiFilter className="text-amber-500" /> View Filters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showSubscriptions} onChange={e => setShowSubscriptions(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Client Subscriptions</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showCoachEvents} onChange={e => setShowCoachEvents(e.target.checked)} className="w-4 h-4 accent-amber-500 cursor-pointer" />
              <span className="text-sm font-bold text-black dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">Coach Events & Sessions</span>
            </label>
          </div>
        </div>
      )}

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