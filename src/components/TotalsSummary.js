import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

const Metric = ({ iconName, label, value, valueStyle, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.metricBlock,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    ]}>
      <View style={styles.metricIconContainer}>
        <View style={styles.metricIcon}>
          <MaterialCommunityIcons name={iconName} size={20} color={COLORS.accent} />
        </View>
      </View>
      <Text style={[styles.metricValue, valueStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(value)}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Animated.View>
  );
};

export const TotalsSummary = ({ totals }) => {
  const containerScale = useRef(new Animated.Value(0.95)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const profitMargin = totals.totalSales > 0 
    ? ((totals.totalProfit / totals.totalSales) * 100).toFixed(1)
    : 0;

  return (
    <Animated.View style={[
      styles.container,
      {
        transform: [{ scale: containerScale }],
        opacity: containerOpacity,
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="chart-pie" size={20} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Overview</Text>
        </View>
        <View style={styles.marginBadge}>
          <Text style={styles.marginText}>{profitMargin}% margin</Text>
        </View>
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsRow}>
        <Metric 
          iconName="wallet-outline"
          label="Investment"
          value={totals.totalInvestment}
          delay={100}
        />
        <View style={styles.metricDivider} />
        <Metric 
          iconName="shopping-outline"
          label="Sales"
          value={totals.totalSales}
          delay={200}
        />
        <View style={styles.metricDivider} />
        <Metric 
          iconName="trophy-outline"
          label="Profit"
          value={totals.totalProfit}
          valueStyle={totals.totalProfit >= 0 ? { color: COLORS.success } : { color: COLORS.error }}
          delay={300}
        />
      </View>

      {/* Collection Status */}
      <View style={styles.separator} />
      <View style={styles.collectionSection}>
        <View style={styles.collectionItem}>
          <View style={[styles.collectionDot, { backgroundColor: COLORS.success }]} />
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionLabel}>Collected</Text>
            <Text style={[styles.collectionValue, { color: COLORS.success }]}>
              {formatCurrency(totals.collectedAmount)}
            </Text>
          </View>
          <View style={[styles.progressBadge, styles.collectedBadge]}>
            <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} />
          </View>
        </View>
        
        <View style={styles.collectionDivider} />
        
        <View style={styles.collectionItem}>
          <View style={[styles.collectionDot, { backgroundColor: COLORS.warning }]} />
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionLabel}>Pending</Text>
            <Text style={[styles.collectionValue, { color: COLORS.warning }]}>
              {formatCurrency(totals.pendingAmount)}
            </Text>
          </View>
          <View style={[styles.progressBadge, styles.pendingBadge]}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.warning} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  marginBadge: {
    backgroundColor: 'rgba(196,154,108,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  marginText: {
    fontSize: THEME.fonts.xs,
    color: COLORS.accent,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconContainer: {
    marginBottom: 12,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: THEME.fonts.lg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: THEME.fonts.xs,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(11,19,32,0.06)',
    marginTop: 10,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(11,19,32,0.06)',
    marginVertical: THEME.spacing.md,
  },
  collectionSection: {
    gap: 12,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collectionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionLabel: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
    fontWeight: '500',
  },
  collectionValue: {
    fontSize: THEME.fonts.sm,
    fontWeight: '700',
  },
  progressBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectedBadge: {
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(217,119,6,0.1)',
  },
  collectionDivider: {
    height: 1,
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
});