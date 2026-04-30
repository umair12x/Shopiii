import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DataContext } from '../context/DataContext';
import { COLORS, THEME } from '../config/colors';

export const SettingsScreen = ({ navigation }) => {
  const { shopDetails, updateShopDetails } = useContext(DataContext);
  const [shopName, setShopName] = useState(shopDetails.name);
  const [ownerName, setOwnerName] = useState(shopDetails.owner);
  const [address, setAddress] = useState(shopDetails.address);
  const [contact, setContact] = useState(shopDetails.contact);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    if (!shopName || !ownerName || !address || !contact) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    await updateShopDetails({
      name: shopName,
      owner: ownerName,
      address: address,
      contact: contact,
    });

    Alert.alert('Success', 'Shop details updated successfully');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={COLORS.white} />
            <Text style={styles.title}>Settings</Text>
          </View>
          <Text style={styles.subtitle}>Manage your shop details</Text>
        </View>

        {/* Shop Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="storefront-outline" size={20} color={COLORS.text} />
              <Text style={styles.sectionTitle}>Shop Information</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editToggleBtn}
            >
              <MaterialCommunityIcons
                name={isEditing ? 'check' : 'pencil'}
                size={16}
                color={COLORS.white}
              />
              <Text style={styles.editToggleBtnText}>{isEditing ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? COLORS.white : COLORS.lightGray }]}
              value={shopName}
              onChangeText={setShopName}
              editable={isEditing}
              placeholder="Enter shop name"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Owner Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? COLORS.white : COLORS.lightGray }]}
              value={ownerName}
              onChangeText={setOwnerName}
              editable={isEditing}
              placeholder="Enter owner name"
              placeholderTextColor={COLORS.gray}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? COLORS.white : COLORS.lightGray }]}
              value={address}
              onChangeText={setAddress}
              editable={isEditing}
              placeholder="Enter shop address"
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isEditing ? COLORS.white : COLORS.lightGray }]}
              value={contact}
              onChangeText={setContact}
              editable={isEditing}
              placeholder="Enter contact number"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
            />
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <MaterialCommunityIcons name="content-save-outline" size={18} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.text} />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="tag-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="laptop" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Built with</Text>
              <Text style={styles.infoValue}>React Native + Expo</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="database-outline" size={18} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Storage</Text>
              <Text style={styles.infoValue}>AsyncStorage (Local)</Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={COLORS.text} />
            <Text style={styles.sectionTitle}>Tips</Text>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="chart-line" size={18} color={COLORS.accent} />
            <Text style={styles.tipText}>
              Regularly check your analytics to track business performance
            </Text>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.tipText}>
              Mark payments as "Collected" to keep track of cash flow
            </Text>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="history" size={18} color={COLORS.accent} />
            <Text style={styles.tipText}>
              View account history to reconcile with previous records
            </Text>
          </View>

          <View style={styles.tipCard}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={COLORS.accent} />
            <Text style={styles.tipText}>
              All data is stored locally on your device for security
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: { flex: 1 },
  header: {
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: THEME.fonts.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  editToggleBtn: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: COLORS.secondary,
    borderRadius: THEME.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editToggleBtnText: {
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  formGroup: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: THEME.fonts.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: THEME.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fonts.md,
    color: COLORS.black,
    minHeight: 44,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: THEME.fonts.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoValue: {
    fontSize: THEME.fonts.md,
    color: COLORS.darkGray,
  },
  tipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipText: {
    fontSize: THEME.fonts.md,
    color: COLORS.darkGray,
    lineHeight: 20,
    flex: 1,
  },
});
