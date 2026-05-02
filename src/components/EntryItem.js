import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { AppIcon as MaterialCommunityIcons } from './AppIcon';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

export const EntryItem = ({ entry, onEdit, onDelete, readOnly = false }) => {
  const isProfit = (entry.profit || 0) > 0;
  const isLoss = (entry.profit || 0) < 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Day',
      `Are you sure you want to delete the totals for ${entry.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            Animated.timing(swipeAnim, {
              toValue: -500,
              duration: 300,
              useNativeDriver: true,
            }).start(() => onDelete(entry.id));
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const profitPercentage = (entry.salePrice || 0) > 0 
    ? (((entry.profit || 0) / entry.salePrice) * 100).toFixed(1)
    : '0';

  return (
    <Animated.View style={[
      styles.container,
      {
        transform: [
          { translateX: swipeAnim },
          { scale: scaleAnim }
        ]
      }
    ]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        {/* Main Content */}
        <View style={styles.contentWrapper}>
          <View style={styles.leftSection}>
            <View style={[
              styles.profitIndicator,
              isProfit ? styles.profitBadge : isLoss ? styles.lossBadge : styles.neutralBadge
            ]}>
              <MaterialCommunityIcons 
                name={isProfit ? 'trending-up' : isLoss ? 'trending-down' : 'calendar'} 
                size={20} 
                color={isProfit ? COLORS.success : isLoss ? COLORS.error : COLORS.muted} 
              />
            </View>

            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={1}>{entry.date}</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceChip}>
                  <MaterialCommunityIcons name="arrow-down" size={12} color={COLORS.warning} />
                  <Text style={styles.priceText}>{formatCurrency(entry.purchasePrice)}</Text>
                </View>
                <View style={styles.priceChip}>
                  <MaterialCommunityIcons name="arrow-up" size={12} color={COLORS.success} />
                  <Text style={styles.priceText}>{formatCurrency(entry.salePrice)}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={[
              styles.profitAmount,
              isProfit ? { color: COLORS.success } : isLoss ? { color: COLORS.error } : { color: COLORS.muted }
            ]}>
              {isProfit ? '+' : ''}{formatCurrency(entry.profit)}
            </Text>
            <View style={[
              styles.percentageChip,
              isProfit ? styles.percentagePositive : isLoss ? styles.percentageNegative : styles.percentageNeutral
            ]}>
              <Text style={[
                styles.percentageText,
                { color: isProfit ? COLORS.success : isLoss ? COLORS.error : COLORS.muted }
              ]}>
                {isProfit ? '+' : ''}{profitPercentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!readOnly && (
          <View style={styles.actionsSection}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => onEdit && onEdit(entry)}
                style={styles.editBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
    overflow: 'hidden',
  },
  contentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    gap: 12,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profitIndicator: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitBadge: {
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  lossBadge: {
    backgroundColor: 'rgba(198,40,40,0.1)',
  },
  neutralBadge: {
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
  itemInfo: {
    flex: 1,
  },
  name: {
    fontSize: THEME.fonts.md,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11,19,32,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: THEME.fonts.xs,
    color: COLORS.muted,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  profitAmount: {
    fontSize: THEME.fonts.lg,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  percentageChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  percentagePositive: {
    backgroundColor: 'rgba(46,125,50,0.08)',
  },
  percentageNegative: {
    backgroundColor: 'rgba(198,40,40,0.08)',
  },
  percentageNeutral: {
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
  percentageText: {
    fontSize: THEME.fonts.xs,
    fontWeight: '700',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,19,32,0.04)',
  },
  paymentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectedBtn: {
    backgroundColor: 'rgba(46,125,50,0.08)',
  },
  pendingBtn: {
    backgroundColor: 'rgba(217,119,6,0.08)',
  },
  paymentText: {
    fontWeight: '700',
    fontSize: THEME.fonts.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(198,40,40,0.08)',
  },
});