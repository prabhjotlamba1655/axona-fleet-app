import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCheck,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { useTelematicsStore } from '../store/telematicsStore';

interface NotificationCentreScreenProps {
  navigation: any;
}

interface NotificationItem {
  id: string;
  tier: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  body: string;
  time: string;
  read: boolean;
  screenTarget: string;
  alertType?: 'SOS' | 'TOWING' | 'TILT' | 'GEOFENCE_EXIT' | 'GEOFENCE_ENTRY';
  params?: any;
}

export const NotificationCentreScreen: React.FC<NotificationCentreScreenProps> = ({
  navigation,
}) => {
  const { panicEvents, simulateCriticalAlert } = useTelematicsStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      tier: 'CRITICAL',
      title: 'AIS-140 Physical Panic SOS Activated',
      body: 'Vehicle MH-12-RN-2024 triggered driver emergency switch. Immediate NOC intervention required.',
      time: '2 mins ago',
      read: false,
      screenTarget: 'PanicSos',
      alertType: 'SOS',
    },
    {
      id: 'notif_tow',
      tier: 'CRITICAL',
      title: 'Unauthorized Vehicle Towing Detected',
      body: 'Vehicle MH-14-DT-7711 moving at 18.5 km/h while engine ignition is switched OFF.',
      time: '12 mins ago',
      read: false,
      screenTarget: 'LiveMap',
      alertType: 'TOWING',
    },
    {
      id: 'notif_2',
      tier: 'CRITICAL',
      title: 'Vehicle Tilt / Rollover Hazard (48.5°)',
      body: 'Vehicle MH-12-PQ-9081 3-axis MEMS sensor recorded 48.5° angular lean exceeding 45° safety limit.',
      time: '25 mins ago',
      read: false,
      screenTarget: 'DriverIntelligence',
      alertType: 'TILT',
    },
    {
      id: 'notif_geo_exit',
      tier: 'CRITICAL',
      title: 'Geofence Exit: Apex Hinjawadi Central Hub',
      body: 'Vehicle MH-12-RN-2024 departed authorized depot boundary without gate pass clearance.',
      time: '45 mins ago',
      read: false,
      screenTarget: 'Geofencing',
      alertType: 'GEOFENCE_EXIT',
    },
    {
      id: 'notif_geo_entry',
      tier: 'CRITICAL',
      title: 'Geofence Entry: Pune City Restricted Zone',
      body: 'Vehicle MH-14-DT-7711 entered restricted heavy commercial vehicle corridor during peak hours.',
      time: '1 hour ago',
      read: false,
      screenTarget: 'Geofencing',
      alertType: 'GEOFENCE_ENTRY',
    },
    {
      id: 'notif_3',
      tier: 'WARNING',
      title: 'Harsh Braking Maneuver (-0.65g)',
      body: 'Vehicle MH-12-PQ-9081 exceeded deceleration threshold on Mumbai-Pune expressway.',
      time: '1.5 hours ago',
      read: true,
      screenTarget: 'DriverIntelligence',
    },
    {
      id: 'notif_5',
      tier: 'INFO',
      title: 'Ignition Turned ON',
      body: 'Vehicle MH-14-GH-3456 engine ignition started at Hinjawadi Phase 1 depot.',
      time: '2 hours ago',
      read: true,
      screenTarget: 'LiveMap',
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationPress = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.alertType) {
      simulateCriticalAlert(notif.alertType);
    } else {
      navigation.navigate(notif.screenTarget, notif.params);
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'ALL') return true;
    return n.tier === activeTab;
  });

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="NOTIFICATIONS"
        subtitle="Alerts & Audit Dispatches"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Unread Summary & Actions */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topHeading}>FIREBASE PUSH NOTIFICATIONS</Text>
            <Text style={styles.topSub}>
              {unreadCount} Unread priority {unreadCount === 1 ? 'alert' : 'alerts'}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead}>
              <CheckCheck size={14} color={colors.accentBlue} style={{ marginRight: 4 }} />
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Priority Tabs */}
        <View style={styles.tabsRow}>
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'WARNING', label: 'Warning' },
            { id: 'INFO', label: 'Info' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications List */}
        <View style={styles.list}>
          {filtered.map((item) => {
            const isCritical = item.tier === 'CRITICAL';
            const isWarn = item.tier === 'WARNING';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  !item.read && styles.cardUnread,
                  isCritical && styles.cardCritical,
                ]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    {isCritical ? (
                      <ShieldAlert size={18} color={colors.criticalRed} />
                    ) : isWarn ? (
                      <AlertTriangle size={18} color={colors.warningAmber} />
                    ) : (
                      <Info size={18} color={colors.infoBlue} />
                    )}
                  </View>

                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardTime}>{item.time}</Text>
                  </View>

                  {!item.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.cardBody}>{item.body}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.tapActionText}>Tap to open event details</Text>
                  <ChevronRight size={14} color={colors.accentBlue} />
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 160,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  topSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: 3,
    borderRadius: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.primaryNavy,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  cardUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  cardCritical: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrap: {
    marginRight: 10,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
    marginLeft: 6,
  },
  cardBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
  },
  tapActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
});
