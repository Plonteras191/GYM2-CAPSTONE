export const getPackageDetails = (transaction) => {
  if (transaction?.package_details) return transaction.package_details;
  if (transaction?.type === 'Refund') {
    return { title: 'Refund Payment', category: transaction.description || 'Refund' };
  }

  const plan = transaction?.membership?.plan;
  const name = transaction?.package_name_snapshot || plan?.name || transaction?.membership?.plan_type || transaction?.description?.replace(/\s+(Plan)?\s*Payment$|\s+Package$/i, '') || 'Unknown';
  const categoryValue = transaction?.package_category_snapshot || plan?.category;
  const category = categoryValue === 'with_coach'
    ? 'With Coach Subscription'
    : categoryValue === 'walk_in'
      ? 'Walk-In Package'
      : categoryValue === 'other'
        ? plan?.category_detail || 'Other / Custom'
        : 'Normal Subscription';

  return {
    title: `${name} Package Payment${transaction?.type === 'Subscription Upgrade' ? ' + Upgraded' : ''}`,
    category,
  };
};
