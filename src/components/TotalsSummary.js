import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const TotalsSummary = ({ totals }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.block}>
          <Text style={styles.label}>Investment</Text>
          <Text style={styles.value}>{formatCurrency(totals.totalInvestment)}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Sales</Text>
          <Text style={styles.value}>{formatCurrency(totals.totalSales)}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Profit</Text>
          <Text style={[styles.value, totals.totalProfit >= 0 ? { color: COLORS.success } : { color: COLORS.error }]}>
            {formatCurrency(totals.totalProfit)}
          </Text>
        </View>
      </View>

      <View style={styles.rowSecondary}>
        <Text style={styles.smallLabel}>Collected: <Text style={styles.smallValue}>{formatCurrency(totals.collectedAmount)}</Text></Text>
        <Text style={styles.smallLabel}>Pending: <Text style={[styles.smallValue, { color: COLORS.warning }]}>{formatCurrency(totals.pendingAmount)}</Text></Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.elevation.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  block: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: THEME.spacing.md,
  },
  label: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
    marginBottom: 6,
  },
  value: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.sm,
  },
  smallLabel: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
  },
  smallValue: {
    fontWeight: '700',
    color: COLORS.text,
  },
});
