export const getPackageCategoryValue = (plan) => {
  if (plan?.category === 'other' && plan.category_detail?.trim()) {
    return `other:${plan.category_detail.trim()}`;
  }
  return plan?.category || 'normal';
};

export const getPackageCategoryLabel = (plan) => {
  if (plan?.category === 'with_coach') return 'With Coach Subscription';
  if (plan?.category === 'walk_in') return 'Walk-In';
  if (plan?.category === 'other') return plan.category_detail?.trim() || 'Other / Custom';
  return 'Normal Subscription';
};

export const getPackageColor = (plan) => {
  if (plan?.color) return plan.color;
  if (plan?.category === 'with_coach') return '#8b5cf6';
  if (plan?.category === 'walk_in') return '#f59e0b';
  if (plan?.category === 'other') return '#3b82f6';
  return '#10b981';
};

export const getPackageCategoryOptions = (plans) => {
  const categories = new Map();
  plans.forEach(plan => {
    const value = plan.name;
    if (!categories.has(value)) {
      categories.set(value, { value, label: plan.name, color: getPackageColor(plan) });
    }
  });
  return [...categories.values()];
};

export const getActivePackageCategoryOptions = (plans, subscriptions, today) => {
  const allPlans = (plans.length > 0
    ? plans
    : subscriptions.map(sub => sub.plan || { name: sub.plan_type, category: 'normal' }))
    .filter(plan => plan.category !== 'walk_in'
      && !String(plan.name || '').toLowerCase().includes('walk')
      && !String(plan.name || '').toLowerCase().includes('daily'));

  return getPackageCategoryOptions(allPlans).map(category => {
    const categoryPlan = allPlans.find(plan => plan.name === category.value);
    const count = subscriptions.filter(sub => {
      const plan = sub.plan || plans.find(item => item.name === sub.plan_type);
      return sub.status === 'Active'
        && sub.start_date <= today
        && (sub.end_date || sub.start_date) >= today
        && (plan?.name || sub.plan_type) === category.value;
    }).length;
    return { ...category, color: getPackageColor(categoryPlan), count };
  });
};

export const getCoachEventCategoryOptions = (categories, events, today) => (
  categories.map(category => ({
    value: category.name,
    label: category.name,
    color: category.color,
    count: events.filter(event =>
      (event.category?.name || event.category || 'General') === category.name
      && (event.end_date || event.start_date) >= today
    ).length,
  }))
);

export const getSubscriptionFilterGroup = (subscription, plans) => {
  const planName = (subscription?.plan_type || '').trim();
  const plan = plans.find(item => item.name?.trim().toLowerCase() === planName.toLowerCase());
  const category = plan?.category;

  if (category === 'with_coach' || planName.toLowerCase().includes('with coach')) return 'With Coach';
  if (category === 'other') return 'Other';

  const duration = Number(plan?.duration_days);
  const normalizedName = planName.toLowerCase();
  if (normalizedName.includes('annual') || duration >= 330) return 'Annual';
  if (normalizedName.includes('monthly') || (duration >= 28 && duration <= 31)) return 'Monthly';

  return 'Other';
};
