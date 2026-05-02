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
  Alert,
  Linking,
  AppState,
  Platform,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { DataContext } from "../context/DataContext";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay, formatTimeAgo } from "../utils/dateUtils";
import { formatCurrency } from "../utils/currencyFormatter";
import { requestRequiredPermissions, requestStoragePermission, checkStoragePermission } from "../utils/permissionManager";
import { downloadCSVToDevice } from "../utils/csvExporter";

const { width: SCREEN_W } = Dimensions.get("window");

const EMPTY_TOTALS = {
  totalInvestment: 0,
  totalSales: 0,
  totalProfit: 0,
  cashInHand: 0,
};
const PERIODS = [
  { key: "today", label: "Today", icon: "calendar-today" },
  { key: "month", label: "Month", icon: "calendar-month" },
  { key: "year", label: "Year", icon: "calendar" },
];

// ─── Reusable Animated Value Hook ───
const useAnimatedValue = (initial) =>
  useRef(new Animated.Value(initial)).current;

// ─── CountUp with full value display ───
const CountUp = React.memo(({ value }) => {
  const anim = useAnimatedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [value]);

  // Format without abbreviation for complete number display
  const formatFullNumber = (num) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return <Text style={styles.countUpText}>{formatFullNumber(display)}</Text>;
});

