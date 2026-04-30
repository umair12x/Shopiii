import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DataContext } from '../context/DataContext';
import { COLORS, THEME } from '../config/colors';
import {
  getLastNDays,
  getCurrentYearStart,
  getDateKey,
  formatDateShort,
} from '../utils/dateUtils';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = () => {
  const { getEntriesForDateRange } = useContext(DataContext);
  const [loading, setLoading] = useState(true);
  const [last30Days, setLast30Days] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);
  const [activeTab, setActiveTab] = useState('30days');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get last 30 days data
      const last30 = getLastNDays(30);
      const endDate = new Date();
      const startDate = last30[0];
      const entries30 = await getEntriesForDateRange(startDate, endDate);
      setLast30Days(aggregateDataByDate(entries30, last30));

      // Get current year data
      const yearStart = getCurrentYearStart();
      const yearEnd = new Date();
      const entriesYear = await getEntriesForDateRange(yearStart, yearEnd);
      setCurrentYear(aggregateDataByMonth(entriesYear));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data by date
  const aggregateDataByDate = (entries, dates) => {
    const aggregated = dates.reduce((acc, date) => {
      acc[getDateKey(date)] = { sales: 0, profit: 0, transactions: 0 };
      return acc;
    }, {});

    entries.forEach((entry) => {
      const key = entry.date;
      if (aggregated[key]) {
        aggregated[key].sales += entry.salePrice;
        aggregated[key].profit += entry.profit;
        aggregated[key].transactions += 1;
      } else {
        aggregated[key] = {
          sales: entry.salePrice,
          profit: entry.profit,
          transactions: 1,
        };
      }
    });

    return aggregated;
  };

  // Aggregate data by month
  const aggregateDataByMonth = (entries) => {
    const monthData = {};
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (let i = 0; i < 12; i++) {
      monthData[i] = { sales: 0, profit: 0 };
    }

    entries.forEach((entry) => {
      const date = new Date(entry.date);
      const month = date.getMonth();
      monthData[month].sales += entry.salePrice;
      monthData[month].profit += entry.profit;
    });

    return monthData;
  };

  const get30DaysChartData = () => {
    if (!last30Days) return null;

    const labels = Object.keys(last30Days).map((date) =>
      formatDateShort(new Date(date))
    );
    const salesData = Object.values(last30Days).map((d) =>
      Math.round(d.sales / 1000)
    );
    const profitData = Object.values(last30Days).map((d) =>
      Math.round(d.profit / 1000)
    );

    return {
      labels: labels.slice(-7), // Show last 7 days for readability
      datasets: [
        {
          data: salesData.slice(-7),
          color: () => COLORS.secondary,
          strokeWidth: 2,
        },
      ],
      legend: ['Sales (in thousands)'],
    };
  };

  const getYearChartData = () => {
    if (!currentYear) return null;

    const months = [
      'J',
      'F',
      'M',
      'A',
      'M',
      'J',
      'J',
      'A',
      'S',
      'O',
      'N',
      'D',
    ];
    const profitData = Object.values(currentYear).map((d) =>
      Math.round(d.profit / 10000)
    );

    return {
      labels: months,
      datasets: [
        {
          data: profitData,
          color: () => COLORS.accent,
          strokeWidth: 2,
        },
      ],
      legend: ['Profit (in 10K)'],
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const chart30 = get30DaysChartData();
  const chartYear = getYearChartData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Text style={styles.subtitle}>Track your business performance</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === '30days' && styles.activeTab]}
            onPress={() => setActiveTab('30days')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === '30days' && styles.activeTabText,
              ]}
            >
              Last 30 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'year' && styles.activeTab]}
            onPress={() => setActiveTab('year')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'year' && styles.activeTabText,
              ]}
            >
              This Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Charts */}
        {activeTab === '30days' && chart30 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Sales Trend (Last 30 Days)</Text>
            <LineChart
              data={chart30}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: () => COLORS.secondary,
                strokeWidth: 2,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: COLORS.secondary,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '0',
                  stroke: COLORS.lightGray,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {activeTab === 'year' && chartYear && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Profit by Month (This Year)</Text>
            <BarChart
              data={chartYear}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: COLORS.white,
                backgroundGradientFrom: COLORS.white,
                backgroundGradientTo: COLORS.white,
                decimalPlaces: 0,
                color: () => COLORS.accent,
                strokeWidth: 1,
                style: { borderRadius: 16 },
                propsForBackgroundLines: {
                  strokeDasharray: '0',
                  stroke: COLORS.lightGray,
                },
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Key Metrics</Text>

          {last30Days && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Average Daily Sales (Last 30 Days)
              </Text>
              <Text style={styles.statValue}>
                ₨ {Math.round(
                  Object.values(last30Days).reduce((sum, d) => sum + d.sales, 0) /
                    Object.keys(last30Days).length
                )}
              </Text>
            </View>
          )}

          {last30Days && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Average Daily Profit (Last 30 Days)
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      Object.values(last30Days).reduce(
                        (sum, d) => sum + d.profit,
                        0
                      ) / Object.keys(last30Days).length >
                      0
                        ? COLORS.success
                        : COLORS.error,
                  },
                ]}
              >
                ₨ {Math.round(
                  Object.values(last30Days).reduce((sum, d) => sum + d.profit, 0) /
                    Object.keys(last30Days).length
                )}
              </Text>
            </View>
          )}

          {currentYear && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Profit (This Year)</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      Object.values(currentYear).reduce((sum, d) => sum + d.profit, 0) >
                      0
                        ? COLORS.success
                        : COLORS.error,
                  },
                ]}
              >
                ₨ {Math.round(
                  Object.values(currentYear).reduce((sum, d) => sum + d.profit, 0)
                )}
              </Text>
            </View>
          )}
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
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fonts.regular,
    color: COLORS.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.small,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.white,
  },
  chartContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  chartTitle: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: THEME.spacing.lg,
  },
  chart: {
    borderRadius: THEME.borderRadius.medium,
    overflow: 'hidden',
  },
  statsContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  statsTitle: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  statLabel: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    marginBottom: THEME.spacing.sm,
  },
  statValue: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
