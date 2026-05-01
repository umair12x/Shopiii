// Get date in YYYY-MM-DD format
export const getDateKey = (date) => {
  if (!date || !(date instanceof Date)) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

// Format date for display (e.g., "Monday, 15 January, 2024")
export const formatDateDisplay = (date) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  return new Intl.DateTimeFormat('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Format date for short display (e.g., "15 Jan")
export const formatDateShort = (date) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  return new Intl.DateTimeFormat('en-PK', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format date as "Jan 15, 2024"
export const formatDateMedium = (date) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Format date as "15/01/2024"
export const formatDateNumeric = (date) => {
  if (!date || !(date instanceof Date)) {
    date = new Date();
  }
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// Get last N days as Date objects
export const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }
  return days;
};

// Get current year start date
export const getCurrentYearStart = () => {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Get current month start date
export const getCurrentMonthStart = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Get today's date with time set to midnight
export const getTodayDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// Get yesterday's date
export const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Check if date is today
export const isToday = (date) => {
  if (!date || !(date instanceof Date)) {
    return false;
  }
  const today = getTodayDate();
  return getDateKey(date) === getDateKey(today);
};

// Check if date is yesterday
export const isYesterday = (date) => {
  if (!date || !(date instanceof Date)) {
    return false;
  }
  const yesterday = getYesterdayDate();
  return getDateKey(date) === getDateKey(yesterday);
};

// Format time (HH:MM AM/PM)
export const formatTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Format date and time together
export const formatDateTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  return `${formatDateDisplay(date)} at ${formatTime(timestamp)}`;
};

// Get relative time (e.g., "Today", "Yesterday", "2 days ago")
export const getRelativeTime = (date) => {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    return formatDateMedium(date);
  }
};

// Format time ago for timestamps or Date objects
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) {
    return 'just now';
  }

  return getRelativeTime(date);
};

// Get month name
export const getMonthName = (monthIndex, short = false) => {
  const months = short 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return months[monthIndex] || '';
};

// Get day name
export const getDayName = (date, short = false) => {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  const days = short 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return days[date.getDay()] || '';
};

// Get day number in month
export const getDayNumber = (date) => {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  return String(date.getDate());
};

// Get start and end of week
export const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Get days in month
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Check if dates are same day
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return getDateKey(date1) === getDateKey(date2);
};

// Add days to date
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Subtract days from date
export const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};