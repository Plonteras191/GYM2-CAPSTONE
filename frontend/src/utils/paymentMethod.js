export const getPaymentMethodLabel = (method) => (
  String(method || '').trim().toLowerCase() === 'card' ? 'Maya' : method
);
