import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DataContext } from '../context/DataContext';
import { EntryItem } from '../components/EntryItem';
import { TotalsSummary } from '../components/TotalsSummary';
import { COLORS, THEME } from '../config/colors';
import { formatDateDisplay } from '../utils/dateUtils';

export const PreviousAccountsScreen = () => {
  const { changeDate, entries, calculateTotals } = useContext(DataContext);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const totals = calculateTotals();

  const handlePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setPickerOpen(false);
      if (event.type === 'set' && selectedDate) {
        setTempDate(selectedDate);
        changeDate(selectedDate);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
      changeDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="history" size={28} color={COLORS.white} />
            <View>
              <Text style={styles.title}>Account History</Text>
              <Text style={styles.subtitle}>View past transactions</Text>
            </View>
          </View>
        </View>

        {/* Date Selection Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Select Date</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.datePickerLeft}>
              <View style={styles.calendarIconWrapper}>
                <MaterialCommunityIcons name="calendar" size={22} color={COLORS.white} />
              </View>
              <View style={styles.datePickerContent}>
                <Text style={styles.datePickerLabel}>Viewing transactions for</Text>
                <Text style={styles.datePickerValue}>
                  {formatDateDisplay(tempDate)}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Date Picker - Direct (Not in Modal) */}
        {pickerOpen && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            maximumDate={new Date()}
          />
        )}

        {/* Totals Summary */}
        {entries.length > 0 && (
          <View style={styles.totalsSection}>
            <TotalsSummary totals={totals} />
          </View>
        )}

        {/* Entries Section */}
        <View style={styles.entriesSection}>
          {entries.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Transactions ({entries.length})</Text>
              {entries.map((item) => (
                <View key={item.id} style={styles.entryItemWrapper}>
                  <EntryItem
                    entry={item}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onTogglePayment={() => {}}
                  />
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons name="calendar-blank" size={56} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                Select a different date to view past records
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: { 
    fontSize: THEME.fonts.sm, 
    color: 'rgba(255,255,255,0.85)',
    marginTop: THEME.spacing.xs,
  },
  sectionContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  sectionLabel: {
    fontSize: THEME.fonts.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.md,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  datePickerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  calendarIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: { 
    fontSize: THEME.fonts.sm, 
    color: COLORS.gray, 
    marginBottom: THEME.spacing.xs 
  },
  datePickerValue: { 
    fontSize: THEME.fonts.lg, 
    fontWeight: '700', 
    color: COLORS.primary 
  },
  totalsSection: {
    paddingHorizontal: 0,
    paddingVertical: THEME.spacing.md,
  },
  entriesSection: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
  },
  entryItemWrapper: {
    marginBottom: THEME.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(15, 23, 36, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
  },
  emptyText: { 
    fontSize: THEME.fonts.lg, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginBottom: THEME.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: { 
    fontSize: THEME.fonts.md, 
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
