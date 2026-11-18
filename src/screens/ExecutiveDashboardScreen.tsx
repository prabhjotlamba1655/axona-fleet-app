import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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
  Layers,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
  CheckCircle,
  Volume2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { KPICard } from '../components/KPICard';
import { MapView } from '../components/MapView';
import { AlertCard } from '../components/AlertCard';
import { VehicleCard } from '../components/VehicleCard';
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
    vehicles,
    recentAlerts,
    livePositions,
    fetchDashboardData,
    fetchVehicles,
    fetchLivePositions,
    fetchCategories,
    fetchPanicEvents,
    initSubscriptions,
    simulatePanic,
    isInitialLoading,
    triggerCriticalPopup,
    setSelectedVehicle,
  } = useTelematicsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<
    'CRITICAL' | 'WARNING' | 'INFO' | null
  >(null);
  const [selectedDetailAlert, setSelectedDetailAlert] = useState<any | null>(null);

  // Full unified telemetry alert catalogue (since 00:00 hrs)
  const allAlertsCatalog = useMemo(() => [
    // --- 1. CRITICAL (Count: 4) ---
    {
      id: 'crit_sos_1',
      type: 'panic',
      category: 'EMERGENCY',
      title: 'Emergency AIS-140 SOS Triggered',
      subtitle: 'Cabin hardware panic button pressed by operator',
      registration_number: 'MH-12-RN-2024',
      vehicle_id: 'veh_1',
      make: 'Tata Motors',
      model: 'Prima 4028.S',
      driver_name: 'Ramesh Kumar',
      severity: 'CRITICAL' as const,
      event_time: 'Today, 08:47 AM',
      address: 'Near Pune-Bangalore Highway, Hinjawadi Phase 1, Pune',
      status: 'Active Emergency',
      soundType: 'siren' as const,
      speed: 0,
      latitude: 18.5912,
      longitude: 73.7389,
      metrics: [
        { label: 'Event', value: 'Cabin Physical SOS', isHighlight: true },
        { label: 'Speed', value: '0 km/h' },
        { label: 'Driver', value: 'Ramesh Kumar' },
      ],
    },
    {
      id: 'crit_tow_1',
      type: 'towing',
      category: 'MOVEMENT',
      title: 'Unauthorized Vehicle Towing Detected',
      subtitle: 'Vehicle moving at 18.5 km/h while engine ignition is switched OFF',
      registration_number: 'MH-14-DT-7711',
      vehicle_id: 'veh_5',
      make: 'Eicher Motors',
      model: 'Pro 3019',
      driver_name: 'Suresh Patil',
      severity: 'CRITICAL' as const,
      event_time: 'Today, 10:15 AM',
      address: 'Apex Hinjawadi Phase 2 Depot Bay 4, Pune',
      status: 'Active Motion Alert',
      soundType: 'towing' as const,
      speed: 18.5,
      latitude: 18.6298,
      longitude: 73.7997,
      metrics: [
        { label: 'Motion', value: 'Unauthorized Towing', isHighlight: true },
        { label: 'Ignition', value: 'OFF (Key Out)' },
        { label: 'Speed', value: '18.5 km/h' },
      ],
    },
    {
      id: 'crit_tilt_1',
      type: 'tilt',
      category: 'DRIVER',
      title: 'Vehicle Tilt / Rollover Hazard (48.5°)',
      subtitle: 'Lateral lean angle exceeded critical 45° threshold',
      registration_number: 'MH-12-PQ-9081',
      vehicle_id: 'veh_2',
      make: 'Mahindra',
      model: 'Bolero Maxi Truck Plus',
      driver_name: 'Vikramaditya Rao',
      severity: 'CRITICAL' as const,
      event_time: 'Today, 11:32 AM',
      address: 'Ghat Section km 32, Katraj Bypass, Pune',
      status: 'Hazard Alert',
      soundType: 'tilt' as const,
      speed: 36.2,
      latitude: 18.4520,
      longitude: 73.8640,
      metrics: [
        { label: 'Lean Angle', value: '48.5° (Limit 45°)', isHighlight: true },
        { label: 'Speed', value: '36.2 km/h' },
        { label: 'Driver', value: 'Vikramaditya Rao' },
      ],
    },
    {
      id: 'crit_tamper_1',
      type: 'tamper',
      category: 'HARDWARE',
      title: 'Main Battery Cut & Tamper Disconnect',
      subtitle: 'External 24V line disconnected, backup battery active (88%)',
      registration_number: 'MH-14-GH-5566',
      vehicle_id: 'veh_4',
      make: 'Ashok Leyland',
      model: 'Viking 222 Staff Coach',
      driver_name: 'Anil Deshmukh',
      severity: 'CRITICAL' as const,
      event_time: 'Today, 07:20 AM',
      address: 'Apex Hinjawadi Central Logistics Hub, Bay 2',
      status: 'Hardware Alert',
      soundType: 'tamper' as const,
      speed: 0,
      latitude: 18.5940,
      longitude: 73.7410,
      metrics: [
        { label: 'Main Battery', value: '0.0V (Disconnected)', isHighlight: true },
        { label: 'Backup Battery', value: '88% Active' },
        { label: 'Tamper Switch', value: 'OPEN' },
      ],
    },

    // --- 2. WARNING (Count: 5) ---
    {
      id: 'warn_hb_1',
      type: 'driver',
      category: 'DRIVER',
      title: 'Harsh Braking Incident (-0.68g)',
      subtitle: 'Rapid deceleration exceeded safety threshold (-0.68g recorded vs -0.55g limit)',
      registration_number: 'MH-12-TX-3344',
      vehicle_id: 'veh_3',
      make: 'Maruti Suzuki',
      model: 'Ertiga Commercial Tour M',
      driver_name: 'Sachin Shinde',
      severity: 'WARNING' as const,
      event_time: 'Today, 09:24 AM',
      address: 'Wakad Flyover Junction, Pune',
      status: 'Logged',
      speed: 18,
      metrics: [
        { label: 'G-Force', value: '-0.68g', isHighlight: true },
        { label: 'Speed Delta', value: '54 -> 18 km/h' },
        { label: 'Driver', value: 'Sachin Shinde' },
      ],
    },
    {
      id: 'warn_ha_1',
      type: 'driver',
      category: 'DRIVER',
      title: 'Harsh Acceleration Spike (+0.52g)',
      subtitle: 'Rapid acceleration exceeded threshold (+0.52g vs +0.43g limit)',
      registration_number: 'MH-12-RN-2024',
      vehicle_id: 'veh_1',
      make: 'Tata Motors',
      model: 'Prima 4028.S',
      driver_name: 'Ramesh Kumar',
      severity: 'WARNING' as const,
      event_time: 'Today, 10:40 AM',
      address: 'Hinjawadi Phase 1 Toll Plaza',
      status: 'Logged',
      speed: 55,
      metrics: [
        { label: 'G-Force', value: '+0.52g', isHighlight: true },
        { label: 'Speed Delta', value: '15 -> 55 km/h' },
      ],
    },
    {
      id: 'warn_spd_1',
      type: 'speed',
      category: 'SPEED',
      title: 'Overspeeding Violation (88.4 km/h)',
      subtitle: 'Exceeded statutory speed limit of 70.0 km/h on highway corridor',
      registration_number: 'MH-12-PQ-9081',
      vehicle_id: 'veh_2',
      make: 'Mahindra',
      model: 'Bolero Maxi Truck Plus',
      driver_name: 'Vikramaditya Rao',
      severity: 'WARNING' as const,
      event_time: 'Today, 11:05 AM',
      address: 'Mumbai-Pune Expressway km 44',
      status: 'Warning',
      speed: 88.4,
      metrics: [
        { label: 'Recorded Speed', value: '88.4 km/h', isHighlight: true },
        { label: 'Speed Limit', value: '70.0 km/h' },
      ],
    },
    {
      id: 'warn_geo_exit_1',
      type: 'geofence',
      category: 'GEOFENCE',
      title: 'Geofence Zone Departure (Zone Exit)',
      subtitle: 'Departed Apex Hinjawadi Central Hub perimeter',
      registration_number: 'MH-14-DT-7711',
      vehicle_id: 'veh_5',
      make: 'Eicher Motors',
      model: 'Pro 3019',
      driver_name: 'Suresh Patil',
      severity: 'WARNING' as const,
      event_time: 'Today, 08:30 AM',
      address: 'Perimeter Gate 2, Apex Logistics Hub',
      status: 'Recorded',
      speed: 28,
      metrics: [
        { label: 'Zone', value: 'Apex Logistics Hub', isHighlight: true },
        { label: 'Event', value: 'Zone Exit' },
      ],
    },
    {
      id: 'warn_idle_1',
      type: 'idle',
      category: 'MOVEMENT',
      title: 'Extended Engine Idling Alert (>30 mins)',
      subtitle: 'Vehicle stationary with engine idling for 34 mins (Fuel waste)',
      registration_number: 'MH-12-TX-3344',
      vehicle_id: 'veh_3',
      make: 'Maruti Suzuki',
      model: 'Ertiga Commercial Tour M',
      driver_name: 'Sachin Shinde',
      severity: 'WARNING' as const,
      event_time: 'Today, 09:55 AM',
      address: 'Viman Nagar Airport Drop Zone',
      status: 'Logged',
      speed: 0,
      metrics: [
        { label: 'Idle Time', value: '34 Minutes', isHighlight: true },
        { label: 'AC Status', value: 'ON' },
      ],
    },

    // --- 3. INFO (Count: 5) ---
    {
      id: 'info_geo_1',
      type: 'geofence',
      category: 'GEOFENCE',
      title: 'Geofence Zone Inbound Entry',
      subtitle: 'Entered Apex Hinjawadi Central Hub via RFID Gate 1',
      registration_number: 'MH-12-RN-2024',
      vehicle_id: 'veh_1',
      make: 'Tata Motors',
      model: 'Prima 4028.S',
      driver_name: 'Ramesh Kumar',
      severity: 'INFO' as const,
      event_time: 'Today, 06:15 AM',
      address: 'Gate 1 Inbound RFID Lane, Hinjawadi Hub',
      status: 'Recorded',
      speed: 12,
      metrics: [
        { label: 'Zone', value: 'Apex Central Hub', isHighlight: true },
        { label: 'Gate', value: 'RFID Lane 1' },
      ],
    },
    {
      id: 'info_ign_1',
      type: 'ignition',
      category: 'MOVEMENT',
      title: 'Ignition Switched ON (Shift Commenced)',
      subtitle: 'Driver keyed ignition ON for Route 14 morning shift',
      registration_number: 'MH-14-GH-5566',
      vehicle_id: 'veh_4',
      make: 'Ashok Leyland',
      model: 'Viking 222 Staff Coach',
      driver_name: 'Anil Deshmukh',
      severity: 'INFO' as const,
      event_time: 'Today, 06:00 AM',
      address: 'Nigdi Depot Terminal Bay 2',
      status: 'Recorded',
      speed: 0,
      metrics: [
        { label: 'Ignition', value: 'ON (Shift Start)', isHighlight: true },
        { label: 'Driver', value: 'Anil Deshmukh' },
      ],
    },
    {
      id: 'info_hb_1',
      type: 'health',
      category: 'HARDWARE',
      title: 'Daily AIS-140 GPS Health Heartbeat OK',
      subtitle: '14 satellites locked, GSM signal 94%, internal battery 96%',
      registration_number: 'MH-12-TX-3344',
      vehicle_id: 'veh_3',
      make: 'Maruti Suzuki',
      model: 'Ertiga Commercial Tour M',
      driver_name: 'Sachin Shinde',
      severity: 'INFO' as const,
      event_time: 'Today, 05:30 AM',
      address: 'Shivajinagar Station Bay',
      status: 'Normal',
      speed: 0,
      metrics: [
        { label: 'GPS Fix', value: '3D Fix (14 Satellites)', isHighlight: true },
        { label: 'GSM Signal', value: '94% (Good)' },
      ],
    },
    {
      id: 'info_geo_2',
      type: 'geofence',
      category: 'GEOFENCE',
      title: 'Geofence Destination Arrival',
      subtitle: 'Entered Chakan Industrial Area Delivery Terminal 3',
      registration_number: 'MH-14-DT-7711',
      vehicle_id: 'veh_5',
      make: 'Eicher Motors',
      model: 'Pro 3019',
      driver_name: 'Suresh Patil',
      severity: 'INFO' as const,
      event_time: 'Today, 07:45 AM',
      address: 'Chakan Phase 2 Industrial Park',
      status: 'Recorded',
      speed: 15,
      metrics: [
        { label: 'Destination', value: 'Chakan Terminal 3', isHighlight: true },
        { label: 'Dwell Time', value: 'Arrived' },
      ],
    },
    {
      id: 'info_bat_1',
      type: 'hardware',
      category: 'HARDWARE',
      title: 'Battery Charging Nominal (24.2V)',
      subtitle: 'Alternator output verified within manufacturer float voltage',
      registration_number: 'MH-12-PQ-9081',
      vehicle_id: 'veh_2',
      make: 'Mahindra',
      model: 'Bolero Maxi Truck Plus',
      driver_name: 'Vikramaditya Rao',
      severity: 'INFO' as const,
      event_time: 'Today, 08:10 AM',
      address: 'Katraj Service Depot Bay 1',
      status: 'Normal',
      speed: 0,
      metrics: [
        { label: 'Voltage', value: '24.2V Float', isHighlight: true },
        { label: 'Alternator', value: 'Charging OK' },
      ],
    },
  ], []);

  const criticalCount = useMemo(
    () => allAlertsCatalog.filter((a) => a.severity === 'CRITICAL').length,
    [allAlertsCatalog]
  );
  const warningCount = useMemo(
    () => allAlertsCatalog.filter((a) => a.severity === 'WARNING').length,
    [allAlertsCatalog]
  );
  const infoCount = useMemo(
    () => allAlertsCatalog.filter((a) => a.severity === 'INFO').length,
    [allAlertsCatalog]
  );

  const vehiclesUnderCategory = useMemo(() => {
    if (!selectedSeverityFilter) return [];
    const alertsInCat = allAlertsCatalog.filter((a) => a.severity === selectedSeverityFilter);
    const map = new Map<string, any>();
    alertsInCat.forEach((a) => {
      if (!map.has(a.registration_number)) {
        map.set(a.registration_number, {
          registration: a.registration_number,
          vehicleId: a.vehicle_id,
          make: a.make,
          model: a.model,
          driverName: a.driver_name,
          latestAlert: a.title,
          alertSubtitle: a.subtitle,
          location: a.address,
          eventTime: a.event_time,
          speed: a.speed,
          severity: a.severity,
          soundType: a.soundType,
          alertItem: a,
        });
      }
    });
    return Array.from(map.values());
  }, [selectedSeverityFilter, allAlertsCatalog]);

  const visibleAlerts = useMemo(() => {
    if (!selectedSeverityFilter) return allAlertsCatalog;
    return allAlertsCatalog.filter((a) => a.severity === selectedSeverityFilter);
  }, [selectedSeverityFilter, allAlertsCatalog]);

  const handleTriggerCriticalPopup = (alert: any) => {
    triggerCriticalPopup({
      id: alert.id || `crit_${Date.now()}`,
      type:
        alert.type === 'towing'
          ? 'TOWING'
          : alert.type === 'tilt'
          ? 'TILT'
          : alert.type === 'geofence'
          ? 'GEOFENCE_EXIT'
          : alert.type === 'tamper'
          ? 'TAMPER'
          : 'SOS',
      title: (alert.title || 'CRITICAL AIS-140 ALERT').toUpperCase(),
      subtitle: alert.subtitle || alert.address || 'Immediate operator attention required',
      severity: 'CRITICAL',
      vehicleReg: alert.registration_number || alert.vehicleReg,
      vehicleId: alert.vehicle_id || alert.vehicleId || 'veh_1',
      driverName: alert.driver_name || alert.driverName || 'Fleet Operator',
      location: alert.address || alert.location || 'Pune Highway Corridor',
      timestamp: alert.event_time || 'Today, 10:15 AM',
      latitude: alert.latitude || 18.5912,
      longitude: alert.longitude || 73.7389,
      speed: alert.speed || 0,
      metrics: alert.metrics || [
        { label: 'Alert Type', value: alert.title, isHighlight: true },
        { label: 'Speed', value: `${alert.speed || 0} km/h` },
        { label: 'Status', value: alert.status || 'Active' },
      ],
      soundType:
        alert.soundType ||
        (alert.type === 'towing'
          ? 'towing'
          : alert.type === 'tilt'
          ? 'tilt'
          : alert.type === 'geofence'
          ? 'geofence'
          : alert.type === 'tamper'
          ? 'tamper'
          : 'siren'),
    });
  };

  const handleViewVehicleOnMap = (vehId?: string) => {
    if (vehId && livePositions[vehId]) {
      setSelectedVehicle(livePositions[vehId]);
    }
    navigation.navigate('LiveMap', { vehicleId: vehId });
  };

  useEffect(() => {
    const unsub = initSubscriptions();
    fetchDashboardData();
    fetchVehicles();
    fetchLivePositions();
    fetchCategories();
    fetchPanicEvents();

    return () => unsub();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchVehicles(),
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
              icon={<Truck size={18} color={colors.primaryNavy} />}
              accentColor={colors.primaryNavy}
              onPress={() => {
                setActiveStatusTab('ALL');
                navigation.navigate('Vehicles', { statusFilter: 'ALL' });
              }}
            />
          </View>

          {/* 2. Moving / En Route */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Moving"
              value={kpis.movingVehicles}
              icon={<Navigation2 size={18} color={colors.statusMoving} />}
              accentColor={colors.statusMoving}
              onPress={() => {
                setActiveStatusTab('MOVING');
                navigation.navigate('Vehicles', { statusFilter: 'MOVING' });
              }}
            />
          </View>

          {/* 3. Idle */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Idle"
              value={kpis.idleVehicles}
              icon={<Clock size={18} color={colors.statusIdle} />}
              accentColor={colors.statusIdle}
              onPress={() => {
                setActiveStatusTab('IDLE');
                navigation.navigate('Vehicles', { statusFilter: 'IDLE' });
              }}
            />
          </View>

          {/* 4. Stopped */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Stopped"
              value={kpis.stoppedVehicles}
              icon={<Square size={18} color={colors.statusStopped} />}
              accentColor={colors.statusStopped}
              onPress={() => {
                setActiveStatusTab('STOPPED');
                navigation.navigate('Vehicles', { statusFilter: 'STOPPED' });
              }}
            />
          </View>

          {/* 5. Disconnected */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Offline GPS"
              value={kpis.offlineVehicles}
              icon={<WifiOff size={18} color={colors.statusDisconnected} />}
              accentColor={colors.statusDisconnected}
              onPress={() => {
                setActiveStatusTab('OFFLINE');
                navigation.navigate('Vehicles', { statusFilter: 'OFFLINE' });
              }}
            />
          </View>

          {/* 6. Panic Alerts */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Panic Alerts"
              value={kpis.todayPanicAlerts ?? kpis.activeSosAlerts ?? 0}
              isCritical={(kpis.activeSosAlerts > 0) || ((kpis.todayPanicAlerts ?? 0) > 0)}
              icon={<ShieldAlert size={18} color={colors.criticalRed} />}
              accentColor={colors.criticalRed}
              onPress={() => navigation.navigate('PanicSos')}
            />
          </View>

          {/* 7. Fleet Utilization */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Fleet Utilization"
              value={`${kpis.totalVehicles > 0 ? Math.round((((kpis.movingVehicles || 0) + (kpis.idleVehicles || 0)) / kpis.totalVehicles) * 100) : 67}%`}
              icon={<TrendingUp size={18} color={colors.statusMoving} />}
              accentColor={colors.statusMoving}
              onPress={() => navigation.navigate('LiveMap')}
            />
          </View>

          {/* 8. Daily Distance */}
          <View style={styles.kpiCol}>
            <KPICard
              title="Daily Distance"
              value={`${kpis.dailyDistance} km`}
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

          {/* 3 Summary Boxes: Critical, Warning & Info (Counts since 00:00 hrs) */}
          <View style={styles.alertSummaryRow}>
            {/* 1. Critical Box */}
            <TouchableOpacity
              style={[
                styles.alertSummaryBox,
                styles.criticalSummaryBox,
                selectedSeverityFilter === 'CRITICAL' && styles.criticalSummaryBoxActive,
              ]}
              onPress={() =>
                setSelectedSeverityFilter(
                  selectedSeverityFilter === 'CRITICAL' ? null : 'CRITICAL'
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.summaryBoxTopRow}>
                <View style={styles.summaryTagWrap}>
                  <View style={[styles.summaryDot, { backgroundColor: '#DC2626' }]} />
                  <Text style={[styles.summaryTagText, { color: '#DC2626' }]}>CRITICAL</Text>
                </View>
                <ShieldAlert size={15} color="#DC2626" />
              </View>
              <Text style={[styles.summaryCountText, { color: '#DC2626' }]}>
                {criticalCount}
              </Text>
              <Text style={styles.summaryTimeText}>Since 00:00 hrs</Text>
              {selectedSeverityFilter === 'CRITICAL' && (
                <View style={[styles.activeIndicatorBar, { backgroundColor: '#DC2626' }]} />
              )}
            </TouchableOpacity>

            {/* 2. Warning Box */}
            <TouchableOpacity
              style={[
                styles.alertSummaryBox,
                styles.warningSummaryBox,
                selectedSeverityFilter === 'WARNING' && styles.warningSummaryBoxActive,
              ]}
              onPress={() =>
                setSelectedSeverityFilter(
                  selectedSeverityFilter === 'WARNING' ? null : 'WARNING'
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.summaryBoxTopRow}>
                <View style={styles.summaryTagWrap}>
                  <View style={[styles.summaryDot, { backgroundColor: '#D97706' }]} />
                  <Text style={[styles.summaryTagText, { color: '#D97706' }]}>WARNING</Text>
                </View>
                <AlertTriangle size={15} color="#D97706" />
              </View>
              <Text style={[styles.summaryCountText, { color: '#D97706' }]}>
                {warningCount}
              </Text>
              <Text style={styles.summaryTimeText}>Since 00:00 hrs</Text>
              {selectedSeverityFilter === 'WARNING' && (
                <View style={[styles.activeIndicatorBar, { backgroundColor: '#D97706' }]} />
              )}
            </TouchableOpacity>

            {/* 3. Info Box */}
            <TouchableOpacity
              style={[
                styles.alertSummaryBox,
                styles.infoSummaryBox,
                selectedSeverityFilter === 'INFO' && styles.infoSummaryBoxActive,
              ]}
              onPress={() =>
                setSelectedSeverityFilter(selectedSeverityFilter === 'INFO' ? null : 'INFO')
              }
              activeOpacity={0.8}
            >
              <View style={styles.summaryBoxTopRow}>
                <View style={styles.summaryTagWrap}>
                  <View style={[styles.summaryDot, { backgroundColor: '#2563EB' }]} />
                  <Text style={[styles.summaryTagText, { color: '#2563EB' }]}>INFO</Text>
                </View>
                <Info size={15} color="#2563EB" />
              </View>
              <Text style={[styles.summaryCountText, { color: '#2563EB' }]}>
                {infoCount}
              </Text>
              <Text style={styles.summaryTimeText}>Since 00:00 hrs</Text>
              {selectedSeverityFilter === 'INFO' && (
                <View style={[styles.activeIndicatorBar, { backgroundColor: '#2563EB' }]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Vehicles under that Alert Category Container (Revealed on Box Click) */}
          {Boolean(selectedSeverityFilter) && (
            <View
              style={[
                styles.vehiclesUnderCard,
                selectedSeverityFilter === 'CRITICAL'
                  ? styles.vehiclesUnderCardCrit
                  : selectedSeverityFilter === 'WARNING'
                  ? styles.vehiclesUnderCardWarn
                  : styles.vehiclesUnderCardInfo,
              ]}
            >
              <View style={styles.vehiclesUnderHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  {selectedSeverityFilter === 'CRITICAL' ? (
                    <ShieldAlert size={16} color="#DC2626" />
                  ) : selectedSeverityFilter === 'WARNING' ? (
                    <AlertTriangle size={16} color="#D97706" />
                  ) : (
                    <Info size={16} color="#2563EB" />
                  )}
                  <Text
                    style={[
                      styles.vehiclesUnderTitle,
                      {
                        color:
                          selectedSeverityFilter === 'CRITICAL'
                            ? '#991B1B'
                            : selectedSeverityFilter === 'WARNING'
                            ? '#92400E'
                            : '#1E40AF',
                      },
                    ]}
                  >
                    VEHICLES UNDER {selectedSeverityFilter} ({vehiclesUnderCategory.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedSeverityFilter(null)}
                  style={styles.clearFilterPill}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearFilterPillText}>Show All</Text>
                  <X size={12} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.vehiclesUnderSub}>
                Fleet assets recording {selectedSeverityFilter?.toLowerCase()} telematics incidents since 00:00 hrs today. Tap any vehicle for action:
              </Text>

              {vehiclesUnderCategory.map((veh) => (
                <View key={veh.registration} style={styles.vehicleUnderItem}>
                  <View style={styles.vehItemTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Truck size={14} color={colors.primaryNavy} />
                      <Text style={styles.vehItemReg}>{veh.registration}</Text>
                      <View style={styles.vehModelBadge}>
                        <Text style={styles.vehModelText}>{veh.model}</Text>
                      </View>
                    </View>
                    <Text style={styles.vehItemTime}>{veh.eventTime}</Text>
                  </View>

                  <Text style={styles.vehItemAlertTitle}>{veh.latestAlert}</Text>
                  <Text style={styles.vehItemAlertSub} numberOfLines={1}>
                    {veh.alertSubtitle}
                  </Text>

                  <View style={styles.vehItemDriverLocRow}>
                    <Text style={styles.vehItemDriverText}>
                      Driver: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{veh.driverName}</Text>
                    </Text>
                    <Text style={styles.vehItemLocText} numberOfLines={1}>
                      📍 {veh.location}
                    </Text>
                  </View>

                  <View style={styles.vehItemActionRow}>
                    {veh.severity === 'CRITICAL' ? (
                      <TouchableOpacity
                        style={styles.triggerAlertBtn}
                        onPress={() => handleTriggerCriticalPopup(veh.alertItem)}
                        activeOpacity={0.8}
                      >
                        <ShieldAlert size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.triggerAlertBtnText}>🚨 Pop Up Alert & Sound</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.detailsAlertBtn}
                        onPress={() => setSelectedDetailAlert(veh.alertItem)}
                        activeOpacity={0.8}
                      >
                        <Info size={12} color="#1E3A8A" style={{ marginRight: 4 }} />
                        <Text style={styles.detailsAlertBtnText}>View Telemetry</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.trackMapBtn}
                      onPress={() => handleViewVehicleOnMap(veh.vehicleId)}
                      activeOpacity={0.8}
                    >
                      <MapPin size={12} color="#0F172A" style={{ marginRight: 4 }} />
                      <Text style={styles.trackMapBtnText}>Track on Map</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Warning / Info Telemetry Detail Modal */}
        {Boolean(selectedDetailAlert) && (
          <Modal
            transparent
            visible={Boolean(selectedDetailAlert)}
            animationType="fade"
            onRequestClose={() => setSelectedDetailAlert(null)}
          >
            <View style={styles.detailModalBackdrop}>
              <View style={styles.detailModalCard}>
                <View
                  style={[
                    styles.detailModalHeader,
                    {
                      backgroundColor:
                        selectedDetailAlert?.severity === 'WARNING' ? '#D97706' : '#2563EB',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {selectedDetailAlert?.severity === 'WARNING' ? (
                      <AlertTriangle size={18} color="#FFFFFF" />
                    ) : (
                      <Info size={18} color="#FFFFFF" />
                    )}
                    <Text style={styles.detailModalHeaderTitle}>
                      {selectedDetailAlert?.severity} TELEMETRY EVENT
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedDetailAlert(null)}
                    style={styles.detailModalClose}
                  >
                    <X size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailModalBody}>
                  <Text style={styles.detailModalReg}>
                    {selectedDetailAlert?.registration_number}
                  </Text>
                  <Text style={styles.detailModalTitle}>{selectedDetailAlert?.title}</Text>
                  <Text style={styles.detailModalSub}>{selectedDetailAlert?.subtitle}</Text>

                  <View style={styles.detailMetricsGrid}>
                    <View style={styles.detailMetricBox}>
                      <Text style={styles.detailMetricLabel}>Driver</Text>
                      <Text style={styles.detailMetricVal}>
                        {selectedDetailAlert?.driver_name || 'Assigned Driver'}
                      </Text>
                    </View>
                    <View style={styles.detailMetricBox}>
                      <Text style={styles.detailMetricLabel}>Recorded Speed</Text>
                      <Text style={styles.detailMetricVal}>
                        {selectedDetailAlert?.speed !== undefined
                          ? `${selectedDetailAlert.speed} km/h`
                          : 'Stationary'}
                      </Text>
                    </View>
                    <View style={styles.detailMetricBox}>
                      <Text style={styles.detailMetricLabel}>Time Logged</Text>
                      <Text style={styles.detailMetricVal}>
                        {selectedDetailAlert?.event_time}
                      </Text>
                    </View>
                    <View style={styles.detailMetricBox}>
                      <Text style={styles.detailMetricLabel}>Status</Text>
                      <Text style={styles.detailMetricVal}>
                        {selectedDetailAlert?.status || 'Active Log'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailLocBox}>
                    <MapPin size={14} color="#64748B" />
                    <Text style={styles.detailLocText}>{selectedDetailAlert?.address}</Text>
                  </View>

                  <View style={styles.detailModalBtnRow}>
                    <TouchableOpacity
                      style={styles.detailTrackBtn}
                      onPress={() => {
                        const vehId = selectedDetailAlert?.vehicle_id;
                        setSelectedDetailAlert(null);
                        handleViewVehicleOnMap(vehId);
                      }}
                      activeOpacity={0.8}
                    >
                      <MapPin size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.detailTrackBtnText}>Track Vehicle on Live Map</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailDismissBtn}
                      onPress={() => setSelectedDetailAlert(null)}
                    >
                      <Text style={styles.detailDismissBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  statusBreakdownSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  statusSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  viewFullListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewFullListText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  statusTabsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statusFilterPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  statusPillMovingActive: {
    backgroundColor: colors.statusMoving,
    borderColor: colors.statusMoving,
  },
  statusPillIdleActive: {
    backgroundColor: colors.statusIdle,
    borderColor: colors.statusIdle,
  },
  statusPillStoppedActive: {
    backgroundColor: colors.statusStopped,
    borderColor: colors.statusStopped,
  },
  statusPillOfflineActive: {
    backgroundColor: colors.statusDisconnected,
    borderColor: colors.statusDisconnected,
  },
  statusFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusFilterPillTextActive: {
    color: '#FFFFFF',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusVehiclesList: {
    marginBottom: 6,
  },
  emptyStatusWrap: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // 3 Summary Boxes: Critical, Warning, Info
  alertSummaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  alertSummaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  criticalSummaryBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  criticalSummaryBoxActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
  },
  warningSummaryBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  warningSummaryBoxActive: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
  },
  infoSummaryBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  infoSummaryBoxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
  },
  summaryBoxTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryCountText: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 1,
  },
  summaryTimeText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  activeIndicatorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },

  // Vehicles Under Selected Category
  vehiclesUnderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  vehiclesUnderCardCrit: {
    borderColor: '#F87171',
    backgroundColor: '#FFF8F8',
  },
  vehiclesUnderCardWarn: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFDF5',
  },
  vehiclesUnderCardInfo: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },
  vehiclesUnderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehiclesUnderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  clearFilterPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  vehiclesUnderSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 15,
  },
  vehicleUnderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehItemReg: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  vehModelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  vehModelText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  vehItemTime: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  vehItemAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  vehItemAlertSub: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 6,
  },
  vehItemDriverLocRow: {
    marginBottom: 8,
    gap: 2,
  },
  vehItemDriverText: {
    fontSize: 11,
    color: '#475569',
  },
  vehItemLocText: {
    fontSize: 10,
    color: '#64748B',
  },
  vehItemActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  triggerAlertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  triggerAlertBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsAlertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  detailsAlertBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  trackMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  trackMapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Detail Modal Styles
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.lg,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailModalHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  detailModalClose: {
    padding: 4,
  },
  detailModalBody: {
    padding: 16,
  },
  detailModalReg: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryNavy,
    marginBottom: 4,
  },
  detailModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  detailModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 16,
  },
  detailMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  detailMetricBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  detailMetricVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailLocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailLocText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  detailModalBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailTrackBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryNavy,
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailTrackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailDismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailDismissBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
