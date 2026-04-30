// Format currency values (Pakistani Rupee)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format number to 2 decimal places
export const formatNumber = (num) => {
  return parseFloat((num || 0).toFixed(2));
};

// Abbreviate large numbers (e.g., 1M, 1K)
export const abbreviateNumber = (num) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};
