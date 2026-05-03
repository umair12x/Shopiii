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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AppIcon as MaterialCommunityIcons } from "../components/AppIcon";
import { DataContext } from "../context/DataContext";
import { EntryForm } from "../components/EntryForm";
import { EntryItem } from "../components/EntryItem";
import { TotalsSummary } from "../components/TotalsSummary";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay } from "../utils/dateUtils";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Simple FAB ───
const FabButton = ({ onPress, bottomOffset }) => (
  <TouchableOpacity
    style={[styles.fab, { bottom: bottomOffset }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <MaterialCommunityIcons name="plus" size={28} color={COLORS.white} />
  </TouchableOpacity>
);

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
  } = useContext(DataContext);
  const tabBarHeight = useBottomTabBarHeight();

  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const totals = calculateTotals();
  const flatListRef = useRef(null);

  // Reverse entries for newest first
  const reversedEntries = useMemo(() => [...entries].reverse(), [entries]);

  // Bottom padding to avoid FAB overlap
  const listBottomPadding = tabBarHeight + 100;

  // Simple entrance animation
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, slideAnim]);

  // Compact header based on scroll
  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [60, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null);
    setFormVisible(true);
  }, []);

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

  // ─── Render Item ───
  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.entryWrap}>
        <EntryItem
          entry={item}
          onEdit={handleEditEntry}
          onDelete={deleteEntry}
        />
      </View>
    ),
    [handleEditEntry, deleteEntry]
  );

  // ─── List Header ───
  const ListHeaderComponent = useCallback(
    () => (
      <View>
        <View style={styles.totalsWrapper}>
          <TotalsSummary totals={totals} />
        </View>
        {entries.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Entries</Text>
            <Text style={styles.sectionCount}>{entries.length}</Text>
          </View>
        )}
      </View>
    ),
    [totals, entries.length]
  );

  // ─── Empty State ───
  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={48}
          color={COLORS.accent}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No records yet</Text>
        <Text style={styles.emptyDesc}>
          Tap the + button to add your first entry
        </Text>
      </View>
    ),
    []
  );

  // ─── Loading State ───
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        {/* ═══ COMPACT HEADER ═══ */}
        <Animated.View
          style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}
        >
          <View style={styles.compactHeaderContent}>
            <Text style={styles.compactDateText}>
              {formatDateDisplay(selectedDate)}
            </Text>
            <View style={styles.compactTotals}>
              <Text style={styles.compactTotalLabel}>Sales</Text>
              <Text style={styles.compactTotalValue}>
                {(totals?.totalSales || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.compactTotals}>
              <Text style={styles.compactTotalLabel}>Profit</Text>
              <Text
                style={[
                  styles.compactTotalValue,
                  {
                    color:
                      totals.totalProfit >= 0 ? COLORS.success : COLORS.error,
                  },
                ]}
              >
                {totals.totalProfit >= 0 ? "+" : ""}
                {(totals?.totalProfit || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══ MAIN HEADER ═══ */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
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
              <View style={styles.profitBadge}>
                <View
                  style={[
                    styles.profitDot,
                    {
                      backgroundColor:
                        totals.totalProfit >= 0 ? "#22c55e" : "#ef4444",
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.profitText,
                    {
                      color:
                        totals.totalProfit >= 0 ? "#22c55e" : "#ef4444",
                    },
                  ]}
                >
                  {totals.totalProfit >= 0 ? "Profit" : "Loss"}
                </Text>
              </View>
            </View>

            <Text style={styles.headerTitle}>Daily Book</Text>

            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Sales</Text>
                <Text style={styles.quickStatValue}>
                  {(totals?.totalSales || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Profit</Text>
                <Text
                  style={[
                    styles.quickStatValue,
                    {
                      color:
                        totals.totalProfit >= 0
                          ? COLORS.success
                          : COLORS.error,
                    },
                  ]}
                >
                  {totals.totalProfit >= 0 ? "+" : ""}
                  {(totals?.totalProfit || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Cash</Text>
                <Text style={styles.quickStatValue}>
                  {(totals?.cashInHand || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ═══ LIST ═══ */}
        <FlatList
          ref={flatListRef}
          data={reversedEntries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={[
            styles.flatListContent,
            { paddingBottom: listBottomPadding },
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

        {/* ═══ FAB ═══ */}
        <FabButton
          onPress={handleAddEntry}
          bottomOffset={tabBarHeight + 20}
        />

        {/* ═══ FORM ═══ */}
        <EntryForm
          visible={formVisible}
          onClose={() => {
            setFormVisible(false);
            setEditingEntry(null);
          }}
          onSubmit={handleFormSubmit}
          editData={editingEntry}
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

  // ─── Loading ───
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.muted,
  },

  // ─── Compact Header ───
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  compactHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  compactTotals: {
    alignItems: "flex-end",
  },
  compactTotalLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
  },
  compactTotalValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },

  // ─── Header ───
  header: {
    backgroundColor: COLORS.primary,
    paddingBottom: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  profitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profitText: {
    fontSize: 12,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 16,
  },

  // ─── Quick Stats ───
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 14,
  },
  quickStat: {
    flex: 1,
    alignItems: "center",
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
  quickStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
  },

  // ─── List ───
  flatListContent: {
    paddingHorizontal: 20,
  },
  totalsWrapper: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    backgroundColor: "rgba(11,19,32,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entryWrap: {
    marginBottom: 8,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },

  // ─── FAB ───
  fab: {
    position: "absolute",
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});