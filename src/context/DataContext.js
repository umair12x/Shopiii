import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, get, set } from 'firebase/database';
import { FIREBASE_ENABLED, firebaseDatabase, ensureSignedIn } from '../config/firebaseConfig';
import { downloadAsCSV } from '../utils/csvExporter';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const FIREBASE_ROOT_PATH = 'shopiii/default';
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

  // Sync tracking state
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSynced, setIsSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');
  const [dataStorageAge, setDataStorageAge] = useState(null);

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
    loadSyncMetadata();
  }, [loadEntriesForDate, loadProductPrices, loadShopDetails]);

  // Load sync metadata
  const loadSyncMetadata = useCallback(async () => {
    try {
      const syncData = await AsyncStorage.getItem('syncMetadata');
      if (syncData) {
        const parsed = JSON.parse(syncData);
        setLastSyncTime(parsed.lastSyncTime ? new Date(parsed.lastSyncTime) : null);
        setIsSynced(parsed.isSynced || false);
        // Calculate data age
        if (parsed.lastDataModified) {
          const age = Date.now() - new Date(parsed.lastDataModified).getTime();
          setDataStorageAge(age);
        }
      }
    } catch (error) {
      console.error('Error loading sync metadata:', error);
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
      // Mark data as not synced
      setIsSynced(false);
      updateSyncMetadata({ isSynced: false, lastDataModified: new Date().toISOString() });
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  // Save product prices to storage
  const saveProductPrices = async (newProducts) => {
    try {
      await AsyncStorage.setItem('product_prices', JSON.stringify(newProducts));
      setProductPrices(newProducts);
      // Mark data as not synced
      setIsSynced(false);
      updateSyncMetadata({ isSynced: false, lastDataModified: new Date().toISOString() });
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

  // Update sync metadata
  const updateSyncMetadata = async (updates) => {
    try {
      const current = await AsyncStorage.getItem('syncMetadata');
      const data = current ? JSON.parse(current) : {};
      const updated = { ...data, ...updates };
      await AsyncStorage.setItem('syncMetadata', JSON.stringify(updated));
      if (updates.lastSyncTime) setLastSyncTime(new Date(updates.lastSyncTime));
      if (updates.isSynced !== undefined) setIsSynced(updates.isSynced);
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  };

  const getCloudRootRef = () => {
    if (!firebaseDatabase) {
      return null;
    }

    return ref(firebaseDatabase, FIREBASE_ROOT_PATH);
  };

  const ensureSignedInIfAvailable = async () => {
    try {
      await ensureSignedIn();
      return { signedIn: true, authConfigMissing: false };
    } catch (error) {
      if (error?.code === 'auth/configuration-not-found') {
        // Allow sync to continue for setups that use open dev rules.
        console.warn('Firebase Auth provider is not configured; attempting sync without auth.');
        return { signedIn: false, authConfigMissing: true };
      }
      throw error;
    }
  };

  const loadLocalSnapshot = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const entryKeys = allKeys.filter((key) => key.startsWith('entries_'));

    const entriesByDate = {};
    for (const key of entryKeys) {
      const stored = await AsyncStorage.getItem(key);
      entriesByDate[key.replace('entries_', '')] = stored ? JSON.parse(stored) : [];
    }

    const [storedShopDetails, storedProductPrices] = await Promise.all([
      AsyncStorage.getItem('shopDetails'),
      AsyncStorage.getItem('product_prices'),
    ]);

    return {
      entriesByDate,
      shopDetails: storedShopDetails ? JSON.parse(storedShopDetails) : shopDetails,
      productPrices: storedProductPrices ? JSON.parse(storedProductPrices) : productPrices,
    };
  };

  // Upload data to Firebase
  const uploadToFirebase = useCallback(async () => {
    if (!FIREBASE_ENABLED || !firebaseDatabase) {
      console.warn('Firebase not configured');
      return { success: false, message: 'Firebase not configured' };
    }
    try {
      // Attempt auth first; continue without auth if provider is not configured.
      const authState = await ensureSignedInIfAvailable();
      setSyncStatus('syncing');
      setSyncMessage('');
      const snapshot = await loadLocalSnapshot();
      const cloudRoot = getCloudRootRef();
      const successMessage = authState.authConfigMissing
        ? 'Synced without Firebase Auth. Enable Anonymous sign-in and secure DB rules before production.'
        : 'Data synced successfully';

      await set(cloudRoot, {
        entriesByDate: snapshot.entriesByDate,
        productPrices: snapshot.productPrices,
        shopDetails: snapshot.shopDetails,
        syncMeta: {
          lastSyncTime: new Date().toISOString(),
          lastDataModified: new Date().toISOString(),
        },
      });
      
      // Mark as synced
      await updateSyncMetadata({
        isSynced: true,
        lastSyncTime: new Date().toISOString(),
        lastDataModified: new Date().toISOString(),
      });
      setSyncStatus('success');
      setSyncMessage(successMessage);
      setIsSynced(true);
      return { success: true, message: successMessage };
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      setSyncStatus('error');
      if (error?.code === 'PERMISSION_DENIED' || String(error?.message || '').includes('permission_denied')) {
        setSyncMessage('Realtime Database denied write. Enable Anonymous sign-in and use auth-based DB rules, or relax rules for development.');
        return {
          success: false,
          message: 'Realtime Database denied write. Either enable Anonymous auth (recommended) or temporarily relax DB rules for development.',
        };
      }
      setSyncMessage(error?.message || 'Sync failed');
      return { success: false, message: error.message };
    }
  }, [entries, productPrices, shopDetails]);

  // Fetch data from Firebase
  const fetchFromFirebase = useCallback(async () => {
    if (!FIREBASE_ENABLED || !firebaseDatabase) {
      console.warn('Firebase not configured');
      return { success: false, message: 'Firebase not configured' };
    }
    try {
      // Attempt auth first; continue without auth if provider is not configured.
      const authState = await ensureSignedInIfAvailable();
      setSyncStatus('syncing');
      setSyncMessage('');
      const cloudRoot = getCloudRootRef();
      const snapshot = await get(cloudRoot);

      if (!snapshot.exists()) {
        setSyncStatus('error');
        setSyncMessage('No cloud data found');
        return { success: false, message: 'No cloud data found' };
      }

      const data = snapshot.val() || {};
      const restoredShopDetails = data.shopDetails || shopDetails;
      const restoredProductPrices = Array.isArray(data.productPrices) ? data.productPrices : [];
      const restoredEntriesByDate = data.entriesByDate || {};

      await AsyncStorage.setItem('shopDetails', JSON.stringify(restoredShopDetails));
      await AsyncStorage.setItem('product_prices', JSON.stringify(restoredProductPrices));

      const entryDates = Object.keys(restoredEntriesByDate);
      for (const dateKey of entryDates) {
        await AsyncStorage.setItem(`entries_${dateKey}`, JSON.stringify(restoredEntriesByDate[dateKey] || []));
      }

      const currentDateKey = formatDateKey(selectedDate);
      const restoredEntries = restoredEntriesByDate[currentDateKey] || [];

      setShopDetails(restoredShopDetails);
      setProductPrices(restoredProductPrices);
      setEntries(restoredEntries);

      const syncMeta = data.syncMeta || {};
      await updateSyncMetadata({
        isSynced: true,
        lastSyncTime: syncMeta.lastSyncTime || new Date().toISOString(),
        lastDataModified: syncMeta.lastDataModified || new Date().toISOString(),
      });
      
      setSyncStatus('success');
      setSyncMessage('Data fetched successfully');
      if (authState.authConfigMissing) {
        return {
          success: true,
          message: 'Data fetched without Firebase Auth. Enable Anonymous sign-in and secure DB rules before production.',
        };
      }
      return { success: true, message: 'Data fetched successfully' };
    } catch (error) {
      console.error('Error fetching from Firebase:', error);
      setSyncStatus('error');
      if (error?.code === 'PERMISSION_DENIED' || String(error?.message || '').includes('permission_denied')) {
        setSyncMessage('Realtime Database denied read. Enable Anonymous sign-in and use auth-based DB rules, or relax rules for development.');
        return {
          success: false,
          message: 'Realtime Database denied read. Either enable Anonymous auth (recommended) or temporarily relax DB rules for development.',
        };
      }
      setSyncMessage(error?.message || 'Sync failed');
      return { success: false, message: error.message };
    }
  }, [selectedDate, shopDetails]);

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
    // Sync related
    lastSyncTime,
    isSynced,
    syncStatus,
    syncMessage,
    dataStorageAge,
    uploadToFirebase,
    fetchFromFirebase,
    updateSyncMetadata,
    // CSV Export
    downloadAsCSV: (allEntries, allShopDetails, allProductPrices) =>
      downloadAsCSV(allEntries, allShopDetails, allProductPrices),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
