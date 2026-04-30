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
          <View style={styles.formContainer}>
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
                placeholderTextColor={COLORS.gray}
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
                placeholderTextColor={COLORS.gray}
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
                placeholderTextColor={COLORS.gray}
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
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: THEME.borderRadius.large,
    borderTopRightRadius: THEME.borderRadius.large,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeBtn: {
    fontSize: 24,
    color: COLORS.gray,
  },
  inputGroup: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: THEME.borderRadius.small,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fonts.regular,
    color: COLORS.black,
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
    backgroundColor: COLORS.lightGray,
  },
  cancelBtnText: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
  },
  submitBtnText: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.white,
  },
});
