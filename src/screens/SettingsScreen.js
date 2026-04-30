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
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your shop details</Text>
        </View>

        {/* Shop Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏪 Shop Information</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editToggleBtn}
            >
              <Text style={styles.editToggleBtnText}>
                {isEditing ? '✓ Done' : '✎ Edit'}
              </Text>
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
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ App Information</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Built with</Text>
            <Text style={styles.infoValue}>React Native + Expo</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Storage</Text>
            <Text style={styles.infoValue}>AsyncStorage (Local)</Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Regularly check your analytics to track business performance
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Mark payments as "Collected" to keep track of cash flow
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • View account history to reconcile with previous records
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • All data is stored locally on your device for security
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
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  header: {
     paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fonts.xl,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fonts.regular,
    color: COLORS.light,
  },
  section: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  editToggleBtn: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: COLORS.secondary,
    borderRadius: THEME.borderRadius.small,
  },
  editToggleBtnText: {
    fontSize: THEME.fonts.small,
    fontWeight: '600',
    color: COLORS.white,
  },
  formGroup: {
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
    minHeight: 44,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.small,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  saveBtnText: {
    fontSize: THEME.fonts.large,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  infoCard: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: THEME.fonts.regular,
    fontWeight: '600',
    color: COLORS.dark,
  },
  infoValue: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
  },
  tipCard: {
    backgroundColor: COLORS.light,
    borderRadius: THEME.borderRadius.medium,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  tipText: {
    fontSize: THEME.fonts.regular,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
});
