import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import GlassCard from './GlassCard';
import { COLORS, THEME } from '../config/colors';

export const EntryForm = ({ 
  visible, 
  onClose, 
  onSubmit, 
  editData = null,
  itemCount = 0 
}) => {
  const [itemName, setItemName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  useEffect(() => {
    if (editData) {
      setItemName(editData.itemName);
      setPurchasePrice(editData.purchasePrice.toString());
      setSalePrice(editData.salePrice.toString());
    } else {
      setItemName(`Item ${itemCount + 1}`);
      setPurchasePrice('');
      setSalePrice('');
    }
  }, [editData, visible, itemCount]);

  const handleSubmit = () => {
    if (!purchasePrice || !salePrice) {
      alert('Please fill in all fields');
      return;
    }

    onSubmit({
      itemName,
      purchasePrice: parseFloat(purchasePrice),
      salePrice: parseFloat(salePrice),
    });

    setItemName('');
    setPurchasePrice('');
    setSalePrice('');
  };

  const handleClose = () => {
    setItemName('');
    setPurchasePrice('');
    setSalePrice('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <GlassCard style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {editData ? 'Edit Entry' : 'Add New Entry'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                value={itemName}
                onChangeText={setItemName}
                placeholderTextColor={COLORS.dim}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Price (Cost)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.dim}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sale Price</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="decimal-pad"
                placeholderTextColor={COLORS.dim}
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelBtn]}
                onPress={handleClose}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitBtn]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitBtnText}>
                  {editData ? 'Update' : 'Add Entry'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: THEME.spacing.lg,
  },
  formContainer: {
    borderTopLeftRadius: THEME.borderRadius.large,
    borderTopRightRadius: THEME.borderRadius.large,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.large,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    fontSize: 22,
    color: COLORS.dim,
  },
  inputGroup: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.dim,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(3,48,67,0.06)',
    borderRadius: THEME.borderRadius.small,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fonts.regular,
    color: COLORS.text,
    backgroundColor: COLORS.glassMuted,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: THEME.spacing.md,
    marginTop: THEME.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.glassMuted,
  },
  cancelBtnText: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
  },
  submitBtnText: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
