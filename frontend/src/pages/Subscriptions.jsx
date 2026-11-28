import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiTag, FiList, FiCalendar, FiFilter, FiUser } from 'react-icons/fi';
import { useSubscriptions } from '../features/subscriptions/hooks/useSubscriptions';
import { useTransactions } from '../features/transactions/hooks/useTransactions';
import TransactionFormModal from '../features/transactions/components/TransactionFormModal';
import WalkInsView from '../features/subscriptions/components/WalkInsView';
import SubscriptionsTable from '../features/subscriptions/components/SubscriptionsTable';
import SubscriptionsCalendarView from '../features/subscriptions/components/SubscriptionsCalendarView';
import { getActivePackageCategoryOptions, getCoachEventCategoryOptions } from '../features/subscriptions/packageCategories';
import SubscriptionFormModal from '../features/subscriptions/components/SubscriptionFormModal';
import CoachEventModal from '../features/subscriptions/components/CoachEventModal';
import PriceListView from '../features/subscriptions/components/PriceListView';
import PackageFormModal from '../features/subscriptions/components/PackageFormModal';
import RenewSubscriptionModal from '../features/subscriptions/components/RenewSubscriptionModal';
import CalendarCategoryFilters from '../features/subscriptions/components/CalendarCategoryFilters';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AlertDialog from '../components/ui/AlertDialog';
import Panel from '../components/ui/Panel';
import { StatStrip, StatCell } from '../components/ui/StatStrip';
import { getLocalDateString } from '../utils/dateFormat';

const VIEWS = [
  { id: 'list', label: 'Subscriptions', icon: FiList },
  { id: 'walkins', label: 'Walk-ins', icon: FiUser },
  { id: 'calendar', label: 'Calendar', icon: FiCalendar },
  { id: 'prices', label: 'Price list', icon: FiTag },
];

