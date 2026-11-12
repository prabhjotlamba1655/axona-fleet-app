import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Truck,
  Navigation2,
  Clock,
  Square,
  WifiOff,
  ShieldAlert,
  Award,
  Milestone,
  MapPin,
  ChevronRight,
  Flame,
  Radio,
  PlusCircle,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { KPICard } from '../components/KPICard';
import { MapView } from '../components/MapView';
import { AlertCard } from '../components/AlertCard';
import { useTelematicsStore } from '../store/telematicsStore';
import { useAuthStore } from '../store/authStore';

interface ExecutiveDashboardScreenProps {
  navigation: any;
}

export const ExecutiveDashboardScreen: React.FC<ExecutiveDashboardScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const {
    kpis,
    recentAlerts,
    livePositions,
    fetchDashboardData,
    fetchLivePositions,
    fetchCategories,
    fetchPanicEvents,
    initSubscriptions,
    simulatePanic,
    isInitialLoading,
  } = useTelematicsStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = initSubscriptions();
    fetchDashboardData();
    fetchLivePositions();
    fetchCategories();
    fetchPanicEvents();

    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchLivePositions(),
      fetchPanicEvents(),
    ]);
    setRefreshing(false);
  };

  const handleSimulateEmergency = async () => {
    Alert.alert(
      'Trigger AIS-140 Panic Simulation',
      'This will broadcast a real-time statutory panic alert packet ($ALT Table 4) to the backend telematics gateway and sound the monitoring alarm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Panic SOS',
          style: 'destructive',
          onPress: async () => {
            const res = await simulatePanic();
            if (res) {
              Alert.alert('Emergency Alert Ingested', `Panic event registered for vehicle: ${res.vehicle}`);
            }
          },
        },
      ]
    );
  };

  const vehiclesList = Object.values(livePositions);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primaryNavy]} />
        }
      >
        {/* Welcome Banner */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Fleet Operator'}</Text>
          </View>

          <TouchableOpacity
            style={styles.testSosBtn}
            onPress={handleSimulateEmergency}
          >
            <Flame size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.testSosText}>Simulate SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>FLEET TELEMATICS KPIS</Text>
          <Text style={styles.liveSyncBadge}>• Real-time Sync</Text>
        </View>

        {/* 8 KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* 1. Total Fleet */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Total Fleet"
              value={kpis.totalVehicles}
              subtitle="Registered assets"
              icon={<Truck size={18} color={colors.primaryNavy} />}
              accentColor={colors.primaryNavy}
              onPress={() => navigation.navigate('Vehicles')}
            />
          </View>

          {/* 2. Moving / En Route */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Moving"
              value={kpis.movingVehicles}
              subtitle="Speed > 0 & Ign ON"
              icon={<Navigation2 size={18} color={colors.statusMoving} />}
              accentColor={colors.statusMoving}
              onPress={() => navigation.navigate('LiveMap', { statusFilter: 'moving' })}
            />
          </View>

          {/* 3. Idle */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Idle"
              value={kpis.idleVehicles}
              subtitle="Speed = 0 & Ign ON"
              icon={<Clock size={18} color={colors.statusIdle} />}
              accentColor={colors.statusIdle}
              onPress={() => navigation.navigate('LiveMap', { statusFilter: 'idle' })}
            />
          </View>

          {/* 4. Stopped */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Stopped"
              value={kpis.stoppedVehicles}
              subtitle="Stationary & Ign OFF"
              icon={<Square size={18} color={colors.statusStopped} />}
              accentColor={colors.statusStopped}
              onPress={() => navigation.navigate('LiveMap', { statusFilter: 'stopped' })}
            />
          </View>

          {/* 5. Disconnected */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Inactive"
              value={kpis.offlineVehicles}
              subtitle="No ping in 15 min"
              icon={<WifiOff size={18} color={colors.statusDisconnected} />}
              accentColor={colors.statusDisconnected}
              onPress={() => navigation.navigate('LiveMap', { statusFilter: 'offline' })}
            />
          </View>

          {/* 6. Active SOS */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Active SOS"
              value={kpis.activeSosAlerts}
              subtitle="Pending response"
              isCritical={kpis.activeSosAlerts > 0}
              icon={<ShieldAlert size={18} color={colors.criticalRed} />}
              accentColor={colors.criticalRed}
              onPress={() => navigation.navigate('PanicSos')}
            />
          </View>

          {/* 7. Safety Score */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Safety Score"
              value={`${kpis.fleetSafetyScore}/100`}
              subtitle="Fleet IMU Index"
              icon={<Award size={18} color={colors.successGreen} />}
              accentColor={colors.successGreen}
              onPress={() => navigation.navigate('DriverIntelligence')}
            />
          </View>

          {/* 8. Daily Distance */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Daily Distance"
              value={`${kpis.dailyDistance} km`}
              subtitle="Since 00:00 UTC"
              icon={<Milestone size={18} color={colors.accentBlue} />}
              accentColor={colors.accentBlue}
              onPress={() => navigation.navigate('Reports', { reportType: 'distance' })}
            />
          </View>
        </View>

        {/* Live Map Preview Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapTitleWrap}>
              <MapPin size={16} color={colors.primaryNavy} />
              <Text style={styles.mapTitle}>LIVE FLEET POSITION PREVIEW</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllMapBtn}
              onPress={() => navigation.navigate('LiveMap')}
            >
              <Text style={styles.viewAllMapText}>Full Screen Map</Text>
              <ChevronRight size={14} color={colors.accentBlue} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            <MapView
              vehicles={vehiclesList}
              height={220}
              onSelectVehicle={(veh) => navigation.navigate('LiveMap', { vehicleId: veh.vehicle_id })}
            />
          </View>
        </View>

        {/* Recent Alerts Feed Section */}
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeaderRow}>
            <Text style={styles.sectionTitle}>RECENT TELEMATICS ALERTS</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Alerts')}
              style={styles.viewAllLink}
            >
              <Text style={styles.viewAllLinkText}>Alert Center</Text>
              <ChevronRight size={14} color={colors.accentBlue} />
            </TouchableOpacity>
          </View>

          {recentAlerts.length === 0 ? (
            <View style={styles.emptyAlerts}>
              <Text style={styles.emptyAlertsText}>No pending critical alerts.</Text>
            </View>
          ) : (
            recentAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                id={alert.id}
                type={alert.type}
                title={alert.title}
                vehicleReg={alert.registration_number}
                severity={alert.severity || (alert.type === 'panic' ? 'CRITICAL' : 'WARNING')}
                eventTime={alert.event_time}
                location={alert.address}
                status={alert.status}
                onPress={() => {
                  if (alert.type === 'panic') {
                    navigation.navigate('PanicSos');
                  } else {
                    navigation.navigate('Alerts');
                  }
                }}
              />
            ))
          )}
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
    paddingBottom: 40,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  testSosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.criticalRed,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    ...shadows.subtle,
  },
  testSosText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  liveSyncBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.statusMoving,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 16,
  },
  kpiCol: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  mapSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
    ...shadows.card,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  viewAllMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllMapText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  mapWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  alertsSection: {
    marginTop: 4,
  },
  alertsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  emptyAlerts: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyAlertsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
