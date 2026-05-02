import { Appearance } from 'react-native';

const LIGHT_COLORS = {
  background: '#F4FAFD',
  surface: '#FFFFFF',
  primary: '#10263F',
  accent: '#00B4D8',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  text: '#102033',
  muted: '#607086',
  white: '#FFFFFF',
  black: '#102033',
  transparent: 'transparent',
  shadow: 'rgba(16,38,63,0.10)',
  profitGreen: '#E8F7EE',
  lossRed: '#FDEEEF',
  pending: '#FFF7E8',
  splashBackground: '#F4FAFD',
  splashBackgroundAlt: '#EAF7FF',
  splashRing: 'rgba(0,180,216,0.16)',
  splashAccent: '#00B4D8',
  splashAccentSoft: '#00E5FF',
  splashText: '#102033',
  splashMuted: '#607086',
  splashMetalLight: '#FFFFFF',
  splashMetalMid: '#C5D4E3',
  splashMetalDark: '#8EA0B8',
};

const DARK_COLORS = {
  background: '#0B1220',
  surface: '#111C30',
  primary: '#060C16',
  accent: '#D4AE84',
  success: '#4CAF50',
  error: '#EF5350',
  warning: '#F59E0B',
  text: '#E7EDF8',
  muted: '#9AA7BD',
  white: '#FFFFFF',
  black: '#0B1320',
  transparent: 'transparent',
  shadow: 'rgba(0,0,0,0.35)',
  profitGreen: 'rgba(76,175,80,0.18)',
  lossRed: 'rgba(239,83,80,0.18)',
  pending: 'rgba(245,158,11,0.16)',
  splashBackground: '#0A0F1A',
  splashBackgroundAlt: '#0F1724',
  splashRing: 'rgba(0,229,255,0.15)',
  splashAccent: '#00E5FF',
  splashAccentSoft: '#00B4D8',
  splashText: '#FFFFFF',
  splashMuted: '#6B7A93',
  splashMetalLight: '#FFFFFF',
  splashMetalMid: '#B8C2D4',
  splashMetalDark: '#8A95AE',
};

const withAliases = (palette, scheme) => ({
  ...palette,
  light: palette.surface,
  dark: palette.text,
  lightGray: scheme === 'dark' ? 'rgba(231,237,248,0.08)' : 'rgba(16,38,63,0.04)',
  darkGray: palette.muted,
  gray: palette.muted,
  secondary: palette.accent,
});

export const getThemeColors = (scheme = Appearance.getColorScheme()) => {
  const palette = scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  return withAliases(palette, scheme);
};

export const COLORS = getThemeColors();

export const applyColorScheme = (scheme) => {
  Object.assign(COLORS, getThemeColors(scheme));
};

Appearance.addChangeListener(({ colorScheme }) => {
  applyColorScheme(colorScheme);
});

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
    soft: { 
      shadowColor: 'rgba(11,19,32,0.06)', 
      shadowOffset: { width: 0, height: 6 }, 
      shadowOpacity: 1, 
      shadowRadius: 16, 
      elevation: 4 
    },
    subtle: { 
      shadowColor: 'rgba(11,19,32,0.04)', 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 1, 
      shadowRadius: 10, 
      elevation: 2 
    },
    strong: { 
      shadowColor: 'rgba(11,19,32,0.12)', 
      shadowOffset: { width: 0, height: 8 }, 
      shadowOpacity: 1, 
      shadowRadius: 24, 
      elevation: 8 
    },
  },
};

// Backwards-compatible aliases for older code
THEME.fonts.small = THEME.fonts.xs;
THEME.fonts.regular = THEME.fonts.sm;
THEME.fonts.medium = THEME.fonts.md;
THEME.fonts.large = THEME.fonts.lg;

THEME.borderRadius.small = THEME.borderRadius.sm;
THEME.borderRadius.medium = THEME.borderRadius.md;
THEME.borderRadius.large = THEME.borderRadius.lg;