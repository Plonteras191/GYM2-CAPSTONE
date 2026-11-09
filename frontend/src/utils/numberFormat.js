export const formatNumber = (value, options = {}) => {
  const maximumFractionDigits = options.maximumFractionDigits ?? Math.max(2, options.minimumFractionDigits ?? 0);
  return Number(value || 0).toLocaleString('en-US', {
    ...options,
    maximumFractionDigits,
  });
};
