import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { DataContext } from '../context/DataContext';
import { COLORS, THEME } from '../config/colors';
import { formatCurrency } from '../utils/currencyFormatter';

const EMPTY_FORM = {
  productName: '',
  barcode: '',
  purchasePrice: '',
  salePrice: '',
  notes: '',
};

export const ProductsScreen = () => {
  const { productPrices, upsertProductPrice, deleteProductPrice, getProductByBarcode } = useContext(DataContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  const stats = useMemo(() => {
    const totalProducts = productPrices.length;
    const barcodeLinked = productPrices.filter((product) => product.barcode).length;
    const averageMargin =
      totalProducts > 0
        ? productPrices.reduce((sum, product) => sum + (product.salePrice - product.purchasePrice), 0) /
          totalProducts
        : 0;

    return {
      totalProducts,
      barcodeLinked,
      averageMargin,
    };
  }, [productPrices]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [...productPrices].sort((a, b) => a.productName.localeCompare(b.productName));
    }

    return productPrices
      .filter((product) => {
        const haystack = [product.productName, product.barcode, product.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [productPrices, searchQuery]);

  const resetForm = (nextValues = EMPTY_FORM) => {
    setForm(nextValues);
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    resetForm();
    setFormVisible(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    resetForm({
      productName: product.productName || '',
      barcode: product.barcode || '',
      purchasePrice: product.purchasePrice ? String(product.purchasePrice) : '',
      salePrice: product.salePrice ? String(product.salePrice) : '',
      notes: product.notes || '',
    });
    setFormVisible(true);
  };

  const openScanner = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Scanner unavailable', 'Barcode scanning works on Android and iOS devices.');
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera permission required', 'Allow camera access to scan product barcodes.');
        return;
      }
    }

    setHasScanned(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (hasScanned) {
      return;
    }

    setHasScanned(true);
    setScannerVisible(false);

    const barcodeValue = String(data || '').trim();
    if (!barcodeValue) {
      return;
    }

    const existingProduct = getProductByBarcode(barcodeValue);

    if (existingProduct) {
      openEditProduct(existingProduct);
      return;
    }

    setEditingProduct(null);
    resetForm({
      ...EMPTY_FORM,
      barcode: barcodeValue,
    });
    setFormVisible(true);
  };

  const handleSave = async () => {
    const productName = form.productName.trim();
    const barcode = form.barcode.trim();
    const purchasePrice = form.purchasePrice.trim();
    const salePrice = form.salePrice.trim();
    const duplicateBarcode =
      barcode &&
      productPrices.find(
        (product) => product.barcode === barcode && product.id !== editingProduct?.id,
      );

    if (!productName) {
      Alert.alert('Missing details', 'Please enter a product name.');
      return;
    }

    if (purchasePrice === '' || salePrice === '') {
      Alert.alert('Missing prices', 'Please enter both purchase and sale prices.');
      return;
    }

    if (duplicateBarcode) {
      Alert.alert(
        'Barcode already exists',
        `This barcode is already assigned to ${duplicateBarcode.productName}. Open that item to update it.`,
      );
      return;
    }

    await upsertProductPrice({
      id: editingProduct?.id,
      createdAt: editingProduct?.createdAt,
      productName,
      barcode,
      purchasePrice: parseFloat(purchasePrice),
      salePrice: parseFloat(salePrice),
      notes: form.notes,
    });

    setFormVisible(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleDelete = (product) => {
    Alert.alert('Delete product', `Remove ${product.productName} from saved prices?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteProductPrice(product.id),
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const profit = item.salePrice - item.purchasePrice;
    const isProfit = profit >= 0;

    return (
      <View style={styles.productCard}>
        <View style={styles.productTopRow}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productMeta} numberOfLines={1}>
              {item.barcode ? `Barcode: ${item.barcode}` : 'Barcode not added yet'}
            </Text>
          </View>
          <View style={[styles.profitBadge, isProfit ? styles.profitBadgePositive : styles.profitBadgeNegative]}>
            <Text style={[styles.profitText, isProfit ? styles.profitPositive : styles.profitNegative]}>
              {isProfit ? '+' : '-'}{formatCurrency(Math.abs(profit))}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Cost</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.purchasePrice)}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Sale</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.salePrice)}</Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditProduct(item)} style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={18} color={COLORS.primary} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionButton, styles.deleteButton]}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerIconWrap}>
                  <MaterialCommunityIcons name="barcode-scan" size={28} color={COLORS.white} />
                </View>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>Product Prices</Text>
                  <Text style={styles.subtitle}>Save prices manually or by scanning barcodes</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={openAddProduct}>
                  <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={openScanner}>
                  <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.secondaryBtnText}>Scan Barcode</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.barcodeLinked}</Text>
                <Text style={styles.statLabel}>With Barcode</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(stats.averageMargin)}</Text>
                <Text style={styles.statLabel}>Avg. Margin</Text>
              </View>
            </View>

            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or barcode"
                placeholderTextColor={COLORS.gray}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Saved Prices</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No products saved yet</Text>
            <Text style={styles.emptyText}>Add products manually or scan a barcode to start building your price list.</Text>
          </View>
        }
      />

      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
                  <Text style={styles.modalSubtitle}>Store the price and barcode for easy reuse later.</Text>
                </View>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Product name</Text>
                <TextInput
                  value={form.productName}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, productName: value }))}
                  placeholder="e.g. Biscuits"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Barcode</Text>
                <TextInput
                  value={form.barcode}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, barcode: value }))}
                  placeholder="Scan or type barcode"
                  placeholderTextColor={COLORS.gray}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.priceRowInput}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Cost price</Text>
                  <TextInput
                    value={form.purchasePrice}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, purchasePrice: value }))}
                    placeholder="0"
                    placeholderTextColor={COLORS.gray}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Sale price</Text>
                  <TextInput
                    value={form.salePrice}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, salePrice: value }))}
                    placeholder="0"
                    placeholderTextColor={COLORS.gray}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                  placeholder="Optional notes"
                  placeholderTextColor={COLORS.gray}
                  style={[styles.input, styles.notesInput]}
                  multiline
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={[styles.modalBtn, styles.cancelBtn]}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.modalBtn, styles.saveBtn]}>
                  <MaterialCommunityIcons name="content-save" size={18} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={scannerVisible} animationType="slide" transparent={false} onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerScreen}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />

          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.scannerCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.scannerHeaderText}>
              <Text style={styles.scannerTitle}>Scan a barcode</Text>
              <Text style={styles.scannerSubtitle}>Point the camera at a product barcode to add or edit it.</Text>
            </View>
          </View>

          <View style={styles.scannerFrame}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
                }}
                onBarcodeScanned={handleBarcodeScanned}
              />
            ) : (
              <View style={styles.permissionState}>
                <MaterialCommunityIcons name="camera-off" size={54} color={COLORS.white} />
                <Text style={styles.permissionTitle}>Camera permission needed</Text>
                <Text style={styles.permissionText}>Allow access to your camera to scan product barcodes.</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={openScanner}>
                  <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.scanOverlayTop} />
            <View style={styles.scanOverlayBottom} />
            <View style={styles.scanBox} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: THEME.spacing.xl,
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
  },
  quickActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.lg,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.08)',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    alignItems: 'center',
    ...THEME.elevation.subtle,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.06)',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: THEME.fonts.md,
  },
  sectionTitle: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyState: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    padding: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    ...THEME.elevation.subtle,
  },
  emptyTitle: {
    marginTop: THEME.spacing.md,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  productCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    ...THEME.elevation.subtle,
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: THEME.spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  productMeta: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
  },
  profitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  profitBadgePositive: {
    backgroundColor: COLORS.profitGreen,
  },
  profitBadgeNegative: {
    backgroundColor: COLORS.lossRed,
  },
  profitText: {
    fontWeight: '800',
    fontSize: 12,
  },
  profitPositive: {
    color: COLORS.success,
  },
  profitNegative: {
    color: COLORS.error,
  },
  priceRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  priceBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  priceValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  notes: {
    marginTop: THEME.spacing.sm,
    color: COLORS.muted,
    fontSize: THEME.fonts.sm,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
  },
  actionText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.lossRed,
  },
  deleteText: {
    color: COLORS.error,
  },
  modalFlex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11,19,32,0.45)',
    padding: THEME.spacing.md,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: THEME.spacing.md,
  },
  fieldLabel: {
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '700',
  },
  input: {
    minHeight: 52,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.background,
    paddingHorizontal: THEME.spacing.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.06)',
  },
  priceRowInput: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  halfField: {
    flex: 1,
  },
  notesInput: {
    minHeight: 84,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  modalBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scannerHeader: {
    paddingTop: 18,
    paddingHorizontal: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeaderText: {
    flex: 1,
  },
  scannerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  scannerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  scannerFrame: {
    flex: 1,
    margin: THEME.spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  scanOverlayTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scanOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scanBox: {
    position: 'absolute',
    top: '28%',
    left: '12%',
    right: '12%',
    bottom: '28%',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 20,
  },
  permissionState: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  permissionTitle: {
    marginTop: THEME.spacing.md,
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: THEME.spacing.lg,
    backgroundColor: COLORS.white,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 14,
    borderRadius: THEME.borderRadius.lg,
  },
  permissionBtnText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
