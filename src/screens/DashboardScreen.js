import React, { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { DataContext } from '../context/DataContext';
import { SummaryCard } from '../components/SummaryCard';
import { COLORS, THEME } from '../config/colors';
import {
  getLastNDays,
  getCurrentYearStart,
  getDateKey,
  formatDateShort,
  parseDate,
} from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyFormatter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

export const DashboardScreen = () => {
  const { getEntriesForDateRange } = useContext(DataContext);
  const [loading, setLoading] = useState(true);
  const [last30Days, setLast30Days] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);
  const [activeTab, setActiveTab] = useState('30days');
  const [yearDataReady, setYearDataReady] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setYearDataReady(false);

      // Load 30 days data
      const last30 = getLastNDays(30);
      const endDate = new Date();
      const startDate = last30[0];
      const entries30 = await getEntriesForDateRange(startDate, endDate);
      const aggregated30 = aggregateDataByDate(entries30, last30);
      setLast30Days(aggregated30);

      // Load year data
      const yearStart = getCurrentYearStart();
      const yearEnd = new Date();
      const entriesYear = await getEntriesForDateRange(yearStart, yearEnd);
      const aggregatedYear = aggregateDataByMonth(entriesYear);
      setCurrentYear(aggregatedYear);
      setYearDataReady(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [getEntriesForDateRange]);

  const aggregateDataByDate = useCallback((entries, dates) => {
    const aggregated = dates.reduce((acc, date) => {
      acc[getDateKey(date)] = { sales: 0, profit: 0, records: 0 };
      return acc;
    }, {});

    entries.forEach((entry) => {
      const key = entry.date;
      if (aggregated[key]) {
        aggregated[key].sales += entry.salePrice || 0;
        aggregated[key].profit += entry.profit || 0;
        aggregated[key].records += 1;
      }
    });

    return aggregated;
  }, []);

  const aggregateDataByMonth = useCallback((entries) => {
    // Initialize all 12 months with zero
    const monthData = {};
    for (let i = 0; i < 12; i++) {
      monthData[i] = { sales: 0, profit: 0, records: 0 };
    }

    entries.forEach((entry) => {
      // Use parseDate utility if available, fallback to new Date
      const date = parseDate ? parseDate(entry.date) : new Date(entry.date);
      
      // Guard against invalid dates
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in entry:', entry.date);
        return;
      }
      
      const month = date.getMonth(); // 0-11
      if (monthData[month]) {
        monthData[month].sales += entry.salePrice || 0;
        monthData[month].profit += entry.profit || 0;
        monthData[month].records += 1;
      }
    });

    return monthData;
  }, []);

  // ─── 30 Days Chart Data ───
  const chart30Data = useMemo(() => {
    if (!last30Days) return null;

    const labels = Object.keys(last30Days).map((date) =>
      formatDateShort(new Date(date))
    );
    const salesData = Object.values(last30Days).map((d) =>
      Math.round((d.sales || 0) / 1000)
    );
    const profitData = Object.values(last30Days).map((d) =>
      Math.round((d.profit || 0) / 1000)
    );

    // Take last 7 days for readability
    const last7Labels = labels.slice(-7);
    const last7Sales = salesData.slice(-7);
    const last7Profit = profitData.slice(-7);

    return {
      labels: last7Labels.length > 0 ? last7Labels : ['No Data'],
      datasets: [
        {
          data: last7Sales.length > 0 ? last7Sales : [0],
          color: () => COLORS.accent,
          strokeWidth: 3,
        },
        {
          data: last7Profit.length > 0 ? last7Profit : [0],
          color: () => COLORS.success,
          strokeWidth: 2,
        },
      ],
      legend: ['Sales (K)', 'Profit (K)'],
    };
  }, [last30Days]);

  // ─── Year Chart Data ───
  const chartYearData = useMemo(() => {
    if (!currentYear) return null;

    const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    
    // Extract profit values for all 12 months
    const profitValues = [];
    for (let i = 0; i < 12; i++) {
      const monthProfit = currentYear[i]?.profit || 0;
      // Convert to thousands for readability
      profitValues.push(Math.round(monthProfit / 1000));
    }

    // Check if all values are zero
    const hasData = profitValues.some(v => v > 0);

    return {
      labels: months,
      datasets: [
        {
          data: hasData ? profitValues : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      ],
      // Add a flag for empty state
      hasData,
    };
  }, [currentYear]);

  // ─── Stats Calculation ───
  const thirtyDayStats = useMemo(() => {
    if (!last30Days) return null;
    
    const values = Object.values(last30Days);
    const totalSales = values.reduce((sum, d) => sum + (d.sales || 0), 0);
    const totalProfit = values.reduce((sum, d) => sum + (d.profit || 0), 0);
    
    return {
      totalSales,
      totalProfit,
      avgDailySales: totalSales / 30,
      avgDailyProfit: totalProfit / 30,
      profitMargin: totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0,
    };
  }, [last30Days]);

  // ─── Year Stats ───
  const yearStats = useMemo(() => {
    if (!currentYear) return null;
    
    const values = Object.values(currentYear);
    const totalSales = values.reduce((sum, d) => sum + (d.sales || 0), 0);
    const totalProfit = values.reduce((sum, d) => sum + (d.profit || 0), 0);
    
    return {
      totalSales,
      totalProfit,
      avgMonthlyProfit: totalProfit / 12,
      bestMonth: values.reduce((best, curr, idx) => 
        (curr.profit || 0) > (best.profit || 0) ? { ...curr, month: idx } : best, 
        { profit: -Infinity, month: 0 }
      ),
    };
  }, [currentYear]);

  // ─── Chart Configs ───
  const lineChartConfig = useMemo(() => ({
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(196,154,108,${opacity})`,
    labelColor: () => COLORS.muted,
    style: { borderRadius: 20 },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: COLORS.accent,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(11,19,32,0.06)',
    },
  }), []);

  const barChartConfig = useMemo(() => ({
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(196,154,108,${opacity})`,
    labelColor: () => COLORS.muted,
    style: { borderRadius: 20 },
    barPercentage: 0.65,
    fillShadowGradient: COLORS.accent,
    fillShadowGradientOpacity: 0.8,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(11,19,32,0.06)',
    },
  }), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconWrap}>
            <MaterialCommunityIcons name="chart-line" size={40} color={COLORS.accent} />
          </View>
          <ActivityIndicator size="large" color={COLORS.accent} style={styles.loader} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const has30DayData = chart30Data && chart30Data.datasets[0].data.some(v => v > 0);
  const hasYearData = chartYearData && chartYearData.hasData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons name="chart-line" size={28} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.title}>Analytics</Text>
              <Text style={styles.subtitle}>Track your business performance</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === '30days' && styles.activeTab]}
            onPress={() => setActiveTab('30days')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={activeTab === '30days' ? COLORS.white : COLORS.muted}
            />
            <Text style={[styles.tabText, activeTab === '30days' && styles.activeTabText]}>
              30 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'year' && styles.activeTab]}
            onPress={() => setActiveTab('year')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar-outline"
              size={20}
              color={activeTab === 'year' ? COLORS.white : COLORS.muted}
            />
            <Text style={[styles.tabText, activeTab === 'year' && styles.activeTabText]}>
              This Year
            </Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* ─── 30 DAYS TAB ─── */}
          {activeTab === '30days' && (
            <>
              {/* Summary Cards */}
              {thirtyDayStats && (
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Total Sales"
                      amount={thirtyDayStats.totalSales}
                      iconName="cart-outline"
                      iconColor={COLORS.accent}
                      accentColor={COLORS.accent}
                      subtitle="30 days"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Total Profit"
                      amount={thirtyDayStats.totalProfit}
                      iconName="trending-up"
                      iconColor={COLORS.success}
                      accentColor={COLORS.success}
                      subtitle="30 days"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Avg Daily Sales"
                      amount={thirtyDayStats.avgDailySales}
                      iconName="chart-bar"
                      iconColor={COLORS.accent}
                      accentColor={COLORS.accent}
                      subtitle="per day"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Profit Margin"
                      amount={parseFloat(thirtyDayStats.profitMargin)}
                      iconName="percent"
                      iconColor={COLORS.success}
                      accentColor={COLORS.success}
                      isPercentage
                      subtitle="avg"
                    />
                  </View>
                </View>
              )}

              {/* Line Chart */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <MaterialCommunityIcons name="chart-line-variant" size={20} color={COLORS.text} />
                    <Text style={styles.chartTitle}>Sales & Profit Trend</Text>
                  </View>
                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeText}>Last 7 Days</Text>
                  </View>
                </View>
                
                {has30DayData ? (
                  <LineChart
                    data={chart30Data}
                    width={CHART_WIDTH}
                    height={240}
                    chartConfig={lineChartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={true}
                    withOuterLines={true}
                    withDots={true}
                    withShadow={false}
                  />
                ) : (
                  <View style={styles.emptyChart}>
                    <MaterialCommunityIcons name="chart-line" size={40} color={COLORS.gray} />
                    <Text style={styles.emptyChartText}>No data for this period</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* ─── YEAR TAB ─── */}
          {activeTab === 'year' && (
            <>
              {/* Year Summary Cards */}
              {yearStats && (
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Year Sales"
                      amount={yearStats.totalSales}
                      iconName="calendar-check"
                      iconColor={COLORS.accent}
                      accentColor={COLORS.accent}
                      subtitle="YTD"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Year Profit"
                      amount={yearStats.totalProfit}
                      iconName="trending-up"
                      iconColor={COLORS.success}
                      accentColor={COLORS.success}
                      subtitle="YTD"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Avg Monthly"
                      amount={yearStats.avgMonthlyProfit}
                      iconName="chart-bar"
                      iconColor={COLORS.accent}
                      accentColor={COLORS.accent}
                      subtitle="profit"
                    />
                  </View>
                  <View style={styles.summaryGridItem}>
                    <SummaryCard
                      title="Best Month"
                      amount={yearStats.bestMonth.profit || 0}
                      iconName="trophy"
                      iconColor="#FFD700"
                      accentColor="#FFD700"
                      subtitle={['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][yearStats.bestMonth.month] || '-'}
                    />
                  </View>
                </View>
              )}

              {/* Bar Chart - THE FIX */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <View style={styles.chartHeaderLeft}>
                    <MaterialCommunityIcons name="chart-bar" size={20} color={COLORS.text} />
                    <Text style={styles.chartTitle}>Monthly Profit</Text>
                  </View>
                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeText}>This Year</Text>
                  </View>
                </View>

                {!yearDataReady ? (
                  <View style={styles.emptyChart}>
                    <ActivityIndicator size="small" color={COLORS.accent} />
                    <Text style={styles.emptyChartText}>Loading year data...</Text>
                  </View>
                ) : hasYearData ? (
                  <BarChart
                    data={chartYearData}
                    width={CHART_WIDTH}
                    height={260}
                    yAxisLabel=""
                    yAxisSuffix="k"
                    chartConfig={barChartConfig}
                    style={styles.chart}
                    fromZero={true}
                    showBarTops={true}
                    showValuesOnTopOfBars={true}
                    withInnerLines={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                    verticalLabelRotation={0}
                  />
                ) : (
                  <View style={styles.emptyChart}>
                    <MaterialCommunityIcons name="chart-bar" size={40} color={COLORS.gray} />
                    <Text style={styles.emptyChartText}>No data for this year yet</Text>
                    <Text style={styles.emptyChartSubtext}>
                      Start adding entries to see your yearly performance
                    </Text>
                  </View>
                )}
              </View>

              {/* Monthly Breakdown List */}
              {yearStats && hasYearData && (
                <View style={styles.monthlyListContainer}>
                  <View style={styles.monthlyListHeader}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.text} />
                    <Text style={styles.monthlyListTitle}>Monthly Breakdown</Text>
                  </View>
                  
                  {Object.entries(currentYear).map(([monthIdx, data]) => {
                    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                    const monthName = monthNames[parseInt(monthIdx)];
                    const profit = data.profit || 0;
                    const sales = data.sales || 0;
                    const isPositive = profit >= 0;
                    
                    // Calculate bar width for visual indicator
                    const maxProfit = Math.max(...Object.values(currentYear).map(d => Math.abs(d.profit || 0)));
                    const barWidth = maxProfit > 0 ? (Math.abs(profit) / maxProfit) * 100 : 0;
                    
                    return (
                      <View key={monthIdx} style={styles.monthRow}>
                        <View style={styles.monthRowLeft}>
                          <Text style={styles.monthName}>{monthName.substring(0, 3)}</Text>
                          <View style={styles.monthBarTrack}>
                            <View style={[
                              styles.monthBarFill,
                              { 
                                width: `${barWidth}%`,
                                backgroundColor: isPositive ? COLORS.success : COLORS.error,
                              }
                            ]} />
                          </View>
                        </View>
                        <View style={styles.monthRowRight}>
                          <Text style={[styles.monthProfit, isPositive ? styles.profitPositive : styles.profitNegative]}>
                            {formatCurrency(profit)}
                          </Text>
                          <Text style={styles.monthSales}>{formatCurrency(sales)} sales</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Insights Section - Shared */}
          {thirtyDayStats && activeTab === '30days' && (
            <View style={styles.insightsContainer}>
              <View style={styles.insightsHeader}>
                <View style={styles.insightsIconWrap}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={22} color={COLORS.accent} />
                </View>
                <Text style={styles.insightsTitle}>Key Insights</Text>
              </View>
              
              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: 'rgba(196,154,108,0.1)' }]}>
                  <MaterialCommunityIcons name="trending-up" size={20} color={COLORS.accent} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Profit Margin</Text>
                  <Text style={styles.insightValue}>{thirtyDayStats.profitMargin}%</Text>
                </View>
                <View style={styles.insightTrend}>
                  <MaterialCommunityIcons 
                    name={thirtyDayStats.profitMargin > 20 ? "arrow-up" : "arrow-down"} 
                    size={16} 
                    color={thirtyDayStats.profitMargin > 20 ? COLORS.success : COLORS.warning} 
                  />
                </View>
              </View>

              <View style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: 'rgba(46,125,50,0.1)' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.success} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Best Day Average</Text>
                  <Text style={styles.insightValue}>{formatCurrency(thirtyDayStats.avgDailySales)}</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingBottom: THEME.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { 
    fontSize: THEME.fonts.xxl, 
    fontWeight: '900', 
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: { 
    fontSize: THEME.fonts.sm, 
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  
  // Tabs
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: THEME.spacing.lg, 
    paddingTop: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  tab: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 16, 
    backgroundColor: COLORS.surface, 
    alignItems: 'center', 
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(11,19,32,0.06)',
  },
  activeTab: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tabText: { 
    fontSize: THEME.fonts.md, 
    fontWeight: '700', 
    color: COLORS.muted,
  },
  activeTabText: {
    color: COLORS.white,
  },
  
  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  summaryGridItem: {
    width: '47%',
    flexGrow: 1,
  },
  
  // Charts
  chartContainer: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: THEME.fonts.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  chartBadge: {
    backgroundColor: 'rgba(196,154,108,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  chart: {
    borderRadius: 20,
    marginLeft: -8,
  },
  
  // Empty Chart State
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,19,32,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    borderStyle: 'dashed',
  },
  emptyChartText: {
    marginTop: THEME.spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },
  emptyChartSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.gray,
  },
  
  // Monthly List
  monthlyListContainer: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
  },
  monthlyListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  monthlyListTitle: {
    fontSize: THEME.fonts.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,19,32,0.04)',
  },
  monthRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthName: {
    width: 32,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  monthBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(11,19,32,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  monthRowRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  monthProfit: {
    fontSize: 14,
    fontWeight: '800',
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  monthSales: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  
  // Insights
  insightsContainer: {
    margin: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: THEME.spacing.lg,
  },
  insightsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,19,32,0.04)',
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  insightTrend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11,19,32,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  loader: {
    marginVertical: THEME.spacing.sm,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});