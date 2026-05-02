import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { AppIcon as MaterialCommunityIcons } from './AppIcon';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

const AnimatedNumber = ({ value, duration = 800, isPercentage = false }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });

    return () => animatedValue.removeListener(listener);
  }, [value, animatedValue, duration]);

  if (isPercentage) {
    return (
      <Text style={styles.animatedNumber}>
        {displayValue.toFixed(1)}%
      </Text>
    );
  }

  return (
    <Text style={styles.animatedNumber}>
      {formatCurrency(displayValue)}
    </Text>
  );
};

export const SummaryCard = ({
  title,
  amount,
  iconName = 'chart-line',
  iconColor = COLORS.primary,
  accentColor = COLORS.accent,
  trend = null,
  subtitle = null,
  isPercentage = false,
  delay = 0,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Icon bounce after card appears
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(iconBounce, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtle shimmer across card
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, delay);

    return () => clearTimeout(entranceTimer);
  }, [delay, scaleAnim, opacityAnim, slideAnim, iconBounce, shimmerAnim]);

  const handlePressIn = useCallback(() => setPressed(true), []);
  const handlePressOut = useCallback(() => setPressed(false), []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-100%', '200%'],
  });

  const isTrendPositive = trend > 0;
  const isTrendNegative = trend < 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { scale: pressed ? 0.97 : scaleAnim },
              { translateY: slideAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Shimmer overlay */}
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        />

        {/* Top row: Label + Trend */}
        <View style={styles.topRow}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{title}</Text>
          </View>

          {trend !== null && (
            <View style={[
              styles.trendBadge,
              isTrendPositive ? styles.trendUpBadge : isTrendNegative ? styles.trendDownBadge : styles.trendNeutralBadge
            ]}>
              <MaterialCommunityIcons
                name={isTrendPositive ? 'trending-up' : isTrendNegative ? 'trending-down' : 'minus'}
                size={14}
                color={isTrendPositive ? COLORS.success : isTrendNegative ? COLORS.error : COLORS.muted}
              />
              <Text style={[
                styles.trendText,
                { color: isTrendPositive ? COLORS.success : isTrendNegative ? COLORS.error : COLORS.muted }
              ]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>

        {/* Middle: Big metric */}
        <View style={styles.metricRow}>
          <AnimatedNumber value={amount} isPercentage={isPercentage} />
        </View>

        {/* Bottom: Context */}
        <View style={styles.bottomRow}>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            <View style={styles.placeholder} />
          )}

          {/* Floating icon */}
          <Animated.View
            style={[
              styles.iconFloat,
              {
                transform: [{ scale: iconBounce }],
                backgroundColor: `${accentColor}18`,
              },
            ]}
          >
            <MaterialCommunityIcons name={iconName} size={24} color={accentColor} />
          </Animated.View>
        </View>

        {/* Bottom accent line */}
        <View style={[styles.bottomLine, { backgroundColor: `${accentColor}30` }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    ...THEME.elevation.subtle,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.05)',
  },
  
  // Left accent bar
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 2,
  },

  // Shimmer effect
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ skewX: '-20deg' }],
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingRight: 16,
  },
  labelWrap: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Trend badge
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendUpBadge: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  trendDownBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  trendNeutralBadge: {
    backgroundColor: 'rgba(11,19,32,0.06)',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Metric
  metricRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  animatedNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.8,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    flex: 1,
    paddingRight: 8,
  },
  placeholder: {
    flex: 1,
  },

  // Floating icon
  iconFloat: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.elevation.small,
  },

  // Bottom line
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
  },
});