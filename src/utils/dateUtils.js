// Get date in YYYY-MM-DD format
export const getDateKey = (date) => {
  return date.toISOString().split('T')[0];
};

// Format date for display (e.g., "Monday, Jan 15, 2024")
export const formatDateDisplay = (date) => {
  return new Intl.DateTimeFormat('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Format date for short display (e.g., "Jan 15")
export const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('en-PK', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Get last N days
export const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
};

// Get current year start date
export const getCurrentYearStart = () => {
  const date = new Date();
  date.setMonth(0, 1);
  return date;
};

// Get current date
export const getTodayDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Check if date is today
export const isToday = (date) => {
  const today = getTodayDate();
  return getDateKey(date) === getDateKey(today);
};

// Format time (HH:MM)
export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
