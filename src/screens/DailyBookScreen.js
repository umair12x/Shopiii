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
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { EntryForm } from '../components/EntryForm';
import { EntryItem } from '../components/EntryItem';
import { TotalsSummary } from '../components/TotalsSummary';
import { COLORS, THEME } from '../config/colors';
import { formatDateDisplay } from '../utils/dateUtils';

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

  const [formVisible, setFormVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const totals = calculateTotals();

  const handleAddEntry = () => {
    setEditingEntry(null);
    setFormVisible(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, formData);
    } else {
      await addEntry(formData);
    }
    setFormVisible(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormVisible(true);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={COLORS.white} />
            <Text style={styles.title}>Daily Book</Text>
          </View>
          <Text style={styles.date}>{formatDateDisplay(selectedDate)}</Text>
        </View>

        {/* Totals Summary */}
        <TotalsSummary totals={totals} />

        {/* Entries List */}
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryItem
              entry={item}
              onEdit={handleEditEntry}
              onDelete={deleteEntry}
              onTogglePayment={togglePaymentStatus}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={72}
                color={COLORS.primary}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>No entries for today</Text>
              <Text style={styles.emptySubtext}>
                Tap the button below to add your first entry
              </Text>
            </View>
          }
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />

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

        <TouchableOpacity style={styles.addButton} onPress={handleAddEntry} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  date: {
    fontSize: THEME.fonts.regular,
    color: COLORS.light,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: THEME.spacing.lg,
  },
  emptyText: {
    fontSize: THEME.fonts.large,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: THEME.spacing.sm,
  },
  emptySubtext: {
    fontSize: THEME.fonts.regular,
    color: COLORS.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.elevation.soft,
  },
});
