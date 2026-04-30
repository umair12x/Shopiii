import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const TotalsSummary = ({ totals }) => {
  return (
    <GlassCard style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>💰 Investment</Text>
          <Text style={styles.value}>{formatCurrency(totals.totalInvestment)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.label}>🛍 Sales</Text>
          <Text style={styles.value}>{formatCurrency(totals.totalSales)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.label, styles.profitLabel]}>📈 Profit</Text>
          <Text
            style={[
              styles.value,
              totals.totalProfit >= 0 ? { color: COLORS.success } : { color: COLORS.error },
            ]}
          >
            {formatCurrency(totals.totalProfit)}
          </Text>
        </View>
      </View>

      <View style={styles.paymentRow}>
        <View style={styles.paymentItem}>
          <Text style={styles.label}>✓ Collected</Text>
          <Text style={[styles.paymentValue, { color: COLORS.success }]}>
            {formatCurrency(totals.collectedAmount)}
          </Text>
        </View>
        <View style={styles.paymentItem}>
          <Text style={styles.label}>⏳ Pending</Text>
          <Text style={[styles.paymentValue, { color: COLORS.warning }]}>
            {formatCurrency(totals.pendingAmount)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: THEME.spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
    gap: THEME.spacing.lg,
  },
  paymentItem: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: THEME.fonts.small,
    color: COLORS.dim,
    marginBottom: THEME.spacing.xs,
    fontWeight: '600',
  },
  profitLabel: {
    fontWeight: '700',
  },
  value: {
    fontSize: THEME.fonts.large,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentValue: {
    fontSize: THEME.fonts.medium,
    fontWeight: '700',
  },
});
