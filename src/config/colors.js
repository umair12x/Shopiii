// Refined color scheme for glassmorphism + minimalism
export const COLORS = {
  // Brand
  primary: '#990302', // Deep red (brand accent)
  secondary: '#0a7273', // Teal accent
  accent: '#fda521',

  // Glass backgrounds (semi-transparent)
  glassLight: 'rgba(255,255,255,0.72)',
  glassMuted: 'rgba(255,255,255,0.48)',
  glassDark: 'rgba(3,48,67,0.12)',

  // Neutrals
  background: '#f6f5f3',
  surface: '#ffffff',
  text: '#033043',
  dim: '#95a5a6',

  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // Semantic subtle fills
  profitGreen: 'rgba(34,197,94,0.08)',
  lossRed: 'rgba(239,68,68,0.06)',
  pending: 'rgba(245,158,11,0.06)',
};

export const THEME = {
  fonts: {
    xxl: 28,
    xl: 22,
    large: 18,
    medium: 16,
    regular: 14,
    small: 12,
  },
  spacing: {
    xxl: 28,
    xl: 20,
    lg: 16,
    md: 12,
    sm: 8,
    xs: 4,
  },
  borderRadius: {
    small: 6,
    medium: 12,
    large: 18,
    pill: 999,
  },
  shadow: {
    subtle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};
