export const MAX_PACKAGE_PRICE = 9999999.99;

export const sanitizePackagePrice = (value) => {
  if (!/^\d*(?:\.\d{0,2})?$/.test(value)) return null;
  if (value !== '' && value !== '.' && Number(value) > MAX_PACKAGE_PRICE) return null;
  return value;
};

export const isValidPackagePrice = (value) => {
  if (value === '' || value === '.' || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return false;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= MAX_PACKAGE_PRICE;
};
