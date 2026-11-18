import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export const navigationRef = createNavigationContainerRef<any>();
import {
  Home,
  MapPin,
  Truck,
  ShieldAlert,
  Menu,
  Navigation,
  ClipboardCheck,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useTelematicsStore } from '../store/telematicsStore';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ExecutiveDashboardScreen } from '../screens/ExecutiveDashboardScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import { AlertCentreScreen } from '../screens/AlertCentreScreen';
import { MoreMenuScreen } from '../screens/MoreMenuScreen';
import { VehicleDetailsScreen } from '../screens/VehicleDetailsScreen';
import { TripHistoryScreen } from '../screens/TripHistoryScreen';
import { PanicSosScreen } from '../screens/PanicSosScreen';
import { DriverIntelligenceScreen } from '../screens/DriverIntelligenceScreen';
import { GeofencingScreen } from '../screens/GeofencingScreen';
import { DeviceHealthScreen } from '../screens/DeviceHealthScreen';
import { EnterpriseReportsScreen } from '../screens/EnterpriseReportsScreen';
import { NotificationCentreScreen } from '../screens/NotificationCentreScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { kpis } = useTelematicsStore();
  const hasSos = kpis.activeSosAlerts > 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 4,
          paddingBottom: 4,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 1,
        },
        tabBarActiveTintColor: colors.primaryNavy,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
          marginBottom: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ExecutiveDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="LiveMap"
        component={LiveTrackingScreen}
        options={{
          tabBarLabel: 'Live Tracking',
          tabBarIcon: ({ color, size }) => <Navigation size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Compliance"
        component={EnterpriseReportsScreen}
        options={{
          tabBarLabel: 'Compliance',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertCentreScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <ShieldAlert size={20} color={hasSos ? colors.criticalRed : color} />
              {hasSos && <View style={styles.alertBadgeDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreMenuScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <Menu size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Vehicles" component={VehicleListScreen} />
        <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
        <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
        <Stack.Screen name="PanicSos" component={PanicSosScreen} />
        <Stack.Screen name="DriverIntelligence" component={DriverIntelligenceScreen} />
        <Stack.Screen name="Geofencing" component={GeofencingScreen} />
        <Stack.Screen name="DeviceHealth" component={DeviceHealthScreen} />
        <Stack.Screen name="Reports" component={EnterpriseReportsScreen} />
        <Stack.Screen name="Notifications" component={NotificationCentreScreen} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.criticalRed,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
