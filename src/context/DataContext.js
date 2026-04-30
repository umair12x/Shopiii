import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [shopDetails, setShopDetails] = useState({
    name: 'Shopiii',
    owner: 'Your Name',
    address: 'Shop Address',
    contact: '+92-000-0000000',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadShopDetails();
    loadEntriesForDate(new Date());
  }, []);

  // Load shop details from storage
  const loadShopDetails = async () => {
    try {
      const stored = await AsyncStorage.getItem('shopDetails');
      if (stored) {
        setShopDetails(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shop details:', error);
    }
  };

  // Load entries for a specific date
  const loadEntriesForDate = useCallback(async (date) => {
    try {
      setLoading(true);
      const dateKey = formatDateKey(date);
      const stored = await AsyncStorage.getItem(`entries_${dateKey}`);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Format date for storage key (YYYY-MM-DD)
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Save entries to storage
  const saveEntries = async (newEntries) => {
    try {
      const dateKey = formatDateKey(selectedDate);
      await AsyncStorage.setItem(`entries_${dateKey}`, JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  // Add new entry
  const addEntry = async (entry) => {
    const newEntry = {
      id: Date.now().toString(),
      date: formatDateKey(selectedDate),
      itemName: entry.itemName || `Item ${entries.length + 1}`,
      purchasePrice: parseFloat(entry.purchasePrice) || 0,
      salePrice: parseFloat(entry.salePrice) || 0,
      profit: parseFloat(entry.salePrice) - parseFloat(entry.purchasePrice) || 0,
      isPaymentCollected: entry.isPaymentCollected || false,
      createdAt: new Date().toISOString(),
    };
    const updatedEntries = [...entries, newEntry];
    await saveEntries(updatedEntries);
  };

  // Update entry
  const updateEntry = async (entryId, updatedData) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            ...updatedData,
            profit: updatedData.salePrice - updatedData.purchasePrice,
          }
        : entry
    );
    await saveEntries(updatedEntries);
  };

  // Delete entry
  const deleteEntry = async (entryId) => {
    const updatedEntries = entries.filter((entry) => entry.id !== entryId);
    await saveEntries(updatedEntries);
  };

  // Toggle payment status
  const togglePaymentStatus = async (entryId) => {
    const updatedEntries = entries.map((entry) =>
      entry.id === entryId
        ? { ...entry, isPaymentCollected: !entry.isPaymentCollected }
        : entry
    );
    await saveEntries(updatedEntries);
  };

  // Calculate totals
  const calculateTotals = () => {
    const totals = entries.reduce(
      (acc, entry) => ({
        totalInvestment: acc.totalInvestment + entry.purchasePrice,
        totalSales: acc.totalSales + entry.salePrice,
        totalProfit: acc.totalProfit + entry.profit,
        pendingAmount: acc.pendingAmount + (entry.isPaymentCollected ? 0 : entry.salePrice),
        collectedAmount: acc.collectedAmount + (entry.isPaymentCollected ? entry.salePrice : 0),
      }),
      {
        totalInvestment: 0,
        totalSales: 0,
        totalProfit: 0,
        pendingAmount: 0,
        collectedAmount: 0,
      }
    );
    return totals;
  };

  // Get entries for date range (for analytics)
  const getEntriesForDateRange = async (startDate, endDate) => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const entryKeys = allKeys.filter((key) => key.startsWith('entries_'));
      const filteredKeys = entryKeys.filter((key) => {
        const dateStr = key.replace('entries_', '');
        const date = new Date(dateStr);
        return date >= startDate && date <= endDate;
      });

      let allEntries = [];
      for (const key of filteredKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          allEntries = allEntries.concat(JSON.parse(stored));
        }
      }
      return allEntries;
    } catch (error) {
      console.error('Error getting entries for date range:', error);
      return [];
    }
  };

  // Update shop details
  const updateShopDetails = async (newDetails) => {
    try {
      const updated = { ...shopDetails, ...newDetails };
      await AsyncStorage.setItem('shopDetails', JSON.stringify(updated));
      setShopDetails(updated);
    } catch (error) {
      console.error('Error updating shop details:', error);
    }
  };

  // Change selected date
  const changeDate = async (date) => {
    setSelectedDate(date);
    await loadEntriesForDate(date);
  };

  const value = {
    entries,
    shopDetails,
    selectedDate,
    loading,
    formatDateKey,
    addEntry,
    updateEntry,
    deleteEntry,
    togglePaymentStatus,
    calculateTotals,
    getEntriesForDateRange,
    updateShopDetails,
    changeDate,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
