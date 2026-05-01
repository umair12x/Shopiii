import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
  accentColor = COLORS.accent,
  trend = null,
  subtitle = null,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.card, 
      { 
        backgroundColor,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }
    ]}>
      {/* Background decoration */}
      <View style={[styles.bgDecoration, { backgroundColor: `${iconColor}08` }]} />
      
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
            <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
          </View>
          {trend && (
            <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
              <MaterialCommunityIcons 
                name={trend > 0 ? 'arrow-up' : 'arrow-down'} 
                size={14} 
                color={trend > 0 ? COLORS.success : COLORS.error} 
              />
              <Text style={[styles.trendText, { color: trend > 0 ? COLORS.success : COLORS.error }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.amountSection}>
          <Text style={[styles.amount, { color: textColor }]}>
            {formatCurrency(amount)}
          </Text>
          <Text style={[styles.title, { color: textColor }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        {/* Progress bar decoration */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: iconColor, width: '60%' }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: THEME.spacing.md,
    ...THEME.elevation.soft,
    position: 'relative',
  },
  bgDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  contentWrapper: {
    padding: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trendUp: {
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  trendDown: {
    backgroundColor: 'rgba(198,40,40,0.1)',
  },
  trendText: {
    fontSize: THEME.fonts.sm,
    fontWeight: '700',
  },
  amountSection: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: THEME.fonts.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.fonts.xs,
    color: COLORS.muted,
    marginTop: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(11,19,32,0.06)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});