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

export const EntryForm = ({ visible, onClose, onSubmit, editData = null, itemCount = 0 }) => {
  const [itemName, setItemName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  useEffect(() => {
    if (editData) {
      setItemName(editData.itemName);
      setPurchasePrice(String(editData.purchasePrice || ''));
      setSalePrice(String(editData.salePrice || ''));
    } else {
      setItemName(`Item ${itemCount + 1}`);
      setPurchasePrice('');
      setSalePrice('');
    }
  }, [editData, visible, itemCount]);

  const handleSubmit = () => {
    if (!purchasePrice || !salePrice) {
      alert('Please add prices');
      return;
    }
    onSubmit({ itemName, purchasePrice: parseFloat(purchasePrice), salePrice: parseFloat(salePrice) });
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.form}>
            <View style={styles.header}>
              <Text style={styles.title}>{editData ? 'Edit Entry' : 'Add Entry'}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.close}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Item name</Text>
              <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="Item name" placeholderTextColor={COLORS.muted} />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Cost</Text>
                <TextInput style={styles.input} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.muted} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Sale</Text>
                <TextInput style={styles.input} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.muted} />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleClose} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={[styles.btn, styles.btnPrimary]}><Text style={styles.btnPrimaryText}>{editData ? 'Update' : 'Add'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(11,19,32,0.35)', justifyContent: 'flex-end' },
  form: { backgroundColor: COLORS.surface, padding: THEME.spacing.lg, borderTopLeftRadius: THEME.borderRadius.lg, borderTopRightRadius: THEME.borderRadius.lg, ...THEME.elevation.soft },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.spacing.md },
  title: { fontSize: THEME.fonts.lg, color: COLORS.text, fontWeight: '700' },
  close: { padding: 6 },
  closeText: { fontSize: 18, color: COLORS.muted },
  field: { marginBottom: THEME.spacing.md },
  fieldRow: { flexDirection: 'row', gap: THEME.spacing.sm, marginBottom: THEME.spacing.md },
  fieldHalf: { flex: 1 },
  label: { fontSize: THEME.fonts.sm, color: COLORS.muted, marginBottom: 6 },
  input: { backgroundColor: 'rgba(11,19,32,0.03)', padding: THEME.spacing.sm, borderRadius: THEME.borderRadius.sm, color: COLORS.text },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: THEME.spacing.sm },
  btn: { flex: 1, paddingVertical: 12, borderRadius: THEME.borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(11,19,32,0.06)', marginRight: THEME.spacing.sm },
  btnGhostText: { color: COLORS.muted, fontWeight: '700' },
  btnPrimary: { backgroundColor: COLORS.accent, marginLeft: THEME.spacing.sm },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700' },
});
