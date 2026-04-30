import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const EntryItem = ({ entry, onEdit, onDelete, onTogglePayment }) => {
  const isProfit = entry.profit > 0;
  const isLoss = entry.profit < 0;

  const handleDelete = () => {
    Alert.alert('Delete Entry', `Are you sure you want to delete "${entry.itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => onDelete(entry.id), style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.name}>{entry.itemName}</Text>
          <Text style={styles.meta}>{`Cost ${formatCurrency(entry.purchasePrice)} • Sale ${formatCurrency(entry.salePrice)}`}</Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={[styles.profit, isProfit ? { color: COLORS.success } : { color: COLORS.error }]}>
            {isProfit ? '+' : ''}{formatCurrency(entry.profit)}
          </Text>
          <Text style={styles.profitLabel}>{isProfit ? 'Profit' : isLoss ? 'Loss' : 'Even'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onTogglePayment(entry.id)}
          style={[styles.paymentBtn, entry.isPaymentCollected ? styles.collected : styles.pending]}
        >
          <MaterialCommunityIcons
            name={entry.isPaymentCollected ? 'check-circle-outline' : 'clock-outline'}
            size={16}
            color={entry.isPaymentCollected ? COLORS.success : COLORS.warning}
          />
          <Text style={styles.paymentText}>{entry.isPaymentCollected ? 'Collected' : 'Pending'}</Text>
        </TouchableOpacity>

        <View style={styles.rowBtns}>
          <TouchableOpacity onPress={() => onEdit(entry)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="pencil" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.iconBtn, styles.deleteBtn]}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.elevation.subtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  name: {
    fontSize: THEME.fonts.md,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  meta: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  profit: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
  },
  profitLabel: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collected: {
    backgroundColor: 'rgba(46,125,50,0.12)',
  },
  pending: {
    backgroundColor: 'rgba(217,119,6,0.08)',
  },
  paymentText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  rowBtns: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
    marginLeft: THEME.spacing.sm,
  },
  deleteBtn: {
    backgroundColor: 'rgba(198,40,40,0.08)',
  },
});
