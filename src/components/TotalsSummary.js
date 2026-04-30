import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

const Metric = ({ iconName, label, value, valueStyle }) => (
  <View style={styles.block}>
    <View style={styles.metricHeader}>
      <View style={styles.metricIconWrap}>
        <MaterialCommunityIcons name={iconName} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
    <Text style={[styles.value, valueStyle]}>{formatCurrency(value)}</Text>
  </View>
);

export const TotalsSummary = ({ totals }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Metric iconName="cash-multiple" label="Investment" value={totals.totalInvestment} />
        <Metric iconName="cart-outline" label="Sales" value={totals.totalSales} />
        <Metric
          iconName="trending-up"
          label="Profit"
          value={totals.totalProfit}
          valueStyle={totals.totalProfit >= 0 ? { color: COLORS.success } : { color: COLORS.error }}
        />
      </View>

      <View style={styles.rowSecondary}>
        <View style={styles.secondaryItem}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.success} />
          <Text style={styles.smallLabel}>
            Collected: <Text style={styles.smallValue}>{formatCurrency(totals.collectedAmount)}</Text>
          </Text>
        </View>
        <View style={styles.secondaryItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.warning} />
          <Text style={styles.smallLabel}>
            Pending: <Text style={[styles.smallValue, { color: COLORS.warning }]}>{formatCurrency(totals.pendingAmount)}</Text>
          </Text>
        </View>
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
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(11,19,32,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
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
    gap: THEME.spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
