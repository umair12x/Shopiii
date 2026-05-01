import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [productPrices, setProductPrices] = useState([]);
  const [shopDetails, setShopDetails] = useState({
    name: 'Shopiii',
    owner: 'Your Name',
    address: 'Shop Address',
    contact: '+92-000-0000000',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Load shop details from storage
  const loadShopDetails = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('shopDetails');
      if (stored) {
        setShopDetails(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shop details:', error);
    }
  }, []);

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

  // Load product prices from storage
  const loadProductPrices = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('product_prices');
      setProductPrices(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error loading product prices:', error);
      setProductPrices([]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadShopDetails();
    loadEntriesForDate(new Date());
    loadProductPrices();
  }, [loadEntriesForDate, loadProductPrices, loadShopDetails]);

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

  // Save product prices to storage
  const saveProductPrices = async (newProducts) => {
    try {
      await AsyncStorage.setItem('product_prices', JSON.stringify(newProducts));
      setProductPrices(newProducts);
    } catch (error) {
      console.error('Error saving product prices:', error);
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

  const normalizeText = (value) => (value ? String(value).trim() : '');

  const normalizePrice = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getProductByBarcode = (barcode) => {
    const normalizedBarcode = normalizeText(barcode);

    if (!normalizedBarcode) {
      return null;
    }

    return productPrices.find(
      (product) => normalizeText(product.barcode) === normalizedBarcode,
    ) || null;
  };

  const upsertProductPrice = async (product) => {
    const normalizedBarcode = normalizeText(product.barcode);
    const normalizedName = normalizeText(product.productName) || 'Unnamed Product';
    const purchasePrice = normalizePrice(product.purchasePrice);
    const salePrice = normalizePrice(product.salePrice);
    const now = new Date().toISOString();

    const existingIndex = productPrices.findIndex(
      (item) => item.id === product.id || (
        normalizedBarcode && normalizeText(item.barcode) === normalizedBarcode
      ),
    );

    const nextProduct = {
      id: product.id || productPrices[existingIndex]?.id || Date.now().toString(),
      barcode: normalizedBarcode,
      productName: normalizedName,
      purchasePrice,
      salePrice,
      notes: normalizeText(product.notes),
      createdAt: productPrices[existingIndex]?.createdAt || product.createdAt || now,
      updatedAt: now,
    };

    const updatedProducts = [...productPrices];

    if (existingIndex >= 0) {
      updatedProducts[existingIndex] = nextProduct;
    } else {
      updatedProducts.push(nextProduct);
    }

    await saveProductPrices(updatedProducts);
  };

  const deleteProductPrice = async (productId) => {
    const updatedProducts = productPrices.filter((product) => product.id !== productId);
    await saveProductPrices(updatedProducts);
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
    productPrices,
    shopDetails,
    selectedDate,
    loading,
    loadProductPrices,
    formatDateKey,
    addEntry,
    updateEntry,
    deleteEntry,
    togglePaymentStatus,
    calculateTotals,
    getEntriesForDateRange,
    updateShopDetails,
    changeDate,
    getProductByBarcode,
    upsertProductPrice,
    deleteProductPrice,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
