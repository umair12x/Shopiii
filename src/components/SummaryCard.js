import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const SummaryCard = ({
  title,
  amount,
  icon = '📊',
}) => {
  return (
    <GlassCard style={styles.wrapper}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.amount}>{formatCurrency(amount)}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    minWidth: 120,
  },
  icon: {
    fontSize: 30,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.fonts.regular,
    color: COLORS.dim,
    marginBottom: THEME.spacing.xs,
    fontWeight: '600',
  },
  amount: {
    fontSize: THEME.fonts.large,
    fontWeight: '700',
    color: COLORS.text,
  },
});
