import React, { useContext, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { DataContext } from "../context/DataContext";
import { SummaryCard } from "../components/SummaryCard";
import { COLORS, THEME } from "../config/colors";
import { formatDateDisplay } from "../utils/dateUtils";

const EMPTY_TOTALS = {
  totalInvestment: 0,
  totalSales: 0,
  totalProfit: 0,
  cashInHand: 0,
};

export const HomeScreen = () => {
  const { shopDetails, entries, getEntriesForDateRange } =
    useContext(DataContext);
  const [todayTotals, setTodayTotals] = useState(EMPTY_TOTALS);
  const [monthTotals, setMonthTotals] = useState(EMPTY_TOTALS);
  const [yearTotals, setYearTotals] = useState(EMPTY_TOTALS);
  const [loadingStats, setLoadingStats] = useState(true);

  const today = new Date();
  const currentMonthLabel = new Intl.DateTimeFormat("en-PK", {
    month: "long",
    year: "numeric",
  }).format(today);

  const getTotalsFromEntries = (periodEntries) => {
    return periodEntries.reduce(
      (acc, entry) => ({
        totalInvestment: acc.totalInvestment + (entry.purchasePrice || 0),
        totalSales: acc.totalSales + (entry.salePrice || 0),
        totalProfit: acc.totalProfit + (entry.profit || 0),
        cashInHand:
          acc.cashInHand +
          (entry.isPaymentCollected ? entry.salePrice || 0 : 0),
      }),
      EMPTY_TOTALS,
    );
  };

  const loadRealtimeSummaries = useCallback(async () => {
    try {
      setLoadingStats(true);

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [todayEntries, currentMonthEntries, currentYearEntries] =
        await Promise.all([
          getEntriesForDateRange(todayStart, todayEnd),
          getEntriesForDateRange(monthStart, now),
          getEntriesForDateRange(yearStart, now),
        ]);

      setTodayTotals(getTotalsFromEntries(todayEntries));
      setMonthTotals(getTotalsFromEntries(currentMonthEntries));
      setYearTotals(getTotalsFromEntries(currentYearEntries));
    } catch (error) {
      console.error("Error loading home summaries:", error);
    } finally {
      setLoadingStats(false);
    }
  }, [getEntriesForDateRange]);

  useFocusEffect(
    useCallback(() => {
      loadRealtimeSummaries();
    }, [loadRealtimeSummaries]),
  );

  useEffect(() => {
    loadRealtimeSummaries();
  }, [entries, loadRealtimeSummaries]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="storefront-outline" size={24} color={COLORS.white} />
            <Text style={styles.title}>{shopDetails.name}</Text>
          </View>
          <Text style={styles.subtitle}>{formatDateDisplay(today)}</Text>
        </View>

        {/* Shop Details Card */}
        <View style={styles.shopDetailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <MaterialCommunityIcons name="account-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailLabel}>Owner:</Text>
            </View>
            <Text style={styles.detailValue}>{shopDetails.owner}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailLabel}>Address:</Text>
            </View>
            <Text style={styles.detailValue}>{shopDetails.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailLabelRow}>
              <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
              <Text style={styles.detailLabel}>Contact:</Text>
            </View>
            <Text style={styles.detailValue}>{shopDetails.contact}</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>

          {loadingStats ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading latest totals...</Text>
            </View>
          ) : (
            <View style={styles.cardRow}>
              <View style={styles.cardItem}>
                <SummaryCard
                  title="Total Profit"
                  amount={todayTotals.totalProfit}
                  backgroundColor={COLORS.profitGreen}
                  textColor={COLORS.success}
                  iconName="trending-up"
                  iconColor={COLORS.success}
                />
              </View>

              <View style={styles.cardItem}>
                <SummaryCard
                  title="Total Sales"
                  amount={todayTotals.totalSales}
                  backgroundColor={COLORS.light}
                  textColor={COLORS.secondary}
                  iconName="cart-outline"
                  iconColor={COLORS.secondary}
                />
              </View>

              <View style={styles.cardItem}>
                <SummaryCard
                  title="Total Investment"
                  amount={todayTotals.totalInvestment}
                  backgroundColor={COLORS.light}
                  textColor={COLORS.dark}
                  iconName="cash-multiple"
                  iconColor={COLORS.dark}
                />
              </View>

              <View style={styles.cardItem}>
                <SummaryCard
                  title="Cash in Hand"
                  amount={todayTotals.cashInHand}
                  backgroundColor={COLORS.light}
                  textColor={COLORS.primary}
                  iconName="wallet-outline"
                  iconColor={COLORS.primary}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            Current Month ({currentMonthLabel})
          </Text>

          <SummaryCard
            title="Monthly Profit"
            amount={monthTotals.totalProfit}
            backgroundColor={COLORS.profitGreen}
            textColor={COLORS.success}
            iconName="chart-line"
            iconColor={COLORS.success}
          />

          <SummaryCard
            title="Monthly Sales"
            amount={monthTotals.totalSales}
            backgroundColor={COLORS.light}
            textColor={COLORS.secondary}
            iconName="receipt-text-outline"
            iconColor={COLORS.secondary}
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            Current Year ({today.getFullYear()})
          </Text>

          <SummaryCard
            title="Yearly Profit"
            amount={yearTotals.totalProfit}
            backgroundColor={COLORS.profitGreen}
            textColor={COLORS.success}
            iconName="calendar-outline"
            iconColor={COLORS.success}
          />

          <SummaryCard
            title="Yearly Sales"
            amount={yearTotals.totalSales}
            backgroundColor={COLORS.light}
            textColor={COLORS.secondary}
            iconName="storefront-outline"
            iconColor={COLORS.secondary}
          />
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          <View style={styles.quickTitleRow}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.accent} />
            <Text style={styles.quickTitle}>Quick Tips</Text>
          </View>
          <View style={styles.quickTipRow}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={16} color={COLORS.accent} />
            <Text style={styles.quickText}>Use the Daily Book tab to track transactions</Text>
          </View>
          <View style={styles.quickTipRow}>
            <MaterialCommunityIcons name="chart-line" size={16} color={COLORS.accent} />
            <Text style={styles.quickText}>Check Dashboard for analytics and trends</Text>
          </View>
          <View style={styles.quickTipRow}>
            <MaterialCommunityIcons name="history" size={16} color={COLORS.accent} />
            <Text style={styles.quickText}>View Previous Accounts to see historical data</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: THEME.fonts.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  cardItem: {
    width: '48%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  shopDetailsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.dark,
  },
  detailValue: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    flex: 1,
    marginLeft: THEME.spacing.md,
    textAlign: 'right',
  },
  infoSection: {
    marginBottom: THEME.spacing.xl,
    marginHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: THEME.spacing.lg,
  },
  loaderContainer: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: THEME.spacing.sm,
    color: COLORS.gray,
    fontSize: THEME.fonts.regular,
  },
  quickInfo: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  quickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  quickTitle: {
    fontSize: THEME.fonts.medium,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  quickTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  quickText: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    lineHeight: 20,
    flex: 1,
  },
});
