import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DataProvider } from './src/context/DataContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { DailyBookScreen } from './src/screens/DailyBookScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { PreviousAccountsScreen } from './src/screens/PreviousAccountsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS } from './src/config/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icons Component (using emoji instead of vector icons)
const TabIcon = ({ focused, emoji }) => {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
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
          let emoji = '🏠';
          if (route.name === 'DailyBook') emoji = '📝';
          else if (route.name === 'Dashboard') emoji = '📊';
          else if (route.name === 'History') emoji = '📋';
          else if (route.name === 'Settings') emoji = '⚙️';

          return <TabIcon focused={focused} emoji={emoji} />;
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
