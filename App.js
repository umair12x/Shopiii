import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DataProvider } from './src/context/DataContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { DailyBookScreen } from './src/screens/DailyBookScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PreviousAccountsScreen } from './src/screens/PreviousAccountsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS } from './src/config/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  DailyBook: 'clipboard-text-outline',
  Dashboard: 'chart-line',
  History: 'history',
  Settings: 'cog-outline',
};

const TabIcon = ({ focused, iconName }) => {
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={focused ? 26 : 24}
      color={focused ? COLORS.primary : COLORS.gray}
    />
  );
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarIcon: ({ focused }) => {
          const iconName = TAB_ICONS[route.name] || TAB_ICONS.Home;

          return <TabIcon focused={focused} iconName={iconName} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="DailyBook"
        component={DailyBookScreen}
        options={{ title: 'Daily Book' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen
        name="History"
        component={PreviousAccountsScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <DataProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}
        >
          <Stack.Screen name="MainApp" component={HomeTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
}