export default function Subscriptions() {
  const navigate = useNavigate();
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
    isAddingPlan, setIsAddingPlan,
    editingPlan, setEditingPlan,
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
    handleOpenNewPlan,
    handleOpenEditPlan,
    handleSavePlan,
    handleAddNewPlan,
    handleDeletePlan,
    renewTarget,
    isRenewing,
    handleOpenRenew,
    handleCloseRenew,
    handleRenew,
    pausingId,
    handlePauseSubscription,
    handleResumeSubscription
  } = useSubscriptions();
  const todayStr = getLocalDateString();

  // Walk-ins are recorded from the Walk-ins tab.
  const sales = useTransactions();
  // Only walk-in packages are sold from the walk-in form.
  const isOneTimePackage = (plan) => plan.category === 'walk_in'
    || /walk|daily/i.test(plan.name || '');
  const walkInPlans = sales.plansList.filter(isOneTimePackage);

  // Shortcuts from the Overview: "Record a payment" opens the subscription form, and a row in
  // "Ending this week" opens the Renew dialog for that membership. The request is
  // cleared afterwards so Back or a refresh does not open it again.
  const location = useLocation();
  React.useEffect(() => {
    const { openNewSale, renewMembershipId } = location.state || {};
    if (openNewSale) {
      setActiveView('list');
      handleOpenAddModal();
    } else if (renewMembershipId) {
      if (isLoading) return;
      const target = subscriptions.find(sub => String(sub.id) === String(renewMembershipId));
      if (target) {
        setActiveView('list');
        handleOpenRenew(target);
      }
    } else {
      return;
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, isLoading, subscriptions, navigate, handleOpenRenew, handleOpenAddModal, setActiveView]);

  /* ── Display-only summary ── */
  const daysUntil = (value) => {
    const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    const now = new Date();
    return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  };
  // Running right now: Active and already started (same rule as the Overview card).
  const activeCount = subscriptions.filter(sub => sub.status === 'Active'
    && (!sub.start_date || String(sub.start_date).slice(0, 10) <= todayStr)).length;
  const expiredCount = subscriptions.filter(sub => sub.status === 'Expired').length;
  const endingSoonCount = subscriptions.filter(sub => {
    const days = sub.status === 'Active' ? daysUntil(sub.end_date) : null;
    return days !== null && days >= 0 && days <= 7;
  }).length;
  const upcomingEventCount = coachEvents.filter(event => String(event.end_date || event.start_date || '').slice(0, 10) >= todayStr).length;

  return (
    <div className={`${activeView === 'calendar' ? 'max-w-screen-2xl' : 'max-w-7xl'} mx-auto space-y-5 p-6 lg:space-y-6`}>

      {/* Top Header Actions */}
      <div className="rise flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ '--i': 0 }}>
        <div role="tablist" aria-label="Packages page view" className="hidden-scrollbar inline-flex w-full overflow-x-auto rounded-xl border border-line-strong bg-field p-1 sm:w-auto">
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveView(id)}
                className={`press flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold sm:gap-2 sm:px-4 sm:text-sm ${active ? 'bg-panel text-ink shadow-[0_1px_2px_rgb(13_13_13/0.08)]' : 'text-muted hover:text-ink'}`}
              >
                <Icon size={15} aria-hidden="true" className={`hidden shrink-0 min-[400px]:block ${active ? 'text-accent' : ''}`} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {(activeView === 'list' || activeView === 'calendar') && (
      <StatStrip index={1}>
        <StatCell label="Active subscriptions" hint="Running right now" tone="orange" isLoading={isLoading} value={activeCount} />
        <StatCell label="Ending in 7 days" hint="Members to remind about renewal" tone="red" isLoading={isLoading} value={endingSoonCount} />
        <StatCell label="Expired" hint="Not renewed yet" tone="slate" isLoading={isLoading} value={expiredCount} />
        <StatCell label="Upcoming classes & events" hint="From today onward" tone="gold" isLoading={isLoading} value={upcomingEventCount} />
      </StatStrip>
      )}

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
              title="Classes & events"
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
          onAddSubscription={handleOpenAddModal}
          onEditSubscription={handleOpenEditModal}
          onDeleteSubscription={handleDelete}
          onRenewSubscription={handleOpenRenew}
          onPauseSubscription={handlePauseSubscription}
          onResumeSubscription={handleResumeSubscription}
          pausingId={pausingId}
          onOpenTrainingPlan={(member) => navigate('/members', { state: { memberId: member.id, tab: 'plan' } })}
        />
      )}

      {/* Walk-ins View */}
      {activeView === 'walkins' && (
        <WalkInsView
          transactions={sales.transactions}
          isLoading={sales.isLoading}
          onAdd={sales.handleOpenAddModal}
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

      {/* Price list View */}
      {activeView === 'prices' && (
        <PriceListView
          plans={plans}
          subscriptions={subscriptions}
          transactions={sales.transactions}
          isLoading={isLoading}
          deletingPlanId={deletingPlanId}
          onAdd={handleOpenNewPlan}
          onEdit={handleOpenEditPlan}
          onDelete={handleDeletePlan}
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

      {/* Walk-in / one-time sale */}
      <TransactionFormModal
        isOpen={sales.isModalOpen}
        isSaving={sales.isSaving}
        formData={sales.formData}
        setFormData={sales.setFormData}
        membersList={sales.membersList}
        plansList={walkInPlans}
        onClose={() => sales.setIsModalOpen(false)}
        onSave={sales.handleSaveTransaction}
        onPlanSelection={sales.handlePlanSelection}
        onAmountChange={sales.handleAmountChange}
        title="Record a walk-in"
        intro="Choose the walk-in package and the price fills in for you. A name is optional."
        submitLabel="Record walk-in"
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

      {/* Renew Subscription Modal */}
      <RenewSubscriptionModal
        subscription={renewTarget}
        subscriptions={subscriptions}
        plans={plans}
        isSaving={isRenewing}
        onClose={handleCloseRenew}
        onConfirm={handleRenew}
      />

      {/* New package / Edit package: one form */}
      <PackageFormModal
        isOpen={isAddingPlan}
        mode="add"
        plan={newPlan}
        setPlan={setNewPlan}
        isSaving={isSaving}
        recentColors={recentColors}
        onUseColor={saveRecentColor}
        onSave={handleAddNewPlan}
        onClose={() => setIsAddingPlan(false)}
      />
      <PackageFormModal
        isOpen={Boolean(editingPlan)}
        mode="edit"
        plan={editingPlan}
        setPlan={setEditingPlan}
        isSaving={isSaving}
        recentColors={recentColors}
        onUseColor={saveRecentColor}
        onSave={async () => { if (await handleSavePlan(editingPlan)) setEditingPlan(null); }}
        onClose={() => setEditingPlan(null)}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        isDanger={confirmDialog.isDanger ?? true}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />
      <AlertDialog
        isOpen={sales.alertDialog.isOpen}
        title={sales.alertDialog.title}
        message={sales.alertDialog.message}
        type={sales.alertDialog.type}
        onClose={() => sales.setAlertDialog(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
