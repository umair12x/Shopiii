import React, {
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DataContext } from "../context/DataContext";
import { EntryForm } from "../components/EntryForm";
import { EntryItem } from "../components/EntryItem";
import { TotalsSummary } from "../components/TotalsSummary";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay } from "../utils/dateUtils";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Animated Counter ───
const AnimatedCounter = ({ value, prefix = "", suffix = "" }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    return () => anim.removeListener(id);
  }, [value, anim]);

  return (
    <Text style={styles.counterText}>
      {prefix}
      {Number(Math.round(display || 0)).toLocaleString()}
      {suffix}
    </Text>
  );
};

// ─── Status Badge ───
const StatusBadge = ({ profit }) => {
  const isPositive = profit >= 0;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.statusBadge}>
      <Animated.View
        style={[
          styles.statusDot,
          {
            backgroundColor: isPositive ? "#22c55e" : "#ef4444",
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Text
        style={[
          styles.statusText,
          { color: isPositive ? "#22c55e" : "#ef4444" },
        ]}
      >
        {isPositive ? "In Profit" : "In Loss"}
      </Text>
    </View>
  );
};

// ─── Floating Action Button with Ring ───
const FabButton = ({ onPress, scaleAnim, bottomOffset = 28 }) => {
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [ringScale, ringOpacity]);

  return (
    <View style={[styles.fabContainer, { bottom: bottomOffset }]}>
      <Animated.View
        style={[
          styles.fabRing,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ═══════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════
export const DailyBookScreen = () => {
  const {
    entries,
    selectedDate,
    loading,
    calculateTotals,
    addEntry,
    updateEntry,
    deleteEntry,
    togglePaymentStatus,
  } = useContext(DataContext);
  const tabBarHeight = useBottomTabBarHeight();

  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // Scroll-driven header animation
  const scrollY = useRef(new Animated.Value(0)).current;

  const totals = calculateTotals();
  const flatListRef = useRef(null);

  // Reverse entries so newest appears at top
  const reversedEntries = useMemo(() => {
    return [...entries].reverse();
  }, [entries]);

  // Calculate dynamic bottom padding to prevent FAB blocking last item
  const listBottomPadding = useMemo(() => {
    const basePadding = tabBarHeight + 100; // FAB height + safe margin
    // Add extra space when only 1 or few items so last item isn't blocked
    if (entries.length <= 2) {
      return basePadding + 120; // Extra breathing room for sparse lists
    }
    return basePadding;
  }, [entries.length, tabBarHeight]);

  // Entrance animation
  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(headerFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(headerSlide, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlide, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [loading, headerFade, headerSlide, contentFade, contentSlide]);

  // Interpolate header animations based on scroll
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null);
    setFormVisible(true);
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.85,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fabScale]);

  const handleFormSubmit = useCallback(
    async (formData) => {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData);
      } else {
        await addEntry(formData);
      }
      setFormVisible(false);
      setEditingEntry(null);
    },
    [editingEntry, updateEntry, addEntry]
  );

  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setFormVisible(true);
  }, []);

  // ─── Loading State ───
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingScreen}>
          <View style={styles.loadingRing}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={40}
              color={COLORS.accent}
            />
          </View>
          <ActivityIndicator
            size="small"
            color={COLORS.accent}
            style={{ marginTop: 20 }}
          />
          <Text style={styles.loadingText}>Opening ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render Item ───
  const renderItem = useCallback(({ item, index }) => (
    <View style={styles.entryWrap}>
      <EntryItem
        entry={item}
        onEdit={handleEditEntry}
        onDelete={deleteEntry}
        onTogglePayment={togglePaymentStatus}
      />
    </View>
  ), [handleEditEntry, deleteEntry, togglePaymentStatus]);

  // ─── List Header (Totals + Section Title) ───
  const ListHeaderComponent = useCallback(() => (
    <View>
      <View style={styles.totalsWrapper}>
        <TotalsSummary totals={totals} />
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIconWrap}>
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={COLORS.accent}
            />
          </View>
          <Text style={styles.sectionTitle}>Transactions</Text>
        </View>
        {entries.length > 0 && (
          <Text style={styles.sectionCount}>
            {entries.length} record{entries.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </View>
  ), [totals, entries.length]);

  // ─── Empty State ───
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconRing}>
        <View style={styles.emptyIconBg}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={48}
            color={COLORS.accent}
          />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptyDesc}>
        Your ledger is empty. Add your first transaction to start
        tracking.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={handleAddEntry}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="plus"
          size={20}
          color={COLORS.white}
        />
        <Text style={styles.emptyCtaText}>Add Entry</Text>
      </TouchableOpacity>
    </View>
  ), [handleAddEntry]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        {/* ═══ COMPACT HEADER (appears on scroll) ═══ */}
        <Animated.View
          style={[
            styles.compactHeader,
            { opacity: compactHeaderOpacity }
          ]}
        >
          <View style={styles.compactHeaderContent}>
            <View style={styles.compactHeaderLeft}>
              <MaterialCommunityIcons
                name="calendar-today"
                size={14}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.compactDateText}>
                {formatDateDisplay(selectedDate)}
              </Text>
            </View>
            <View style={styles.compactTotals}>
              <Text style={styles.compactTotalLabel}>Sales</Text>
              <Text style={styles.compactTotalValue}>
                {Number(totals?.totalSales || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.compactTotals}>
              <Text style={styles.compactTotalLabel}>Profit</Text>
              <Text style={[
                styles.compactTotalValue,
                { color: totals.totalProfit >= 0 ? "#22c55e" : "#ef4444" }
              ]}>
                {totals.totalProfit >= 0 ? "+" : ""}
                {Number(totals?.totalProfit || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══ EXPANDABLE HEADER ═══ */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [
                { translateY: headerSlide },
                { translateY: headerTranslateY }
              ],
            },
          ]}
        >
          <View style={styles.headerStrip} />

          <Animated.View 
            style={[
              styles.headerContent,
              { opacity: headerOpacity }
            ]}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.dateChip}>
                <MaterialCommunityIcons
                  name="calendar-today"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.dateChipText}>
                  {formatDateDisplay(selectedDate)}
                </Text>
              </View>
              <StatusBadge profit={totals.totalProfit} />
            </View>

            <View style={styles.headerMiddle}>
              <View>
                <Text style={styles.headerTitle}>Daily Ledger</Text>
                <Text style={styles.headerSubtitle}>
                  Track every transaction
                </Text>
              </View>
              <View style={styles.countOrb}>
                <AnimatedCounter value={entries.length} />
                <Text style={styles.countLabel}>Entries</Text>
              </View>
            </View>

            <View style={styles.totalsStrip}>
              <View style={styles.totalsStripItem}>
                <Text style={styles.totalsStripLabel}>Sales</Text>
                <Text style={[styles.totalsStripValue, { color: COLORS.accent }]}>
                  {Number(totals?.totalSales || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalsStripDivider} />
              <View style={styles.totalsStripItem}>
                <Text style={styles.totalsStripLabel}>Profit</Text>
                <Text style={[
                  styles.totalsStripValue,
                  { color: totals.totalProfit >= 0 ? COLORS.success : COLORS.error }
                ]}>
                  {totals.totalProfit >= 0 ? "+" : ""}
                  {Number(totals?.totalProfit || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalsStripDivider} />
              <View style={styles.totalsStripItem}>
                <Text style={styles.totalsStripLabel}>Cash</Text>
                <Text style={[styles.totalsStripValue, { color: COLORS.white }]}>
                  {Number(totals?.cashInHand || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* ═══ SCROLLABLE LIST (Full screen overlay) ═══ */}
        <Animated.View
          style={[
            styles.listContainer,
            {
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <FlatList
            ref={flatListRef}
            data={reversedEntries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={[
              styles.flatListContent,
              { paddingBottom: listBottomPadding }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={8}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          />
        </Animated.View>

        {/* ═══ FAB (Fixed position above content) ═══ */}
        <FabButton
          onPress={handleAddEntry}
          scaleAnim={fabScale}
          bottomOffset={tabBarHeight + 20}
        />

        {/* EntryForm preserved exactly */}
        <EntryForm
          visible={formVisible}
          onClose={() => {
            setFormVisible(false);
            setEditingEntry(null);
          }}
          onSubmit={handleFormSubmit}
          editData={editingEntry}
          itemCount={entries.length}
        />
      </View>
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

  // ─── Compact Header ───
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  compactHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  compactTotals: {
    alignItems: 'flex-end',
  },
  compactTotalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },

  // ─── Loading ───
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRing: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(196,154,108,0.2)",
    borderStyle: "dashed",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.muted,
  },

  // ─── Header (Fixed) ───
  header: {
    backgroundColor: COLORS.primary,
    position: "relative",
    zIndex: 5,
  },
  headerStrip: {
    height: 4,
    backgroundColor: COLORS.accent,
    opacity: 0.6,
  },
  headerContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerMiddle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
  },
  countOrb: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  counterText: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.white,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Totals Strip
  totalsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  totalsStripItem: {
    flex: 1,
    alignItems: "center",
  },
  totalsStripLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalsStripValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.white,
  },
  totalsStripDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
  },

  // ─── Scrollable List (Takes remaining space) ───
  listContainer: {
    flex: 1,
    marginTop: -8,
  },
  flatListContent: {
    paddingHorizontal: THEME.spacing.lg,
    // paddingBottom is now dynamic via inline style
  },

  // Totals Component Wrapper
  totalsWrapper: {
    marginTop: 8,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    backgroundColor: "rgba(11,19,32,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Entry Items
  entryWrap: {
    marginBottom: 8,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(196,154,108,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: "rgba(196,154,108,0.15)",
    borderStyle: "dashed",
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "rgba(196,154,108,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: THEME.spacing.xl,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyCtaText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 15,
  },

  // ─── FAB ───
  fabContainer: {
    position: "absolute",
    right: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fabRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
});