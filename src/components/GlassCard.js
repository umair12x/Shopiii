import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, THEME } from '../config/colors';

export const GlassCard = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glassLight,
    borderRadius: THEME.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: THEME.spacing.lg,
    ...THEME.shadow.subtle,
  },
});

export default GlassCard;
