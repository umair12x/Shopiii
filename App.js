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
} from "react-native";

import { DataProvider } from "./src/context/DataContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { DailyBookScreen } from "./src/screens/DailyBookScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ProductsScreen } from "./src/screens/ProductsScreen";
import { PreviousAccountsScreen } from "./src/screens/PreviousAccountsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { COLORS } from "./src/config/colors";
import { AppSplashScreen } from "./src/components/AppSplashScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================
// THEME CONFIGURATION
// ============================================
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

// ============================================
// TAB NAVIGATION CONSTANTS
// ============================================
const TAB_CONFIG = {
  Home: { icon: { focused: "home", unfocused: "home-outline" }, label: "Home" },
  DailyBook: { icon: { focused: "book-open", unfocused: "book-open-outline" }, label: "Daily Book" },
  Products: { icon: { focused: "barcode", unfocused: "barcode" }, label: "Products" },
  History: { icon: { focused: "calendar-clock", unfocused: "calendar-clock-outline" }, label: "History" },
  Dashboard: { icon: { focused: "chart-box", unfocused: "chart-box-outline" }, label: "Dashboard" },
  Settings: { icon: { focused: "cog", unfocused: "cog-outline" }, label: "Settings" },
};

// ============================================
// TAB ICON COMPONENT
// ============================================
const TabIcon = ({ focused, routeName, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = TAB_CONFIG[routeName];

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim]);

  if (!config) return null;

  const iconName = focused ? config.icon.focused : config.icon.unfocused;

  return (
    <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
      <MaterialCommunityIcons name={iconName} size={22} color={color} />
      
      {focused && (
        <>
          <View style={styles.activeDot} />
          <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
        </>
      )}
    </Animated.View>
  );
};

// ============================================
// FLOATING TAB BAR COMPONENT
// ============================================
const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (route, isFocused, event) => {
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.floatingBarWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? COLORS.accent : COLORS.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            handleTabPress(route, isFocused, event);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <TabIcon focused={isFocused} routeName={route.name} color={color} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============================================
// MAIN TAB NAVIGATOR
// ============================================
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
      <Tab.Screen name="DailyBook" component={DailyBookScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="History" component={PreviousAccountsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ============================================
// ROOT STACK NAVIGATOR
// ============================================
function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainApp" component={HomeTabs} />
    </Stack.Navigator>
  );
}

// ============================================
// SPLASH SCREEN COMPONENT
// ============================================
const SplashScreenWrapper = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 350,
      delay: 1500, // Show splash for 1.5 seconds
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
      <AppSplashScreen onFinish={() => {}} />
    </Animated.View>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  if (isSplashVisible) {
    return (
      <SafeAreaProvider>
        <StatusBar hidden />
        <SplashScreenWrapper onFinish={handleSplashFinish} />
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

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
  },
  floatingBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  floatingBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    height: 70,
    paddingHorizontal: 12,
    width: SCREEN_WIDTH - 40,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 60,
  },
  activeDot: {
    position: "absolute",
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
});