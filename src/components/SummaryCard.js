import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const SummaryCard = ({
  title,
  amount,
  backgroundColor = COLORS.surface,
  textColor = COLORS.text,
  iconName = 'chart-line',
  iconColor = COLORS.primary,
}) => {
  return (
    <View style={[styles.card, { backgroundColor }] }>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
        </View>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.amount, { color: textColor }]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    ...THEME.elevation.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,19,32,0.06)',
  },
  title: {
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
    color: COLORS.muted,
  },
  amount: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
});