// ─── Metric Pill with full value ───
const MetricPill = React.memo(({ icon, label, value, color, delay }) => {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  const formatFullNumber = (num) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Animated.View style={[styles.metricPill, { opacity }]}>
      <View style={[styles.metricPillIcon, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <View style={styles.metricPillTextContainer}>
        <Text style={styles.metricPillValue} numberOfLines={2}>
          {formatFullNumber(value)}
        </Text>
        <Text style={styles.metricPillLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
});

// ─── Spark Bar ───
const SparkBar = React.memo(({ value, max, color }) => {
  const width = useAnimatedValue(0);
  const pct = max > 0 ? (Math.abs(value) / max) * 100 : 0;

  useEffect(() => {
    Animated.timing(width, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.sparkTrack}>
      <Animated.View
        style={[
          styles.sparkFill,
          {
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
});

// ─── Health Indicator ───
const HealthIndicator = React.memo(({ profit, sales }) => {
  const margin = sales > 0 ? (profit / sales) * 100 : 0;
  const healthy = margin >= 20;

  return (
    <View style={styles.healthWrap}>
      <View
        style={[
          styles.healthDot,
          { backgroundColor: healthy ? "#4ade80" : "#fbbf24" },
        ]}
      />
      <Text style={styles.healthText}>
        {healthy ? "Healthy" : "Low"} margin · {margin.toFixed(1)}%
      </Text>
    </View>
  );
});

// ─── Detail Chip with full value ───
const DetailChip = React.memo(({ icon, label, value }) => (
  <View style={styles.detailChip}>
    <MaterialCommunityIcons name={icon} size={14} color={COLORS.accent} />
    <View style={styles.detailChipTextContainer}>
      <Text style={styles.detailChipLabel}>{label}</Text>
      <Text style={styles.detailChipValue} numberOfLines={2}>
        {value || "—"}
      </Text>
    </View>
  </View>
));

// ─── Sync Status ───
const SyncStatus = React.memo(
  ({ lastSyncTime, isSynced, syncStatus, syncMessage, dataStorageAge, onSync }) => {
    const isSyncing = syncStatus === "syncing";
    const spin = useAnimatedValue(0);

    useEffect(() => {
      if (!isSyncing) return;
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }, [isSyncing]);

    const icon = isSyncing
      ? "cloud-sync"
      : isSynced
        ? "cloud-check"
        : "cloud-off-outline";
    const color = isSyncing
      ? COLORS.warning || "#fbbf24"
      : isSynced
        ? COLORS.success || "#22c55e"
        : COLORS.error || "#ef4444";
    const msg = isSyncing
      ? "Syncing..."
      : syncStatus === "error" && syncMessage
        ? syncMessage
      : lastSyncTime
        ? `Synced ${formatTimeAgo(lastSyncTime)}`
        : dataStorageAge
          ? `Local · ${formatTimeAgo(new Date(Date.now() - dataStorageAge))}`
          : "Local only";

    return (
      <TouchableOpacity
        style={[styles.syncCard, { borderLeftColor: color }]}
        onPress={onSync}
        activeOpacity={isSyncing ? 1 : 0.8}
        disabled={isSyncing}
      >
        <Animated.View
          style={[
            styles.syncIconWrap,
            {
              transform: [
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </Animated.View>
        <View style={styles.syncTextContainer}>
          <Text style={styles.syncTitle}>
            {isSyncing
              ? "Syncing..."
              : isSynced
                ? "Cloud Synced"
                : "Local Only"}
          </Text>
          <Text style={[styles.syncMessage, { color }]} numberOfLines={2}>
            {msg}
          </Text>
        </View>
        {!isSyncing && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={COLORS.muted}
          />
        )}
      </TouchableOpacity>
    );
  },
);

// ═══════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════
export const HomeScreen = () => {
  const {
    shopDetails,
    entries,
    getEntriesForDateRange,
    lastSyncTime,
    isSynced,
    syncStatus,
    syncMessage,
    dataStorageAge,
    uploadToFirebase,
    fetchFromFirebase,
    downloadAsCSV,
    productPrices,
  } = useContext(DataContext);
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
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingOpenSettings, setPendingOpenSettings] = useState(false);

  // Single animation controller instead of multiple refs
  const animController = useRef(new Animated.Value(0)).current;

  const today = useMemo(() => new Date(), []);
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PK", {
        month: "long",
        year: "numeric",
      }).format(today),
    [],
  );

  const getTotals = useCallback(
    (items) =>
      items.reduce(
        (acc, e) => ({
          totalInvestment: acc.totalInvestment + (e.purchasePrice || 0),
          totalSales: acc.totalSales + (e.salePrice || 0),
          totalProfit: acc.totalProfit + (e.profit || 0),
          cashInHand:
            acc.cashInHand + (e.isPaymentCollected ? e.salePrice || 0 : 0),
        }),
        { ...EMPTY_TOTALS },
      ),
    [],
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const [tEntries, mEntries, yEntries] = await Promise.all([
        getEntriesForDateRange(todayStart, todayEnd),
        getEntriesForDateRange(
          new Date(now.getFullYear(), now.getMonth(), 1),
          now,
        ),
        getEntriesForDateRange(new Date(now.getFullYear(), 0, 1), now),
      ]);
      setData({ today: getTotals(tEntries), month: getTotals(mEntries), year: getTotals(yEntries) });
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
    }, [loadData]),
  );
  useEffect(() => {
    loadData();
  }, [entries, loadData]);

  // Request required permissions on component mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await requestRequiredPermissions();
      } catch (error) {
        console.warn('Permission request error:', error);
      }
    };
    requestPermissions();
  }, []);

  // If user opened Settings to grant permission, detect return to app and retry export
  useEffect(() => {
    const handleAppState = async (next) => {
      if (next === 'active' && pendingOpenSettings) {
        setPendingOpenSettings(false);
        try {
          const granted = await checkStoragePermission();
          if (granted) {
            if (Platform.OS === 'android' && ToastAndroid) {
              ToastAndroid.show('Storage granted — retrying export...', ToastAndroid.SHORT);
            } else {
              Alert.alert('Permission Granted', 'Storage permission granted. Retrying export...');
            }
            // Retry export
            handleExportCSV();
          } else {
            if (Platform.OS === 'android' && ToastAndroid) {
              ToastAndroid.show('Storage permission still not granted.', ToastAndroid.SHORT);
            } else {
              Alert.alert('Permission Not Granted', 'Storage permission was not granted.');
            }
          }
        } catch (e) {
          console.warn('Error checking permission after settings:', e);
        }
      }
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handleAppState) : null;
    return () => {
      try {
        sub && sub.remove && sub.remove();
      } catch (e) {}
    };
  }, [pendingOpenSettings, handleExportCSV]);

  // Single staggered entrance animation
  useEffect(() => {
    if (loading) return;
    Animated.timing(animController, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);
  
  const handleSync = useCallback(async () => {
    if (!uploadToFirebase) return;
    try {
      const r = await uploadToFirebase();
      if (!r?.success) console.warn("Sync failed:", r?.message);
    } catch (e) {
      console.error("Sync error:", e);
    }
  }, [uploadToFirebase]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      // Request storage permission first
      const storagePermission = await requestStoragePermission();
      
      if (storagePermission.status !== 'granted') {
        Alert.alert(
          'Storage Permission Required',
          'Please grant storage permission to download CSV files. You can enable this in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                try {
                  setPendingOpenSettings(true);
                  Linking.openSettings();
                } catch (e) {
                  console.warn('Unable to open settings:', e);
                }
              },
            },
          ],
        );
        setIsExporting(false);
        return;
      }

      // Get all data for export
      const allEntries = await getEntriesForDateRange(
        new Date(new Date().getFullYear(), 0, 1),
        new Date()
      );
      
      // Download to device storage
      const result = await downloadCSVToDevice(allEntries, shopDetails, productPrices);
      
      if (result.success) {
        Alert.alert(
          '✓ Downloaded Successfully',
          result.message || 'CSV file has been downloaded to your device storage!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Download Failed',
          result.message || 'Failed to download CSV file. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Error',
        error.message || 'An error occurred while exporting. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  }, [downloadCSVToDevice, shopDetails, productPrices, getEntriesForDateRange]);

  const handleDownloadFromFirebase = useCallback(async () => {
    setIsDownloading(true);
    try {
      const result = await fetchFromFirebase();
      if (result.success) {
        Alert.alert(
          'Download Successful',
          result.message || 'Data downloaded from Firebase successfully!'
        );
      } else {
        Alert.alert(
          'Download Failed',
          result.message || 'Failed to download data from Firebase'
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', error.message || 'An error occurred during download');
    } finally {
      setIsDownloading(false);
    }
  }, [fetchFromFirebase]);

  const current = data[period];
  const maxVal = Math.max(
    current.totalSales,
    current.totalProfit,
    current.totalInvestment,
    1,
  );
  const periodLabel =
    period === "today"
      ? formatDateDisplay(today)
      : period === "month"
        ? monthLabel
        : `Year ${today.getFullYear()}`;

  const shopName = shopDetails?.name || "My Shop";
  const shopOwner = shopDetails?.owner || "";
  const shopAddress = shopDetails?.address || "";
  const shopContact = shopDetails?.contact || "";

  // Interpolations from single controller
  const headerOpacity = animController.interpolate({
    inputRange: [0, 0.4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const headerScale = animController.interpolate({
    inputRange: [0, 0.4],
    outputRange: [0.95, 1],
    extrapolate: "clamp",
  });
  const contentOpacity = animController.interpolate({
    inputRange: [0.2, 0.7],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const contentSlide = animController.interpolate({
    inputRange: [0.2, 0.7],
    outputRange: [30, 0],
    extrapolate: "clamp",
  });
  const waveTranslate = animController.interpolate({
    inputRange: [0.3, 1],
    outputRange: [20, 0],
    extrapolate: "clamp",
  });

  // Format helper for complete number display
  const formatFullNumber = (num) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingLogo}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={48}
              color={COLORS.accent}
            />
          </View>
          <ActivityIndicator
            size="large"
            color={COLORS.accent}
            style={{ marginTop: 20 }}
          />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + THEME.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Hero */}
        <Animated.View
          style={[
            styles.heroHeader,
            { opacity: headerOpacity, transform: [{ scale: headerScale }] },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroShop}>
              <View style={styles.shopAvatar}>
                <Text style={styles.shopAvatarText}>{shopName.charAt(0)}</Text>
              </View>
              <View style={styles.shopInfoContainer}>
                <Text style={styles.shopName} numberOfLines={2}>
                  {shopName}
                </Text>
                <HealthIndicator
                  profit={current.totalProfit}
                  sales={current.totalSales}
                />
              </View>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricLabel}>Net Profit</Text>
            <CountUp value={current.totalProfit} />
            <Text style={styles.heroMetricPeriod}>{periodLabel}</Text>
          </View>

          <View style={styles.heroPills}>
            <MetricPill
              icon="wallet-outline"
              label="Cash in Hand"
              value={current.cashInHand}
              color={COLORS.success}
              delay={200}
            />
            <MetricPill
              icon="cart-outline"
              label="Total Sales"
              value={current.totalSales}
              color={COLORS.accent}
              delay={300}
            />
            <MetricPill
              icon="cash-minus"
              label="Total Cost"
              value={current.totalInvestment}
              color={COLORS.warning}
              delay={400}
            />
          </View>
        </Animated.View>

        {/* Sync */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            backgroundColor: COLORS.primary,
            paddingHorizontal: THEME.spacing.lg,
            paddingBottom: THEME.spacing.md,
          }}
        >
          <SyncStatus
            lastSyncTime={lastSyncTime}
            isSynced={isSynced}
            syncStatus={syncStatus}
            syncMessage={syncMessage}
            dataStorageAge={dataStorageAge}
            onSync={handleSync}
          />
        </Animated.View>

        {/* Wave */}
        <Animated.View
          style={[
            styles.waveContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: waveTranslate }],
            },
          ]}
        >
          <View style={styles.wave} />
        </Animated.View>

        {/* Content */}
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
          <View style={styles.periodSelector}>
            {PERIODS.map((p) => {
              const active = period === p.key;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.periodBtn, active && styles.periodBtnActive]}
                  onPress={() => setPeriod(p.key)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={p.icon}
                    size={16}
                    color={active ? COLORS.white : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.periodText,
                      active && styles.periodTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
              <Text style={styles.breakdownSubtitle}>
                Profit vs Investment vs Sales
              </Text>
            </View>
            <View style={styles.sparkLines}>
              {[
                {
                  label: "Profit",
                  value: current.totalProfit,
                  color: COLORS.success,
                },
                {
                  label: "Sales",
                  value: current.totalSales,
                  color: COLORS.accent,
                },
                {
                  label: "Cost",
                  value: current.totalInvestment,
                  color: COLORS.warning,
                },
              ].map((item) => (
                <View key={item.label} style={styles.sparkRow}>
                  <View style={styles.sparkLabelWrap}>
                    <View
                      style={[styles.sparkDot, { backgroundColor: item.color }]}
                    />
                    <Text style={styles.sparkLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.sparkBarContainer}>
                    <SparkBar
                      value={item.value}
                      max={maxVal}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.sparkValue}>
                    {formatFullNumber(item.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {[
              {
                icon: "trending-up",
                label: "Profit Margin",
                value: `${current.totalSales > 0 ? ((current.totalProfit / current.totalSales) * 100).toFixed(2) : 0}%`,
                bg: "rgba(34,197,94,0.1)",
                color: COLORS.success,
              },
              {
                icon: "chart-pie",
                label: "Gross Profit",
                value: formatFullNumber(
                  current.totalSales - current.totalInvestment,
                ),
                bg: "rgba(196,154,108,0.1)",
                color: COLORS.accent,
              },
              {
                icon: "wallet",
                label: "Cash Balance",
                value: formatFullNumber(current.cashInHand),
                bg: "rgba(59,130,246,0.1)",
                color: COLORS.primary,
              },
            ].map((m) => (
              <View key={m.label} style={styles.metricCard}>
                <View
                  style={[styles.metricIconWrap, { backgroundColor: m.bg }]}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={22}
                    color={m.color}
                  />
                </View>
                <Text style={styles.metricValue} numberOfLines={2}>
                  {m.value}
                </Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Export & Download Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleExportCSV}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="download"
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.actionButtonText}>Export CSV</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleDownloadFromFirebase}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="cloud-download"
                    size={22}
                    color={COLORS.accent}
                  />
                  <Text style={styles.actionButtonTextSecondary}>
                    Download from Cloud
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Shop */}
          <View style={styles.shopSection}>
            <View style={styles.shopSectionHeader}>
              <Text style={styles.shopSectionTitle}>Shop Profile</Text>
              <Text style={styles.shopSectionUpdated}>
                Updated {formatTimeAgo(lastUpdated)}
              </Text>
            </View>
            <View style={styles.shopCard}>
              <View style={styles.shopCardTop}>
                <View style={styles.shopCardAvatar}>
                  <MaterialCommunityIcons
                    name="storefront"
                    size={28}
                    color={COLORS.accent}
                  />
                </View>
                <View style={styles.shopCardInfoContainer}>
                  <Text style={styles.shopCardName} numberOfLines={2}>
                    {shopName}
                  </Text>
                  {shopOwner ? (
                    <Text style={styles.shopCardOwner}>Owner: {shopOwner}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.chipsRow}>
                <DetailChip
                  icon="map-marker-outline"
                  label="Location"
                  value={shopAddress}
                />
                <DetailChip
                  icon="phone-outline"
                  label="Contact"
                  value={shopContact}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: COLORS.background },
  
  // Updated containers for better text wrapping
  flex1: { flex: 1 },
  shopInfoContainer: { flex: 1, marginRight: 8 },
  shopCardInfoContainer: { flex: 1 },
  metricPillTextContainer: { flex: 1, marginRight: 4 },
  detailChipTextContainer: { flex: 1 },
  syncTextContainer: { flex: 1, marginRight: 8 },
  sparkBarContainer: { flex: 1 },
  
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
  heroShop: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
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
  shopAvatarText: { fontSize: 22, fontWeight: "900", color: COLORS.white },
  shopName: {
    fontSize: 18,
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

  healthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },

  heroMetric: { marginTop: 28, marginBottom: 20 },
  heroMetricLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  countUpText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  heroMetricPeriod: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },

  heroPills: { flexDirection: "row", gap: 10 },
  metricPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  metricPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricPillValue: { 
    fontSize: 13, 
    fontWeight: "900", 
    color: COLORS.white,
    lineHeight: 16,
  },
  metricPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderLeftWidth: 3,
  },
  syncIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitle: { fontSize: 14, fontWeight: "800", color: COLORS.white },
  syncMessage: { fontSize: 11, fontWeight: "600", marginTop: 2, lineHeight: 14 },

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

  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },

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
  periodBtnActive: { backgroundColor: COLORS.accent },
  periodText: { fontSize: 14, fontWeight: "700", color: COLORS.muted },
  periodTextActive: { color: COLORS.white, fontWeight: "800" },

  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  breakdownHeader: { marginBottom: THEME.spacing.md },
  breakdownTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  breakdownSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.muted,
    marginTop: 2,
  },
  sparkLines: { gap: 16 },
  sparkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sparkLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 65,
  },
  sparkDot: { width: 10, height: 10, borderRadius: 5 },
  sparkLabel: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  sparkTrack: {
    height: 8,
    backgroundColor: "rgba(11,19,32,0.06)",
    borderRadius: 4,
    overflow: "hidden",
  },
  sparkFill: { height: "100%", borderRadius: 4 },
  sparkValue: {
    width: 90,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },

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
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.3,
    textAlign: "center",
    lineHeight: 18,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  actionsGrid: {
    flexDirection: "row",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.md,
    borderRadius: 16,
    gap: THEME.spacing.sm,
    ...THEME.elevation.medium,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.accent,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
  },

  shopSection: { marginTop: THEME.spacing.sm },
  shopSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  shopSectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  shopSectionUpdated: { fontSize: 11, fontWeight: "600", color: COLORS.muted },
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
  shopCardName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  shopCardOwner: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginTop: 2,
  },
  chipsRow: { flexDirection: "row", gap: 10 },
  detailChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.06)",
  },
  detailChipLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailChipValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
    lineHeight: 16,
  },
});