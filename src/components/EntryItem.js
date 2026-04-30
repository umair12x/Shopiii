import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import GlassCard from './GlassCard';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const EntryItem = ({
  entry,
  onEdit,
  onDelete,
  onTogglePayment,
}) => {
  const isProfit = entry.profit > 0;
  const isLoss = entry.profit < 0;

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.itemName}"?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => onDelete(entry.id),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.contentTop}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{entry.itemName}</Text>
          <Text style={styles.prices}>
            Cost: {formatCurrency(entry.purchasePrice)} | Sale: {formatCurrency(entry.salePrice)}
          </Text>
        </View>
        <View style={styles.profitContainer}>
          <Text style={[styles.profit, isProfit ? { color: COLORS.success } : { color: COLORS.error }]}>
            {isProfit ? '+' : ''} {formatCurrency(entry.profit)}
          </Text>
          <Text style={styles.profitLabel}>{isProfit ? 'Profit' : isLoss ? 'Loss' : 'Break Even'}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.paymentBtn,
            { backgroundColor: entry.isPaymentCollected ? COLORS.success : COLORS.warning },
          ]}
          onPress={() => onTogglePayment(entry.id)}
        >
          <Text style={styles.paymentBtnText}>{entry.isPaymentCollected ? '✓ Collected' : '⏳ Pending'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(entry)}>
          <Text style={styles.actionBtnText}>✎ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.actionBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  contentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: THEME.fonts.medium,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: THEME.spacing.xs,
  },
  prices: {
    fontSize: THEME.fonts.small,
    color: COLORS.dim,
  },
  profitContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  profit: {
    fontSize: THEME.fonts.large,
    fontWeight: '800',
    marginBottom: THEME.spacing.xs,
  },
  profitLabel: {
    fontSize: THEME.fonts.small,
    color: COLORS.dim,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    justifyContent: 'space-between',
  },
  paymentBtn: {
    flex: 0.8,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBtnText: {
    fontSize: THEME.fonts.small,
    fontWeight: '700',
    color: COLORS.surface,
  },
  editBtn: {
    flex: 0.6,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.small,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flex: 0.6,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.small,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: THEME.fonts.small,
    fontWeight: '700',
    color: COLORS.surface,
  },
});
