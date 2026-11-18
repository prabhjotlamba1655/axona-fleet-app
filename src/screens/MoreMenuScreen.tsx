import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Award,
  Layers,
  Users,
  Settings,
  ShieldAlert,
  ChevronRight,
  LogOut,
  Shield,
  Home,
  FileText,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';

interface MoreMenuScreenProps {
  navigation: any;
}

export const MoreMenuScreen: React.FC<MoreMenuScreenProps> = ({ navigation }) => {
  const { user, canManageUsers, logout } = useAuthStore();

  const menuItems = [
    {
      id: 'driver',
      title: 'Driver Intelligence & Safety',
      subtitle: 'Harsh braking, acceleration, tilt & safety scoreboards',
      icon: Award,
      color: colors.statusMoving,
      action: () => navigation.navigate('DriverIntelligence'),
    },
    {
      id: 'panic',
      title: 'AIS-140 Panic Emergency Desk',
      subtitle: '4-stage resolution workflow with operator audit log',
      icon: ShieldAlert,
      color: colors.criticalRed,
      action: () => navigation.navigate('PanicSos'),
    },
    {
      id: 'geofence',
      title: 'Geofencing & Spatial Perimeters',
      subtitle: 'Circular and polygon boundaries, entry/exit dwell logs',
      icon: Layers,
      color: colors.infoBlue,
      action: () => navigation.navigate('Geofencing'),
    },
    {
      id: 'reports',
      title: 'Enterprise Fleet Audit Reports',
      subtitle: 'Download up to 90-day reports with custom date range in PDF',
      icon: FileText,
      color: colors.primaryNavy,
      action: () => navigation.navigate('Reports', { initialTab: 'reports' }),
    },
    ...(canManageUsers()
      ? [
          {
            id: 'users',
            title: 'User Management & RBAC',
            subtitle: 'Tenant users, role permissions & assigned assets',
            icon: Users,
            color: colors.primaryNavy,
            action: () => navigation.navigate('UserManagement'),
          },
        ]
      : []),
    {
      id: 'profile',
      title: 'Profile & Platform Settings',
      subtitle: 'Security, biometric login, gateway URLs & RBAC switcher',
      icon: Settings,
      color: colors.primaryNavy,
      action: () => navigation.navigate('ProfileSettings'),
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="ENTERPRISE MODULES"
        subtitle="Axona Fleet Management v2.4"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headingWrap}>
          <Text style={styles.menuHeading}>ENTERPRISE FLEET MODULES</Text>
          <Text style={styles.menuSub}>Axona Fleet Management PRD Version 2.4</Text>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <IconComponent size={20} color={item.color} />
                </View>

                <View style={styles.menuTextWrap}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>

                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}

          {/* Explicit Home Shortcut at end of Modules */}
          <TouchableOpacity
            style={styles.returnHomeBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Home size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.returnHomeText}>Return to Executive Home Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },
  headingWrap: {
    marginBottom: 14,
  },
  menuHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  menuSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuList: {
    gap: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  returnHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryNavy,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    ...shadows.subtle,
  },
  returnHomeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
