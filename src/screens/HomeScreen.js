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
          <Text style={styles.title}>{shopDetails.name}</Text>
          <Text style={styles.subtitle}>{formatDateDisplay(today)}</Text>
        </View>

        {/* Shop Details Card */}
        <View style={styles.shopDetailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>👤 Owner:</Text>
            <Text style={styles.detailValue}>{shopDetails.owner}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Address:</Text>
            <Text style={styles.detailValue}>{shopDetails.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📞 Contact:</Text>
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
            <>
              <SummaryCard
                title="Total Profit"
                amount={todayTotals.totalProfit}
                backgroundColor={COLORS.profitGreen}
                textColor={COLORS.success}
                icon="📈"
              />

              <SummaryCard
                title="Total Sales"
                amount={todayTotals.totalSales}
                backgroundColor={COLORS.light}
                textColor={COLORS.secondary}
                icon="🛍"
              />

              <SummaryCard
                title="Total Investment"
                amount={todayTotals.totalInvestment}
                backgroundColor={COLORS.light}
                textColor={COLORS.dark}
                icon="💰"
              />

              <SummaryCard
                title="Cash in Hand"
                amount={todayTotals.cashInHand}
                backgroundColor={COLORS.light}
                textColor={COLORS.primary}
                icon="💵"
              />
            </>
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
            icon="📊"
          />

          <SummaryCard
            title="Monthly Sales"
            amount={monthTotals.totalSales}
            backgroundColor={COLORS.light}
            textColor={COLORS.secondary}
            icon="🧾"
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
            icon="📅"
          />

          <SummaryCard
            title="Yearly Sales"
            amount={yearTotals.totalSales}
            backgroundColor={COLORS.light}
            textColor={COLORS.secondary}
            icon="🏪"
          />
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfo}>
          <Text style={styles.quickTitle}>💡 Quick Tips</Text>
          <Text style={styles.quickText}>
            • Use the Daily Book tab to track transactions
          </Text>
          <Text style={styles.quickText}>
            • Check Dashboard for analytics and trends
          </Text>
          <Text style={styles.quickText}>
            • View Previous Accounts to see historical data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fonts.regular,
    color: COLORS.light,
  },
  shopDetailsCard: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.md,
  },
  detailLabel: {
    fontSize: THEME.fonts.regular,
    fontWeight: "600",
    color: COLORS.dark,
  },
  detailValue: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    flex: 1,
    marginLeft: THEME.spacing.md,
    textAlign: "right",
  },
  infoSection: {
    marginBottom: THEME.spacing.xl,
    marginHorizontal: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fonts.large,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: THEME.spacing.lg,
  },
  loaderContainer: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    alignItems: "center",
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
  quickTitle: {
    fontSize: THEME.fonts.medium,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: THEME.spacing.md,
  },
  quickText: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
});
