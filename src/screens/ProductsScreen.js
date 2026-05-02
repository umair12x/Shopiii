import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
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
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon as MaterialCommunityIcons } from '../components/AppIcon';
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
  const [scannerMode, setScannerMode] = useState('add');
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (scannerVisible) {
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      );
      scanAnimation.start();
      return () => scanAnimation.stop();
    }
    scanLineAnim.setValue(0);
  }, [scannerVisible]);

  const stats = useMemo(() => {
    const totalProducts = productPrices.length;
    const barcodeLinked = productPrices.filter(p => p.barcode).length;
    const avgMargin = totalProducts > 0
      ? productPrices.reduce((sum, p) => sum + (p.salePrice - p.purchasePrice), 0) / totalProducts
      : 0;
    return { totalProducts, barcodeLinked, avgMargin };
  }, [productPrices]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [...productPrices].sort((a, b) => a.productName.localeCompare(b.productName));
    return productPrices
      .filter(p => [p.productName, p.barcode, p.notes].filter(Boolean).join(' ').toLowerCase().includes(query))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [productPrices, searchQuery]);

  const resetForm = () => setForm(EMPTY_FORM);

  const openAddProduct = () => {
    setEditingProduct(null);
    resetForm();
    setFormVisible(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setForm({
      productName: product.productName || '',
      barcode: product.barcode || '',
      purchasePrice: product.purchasePrice ? String(product.purchasePrice) : '',
      salePrice: product.salePrice ? String(product.salePrice) : '',
      notes: product.notes || '',
    });
    setFormVisible(true);
  };

  const openScanner = async (mode = 'add') => {
    if (Platform.OS === 'web') {
      Alert.alert('Unavailable', 'Barcode scanning works on mobile devices.');
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Allow camera access to scan barcodes.');
        return;
      }
    }
    setScannerMode(mode);
    setScanned(false);
    setScanning(true);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanned || !scanning) return;
    setScanned(true);
    setScanning(false);
    if (Platform.OS !== 'web') Vibration.vibrate(50);

    const barcode = String(data || '').trim();
    if (!barcode) {
      setTimeout(() => { setScanned(false); setScanning(true); }, 2000);
      return;
    }

    const existingProduct = getProductByBarcode(barcode);
    setScannerVisible(false);

    if (scannerMode === 'find') {
      if (existingProduct) {
        Alert.alert('Product Found', `${existingProduct.productName} - ${formatCurrency(existingProduct.salePrice)}`, [
          { text: 'OK', onPress: () => setSearchQuery(existingProduct.productName) },
          { text: 'Edit', onPress: () => openEditProduct(existingProduct) },
        ]);
      } else {
        Alert.alert('Not Found', 'No product found with this barcode.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add New', onPress: () => {
            setEditingProduct(null);
            setForm({ ...EMPTY_FORM, barcode });
            setFormVisible(true);
          }},
        ]);
      }
    } else {
      if (existingProduct) {
        Alert.alert('Product Exists', `${existingProduct.productName} already has this barcode.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => openEditProduct(existingProduct) },
        ]);
      } else {
        setEditingProduct(null);
        setForm({ ...EMPTY_FORM, barcode });
        setFormVisible(true);
      }
    }
  };

  const handleSave = async () => {
    const { productName, barcode, purchasePrice, salePrice, notes } = form;
    if (!productName.trim()) {
      Alert.alert('Missing Info', 'Please enter a product name.');
      return;
    }
    if (!purchasePrice || !salePrice) {
      Alert.alert('Missing Prices', 'Please enter both purchase and sale prices.');
      return;
    }
    const duplicate = barcode && productPrices.find(p => p.barcode === barcode && p.id !== editingProduct?.id);
    if (duplicate) {
      Alert.alert('Duplicate Barcode', `Already assigned to ${duplicate.productName}`);
      return;
    }
    await upsertProductPrice({
      id: editingProduct?.id,
      createdAt: editingProduct?.createdAt,
      productName: productName.trim(),
      barcode: barcode.trim(),
      purchasePrice: parseFloat(purchasePrice),
      salePrice: parseFloat(salePrice),
      notes: notes.trim(),
    });
    setFormVisible(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleDelete = (product) => {
    Alert.alert('Delete Product', `Remove ${product.productName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProductPrice(product.id) },
    ]);
  };

  const renderItem = ({ item }) => {
    const profit = item.salePrice - item.purchasePrice;
    const isProfit = profit >= 0;
    const marginPercent = item.salePrice > 0 ? ((profit / item.salePrice) * 100).toFixed(1) : 0;

    return (
      <Animated.View style={[styles.productCard, { opacity: fadeAnim }]}>
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
            <View style={[styles.marginBadge, isProfit ? styles.marginPositive : styles.marginNegative]}>
              <Text style={[styles.marginText, { color: isProfit ? COLORS.success : COLORS.error }]}>
                {isProfit ? '+' : ''}{marginPercent}%
              </Text>
            </View>
          </View>
          {item.barcode ? (
            <View style={styles.barcodeRow}>
              <MaterialCommunityIcons name="barcode" size={12} color={COLORS.muted} />
              <Text style={styles.barcodeText}>{item.barcode}</Text>
            </View>
          ) : (
            <Text style={styles.noBarcode}>No barcode</Text>
          )}
        </View>

        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Cost</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.purchasePrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Sale</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.salePrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Profit</Text>
            <Text style={[styles.priceValue, { color: isProfit ? COLORS.success : COLORS.error }]}>
              {isProfit ? '+' : ''}{formatCurrency(profit)}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <View style={styles.notesRow}>
            <MaterialCommunityIcons name="note-outline" size={12} color={COLORS.muted} />
            <Text style={styles.notesText} numberOfLines={1}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditProduct(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="pencil" size={14} color={COLORS.accent} />
            <Text style={styles.actionEditText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={14} color={COLORS.error} />
            <Text style={styles.actionDeleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons name="barcode" size={24} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.title}>Products</Text>
                  <Text style={styles.subtitle}>Manage your catalog</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.primaryBtn} onPress={openAddProduct}>
                  <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => openScanner('add')}>
                  <MaterialCommunityIcons name="barcode" size={18} color={COLORS.accent} />
                  <Text style={styles.secondaryBtnText}>Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => openScanner('find')}>
                  <MaterialCommunityIcons name="magnify" size={18} color={COLORS.accent} />
                  <Text style={styles.secondaryBtnText}>Find</Text>
                </TouchableOpacity>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalProducts}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.barcodeLinked}</Text>
                  <Text style={styles.statLabel}>Barcodes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{formatCurrency(stats.avgMargin)}</Text>
                  <Text style={styles.statLabel}>Avg Margin</Text>
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products..."
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {filteredProducts.length > 0 && (
              <Text style={styles.sectionTitle}>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="package-variant-closed" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matches' : 'No products'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'Add your first product to get started'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddProduct}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Product Form Modal */}
      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalDrag} />
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'New Product'}</Text>
                  <Text style={styles.modalSubtitle}>{editingProduct ? 'Update product details' : 'Add product to catalog'}</Text>
                </View>
                <TouchableOpacity onPress={() => setFormVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  value={form.productName}
                  onChangeText={text => setForm(prev => ({ ...prev, productName: text }))}
                  placeholder="e.g. Wheat Flour"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Barcode</Text>
                <View style={styles.barcodeRow}>
                  <TextInput
                    value={form.barcode}
                    onChangeText={text => setForm(prev => ({ ...prev, barcode: text }))}
                    placeholder="Scan or type barcode"
                    placeholderTextColor={COLORS.muted}
                    style={[styles.input, styles.barcodeInput]}
                  />
                  <TouchableOpacity style={styles.scanBtn} onPress={() => {
                    setFormVisible(false);
                    setTimeout(() => openScanner('add'), 300);
                  }}>
                    <MaterialCommunityIcons name="barcode" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.priceField}>
                  <Text style={styles.fieldLabel}>Cost Price *</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.currencyPrefix}>Rs</Text>
                    <TextInput
                      value={form.purchasePrice}
                      onChangeText={text => setForm(prev => ({ ...prev, purchasePrice: text }))}
                      placeholder="0"
                      placeholderTextColor={COLORS.muted}
                      style={styles.priceInput}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.priceField}>
                  <Text style={styles.fieldLabel}>Sale Price *</Text>
                  <View style={styles.priceInputWrap}>
                    <Text style={styles.currencyPrefix}>Rs</Text>
                    <TextInput
                      value={form.salePrice}
                      onChangeText={text => setForm(prev => ({ ...prev, salePrice: text }))}
                      placeholder="0"
                      placeholderTextColor={COLORS.muted}
                      style={styles.priceInput}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={text => setForm(prev => ({ ...prev, notes: text }))}
                  placeholder="Optional notes..."
                  placeholderTextColor={COLORS.muted}
                  style={[styles.input, styles.notesInput]}
                  multiline
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" transparent={false} onRequestClose={() => {
        setScannerVisible(false);
        setScanned(false);
        setScanning(true);
      }}>
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => setScannerVisible(false)}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>{scannerMode === 'find' ? 'Find Product' : 'Scan Barcode'}</Text>
            {scanned && (
              <TouchableOpacity onPress={() => { setScanned(false); setScanning(true); }}>
                <Text style={styles.rescanText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.scannerFrame}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
                }}
                onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
              />
            ) : (
              <View style={styles.permissionView}>
                <MaterialCommunityIcons name="camera-off" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={styles.permissionTitle}>Camera Required</Text>
                <Text style={styles.permissionText}>Allow camera to scan barcodes</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={() => openScanner(scannerMode)}>
                  <Text style={styles.permissionBtnText}>Grant Access</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.scanOverlay}>
              <Text style={styles.scanOverlayText}>
                {scannerMode === 'find' ? 'Scan to find product' : 'Align barcode in frame'}
              </Text>
            </View>
            
            <View style={styles.scanBox}>
              <View style={[styles.scanCorner, styles.topLeft]} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
              {scanning && <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]} />}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  listContent: {
    paddingBottom: 100,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  secondaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  productCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: THEME.spacing.md,
  },
  productInfo: {
    marginBottom: THEME.spacing.sm,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  marginPositive: {
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  marginNegative: {
    backgroundColor: 'rgba(198,40,40,0.1)',
  },
  marginText: {
    fontWeight: '700',
    fontSize: 11,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },
  noBarcode: {
    fontSize: 11,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    marginBottom: THEME.spacing.sm,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceDivider: {
    width: 1,
    backgroundColor: 'rgba(11,19,32,0.06)',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: THEME.spacing.sm,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
  actionEditText: {
    fontWeight: '600',
    color: COLORS.accent,
    fontSize: 12,
  },
  actionDeleteText: {
    fontWeight: '600',
    color: COLORS.error,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: THEME.spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  modalFlex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalDrag: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  formField: {
    marginBottom: THEME.spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(11,19,32,0.04)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  barcodeInput: {
    flex: 1,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  priceField: {
    flex: 1,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
    borderRadius: 12,
  },
  currencyPrefix: {
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: '600',
    paddingLeft: 14,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: THEME.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: COLORS.muted,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontWeight: '700',
    color: COLORS.white,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: 50,
    paddingBottom: THEME.spacing.md,
  },
  scannerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  rescanText: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  scannerFrame: {
    flex: 1,
    margin: THEME.spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  scanOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
  },
  scanOverlayText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  scanBox: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '30%',
  },
  scanCorner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: COLORS.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent,
  },
  permissionView: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  permissionTitle: {
    marginTop: THEME.spacing.md,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  permissionText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: THEME.spacing.lg,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});