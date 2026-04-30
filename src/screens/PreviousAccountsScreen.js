import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
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
  const [pickerDraftDate, setPickerDraftDate] = useState(new Date());

  const totals = calculateTotals();

  const handleDateConfirm = (date) => {
    setTempDate(date);
    changeDate(date);
    setPickerOpen(false);
  };

  const handlePickerChange = (event, selectedDate) => {
    if (selectedDate) {
      setPickerDraftDate(selectedDate);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account History</Text>
          <Text style={styles.subtitle}>View past transactions</Text>
        </View>

        {/* Date Picker Button */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => {
            setPickerDraftDate(tempDate);
            setPickerOpen(true);
          }}
        >
          <Text style={styles.datePickerIcon}>📅</Text>
          <View style={styles.datePickerContent}>
            <Text style={styles.datePickerLabel}>Select Date</Text>
            <Text style={styles.datePickerValue}>
              {formatDateDisplay(tempDate)}
            </Text>
          </View>
          <Text style={styles.datePickerArrow}>›</Text>
        </TouchableOpacity>

        {/* Totals Summary */}
        {entries.length > 0 && <TotalsSummary totals={totals} />}

        {/* Entries List */}
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryItemWrapper}>
              <EntryItem
                entry={item}
                onEdit={() => {}}
                onDelete={() => {}}
                onTogglePayment={() => {}}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No entries for this date</Text>
              <Text style={styles.emptySubtext}>
                Select a different date to view past records
              </Text>
            </View>
          }
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />

        {/* Date Picker Modal */}
        <Modal visible={pickerOpen} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setPickerOpen(false)}
                  style={styles.pickerCloseBtn}
                >
                  <Text style={styles.pickerCloseBtnText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Date</Text>
                <View style={{ width: 40 }} />
              </View>

              <DateTimePicker
                value={pickerDraftDate}
                mode="date"
                display="calendar"
                onChange={handlePickerChange}
                maximumDate={new Date()}
              />

              <TouchableOpacity
                style={styles.pickerConfirmBtn}
                onPress={() => handleDateConfirm(pickerDraftDate)}
              >
                <Text style={styles.pickerConfirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1,},
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: { fontSize: THEME.fonts.sm, color: 'rgba(255,255,255,0.9)' },
  datePickerIcon: { fontSize: 24, marginRight: THEME.spacing.md },
  datePickerContent: {
    flex: 1,
  },
  datePickerLabel: { fontSize: THEME.fonts.sm, color: COLORS.gray, marginBottom: THEME.spacing.xs },
  datePickerValue: { fontSize: THEME.fonts.md, fontWeight: '700', color: COLORS.text },
  datePickerArrow: { fontSize: THEME.fonts.xl, color: COLORS.gray },
  listContent: { paddingHorizontal: THEME.spacing.lg, paddingBottom: THEME.spacing.lg },
  entryItemWrapper: {
    marginBottom: THEME.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: THEME.spacing.lg,
  },
  emptyText: { fontSize: THEME.fonts.xl, fontWeight: '700', color: COLORS.text, marginBottom: THEME.spacing.sm },
  emptySubtext: { fontSize: THEME.fonts.md, color: COLORS.gray },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: { backgroundColor: COLORS.surface, borderTopLeftRadius: THEME.borderRadius.lg, borderTopRightRadius: THEME.borderRadius.lg, paddingBottom: THEME.spacing.lg },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pickerCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCloseBtnText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  pickerTitle: { fontSize: THEME.fonts.lg, fontWeight: '700', color: COLORS.text },
  pickerConfirmBtn: { marginHorizontal: THEME.spacing.lg, marginTop: THEME.spacing.lg, paddingVertical: THEME.spacing.md, backgroundColor: COLORS.primary, borderRadius: THEME.borderRadius.sm, alignItems: 'center' },
  pickerConfirmBtnText: { fontSize: THEME.fonts.lg, fontWeight: '700', color: COLORS.white },
});
