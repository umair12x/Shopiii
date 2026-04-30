// Minimal, premium color palette and theme tokens
export const COLORS = {
  // Core
  background: '#F7F8FA', // very light neutral
  surface: '#FFFFFF', // card / surface background
  primary: '#0F1724', // deep navy (brand primary)
  accent: '#C49A6C', // warm gold accent

  // Semantic
  success: '#2E7D32',
  error: '#C62828',
  warning: '#D97706',

  // Text
  text: '#0B1320',
  muted: '#6B7280',

  // Utilities
  white: '#FFFFFF',
  transparent: 'transparent',
  shadow: 'rgba(11,19,32,0.08)',
};

// Backwards color aliases for older files
COLORS.light = COLORS.surface;
COLORS.dark = COLORS.text;
COLORS.lightGray = 'rgba(11,19,32,0.04)';
COLORS.darkGray = COLORS.muted;
COLORS.gray = COLORS.muted;
COLORS.secondary = COLORS.accent;

// Semantic light tints used previously
COLORS.profitGreen = '#E6F4EA';
COLORS.lossRed = '#FDECEC';
COLORS.pending = '#FFF7E6';
COLORS.black = COLORS.text;

export const THEME = {
  fonts: {
    // sizes tuned for clarity and hierarchy
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  elevation: {
    soft: { shadowColor: 'rgba(11,19,32,0.06)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 4 },
    subtle: { shadowColor: 'rgba(11,19,32,0.04)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 },
  },
};

// Backwards-compatible aliases for older code
THEME.fonts.small = THEME.fonts.xs;
THEME.fonts.regular = THEME.fonts.sm;
THEME.fonts.medium = THEME.fonts.md;
THEME.fonts.large = THEME.fonts.lg;
THEME.fonts.xxl = THEME.fonts.xxl;

THEME.spacing.xxl = THEME.spacing.xxl;

THEME.borderRadius.small = THEME.borderRadius.sm;
THEME.borderRadius.medium = THEME.borderRadius.md;
THEME.borderRadius.large = THEME.borderRadius.lg;
