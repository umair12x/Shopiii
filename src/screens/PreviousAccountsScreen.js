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
  Platform,
  Animated,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AppIcon as MaterialCommunityIcons } from "../components/AppIcon";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DataContext } from "../context/DataContext";
import { EntryItem } from "../components/EntryItem";
import { TotalsSummary } from "../components/TotalsSummary";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay } from "../utils/dateUtils";

// ─── Timeline Entry Wrapper ───
const TimelineEntry = ({ entry, index, total }) => {
  const isLast = index === total - 1;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={styles.timelineDot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineEntryCard}>
        <EntryItem entry={entry} readOnly />
      </View>
    </View>
  );
};

// ─── Compact Totals Bar ───
const CompactTotals = ({ totals }) => {
  const profitColor = totals.totalProfit >= 0 ? COLORS.success : COLORS.error;
  return (
    <View style={styles.compactBar}>
      <View style={styles.compactItem}>
        <Text style={styles.compactLabel}>Sales</Text>
        <Text style={[styles.compactValue, { color: COLORS.accent }]}>
          {(totals.totalSales || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.compactDivider} />
      <View style={styles.compactItem}>
        <Text style={styles.compactLabel}>Profit</Text>
        <Text style={[styles.compactValue, { color: profitColor }]}>
          {totals.totalProfit >= 0 ? "+" : ""}
          {(totals.totalProfit || 0).toLocaleString()}
        </Text>
      </View>
      <View style={styles.compactDivider} />
      <View style={styles.compactItem}>
        <Text style={styles.compactLabel}>Cash</Text>
        <Text style={[styles.compactValue, { color: COLORS.primary }]}>
          {(totals.cashInHand || 0).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

// ─── iOS Date Picker Modal ───
const IOSDatePickerModal = ({ visible, date, onChange, onClose }) => {
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerOverlay}>
        <TouchableOpacity
          style={styles.pickerBackdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.iosPickerSheet}>
          <View style={styles.pickerHandle} />
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Jump to Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChange}
            maximumDate={new Date()}
            textColor={COLORS.text}
          />
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════
export const PreviousAccountsScreen = () => {
  const { changeDate, entries, calculateTotals, selectedDate } =
    useContext(DataContext);
  const tabBarHeight = useBottomTabBarHeight();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date(selectedDate));

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  const totals = calculateTotals();
  const formattedDate = formatDateDisplay(tempDate);

  // Simple entrance animation
  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerFade]);

  // Content transition animation
  const animateTransition = useCallback(
    (dir) => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: dir * 20,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [fadeAnim, slideAnim]
  );

  const handleDateChange = useCallback(
    (date) => {
      const dir = date > tempDate ? 1 : -1;
      setTempDate(date);
      changeDate(date);
      animateTransition(dir);
    },
    [tempDate, changeDate, animateTransition]
  );

  const handlePickerChange = useCallback(
    (event, selected) => {
      if (Platform.OS === "android") {
        setPickerOpen(false);
        if (event.type === "set" && selected) {
          handleDateChange(selected);
        }
      } else if (selected) {
        handleDateChange(selected);
      }
    },
    [handleDateChange]
  );

  const goBack = useCallback(() => {
    const d = new Date(tempDate);
    d.setDate(d.getDate() - 1);
    handleDateChange(d);
  }, [tempDate, handleDateChange]);

  const goForward = useCallback(() => {
    const d = new Date(tempDate);
    d.setDate(d.getDate() + 1);
    handleDateChange(d);
  }, [tempDate, handleDateChange]);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + THEME.spacing.xl },
        ]}
      >
        {/* ═══ HEADER ═══ */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <MaterialCommunityIcons
                  name="history"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>History</Text>
                <Text style={styles.headerSubtitle}>{formattedDate}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.calendarBtn}
              onPress={openPicker}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="calendar-search"
                size={20}
                color={COLORS.accent}
              />
            </TouchableOpacity>
          </View>

          {/* Simple Date Navigation */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={goBack} style={styles.navBtn}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={openPicker} style={styles.dateNavCenter}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.dateNavText}>{formattedDate}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goForward} style={styles.navBtn}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ═══ CONTENT ═══ */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Compact Totals */}
          {entries.length > 0 && <CompactTotals totals={totals} />}

          {/* Entries Timeline */}
          <View style={styles.entriesArea}>
            {entries.length > 0 ? (
              <>
                <View style={styles.entriesHeader}>
                  <View style={styles.entriesHeaderLeft}>
                    <View style={styles.entriesIconWrap}>
                      <MaterialCommunityIcons
                        name="timeline-text"
                        size={18}
                        color={COLORS.accent}
                      />
                    </View>
                    <Text style={styles.entriesTitle}>Daily Totals</Text>
                  </View>
                  <View style={styles.entriesCountBadge}>
                    <Text style={styles.entriesCountText}>
                      {entries.length}
                    </Text>
                  </View>
                </View>

                <FlatList
                  data={entries}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <TimelineEntry
                      entry={item}
                      index={index}
                      total={entries.length}
                    />
                  )}
                  contentContainerStyle={styles.timelineList}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyRing}>
                  <View style={styles.emptyIconBg}>
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={44}
                      color={COLORS.accent}
                    />
                  </View>
                </View>
                <Text style={styles.emptyTitle}>No records</Text>
                <Text style={styles.emptyDesc}>
                  {formattedDate} has no daily record.
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={openPicker}
                >
                  <MaterialCommunityIcons
                    name="calendar-search"
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.emptyCtaText}>Pick Another Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* TotalsSummary */}
          {entries.length > 0 && (
            <View style={styles.fullTotals}>
              <TotalsSummary totals={totals} />
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ═══ DATE PICKERS ═══ */}
      {Platform.OS === "ios" && (
        <IOSDatePickerModal
          visible={pickerOpen}
          date={tempDate}
          onChange={handlePickerChange}
          onClose={closePicker}
        />
      )}

      {Platform.OS === "android" && pickerOpen && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handlePickerChange}
          maximumDate={new Date()}
        />
      )}
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

  // ─── Header ───
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // ─── Date Navigation ───
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dateNavText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },

  // ─── Picker ───
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,19,32,0.5)",
  },
  iosPickerSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,19,32,0.2)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(11,19,32,0.06)",
  },
  pickerCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.muted,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  pickerDone: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
  },

  // ─── Content ───
  content: {
    flex: 1,
  },

  // ─── Compact Totals ───
  compactBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  compactItem: {
    flex: 1,
    alignItems: "center",
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  compactDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(11,19,32,0.08)",
    alignSelf: "center",
  },

  // ─── Entries Area ───
  entriesArea: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  entriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  entriesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  entriesIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  entriesCountBadge: {
    backgroundColor: "rgba(196,154,108,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entriesCountText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accent,
  },

  // ─── Timeline ───
  timelineList: {
    paddingBottom: 20,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    width: 24,
    alignItems: "center",
    paddingTop: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(196,154,108,0.15)",
    marginTop: 4,
  },
  timelineEntryCard: {
    flex: 1,
    paddingBottom: 12,
  },

  // ─── Full Totals ───
  fullTotals: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    marginBottom: 40,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyRing: {
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
    borderRadius: 24,
    backgroundColor: "rgba(196,154,108,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyCtaText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
  },
});