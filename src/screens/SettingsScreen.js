import React, { useContext, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AppIcon as MaterialCommunityIcons } from "../components/AppIcon";
import { DataContext } from "../context/DataContext";
import { COLORS, THEME } from "../config/colors";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Shop Avatar with Gradient Ring ───
const ShopAvatar = ({ name, size = 80 }) => {
  const initial = name?.charAt(0)?.toUpperCase() || "S";
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.avatarContainer}>
      <Animated.View
        style={[
          styles.avatarRing,
          {
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <View
        style={[
          styles.avatarInner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
          {initial}
        </Text>
      </View>
    </View>
  );
};

// ─── Floating Label Input ───
const FloatingInput = ({
  label,
  icon,
  value,
  onChangeText,
  editable,
  multiline,
  keyboardType,
  placeholder,
  delay = 0,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [fadeAnim, slideAnim, delay]);

  const labelActive = isFocused || value?.length > 0;

  return (
    <Animated.View
      style={[
        styles.floatWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.floatHeader}>
        <View
          style={[
            styles.floatIconWrap,
            {
              backgroundColor: editable
                ? `${COLORS.accent}15`
                : "rgba(11,19,32,0.04)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={editable ? COLORS.accent : COLORS.muted}
          />
        </View>
        <Animated.Text
          style={[
            styles.floatLabel,
            {
              fontSize: labelActive ? 11 : 14,
              top: labelActive ? -6 : 14,
              color: editable
                ? isFocused
                  ? COLORS.accent
                  : COLORS.muted
                : COLORS.muted,
            },
          ]}
        >
          {label}
        </Animated.Text>
      </View>

      <TextInput
        style={[
          styles.floatInput,
          multiline && styles.floatInputMultiline,
          editable && styles.floatInputEditable,
          isFocused && editable && styles.floatInputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        placeholder={editable ? placeholder : ""}
        placeholderTextColor={COLORS.gray}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </Animated.View>
  );
};

// ─── Action Card with Gradient ───
const ActionCard = ({ icon, title, desc, color, onPress, delay = 0 }) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [scale, opacity, delay]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.actionCard,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.actionGradient, { backgroundColor: `${color}12` }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={icon} size={22} color={COLORS.white} />
          </View>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDesc} numberOfLines={2}>
            {desc}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Info Row ───
const InfoRow = ({ icon, label, value, color }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoRowIcon, { backgroundColor: `${color}12` }]}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
    </View>
    <View style={styles.infoRowText}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  </View>
);

// ═══════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════
export const SettingsScreen = ({ navigation }) => {
  const { shopDetails, updateShopDetails } = useContext(DataContext);
  const tabBarHeight = useBottomTabBarHeight();
  const [shopName, setShopName] = useState(shopDetails.name);
  const [ownerName, setOwnerName] = useState(shopDetails.owner);
  const [address, setAddress] = useState(shopDetails.address);
  const [contact, setContact] = useState(shopDetails.contact);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const formExpand = useRef(new Animated.Value(0)).current;
  const saveBtnSlide = useRef(new Animated.Value(100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerFade, headerSlide]);

  // Edit mode animation
  useEffect(() => {
    if (isEditing) {
      Animated.parallel([
        Animated.timing(formExpand, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(saveBtnSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(formExpand, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(saveBtnSlide, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isEditing, formExpand, saveBtnSlide]);

  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSave = useCallback(async () => {
    if (!shopName || !ownerName || !address || !contact) {
      triggerShake();
      Alert.alert("Missing Fields", "Please fill in all fields to save.");
      return;
    }

    await updateShopDetails({
      name: shopName,
      owner: ownerName,
      address: address,
      contact: contact,
    });

    setSavedAt(new Date());
    setIsEditing(false);

    // Success animation
    Animated.sequence([
      Animated.spring(successScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(successScale, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    Alert.alert("Saved", "Shop details updated successfully.");
  }, [shopName, ownerName, address, contact, updateShopDetails, triggerShake, successScale]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + THEME.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: tabBarHeight + 8 }}
        contentInsetAdjustmentBehavior="automatic"
        decelerationRate="normal"
        bounces={true}
        keyboardDismissMode="interactive"
      >
        {/* ═══ PROFILE HEADER ═══ */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.profileTop}>
            <ShopAvatar name={shopName} size={72} />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>
                {shopName || "Your Shop"}
              </Text>
              <Text style={styles.profileOwner}>by {ownerName || "Owner"}</Text>
              <View style={styles.profileStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>

          {savedAt && (
            <Text style={styles.lastSaved}>
              Last updated {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          )}
        </Animated.View>

        {/* ═══ EDIT TOGGLE ═══ */}
        <View style={styles.editBar}>
          <Text style={styles.editBarLabel}>
            {isEditing ? "Editing Profile" : "Business Profile"}
          </Text>
          <TouchableOpacity
            style={[
              styles.editBarBtn,
              isEditing && styles.editBarBtnActive,
            ]}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isEditing ? "close" : "pencil"}
              size={16}
              color={isEditing ? COLORS.error : COLORS.white}
            />
            <Text
              style={[
                styles.editBarBtnText,
                isEditing && { color: COLORS.error },
              ]}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══ FORM CARD ═══ */}
        <Animated.View
          style={[
            styles.formCard,
            {
              transform: [
                {
                  translateY: formExpand.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
            },
          ]}
        >
          <FloatingInput
            label="Shop Name"
            icon="store-outline"
            value={shopName}
            onChangeText={setShopName}
            editable={isEditing}
            placeholder="Enter shop name"
            delay={100}
          />

          <FloatingInput
            label="Owner Name"
            icon="account-outline"
            value={ownerName}
            onChangeText={setOwnerName}
            editable={isEditing}
            placeholder="Enter owner name"
            delay={150}
          />

          <FloatingInput
            label="Address"
            icon="map-marker-outline"
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
            multiline
            placeholder="Enter shop address"
            delay={200}
          />

          <FloatingInput
            label="Contact"
            icon="phone-outline"
            value={contact}
            onChangeText={setContact}
            editable={isEditing}
            keyboardType="phone-pad"
            placeholder="Enter contact number"
            delay={250}
          />

          {/* Save Button */}
          <Animated.View
            style={[
              styles.saveBtnWrap,
              {
                transform: [{ translateY: saveBtnSlide }],
                opacity: formExpand,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={22}
                color={COLORS.white}
              />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Success Overlay */}
        <Animated.View
          style={[
            styles.successOverlay,
            { transform: [{ scale: successScale }], opacity: successScale },
          ]}
          pointerEvents="none"
        >
          <View style={styles.successRing}>
            <MaterialCommunityIcons name="check" size={40} color={COLORS.success} />
          </View>
        </Animated.View>

        {/* ═══ QUICK ACTIONS ═══ */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="barcode"
              title="Products"
              desc="Manage catalog & barcodes"
              color={COLORS.accent}
              onPress={() => navigation.navigate("Products")}
              delay={100}
            />
            <ActionCard
              icon="chart-line"
              title="Analytics"
              desc="View business insights"
              color={COLORS.success}
              onPress={() => navigation.navigate("Dashboard")}
              delay={200}
            />
            <ActionCard
              icon="book-open-variant"
              title="Daily Book"
              desc="Track daily totals"
              color={COLORS.primary}
              onPress={() => navigation.navigate("DailyBook")}
              delay={300}
            />
            <ActionCard
              icon="history"
              title="History"
              desc="View past accounts"
              color={COLORS.warning}
              onPress={() => navigation.navigate("PreviousAccounts")}
              delay={400}
            />
          </View>
        </View>

        {/* ═══ ABOUT ═══ */}
        <View style={styles.sectionPad}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.aboutCard}>
            <InfoRow
              icon="information-outline"
              label="Version"
              value="1.0.0"
              color={COLORS.accent}
            />
            <View style={styles.aboutDivider} />
            <InfoRow
              icon="react"
              label="Framework"
              value="React Native"
              color={COLORS.success}
            />
            <View style={styles.aboutDivider} />
            <InfoRow
              icon="database-outline"
              label="Storage"
              value="Local (AsyncStorage)"
              color={COLORS.warning}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.lg,
  },

  // ─── Profile Header ───
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 28,
    alignItems: "center",
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "absolute",
    backgroundColor: "rgba(196,154,108,0.25)",
  },
  avatarInner: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 2,
  },
  avatarText: {
    fontWeight: "900",
    color: COLORS.white,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  profileOwner: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  profileStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4ade80",
    letterSpacing: 0.3,
  },
  lastSaved: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    marginTop: 12,
    letterSpacing: 0.5,
  },

  // ─── Edit Bar ───
  editBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: -16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
    zIndex: 10,
  },
  editBarLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  editBarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editBarBtnActive: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  editBarBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
  },

  // ─── Form Card ───
  formCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: 12,
    borderRadius: 24,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
    overflow: "hidden",
  },

  // ─── Floating Input ───
  floatWrap: {
    marginBottom: 20,
    position: "relative",
  },
  floatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  floatIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  floatLabel: {
    position: "absolute",
    left: 36,
    fontWeight: "700",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  floatInput: {
    borderWidth: 1.5,
    borderColor: "rgba(11,19,32,0.08)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.muted,
    backgroundColor: "rgba(11,19,32,0.02)",
    minHeight: 52,
  },
  floatInputEditable: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderColor: "rgba(196,154,108,0.2)",
  },
  floatInputFocused: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  floatInputMultiline: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  // ─── Save Button ───
  saveBtnWrap: {
    marginTop: 8,
    overflow: "hidden",
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },

  // ─── Success Overlay ───
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  // ─── Section ───
  sectionPad: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingLeft: 4,
  },

  // ─── Action Grid ───
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME.spacing.sm,
  },
  actionCard: {
    width: (SCREEN_W - THEME.spacing.lg * 2 - THEME.spacing.sm) / 2,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  actionGradient: {
    padding: 16,
    alignItems: "flex-start",
    gap: 10,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.muted,
    lineHeight: 18,
  },

  // ─── About ───
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.04)",
    ...THEME.elevation.subtle,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: "rgba(11,19,32,0.04)",
    marginHorizontal: 8,
  },

  // ─── Info Row ───
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  infoRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRowText: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
});