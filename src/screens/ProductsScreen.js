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
  ScrollView,
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
  const [scannerMode, setScannerMode] = useState('add'); // 'add' or 'find'
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [foundProduct, setFoundProduct] = useState(null);
  const [showFoundProduct, setShowFoundProduct] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const foundProductAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animated scan line
  useEffect(() => {
    if (scannerVisible) {
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimation.start();
      return () => scanAnimation.stop();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [scannerVisible]);

  // Animate found product card
  useEffect(() => {
    if (showFoundProduct && foundProduct) {
      Animated.spring(foundProductAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      foundProductAnim.setValue(0);
    }
  }, [showFoundProduct, foundProduct]);

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

  const openScanner = async (mode = 'add') => {
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

    setScannerMode(mode);
    setScanned(false);
    setScanning(true);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }) => {
    // Prevent multiple scans
    if (scanned || !scanning) return;
    
    setScanned(true);
    setScanning(false);
    
    // Vibrate on successful scan
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }

    const barcodeValue = String(data || '').trim();
    if (!barcodeValue) {
      // Reset scanner after delay if no data
      setTimeout(() => {
        setScanned(false);
        setScanning(true);
      }, 2000);
      return;
    }

    // Check if product exists
    const existingProduct = getProductByBarcode(barcodeValue);

    if (scannerMode === 'find') {
      // Find mode - search for product
      setScannerVisible(false);
      
      if (existingProduct) {
        // Product found - show it with animation
        setFoundProduct(existingProduct);
        setShowFoundProduct(true);
        setSearchQuery(''); // Clear search
        
        // Scroll to product
        Alert.alert(
          'Product Found',
          `${existingProduct.productName} - ${formatCurrency(existingProduct.salePrice)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Focus on this product
                setSearchQuery(existingProduct.productName);
              }
            },
            {
              text: 'Edit',
              onPress: () => {
                setShowFoundProduct(false);
                setFoundProduct(null);
                openEditProduct(existingProduct);
              }
            }
          ]
        );
      } else {
        // Product not found
        Alert.alert(
          'Not Found',
          'No product found with this barcode.',
          [
            {
              text: 'Add New',
              onPress: () => {
                setEditingProduct(null);
                resetForm({
                  ...EMPTY_FORM,
                  barcode: barcodeValue,
                });
                setFormVisible(true);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setScanning(true);
              }
            }
          ]
        );
      }
    } else {
      // Add mode - open form with barcode
      setScannerVisible(false);

      if (existingProduct) {
        // Show alert and open edit
        Alert.alert(
          'Product Found',
          `${existingProduct.productName} already exists with this barcode.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setScanning(true);
              }
            },
            {
              text: 'Edit Product',
              onPress: () => openEditProduct(existingProduct),
            },
          ]
        );
        return;
      }

      // Open form with scanned barcode
      setEditingProduct(null);
      resetForm({
        ...EMPTY_FORM,
        barcode: barcodeValue,
      });
      setFormVisible(true);
    }
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
        `This barcode is already assigned to Rs {duplicateBarcode.productName}. Open that item to update it.`,
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
    Alert.alert('Delete product', `Remove Rs {product.productName} from saved prices?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (foundProduct?.id === product.id) {
            setShowFoundProduct(false);
            setFoundProduct(null);
          }
          deleteProductPrice(product.id);
        },
      },
    ]);
  };

  const highlightProduct = (product) => {
    setSearchQuery(product.productName);
    setShowFoundProduct(false);
    setFoundProduct(null);
  };

  const renderItem = ({ item, index }) => {
    const profit = item.salePrice - item.purchasePrice;
    const isProfit = profit >= 0;
    const marginPercent = item.salePrice > 0 ? ((profit / item.salePrice) * 100).toFixed(1) : 0;
    const isHighlighted = foundProduct?.id === item.id && showFoundProduct;

    return (
      <Animated.View 
        style={[
          styles.productCard,
          isHighlighted && styles.productCardHighlighted,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              ...(isHighlighted ? [{ scale: foundProductAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
              })}] : [])
            ]
          }
        ]}
      >
        {isHighlighted && (
          <View style={styles.foundBadge}>
            <MaterialCommunityIcons name="barcode-scan" size={14} color={COLORS.white} />
            <Text style={styles.foundBadgeText}>Found via scan</Text>
          </View>
        )}
        
        <View style={styles.productTopRow}>
          <View style={styles.productInfo}>
            <View style={styles.productNameRow}>
              <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
              <View style={[styles.marginBadge, isProfit ? styles.marginPositive : styles.marginNegative]}>
                <Text style={[styles.marginText, { color: isProfit ? COLORS.success : COLORS.error }]}>
                  {isProfit ? '+' : ''}{marginPercent}%
                </Text>
              </View>
            </View>
            {item.barcode ? (
              <View style={styles.barcodeRow}>
                <MaterialCommunityIcons name="barcode" size={14} color={isHighlighted ? COLORS.accent : COLORS.muted} />
                <Text style={[styles.barcodeText, isHighlighted && styles.barcodeTextHighlighted]}>
                  {item.barcode}
                </Text>
              </View>
            ) : (
              <Text style={styles.noBarcode}>No barcode</Text>
            )}
          </View>
        </View>

        <View style={styles.priceGrid}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Cost</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.purchasePrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Sale</Text>
            <Text style={styles.priceValue}>{formatCurrency(item.salePrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Profit</Text>
            <Text style={[styles.priceValue, { color: isProfit ? COLORS.success : COLORS.error }]}>
              {isProfit ? '+' : ''}{formatCurrency(profit)}
            </Text>
          </View>
        </View>

        {item.notes ? (
          <View style={styles.notesContainer}>
            <MaterialCommunityIcons name="note-text-outline" size={14} color={COLORS.muted} />
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditProduct(item)} style={styles.editBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.accent} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => openScanner('find')} 
            style={styles.findBtn}
          >
            <MaterialCommunityIcons name="barcode-scan" size={16} color={COLORS.primary} />
            <Text style={styles.findBtnText}>Find</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteBtnText}>Delete</Text>
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: 80 }}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerIconWrap}>
                  <MaterialCommunityIcons name="barcode-scan" size={28} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.title}>Product Prices</Text>
                  <Text style={styles.subtitle}>Manage your product catalog</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={openAddProduct} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => openScanner('add')} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="barcode-scan" size={20} color={COLORS.accent} />
                  <Text style={styles.secondaryBtnText}>Scan to Add</Text>
                </TouchableOpacity>
              </View>

              {/* Find Product by Barcode Button */}
              <TouchableOpacity 
                style={styles.findProductBtn}
                onPress={() => openScanner('find')}
                activeOpacity={0.8}
              >
                <View style={styles.findProductIcon}>
                  <MaterialCommunityIcons name="magnify" size={24} color={COLORS.white} />
                </View>
                <View style={styles.findProductTextWrap}>
                  <Text style={styles.findProductTitle}>Find Product by Barcode</Text>
                  <Text style={styles.findProductSubtitle}>Scan a barcode to quickly locate a product</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              {/* Quick Stats in Header */}
              <View style={styles.headerStats}>
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatValue}>{stats.totalProducts}</Text>
                  <Text style={styles.headerStatLabel}>Products</Text>
                </View>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatValue}>{stats.barcodeLinked}</Text>
                  <Text style={styles.headerStatLabel}>With Barcode</Text>
                </View>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <Text style={styles.headerStatValue}>{formatCurrency(stats.averageMargin)}</Text>
                  <Text style={styles.headerStatLabel}>Avg. Margin</Text>
                </View>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={22} color={COLORS.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or barcode..."
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setShowFoundProduct(false);
                  setFoundProduct(null);
                }}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={COLORS.muted} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => openScanner('find')}>
                  <MaterialCommunityIcons name="barcode-scan" size={22} color={COLORS.accent} />
                </TouchableOpacity>
              )}
            </View>

            {filteredProducts.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Saved Products ({filteredProducts.length})
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color={COLORS.accent} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching products' : 'No products saved yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try a different search term or clear the search.'
                : 'Add products manually or scan a barcode to start building your price list.'}
            </Text>
            {!searchQuery && (
              <View style={styles.emptyActions}>
                <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddProduct} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
                  <Text style={styles.emptyAddText}>Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.emptyScanBtn} 
                  onPress={() => openScanner('find')} 
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="barcode-scan" size={20} color={COLORS.accent} />
                  <Text style={styles.emptyScanText}>Find by Barcode</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />

      {/* Product Form Modal */}
      <Modal visible={formVisible} animationType="slide" transparent onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Drag indicator */}
              <View style={styles.dragIndicator} />
              
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconWrap}>
                    <MaterialCommunityIcons 
                      name={editingProduct ? 'pencil-circle' : 'plus-circle'} 
                      size={28} 
                      color={COLORS.accent} 
                    />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'New Product'}</Text>
                    <Text style={styles.modalSubtitle}>Save price and barcode for easy reuse</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.fieldGroup}>
                  <View style={styles.fieldHeader}>
                    <MaterialCommunityIcons name="tag-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.fieldLabel}>Product Name *</Text>
                  </View>
                  <TextInput
                    value={form.productName}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, productName: value }))}
                    placeholder="e.g. Wheat Flour, Rice Bag"
                    placeholderTextColor={COLORS.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.fieldHeader}>
                    <MaterialCommunityIcons name="barcode" size={16} color={COLORS.accent} />
                    <Text style={styles.fieldLabel}>Barcode</Text>
                  </View>
                  <View style={styles.barcodeInputRow}>
                    <TextInput
                      value={form.barcode}
                      onChangeText={(value) => setForm((prev) => ({ ...prev, barcode: value }))}
                      placeholder="Scan or type barcode"
                      placeholderTextColor={COLORS.muted}
                      style={[styles.input, styles.barcodeInput]}
                      autoCapitalize="none"
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity 
                      style={styles.scanInlineBtn}
                      onPress={() => {
                        setFormVisible(false);
                        setTimeout(() => openScanner('add'), 300);
                      }}
                    >
                      <MaterialCommunityIcons name="barcode-scan" size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceRowInput}>
                  <View style={styles.halfField}>
                    <View style={styles.fieldHeader}>
                      <MaterialCommunityIcons name="arrow-down-circle" size={16} color={COLORS.warning} />
                      <Text style={styles.fieldLabel}>Cost Price *</Text>
                    </View>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.currencySymbol}>Rs</Text>
                      <TextInput
                        value={form.purchasePrice}
                        onChangeText={(value) => setForm((prev) => ({ ...prev, purchasePrice: value }))}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.muted}
                        style={styles.priceInput}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.halfField}>
                    <View style={styles.fieldHeader}>
                      <MaterialCommunityIcons name="arrow-up-circle" size={16} color={COLORS.success} />
                      <Text style={styles.fieldLabel}>Sale Price *</Text>
                    </View>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.currencySymbol}>Rs</Text>
                      <TextInput
                        value={form.salePrice}
                        onChangeText={(value) => setForm((prev) => ({ ...prev, salePrice: value }))}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.muted}
                        style={styles.priceInput}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.fieldHeader}>
                    <MaterialCommunityIcons name="note-text-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.fieldLabel}>Notes (Optional)</Text>
                  </View>
                  <TextInput
                    value={form.notes}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                    placeholder="Add any additional notes..."
                    placeholderTextColor={COLORS.muted}
                    style={[styles.input, styles.notesInput]}
                    multiline
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>Save Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Scanner Modal */}
      <Modal 
        visible={scannerVisible} 
        animationType="slide" 
        transparent={false} 
        onRequestClose={() => {
          setScannerVisible(false);
          setScanned(false);
          setScanning(true);
        }}
      >
        <View style={styles.scannerScreen}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => {
              setScannerVisible(false);
              setScanned(false);
              setScanning(true);
            }} style={styles.scannerCloseBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.scannerHeaderText}>
              <Text style={styles.scannerTitle}>
                {scannerMode === 'find' ? 'Find Product' : 'Add Product'}
              </Text>
              <Text style={styles.scannerSubtitle}>
                {scannerMode === 'find' 
                  ? 'Scan to search for existing product' 
                  : 'Point camera at a product barcode'}
              </Text>
            </View>
            {scanned && (
              <TouchableOpacity 
                style={styles.rescanBtn}
                onPress={() => {
                  setScanned(false);
                  setScanning(true);
                }}
              >
                <Text style={styles.rescanText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.scannerFrame}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'ean13', 'ean8', 'upc_a', 'upc_e', 
                    'code128', 'code39', 'code93', 'codabar',
                    'itf14', 'pdf417', 'aztec', 'qr'
                  ],
                }}
                onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
              />
            ) : (
              <View style={styles.permissionState}>
                <MaterialCommunityIcons name="camera-off" size={64} color="rgba(255,255,255,0.5)" />
                <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
                <Text style={styles.permissionText}>Allow camera access to scan product barcodes</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={() => openScanner(scannerMode)}>
                  <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Scanner Overlay */}
            <View style={styles.scanOverlayTop}>
              <Text style={styles.scanOverlayText}>
                {scannerMode === 'find' ? 'Scan to find product' : 'Align barcode within frame'}
              </Text>
            </View>
            <View style={styles.scanOverlayBottom}>
              <View style={styles.scanModeIndicator}>
                <MaterialCommunityIcons 
                  name={scannerMode === 'find' ? 'magnify' : 'plus-circle'} 
                  size={20} 
                  color={COLORS.accent} 
                />
                <Text style={styles.scanModeText}>
                  {scannerMode === 'find' ? 'Search Mode' : 'Add Mode'}
                </Text>
              </View>
            </View>
            
            {/* Scan Box with animated line */}
            <View style={styles.scanBox}>
              <View style={[styles.scanBoxCorner, styles.topLeft]} />
              <View style={[styles.scanBoxCorner, styles.topRight]} />
              <View style={[styles.scanBoxCorner, styles.bottomLeft]} />
              <View style={[styles.scanBoxCorner, styles.bottomRight]} />
              
              {scanning && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineTranslate }] }
                  ]} 
                />
              )}
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
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: THEME.fonts.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: THEME.fonts.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: THEME.fonts.md,
  },
  findProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    padding: THEME.spacing.md,
    backgroundColor: 'rgba(196,154,108,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.3)',
  },
  findProductIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findProductTextWrap: {
    flex: 1,
  },
  findProductTitle: {
    color: COLORS.white,
    fontSize: THEME.fonts.md,
    fontWeight: '700',
  },
  findProductSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: THEME.fonts.xs,
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    borderRadius: 16,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: THEME.fonts.md,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerStatLabel: {
    fontSize: THEME.fonts.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '600',
  },
  headerStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: THEME.spacing.md,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.06)',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: THEME.fonts.md,
  },
  sectionHeader: {
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyState: {
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.xl,
    padding: THEME.spacing.xl,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(196,154,108,0.2)',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: THEME.spacing.lg,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  emptyAddBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: THEME.fonts.sm,
  },
  emptyScanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(196,154,108,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.3)',
  },
  emptyScanText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: THEME.fonts.sm,
  },
  productCard: {
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
    ...THEME.elevation.subtle,
  },
  productCardHighlighted: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(196,154,108,0.03)',
  },
  foundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: THEME.spacing.sm,
  },
  foundBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  productTopRow: {
    marginBottom: THEME.spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  barcodeTextHighlighted: {
    color: COLORS.accent,
  },
  noBarcode: {
    color: COLORS.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(11,19,32,0.04)',
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceDivider: {
    width: 1,
    backgroundColor: 'rgba(11,19,32,0.06)',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,19,32,0.04)',
  },
  notes: {
    flex: 1,
    color: COLORS.muted,
    fontSize: THEME.fonts.sm,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: THEME.spacing.xs,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(196,154,108,0.08)',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.15)',
  },
  editBtnText: {
    fontWeight: '700',
    color: COLORS.accent,
    fontSize: THEME.fonts.sm,
  },
  findBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,36,0.06)',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.1)',
  },
  findBtnText: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: THEME.fonts.sm,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(198,40,40,0.06)',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.1)',
  },
  deleteBtnText: {
    fontWeight: '700',
    color: COLORS.error,
    fontSize: THEME.fonts.sm,
  },
  // Modal Styles
  modalFlex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11,19,32,0.5)',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: THEME.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
    ...THEME.elevation.strong,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(11,19,32,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,19,32,0.06)',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: THEME.fonts.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11,19,32,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: THEME.spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: THEME.fonts.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(11,19,32,0.04)',
    paddingHorizontal: THEME.spacing.md,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: 'transparent',
    fontSize: THEME.fonts.md,
  },
  barcodeInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanInlineBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.2)',
  },
  priceRowInput: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  halfField: {
    flex: 1,
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencySymbol: {
    fontSize: THEME.fonts.md,
    color: COLORS.muted,
    fontWeight: '600',
    paddingLeft: 16,
  },
  priceInput: {
    flex: 1,
    padding: 16,
    color: COLORS.text,
    fontSize: THEME.fonts.md,
    fontWeight: '500',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: THEME.spacing.md,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,19,32,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.08)',
  },
  cancelBtnText: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: THEME.fonts.md,
  },
  saveBtn: {
    flex: 2,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: THEME.fonts.md,
  },
  // Scanner Styles
  scannerScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    paddingTop: 20,
    paddingHorizontal: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    backgroundColor: '#000',
  },
  scannerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  rescanBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
  },
  rescanText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  scannerFrame: {
    flex: 1,
    margin: THEME.spacing.md,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
  },
  scanOverlayTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  scanOverlayText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  scanOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '25%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  scanModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(196,154,108,0.3)',
  },
  scanModeText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  scanBox: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '25%',
  },
  scanBoxCorner: {
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
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
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
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: THEME.spacing.lg,
    backgroundColor: COLORS.white,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionBtnText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: THEME.fonts.md,
  },
});