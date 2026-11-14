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
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import { getLocalDateString } from '../utils/dateFormat';

const VIEWS = [
  { id: 'list', label: 'List', icon: FiList },
  { id: 'calendar', label: 'Calendar', icon: FiCalendar },
];

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
  const todayStr = getLocalDateString();

  /* ── Display-only summary ── */
  const daysUntil = (value) => {
    const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    const now = new Date();
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  };
  const activeCount = subscriptions.filter(sub => sub.status === 'Active').length;
  const expiredCount = subscriptions.filter(sub => sub.status === 'Expired').length;
  const endingSoonCount = subscriptions.filter(sub => {
    const days = sub.status === 'Active' ? daysUntil(sub.end_date) : null;
    return days !== null && days >= 0 && days <= 7;
  }).length;
  const upcomingEventCount = coachEvents.filter(event => String(event.end_date || event.start_date || '').slice(0, 10) >= todayStr).length;

  return (
    <div className={`${activeView === 'list' ? 'max-w-7xl' : 'max-w-screen-2xl'} mx-auto space-y-5 p-6 lg:space-y-6`}>

      {/* Top Header Actions */}
      <div className="rise flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ '--i': 0 }}>
        <div role="tablist" aria-label="Subscriptions view" className="inline-flex w-full rounded-xl border border-line bg-field p-1 sm:w-auto">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveView(id)}
                className={`press flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium ${active ? 'bg-panel text-ink shadow-[0_1px_2px_rgb(13_13_13/0.08)]' : 'text-muted hover:text-ink'}`}
              >
                <Icon size={15} className={active ? 'text-accent' : ''} /> {label}
              </button>
            );
          })}
        </div>
        <Button variant="outline" onClick={() => setIsPlanModalOpen(true)} icon={<FiTag size={16} />} className="whitespace-nowrap">
          Manage packages
        </Button>
      </div>

      <StatStrip index={1}>
        <StatCell label="Active subscriptions" hint="Running right now" tone="orange" isLoading={isLoading} value={activeCount} />
        <StatCell label="Ending in 7 days" hint="Members to remind about renewal" tone="red" isLoading={isLoading} value={endingSoonCount} />
        <StatCell label="Expired" hint="Not renewed yet" tone="slate" isLoading={isLoading} value={expiredCount} />
        <StatCell label="Upcoming coach events" hint="From today onward" tone="gold" isLoading={isLoading} value={upcomingEventCount} />
      </StatStrip>

      {activeView === 'calendar' && (
        <Panel index={2} title="Show on calendar" icon={FiFilter} className="xl:hidden">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CalendarCategoryFilters
              title="Client subscriptions"
              categories={getActivePackageCategoryOptions(plans, subscriptions, todayStr)}
              selectedCategories={selectedSubscriptionCategories}
              onChange={setSelectedSubscriptionCategories}
              enabled={showSubscriptions}
              onEnabledChange={setShowSubscriptions}
            />
            <CalendarCategoryFilters
              title="Coach events & sessions"
              categories={getCoachEventCategoryOptions(eventCategories, coachEvents, todayStr)}
              selectedCategories={selectedCoachCategories}
              onChange={setSelectedCoachCategories}
              enabled={showCoachEvents}
              onEnabledChange={setShowCoachEvents}
            />
          </div>
        </Panel>
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
        subscriptions={subscriptions}
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