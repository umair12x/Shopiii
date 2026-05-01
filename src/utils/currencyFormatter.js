// Format currency values (Pakistani Rupee)
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format currency with symbol only (₨)
export const formatCurrencySymbol = (amount) => {
  if (amount === null || amount === undefined) {
    amount = 0;
  }
  
  return `₨ ${new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

// Format currency with decimal places
export const formatCurrencyDecimal = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

// Format number to specific decimal places
export const formatNumberDecimal = (num, decimals = 2) => {
  if (num === null || num === undefined) {
    return '0.00';
  }
  
  return parseFloat(num).toFixed(decimals);
};

// Abbreviate large numbers (e.g., 1M, 1K)
export const abbreviateNumber = (num) => {
  if (num === null || num === undefined) {
    return '0';
  }
  
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  } else if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

// Abbreviate currency values (e.g., ₨ 1.5M, ₨ 500K)
export const abbreviateCurrency = (amount) => {
  if (amount === null || amount === undefined) {
    return '₨ 0';
  }
  
  const prefix = amount < 0 ? '-₨ ' : '₨ ';
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1_000_000) {
    return prefix + (absAmount / 1_000_000).toFixed(1) + 'M';
  } else if (absAmount >= 1_000) {
    return prefix + (absAmount / 1_000).toFixed(1) + 'K';
  }
  return prefix + absAmount.toFixed(0);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) {
    return '0%';
  }
  
  return value.toFixed(decimals) + '%';
};

// Format profit/loss with sign
export const formatProfitLoss = (amount) => {
  if (amount === null || amount === undefined) {
    return '₨ 0';
  }
  
  const sign = amount >= 0 ? '+' : '';
  return sign + formatCurrency(amount);
};

// Parse currency string to number
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Calculate profit margin percentage
export const calculateMargin = (costPrice, salePrice) => {
  if (!salePrice || salePrice === 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
};

// Calculate profit amount
export const calculateProfit = (costPrice, salePrice) => {
  return (salePrice || 0) - (costPrice || 0);
};