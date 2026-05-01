import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
} from "react-native";
import { DataProvider } from "./src/context/DataContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { DailyBookScreen } from "./src/screens/DailyBookScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ProductsScreen } from "./src/screens/ProductsScreen";
import { PreviousAccountsScreen } from "./src/screens/PreviousAccountsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { COLORS, THEME } from "./src/config/colors";
import { AppSplashScreen } from "./src/components/AppSplashScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width: SCREEN_W } = Dimensions.get("window");

// ─── Custom Navigation Theme ───
const AppNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: "transparent",
    primary: COLORS.accent,
  },
};

// ─── Animated Tab Icon ───
const TabIcon = ({ focused, routeName }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.2 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -4 : 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, labelOpacity, translateY]);

  const getIconName = () => {
    const icons = {
      Home: focused ? "home-variant" : "home-variant-outline",
      Products: focused ? "barcode-scan" : "barcode-scan",
      DailyBook: focused ? "book-open-variant" : "book-open-variant",
      Dashboard: focused ? "chart-box" : "chart-box-outline",
      History: focused ? "calendar-clock" : "calendar-clock-outline",
      Settings: focused ? "cog" : "cog-outline",
    };
    return icons[routeName] || "help-circle";
  };

  const getLabel = () => {
    const labels = {
      Home: "Home",
      Products: "Products",
      DailyBook: "Book",
      Dashboard: "Stats",
      History: "History",
      Settings: "Settings",
    };
    return labels[routeName] || routeName;
  };

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
        }}
      >
        <MaterialCommunityIcons
          name={getIconName()}
          size={focused ? 24 : 22}
          color={focused ? COLORS.accent : COLORS.muted}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabelMini,
          {
            opacity: labelOpacity,
            color: focused ? COLORS.accent : COLORS.muted,
          },
        ]}
      >
        {getLabel()}
      </Animated.Text>
    </View>
  );
};

// ─── Center Action Button ───
const CenterButton = ({ onPress, focused }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.5,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.timing(rotate, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }).start();
    } else {
      pulse.setValue(1);
      glowOpacity.setValue(0.5);
      Animated.timing(rotate, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [focused, pulse, glowOpacity, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      style={styles.centerBtnTouch}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.centerBtnContainer}>
        <Animated.View
          style={[
            styles.centerBtnGlow,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulse }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.centerBtn,
            focused && styles.centerBtnActive,
            { transform: [{ rotate: spin }] },
          ]}
        >
          <MaterialCommunityIcons
            name={focused ? "book-open-variant" : "plus"}
            size={26}
            color={COLORS.white}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Floating Tab Bar with 6 Tabs ───
const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  // All 6 tabs including center DailyBook
  const allTabs = state.routes;
  const centerIndex = 2; // DailyBook is at index 2

  useEffect(() => {
    if (tabWidth > 0) {
      const activeIndex = state.index;
      const x = activeIndex * tabWidth;
      Animated.spring(indicatorX, {
        toValue: x + tabWidth / 2 - 10,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index, tabWidth, indicatorX]);

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setTabWidth(width / allTabs.length);
  };

  return (
    <View
      style={[
        styles.floatingBarWrap,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={styles.floatingBar} onLayout={onLayout}>
        {/* Sliding Indicator */}
        <Animated.View
          style={[
            styles.indicatorOrb,
            { transform: [{ translateX: indicatorX }] },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center elevated button for DailyBook
          if (route.name === "DailyBook") {
            return (
              <View key={route.key} style={styles.centerTabSlot}>
                <CenterButton onPress={onPress} focused={isFocused} />
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabSlot}
              activeOpacity={0.7}
            >
              <TabIcon focused={isFocused} routeName={route.name} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Home Tabs with all 6 screens ───
function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="DailyBook" component={DailyBookScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={PreviousAccountsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack ───
function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="MainApp"
        component={HomeTabs}
        options={{ animation: "fade" }}
      />
    </Stack.Navigator>
  );
}

// ─── Main App ───
export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleSplashFinish = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setIsSplashVisible(false);
    });
  }, [fadeAnim]);

  if (isSplashVisible) {
    return (
      <SafeAreaProvider>
        <StatusBar hidden />
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <AppSplashScreen onFinish={handleSplashFinish} />
        </Animated.View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <DataProvider>
        <NavigationContainer theme={AppNavigationTheme}>
          <RootStack />
        </NavigationContainer>
      </DataProvider>
    </SafeAreaProvider>
  );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const styles = StyleSheet.create({
  // ─── Floating Tab Bar ───
  floatingBarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    height: 72,
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(11,19,32,0.06)",
    width: SCREEN_W - 24,
  },
  indicatorOrb: {
    position: "absolute",
    bottom: 10,
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  tabSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  centerTabSlot: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
  },

  // ─── Tab Icon ───
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  tabLabelMini: {
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // ─── Center Button ───
  centerBtnTouch: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtnContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerBtnGlow: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accent,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  centerBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.accent,
  },
});