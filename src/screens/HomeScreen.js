import React, {
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { DataContext } from "../context/DataContext";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay, formatTimeAgo } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyFormatter";

const { width: SCREEN_W } = Dimensions.get("window");

const EMPTY_TOTALS = {
  totalInvestment: 0,
  totalSales: 0,
  totalProfit: 0,
  cashInHand: 0,
};

// ─── Animated CountUp Number ───
const CountUp = ({ value, duration = 900, prefix = "", suffix = "" }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [value, anim, duration]);

  return (
    <Text style={styles.countUpText}>
      {prefix}
      {formatCurrency(display)}
      {suffix}
    </Text>
  );
};

// ─── Metric Pill ───
const MetricPill = ({ icon, label, value, color, delay = 0 }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, scale, opacity]);

  return (
    <Animated.View style={[styles.metricPill, { transform: [{ scale }], opacity }]}>
      <View style={[styles.metricPillIcon, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View>
        <Text style={styles.metricPillValue} numberOfLines={1}>
          {formatCurrency(value)}
        </Text>
        <Text style={styles.metricPillLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
};

// ─── Sparkline Bar (mini visual) ───
const SparkBar = ({ value, max, color }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const finalWidth = max > 0 ? (Math.abs(value) / max) * 100 : 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: finalWidth,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [finalWidth, widthAnim]);

  return (
    <View style={styles.sparkTrack}>
      <Animated.View
        style={[
          styles.sparkFill,
          {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

// ─── Period Selector ───
const PeriodSelector = ({ active, onChange }) => {
  const periods = [
    { key: "today", label: "Today", icon: "calendar-today" },
    { key: "month", label: "Month", icon: "calendar-month" },
    { key: "year", label: "Year", icon: "calendar" },
  ];

  return (
    <View style={styles.periodSelector}>
      {periods.map((p) => {
        const isActive = active === p.key;
        return (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, isActive && styles.periodBtnActive]}
            onPress={() => onChange(p.key)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={p.icon}
              size={16}
              color={isActive ? COLORS.white : COLORS.muted}
            />
            <Text style={[styles.periodText, isActive && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Health Indicator ───
const HealthIndicator = ({ profit, sales }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const margin = sales > 0 ? (profit / sales) * 100 : 0;
  const isHealthy = margin >= 20;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.3,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.healthWrap}>
      <Animated.View
        style={[
          styles.healthDot,
          {
            backgroundColor: isHealthy ? "#4ade80" : "#fbbf24",
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Text style={styles.healthText}>
        {isHealthy ? "Healthy margin" : "Low margin"} · {margin.toFixed(1)}%
      </Text>
    </View>
  );
};

// ─── Shop Detail Chip ───
const DetailChip = ({ icon, label, value }) => (
  <View style={styles.detailChip}>
    <MaterialCommunityIcons name={icon} size={14} color={COLORS.accent} />
    <View style={styles.detailChipText}>
      <Text style={styles.detailChipLabel}>{label}</Text>
      <Text style={styles.detailChipValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

// ═══════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════
export const HomeScreen = () => {
  const { shopDetails, entries, getEntriesForDateRange } = useContext(DataContext);
  const tabBarHeight = useBottomTabBarHeight();
  const [period, setPeriod] = useState("today");
  const [data, setData] = useState({
    today: EMPTY_TOTALS,
    month: EMPTY_TOTALS,
    year: EMPTY_TOTALS,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Animation refs
  const headerScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const currentMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(today),
    [today]
  );

  const getTotals = useCallback((periodEntries) => {
    return periodEntries.reduce(
      (acc, entry) => ({
        totalInvestment: acc.totalInvestment + (entry.purchasePrice || 0),
        totalSales: acc.totalSales + (entry.salePrice || 0),
        totalProfit: acc.totalProfit + (entry.profit || 0),
        cashInHand:
          acc.cashInHand + (entry.isPaymentCollected ? entry.salePrice || 0 : 0),
      }),
      { ...EMPTY_TOTALS }
    );
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [tEntries, mEntries, yEntries] = await Promise.all([
        getEntriesForDateRange(todayStart, todayEnd),
        getEntriesForDateRange(monthStart, now),
        getEntriesForDateRange(yearStart, now),
      ]);

      setData({
        today: getTotals(tEntries),
        month: getTotals(mEntries),
        year: getTotals(yEntries),
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Home load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getEntriesForDateRange, getTotals]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [entries, loadData]);

  // Entrance animation
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(headerScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: 0,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, headerOpacity, headerScale, contentOpacity, contentSlide, waveAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const current = data[period];
  const maxVal = Math.max(
    current.totalSales,
    current.totalProfit,
    current.totalInvestment,
    1
  );

  const periodLabel =
    period === "today"
      ? formatDateDisplay(today)
      : period === "month"
      ? currentMonthLabel
      : `Year ${today.getFullYear()}`;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingLogo}>
            <MaterialCommunityIcons name="storefront-outline" size={48} color={COLORS.accent} />
          </View>
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + THEME.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: tabBarHeight + 8 }}
        contentInsetAdjustmentBehavior="automatic"
        decelerationRate="normal"
        bounces={true}
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* ═══ HERO HEADER ═══ */}
        <Animated.View
          style={[
            styles.heroHeader,
            { opacity: headerOpacity, transform: [{ scale: headerScale }] },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroShop}>
              <View style={styles.shopAvatar}>
                <Text style={styles.shopAvatarText}>{shopDetails.name?.charAt(0) || "S"}</Text>
              </View>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shopDetails.name}</Text>
                <HealthIndicator profit={current.totalProfit} sales={current.totalSales} />
              </View>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Hero Metric */}
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>Net Profit</Text>
            <CountUp value={current.totalProfit} />
            <Text style={styles.heroMetricPeriod}>{periodLabel}</Text>
          </View>

          {/* Quick pills */}
          <View style={styles.heroPills}>
            <MetricPill
              icon="wallet-outline"
              label="Cash"
              value={current.cashInHand}
              color={COLORS.primary}
              delay={300}
            />
            <MetricPill
              icon="cart-outline"
              label="Sales"
              value={current.totalSales}
              color={COLORS.accent}
              delay={400}
            />
            <MetricPill
              icon="cash-minus"
              label="Cost"
              value={current.totalInvestment}
              color={COLORS.warning}
              delay={500}
            />
          </View>
        </Animated.View>

        {/* ═══ WAVE DIVIDER ═══ */}
        <Animated.View
          style={[
            styles.waveContainer,
            { opacity: waveAnim, transform: [{ translateY: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <View style={styles.wave} />
        </Animated.View>

        {/* ═══ CONTENT ═══ */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          {/* Period Selector */}
          <PeriodSelector active={period} onChange={setPeriod} />

          {/* Visual Breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
              <Text style={styles.breakdownSubtitle}>Profit vs Investment vs Sales</Text>
            </View>

            <View style={styles.sparkLines}>
              <View style={styles.sparkRow}>
                <View style={styles.sparkLabelWrap}>
                  <View style={[styles.sparkDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.sparkLabel}>Profit</Text>
                </View>
                <View style={styles.sparkBarWrap}>
                  <SparkBar value={current.totalProfit} max={maxVal} color={COLORS.success} />
                </View>
                <Text style={styles.sparkValue}>{formatCurrency(current.totalProfit)}</Text>
              </View>

              <View style={styles.sparkRow}>
                <View style={styles.sparkLabelWrap}>
                  <View style={[styles.sparkDot, { backgroundColor: COLORS.accent }]} />
                  <Text style={styles.sparkLabel}>Sales</Text>
                </View>
                <View style={styles.sparkBarWrap}>
                  <SparkBar value={current.totalSales} max={maxVal} color={COLORS.accent} />
                </View>
                <Text style={styles.sparkValue}>{formatCurrency(current.totalSales)}</Text>
              </View>

              <View style={styles.sparkRow}>
                <View style={styles.sparkLabelWrap}>
                  <View style={[styles.sparkDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.sparkLabel}>Cost</Text>
                </View>
                <View style={styles.sparkBarWrap}>
                  <SparkBar value={current.totalInvestment} max={maxVal} color={COLORS.warning} />
                </View>
                <Text style={styles.sparkValue}>{formatCurrency(current.totalInvestment)}</Text>
              </View>
            </View>
          </View>

          {/* Key Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "rgba(34,197,94,0.1)" }]}>
                <MaterialCommunityIcons name="trending-up" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.metricValue}>
                {current.totalSales > 0 ? ((current.totalProfit / current.totalSales) * 100).toFixed(1) : 0}%
              </Text>
              <Text style={styles.metricLabel}>Margin</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "rgba(196,154,108,0.1)" }]}>
                <MaterialCommunityIcons name="chart-pie" size={22} color={COLORS.accent} />
              </View>
              <Text style={styles.metricValue}>
                {formatCurrency(current.totalSales - current.totalInvestment)}
              </Text>
              <Text style={styles.metricLabel}>Gross</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
                <MaterialCommunityIcons name="wallet" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.metricValue}>
                {formatCurrency(current.cashInHand)}
              </Text>
              <Text style={styles.metricLabel}>Cash</Text>
            </View>
          </View>

          {/* Shop Details - Compact */}
          <View style={styles.shopSection}>
            <View style={styles.shopSectionHeader}>
              <Text style={styles.shopSectionTitle}>Shop Profile</Text>
              <Text style={styles.shopSectionUpdated}>Updated {formatTimeAgo(lastUpdated)}</Text>
            </View>

            <View style={styles.shopCard}>
              <View style={styles.shopCardTop}>
                <View style={styles.shopCardAvatar}>
                  <MaterialCommunityIcons name="storefront" size={28} color={COLORS.accent} />
                </View>
                <View style={styles.shopCardInfo}>
                  <Text style={styles.shopCardName}>{shopDetails.name}</Text>
                  <Text style={styles.shopCardOwner}>by {shopDetails.owner}</Text>
                </View>
              </View>

              <View style={styles.chipsRow}>
                <DetailChip icon="map-marker-outline" label="Location" value={shopDetails.address} />
                <DetailChip icon="phone-outline" label="Contact" value={shopDetails.contact} />
              </View>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.xl,
  },

  // ─── Loading ───
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.muted,
  },

  // ─── Hero Header ───
  heroHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 28,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroShop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  shopAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  shopAvatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Health
  healthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },

  // Hero Metric
  heroMetric: {
    marginTop: 28,
    marginBottom: 20,
  },
  heroMetricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  countUpText: {
    fontSize: 42,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -1,
  },
  heroMetricPeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },

  // Hero Pills
  heroPills: {
    flexDirection: "row",
    gap: 10,
  },
  metricPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  metricPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metricPillValue: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.white,
  },
  metricPillLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  // ─── Wave ───
  waveContainer: {
    height: 30,
    backgroundColor: COLORS.primary,
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // ─── Content ───
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },

  // Period Selector
  periodSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.06)",
  },
  periodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  periodBtnActive: {
    backgroundColor: COLORS.accent,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.muted,
  },
  periodTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },

  // Breakdown Card
  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  breakdownHeader: {
    marginBottom: THEME.spacing.md,
  },
  breakdownTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  breakdownSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    marginTop: 2,
  },
  sparkLines: {
    gap: 16,
  },
  sparkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sparkLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 70,
  },
  sparkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sparkLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  sparkBarWrap: {
    flex: 1,
  },
  sparkTrack: {
    height: 8,
    backgroundColor: "rgba(11,19,32,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  sparkFill: {
    height: "100%",
    borderRadius: 4,
  },
  sparkValue: {
    width: 80,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: THEME.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Shop Section
  shopSection: {
    marginTop: THEME.spacing.sm,
  },
  shopSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  shopSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  shopSectionUpdated: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
  },
  shopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  shopCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: THEME.spacing.md,
  },
  shopCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(196,154,108,0.2)",
  },
  shopCardInfo: {
    flex: 1,
  },
  shopCardName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  shopCardOwner: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10,
  },
  detailChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.06)",
  },
  detailChipText: {
    flex: 1,
  },
  detailChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailChipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
});