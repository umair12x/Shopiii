import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { AppIcon as MaterialCommunityIcons } from './AppIcon';
import { COLORS, THEME } from '../config/colors';

const { height } = Dimensions.get('window');

export const EntryForm = ({ visible, onClose, onSubmit, editData = null }) => {
  // For the simplified flow we collect daily totals
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (editData) {
      setPurchasePrice(String(editData.purchasePrice || ''));
      setSalePrice(String(editData.salePrice || ''));
    } else {
      setPurchasePrice('');
      setSalePrice('');
    }
  }, [editData, visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(formScale, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = () => {
    if (purchasePrice === '' || salePrice === '') {
      alert('Please enter totals for purchases and sales');
      return;
    }
    
    // Quick success animation before closing
    Animated.sequence([
      Animated.timing(formScale, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(formScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      onSubmit({ purchasePrice: parseFloat(purchasePrice), salePrice: parseFloat(salePrice) });
      setPurchasePrice('');
      setSalePrice('');
      handleClose();
    }, 200);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPurchasePrice('');
      setSalePrice('');
      setFocusedField(null);
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={styles.backdropTouch} onPress={handleClose} activeOpacity={1} />
          
          <Animated.View style={[
            styles.form,
            {
              transform: [
                { translateY: slideAnim },
                { scale: formScale }
              ],
            }
          ]}>
            {/* Decorative top bar */}
            <View style={styles.dragIndicator} />
            
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons 
                    name={editData ? 'pencil-circle' : 'plus-circle'} 
                    size={28} 
                    color={COLORS.accent} 
                  />
                </View>
                <View>
                  <Text style={styles.title}>{editData ? 'Edit Daily Totals' : 'New Daily Totals'}</Text>
                  <Text style={styles.headerSubtext}>
                    {editData ? 'Update today\'s record' : 'Add today\'s purchases and sales'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close form">
                <MaterialCommunityIcons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {/* Item Name Field */}
              {/* We no longer collect item name — this form captures daily totals */}

              {/* Price Fields */}
              <View style={styles.pricesRow}>
                <View style={[styles.fieldWrapper, styles.priceField]}>
                  <View style={styles.fieldHeader}>
                    <MaterialCommunityIcons name="arrow-down-circle" size={16} color={COLORS.warning} />
                    <Text style={styles.label}>Total Purchases</Text>
                  </View>
                  <View style={[
                    styles.priceInputWrap,
                    focusedField === 'purchase' && styles.inputFocused
                  ]}>
                    <Text style={styles.currencySymbol}>Rs</Text>
                    <TextInput 
                      style={styles.priceInput} 
                      value={purchasePrice} 
                      onChangeText={setPurchasePrice} 
                      keyboardType="numeric" 
                      placeholder="0.00" 
                      placeholderTextColor={COLORS.muted}
                      onFocus={() => setFocusedField('purchase')}
                      onBlur={() => setFocusedField(null)}
                      selectionColor={COLORS.accent}
                    />
                  </View>
                </View>

                <View style={styles.priceDivider}>
                  <View style={styles.dividerLine} />
                </View>

                <View style={[styles.fieldWrapper, styles.priceField]}>
                  <View style={styles.fieldHeader}>
                    <MaterialCommunityIcons name="arrow-up-circle" size={16} color={COLORS.success} />
                    <Text style={styles.label}>Total Sales</Text>
                  </View>
                  <View style={[
                    styles.priceInputWrap,
                    focusedField === 'sale' && styles.inputFocused
                  ]}>
                    <Text style={styles.currencySymbol}>Rs</Text>
                    <TextInput 
                      style={styles.priceInput} 
                      value={salePrice} 
                      onChangeText={setSalePrice} 
                      keyboardType="numeric" 
                      placeholder="0.00" 
                      placeholderTextColor={COLORS.muted}
                      onFocus={() => setFocusedField('sale')}
                      onBlur={() => setFocusedField(null)}
                      selectionColor={COLORS.accent}
                    />
                  </View>
                </View>
              </View>

            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                onPress={handleClose} 
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={18} color={COLORS.muted} />
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSubmit} 
                style={[styles.submitBtn, (purchasePrice === '' || salePrice === '') && styles.submitBtnDisabled]}
                activeOpacity={0.7}
                disabled={purchasePrice === '' || salePrice === ''}
              >
                <MaterialCommunityIcons 
                  name={editData ? 'content-save' : 'plus-circle'} 
                  size={20} 
                  color={COLORS.white} 
                />
                <Text style={styles.submitText}>
                  {editData ? 'Update Totals' : 'Save Totals'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(11,19,32,0.5)', 
    justifyContent: 'flex-end' 
  },
  backdropTouch: {
    flex: 1,
  },
  form: { 
    backgroundColor: COLORS.surface, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    ...THEME.elevation.strong,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(11,19,32,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,19,32,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(196,154,108,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { 
    fontSize: THEME.fonts.xl, 
    color: COLORS.text, 
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtext: {
    fontSize: THEME.fonts.sm,
    color: COLORS.muted,
    marginTop: 2,
  },
  closeBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11,19,32,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    maxHeight: 400,
  },
  fieldWrapper: { 
    marginBottom: THEME.spacing.lg 
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: { 
    fontSize: THEME.fonts.sm, 
    color: COLORS.text, 
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: { 
    backgroundColor: 'rgba(11,19,32,0.04)', 
    padding: 16,
    borderRadius: 16,
    color: COLORS.text,
    fontSize: THEME.fonts.md,
    fontWeight: '500',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(196,154,108,0.05)',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  priceField: {
    flex: 1,
  },
  priceDivider: {
    paddingTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerLine: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(11,19,32,0.08)',
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
  actions: { 
    flexDirection: 'row', 
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    gap: 12,
  },
  cancelBtn: { 
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8,
    backgroundColor: 'rgba(11,19,32,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(11,19,32,0.08)',
  },
  cancelText: { 
    color: COLORS.muted, 
    fontWeight: '700',
    fontSize: THEME.fonts.md,
  },
  submitBtn: { 
    flex: 2,
    paddingVertical: 16,
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
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: { 
    color: COLORS.white, 
    fontWeight: '800',
    fontSize: THEME.fonts.md,
  },
});