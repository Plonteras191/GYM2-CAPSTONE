import React from 'react';
import { FiTag, FiList, FiCalendar, FiFilter } from 'react-icons/fi';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import SubscriptionsTable from '../features/subscriptions/components/SubscriptionsTable';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import { getActivePackageCategoryOptions, getCoachEventCategoryOptions } from '../features/subscriptions/packageCategories';
import SubscriptionFormModal from '../features/subscriptions/components/SubscriptionFormModal';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import PricingCatalogModal from '../features/subscriptions/components/PricingCatalogModal';
import CalendarCategoryFilters from '../features/subscriptions/components/CalendarCategoryFilters';
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
    deletingEventId,
    isEventModalOpen, setIsEventModalOpen,
    isSavingEvent,
    isSavingCategory,
    eventCategories,
    showSubscriptions, setShowSubscriptions,
    showCoachEvents, setShowCoachEvents,
    selectedCoachCategories, setSelectedCoachCategories,
    selectedSubscriptionCategories, setSelectedSubscriptionCategories,
    confirmDialog, setConfirmDialog,
    alertDialog, setAlertDialog,
    eventForm, setEventForm,
    coachEvents,
    recentColors,
    saveRecentColor,
    formData, setFormData,
    newPlan, setNewPlan,
    loyalDiscount,
    calculatedPrice,
    handleOpenAddModal,
    handleOpenEditModal,
    handleDelete,
    handleSaveSubscription,
    handleSaveCoachEvent,
    handleUpdateCoachEventCategory,
    handleDeleteCoachEventCategory,
    handleOpenNewCoachEvent,
    handleEditCoachEvent,
    handleDeleteCoachEvent,
    handleUpdatePlanPrice,
    handleSavePlan,
    handleSavePlans,
    handleAddNewPlan,
    handleDeletePlan
  } = useSubscriptions();
  const todayStr = new Date().toISOString().split('T')[0];

  const secondaryButtonClass = "mx-1 flex min-h-[38px] items-center justify-center gap-2 rounded-lg border-0 bg-black px-3.5 py-2 font-sans text-[15px] font-bold normal-case text-gray-300 shadow-sm transition-colors hover:bg-gray-900 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-300 dark:text-black dark:hover:bg-gray-200";

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex w-full flex-col items-stretch gap-3">
        <div className="ml-auto flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button onClick={() => setIsPlanModalOpen(true)} className={`${secondaryButtonClass} self-end sm:self-auto`}>
            <FiTag size={16} /> Manage Packages
          </button>
          <div className="flex w-full rounded-xl border border-gray-300 bg-gray-100 p-1 shadow-sm dark:border-[#393e4f] dark:bg-[#191b22] sm:w-auto">
            <button 
              onClick={() => setActiveView('list')} 
              className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${activeView === 'list' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-400 dark:hover:bg-[#252833]'}`}
            >
              <FiList size={16} /> List
            </button>
            <button 
              onClick={() => setActiveView('calendar')} 
              className={`mx-1 flex min-h-[38px] flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 font-sans text-[15px] font-bold normal-case transition-all active:scale-[0.98] ${activeView === 'calendar' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm' : 'text-slate-600 hover:bg-white dark:text-gray-400 dark:hover:bg-[#252833]'}`}
            >
              <FiCalendar size={16} /> Calendar
            </button>
          </div>
        </div>
      </div>

      {activeView === 'calendar' && (
        <div className="xl:hidden rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm dark:border-[#454e5e] dark:bg-[#252833] sm:p-5">
          <div className="mb-3 border-b-2 border-gray-300 pb-1 dark:border-gray-600">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-gray-300">
              <FiFilter size={18} className="shrink-0 text-slate-800 dark:text-gray-300" /> View Filters
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CalendarCategoryFilters
              title="Client Subscriptions"
              categories={getActivePackageCategoryOptions(plans, subscriptions, todayStr)}
              selectedCategories={selectedSubscriptionCategories}
              onChange={setSelectedSubscriptionCategories}
              enabled={showSubscriptions}
              onEnabledChange={setShowSubscriptions}
            />
            <CalendarCategoryFilters
              title="Coach Events & Sessions"
              categories={getCoachEventCategoryOptions(eventCategories, coachEvents, todayStr)}
              selectedCategories={selectedCoachCategories}
              onChange={setSelectedCoachCategories}
              enabled={showCoachEvents}
              onEnabledChange={setShowCoachEvents}
            />
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
          plans={plans}
          coachEvents={coachEvents}
          showSubscriptions={showSubscriptions}
          setShowSubscriptions={setShowSubscriptions}
          showCoachEvents={showCoachEvents}
          setShowCoachEvents={setShowCoachEvents}
          eventCategories={eventCategories}
          selectedCoachCategories={selectedCoachCategories}
          setSelectedCoachCategories={setSelectedCoachCategories}
          selectedSubscriptionCategories={selectedSubscriptionCategories}
          setSelectedSubscriptionCategories={setSelectedSubscriptionCategories}
          onOpenEventModal={() => handleOpenNewCoachEvent()}
          onEditCoachEvent={handleEditCoachEvent}
          onDeleteCoachEvent={handleDeleteCoachEvent}
          deletingEventId={deletingEventId}
          onDateClick={(info) => {
            handleOpenNewCoachEvent(info.dateStr);
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
        eventCategories={eventCategories}
        isSaving={isSavingEvent}
        isSavingCategory={isSavingCategory}
        onUpdateCategory={handleUpdateCoachEventCategory}
        onDeleteCategory={handleDeleteCoachEventCategory}
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
        recentColors={recentColors}
        newPlan={newPlan}
        setNewPlan={setNewPlan}
        deletingPlanId={deletingPlanId}
        onClose={() => {
          setIsPlanModalOpen(false);
          setIsAddingPlan(false);
        }}
        onUpdatePlanPrice={handleUpdatePlanPrice}
        onSavePlans={handleSavePlans}
        onSavePlan={handleSavePlan}
        onUseColor={saveRecentColor}
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