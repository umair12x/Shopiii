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
            <MaterialCommunityIcons name="cog" size={28} color={COLORS.white} />
            <View>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Manage your shop details</Text>
            </View>
          </View>
        </View>

        {/* Shop Details Section */}
        <View style={styles.sectionWrapper}>
          <View style={[styles.sectionBackground, { backgroundColor: COLORS.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconWrapper}>
                  <MaterialCommunityIcons name="storefront" size={20} color={COLORS.white} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Shop Information</Text>
                  <Text style={styles.sectionDesc}>Configure your business details</Text>
                </View>
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

            <View style={styles.formContent}>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="store" size={18} color={COLORS.primary} />
                  <Text style={styles.label}>Shop Name</Text>
                </View>
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
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
                  <Text style={styles.label}>Owner Name</Text>
                </View>
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
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={COLORS.primary} />
                  <Text style={styles.label}>Address</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.addressInput, { backgroundColor: isEditing ? COLORS.white : COLORS.lightGray }]}
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
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="phone" size={18} color={COLORS.primary} />
                  <Text style={styles.label}>Contact Number</Text>
                </View>
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
                  <MaterialCommunityIcons name="content-save" size={18} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* App Information Section */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionBackground}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrapper}>
                <MaterialCommunityIcons name="information" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.sectionTitle}>About App</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <MaterialCommunityIcons name="tag" size={18} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>App Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <MaterialCommunityIcons name="laptop" size={18} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Built with</Text>
                <Text style={styles.infoValue}>React Native + Expo</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrapper}>
                <MaterialCommunityIcons name="database" size={18} color={COLORS.white} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Storage</Text>
                <Text style={styles.infoValue}>AsyncStorage (Local)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionBackground}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconWrapper}>
                <MaterialCommunityIcons name="lightbulb" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.sectionTitle}>Pro Tips</Text>
            </View>

            <View style={styles.tipsList}>
              <View style={styles.tipCard}>
                <View style={styles.tipIconWrapper}>
                  <MaterialCommunityIcons name="chart-line" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.tipText}>
                  Regularly check analytics to track business performance
                </Text>
              </View>

              <View style={styles.tipCard}>
                <View style={styles.tipIconWrapper}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.success} />
                </View>
                <Text style={styles.tipText}>
                  Mark payments as "Collected" to track cash flow
                </Text>
              </View>

              <View style={styles.tipCard}>
                <View style={styles.tipIconWrapper}>
                  <MaterialCommunityIcons name="history" size={18} color={COLORS.warning} />
                </View>
                <Text style={styles.tipText}>
                  View account history to reconcile with previous records
                </Text>
              </View>

              <View style={[styles.tipCard, { marginBottom: 0 }]}>
                <View style={styles.tipIconWrapper}>
                  <MaterialCommunityIcons name="shield-check" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.tipText}>
                  All data is stored locally on your device for security
                </Text>
              </View>
            </View>
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
    paddingVertical: THEME.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: THEME.fonts.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: THEME.spacing.xs,
  },
  sectionWrapper: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  sectionBackground: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    flex: 1,
  },
  sectionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionDesc: {
    fontSize: THEME.fonts.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  editToggleBtn: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editToggleBtnText: {
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  formContent: {
    marginTop: THEME.spacing.lg,
  },
  formGroup: {
    marginBottom: THEME.spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  label: {
    fontSize: THEME.fonts.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fonts.md,
    color: COLORS.text,
    minHeight: 44,
  },
  addressInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: THEME.fonts.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: THEME.fonts.sm,
    fontWeight: '600',
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: THEME.fonts.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: THEME.spacing.sm,
  },
  tipsList: {
    marginTop: THEME.spacing.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
  },
  tipIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 36, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipText: {
    fontSize: THEME.fonts.md,
    color: COLORS.text,
    lineHeight: 20,
    flex: 1,
    fontWeight: '500',
  },
});
