import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ShieldAlert,
  Filter,
  Search,
  AlertTriangle,
  Zap,
  Battery,
  MapPin,
  X,
  Layers,
  ChevronRight,
  Volume2,
  Truck,
  BellRing,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { AlertCard } from '../components/AlertCard';
import { MapView } from '../components/MapView';
import { api } from '../services/api';
import { useTelematicsStore } from '../store/telematicsStore';

interface AlertCentreScreenProps {
  navigation: any;
  route: any;
}

export const AlertCentreScreen: React.FC<AlertCentreScreenProps> = ({
  navigation,
  route,
}) => {
  const { panicEvents, fetchPanicEvents, simulateCriticalAlert, triggerCriticalPopup } =
    useTelematicsStore();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [driverEvents, setDriverEvents] = useState<any[]>([]);
  const [geofenceEvents, setGeofenceEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllAlerts();
  }, []);

  const loadAllAlerts = async () => {
    try {
      setLoading(true);
      const [dEvents, gEvents] = await Promise.all([
        api.driverIntelligence.getEvents({ limit: 50 }),
        api.geofences.getEvents(30),
      ]);
      setDriverEvents(dEvents || []);
      setGeofenceEvents(gEvents || []);
      await fetchPanicEvents();
    } catch (e) {
      console.warn('Alerts fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Compile full unified alert catalog per PRD Section 6 & 14
  const unifiedAlerts: any[] = [];

  // 1. Critical SOS Alerts
  panicEvents.forEach((p) => {
    unifiedAlerts.push({
      id: p.id,
      category: 'EMERGENCY',
      categoryName: '1. Critical SOS',
      title: 'AIS-140 Panic SOS Triggered',
      code: 'Code 01 ($ALT)',
      vehicleReg: p.registration_number,
      vehicleId: p.vehicle_id,
      driverName: p.owner_name || 'Ramesh Kumar',
      severity: 'CRITICAL',
      eventTime: p.event_time,
      location: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status,
      speed: p.speed,
      soundType: 'siren',
      telemetryDetail: `Device IMEI: ${p.device_imei || '863124059123456'} • Speed: ${p.speed || 0} km/h`,
    });
  });

  // 2. Unauthorized Towing Alert
  unifiedAlerts.push({
    id: 'alert_towing_1',
    category: 'MOVEMENT',
    categoryName: '4. Motion & Ignition',
    title: 'Unauthorized Vehicle Towing Detected',
    code: 'Code 25 (TOW)',
    vehicleReg: 'MH-14-DT-7711',
    vehicleId: 'veh_5',
    driverName: 'Suresh Patil',
    severity: 'CRITICAL',
    eventTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    location: 'Near Hinjawadi Phase 2 Depot, Pune (18.5872, 73.7420)',
    latitude: 18.5872,
    longitude: 73.7420,
    status: 'Active Security Alert',
    speed: 18.5,
    soundType: 'towing',
    telemetryDetail: 'Engine Ignition OFF • Speed: 18.5 km/h • Towing Detection Active',
  });

  // 3. Vehicle Tilt / Rollover Hazard Alert
  unifiedAlerts.push({
    id: 'alert_tilt_1',
    category: 'DRIVER',
    categoryName: '2. Driver Intelligence',
    title: 'Vehicle Tilt / Rollover Hazard (48.5°)',
    code: 'Code 22 (TI)',
    vehicleReg: 'MH-12-PQ-9081',
    vehicleId: 'veh_2',
    driverName: 'Vikramaditya Rao',
    severity: 'CRITICAL',
    eventTime: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    location: 'Ghat Section km 32, Katraj Bypass, Pune',
    latitude: 18.4520,
    longitude: 73.8640,
    status: 'Hazard Alert',
    speed: 36.2,
    soundType: 'tilt',
    telemetryDetail: 'Angular Lean: 48.5° (Safety Limit: 45.0°) • Bosch 3-Axis MEMS',
  });

  // 4. Geofence Exit Alert
  unifiedAlerts.push({
    id: 'alert_geo_exit_1',
    category: 'GEOFENCE',
    categoryName: '5. Geofencing',
    title: 'Geofence Perimeter Breach: Zone Departure',
    code: 'Code 21 (GO)',
    vehicleReg: 'MH-12-RN-2024',
    vehicleId: 'veh_1',
    driverName: 'Ramesh Kumar',
    severity: 'CRITICAL',
    eventTime: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    location: 'Perimeter Gate 2, Apex Hinjawadi Central Logistics Hub',
    latitude: 18.5940,
    longitude: 73.7410,
    status: 'Recorded',
    speed: 28.0,
    soundType: 'geofence',
    telemetryDetail: 'Departed Apex Hinjawadi Hub without outbound gate clearance',
  });

  // 5. Geofence Entry Alert
  unifiedAlerts.push({
    id: 'alert_geo_entry_1',
    category: 'GEOFENCE',
    categoryName: '5. Geofencing',
    title: 'Geofence Breach: Restricted Zone Entry',
    code: 'Code 20 (GI)',
    vehicleReg: 'MH-14-DT-7711',
    vehicleId: 'veh_5',
    driverName: 'Suresh Patil',
    severity: 'CRITICAL',
    eventTime: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    location: 'FC Road / Shivaji Nagar Restricted Heavy Corridor',
    latitude: 18.5204,
    longitude: 73.8567,
    status: 'Recorded',
    speed: 32.4,
    soundType: 'geofence',
    telemetryDetail: 'Heavy vehicle entered restricted municipal corridor during peak hours',
  });

  // 6. Hardware Tamper & Power Cut Alert
  unifiedAlerts.push({
    id: 'alert_tamper_1',
    category: 'HARDWARE',
    categoryName: '3. Hardware & Tamper',
    title: 'Main Battery Cut & Tamper Switch Activated',
    code: 'Code 09 (TP)',
    vehicleReg: 'MH-14-DT-7711',
    vehicleId: 'veh_5',
    driverName: 'Suresh Patil',
    severity: 'CRITICAL',
    eventTime: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    location: 'Apex Depot Bay 4, Nigdi (18.6298, 73.7997)',
    latitude: 18.6298,
    longitude: 73.7997,
    status: 'Hardware Alert',
    telemetryDetail: 'External 24V line disconnected • Internal backup battery active (92%)',
  });

  // 7. Driver Intelligence Events from API
  driverEvents.forEach((d) => {
    unifiedAlerts.push({
      id: d.id,
      category: 'DRIVER',
      categoryName: '2. Driver Intelligence',
      title: d.event_type ? d.event_type.replace('_', ' ') : 'Driver IMU Event',
      code: d.event_type === 'HARSH_BRAKING' ? 'Code 13 (HB)' : d.event_type === 'HARSH_ACCEL' ? 'Code 14 (HA)' : d.event_type === 'VEHICLE_TILT' ? 'Code 22 (TI)' : 'Code 15 (RT)',
      vehicleReg: d.registration_number,
      vehicleId: d.vehicle_id,
      driverName: 'Assigned Driver',
      severity: d.severity || 'WARNING',
      eventTime: d.event_time,
      location: d.address,
      latitude: d.latitude,
      longitude: d.longitude,
      status: 'Logged',
      speed: d.speed_recorded,
      telemetryDetail: d.g_force_value ? `Recorded G-Force: ${d.g_force_value}g` : `Speed: ${d.speed_recorded || 0} km/h`,
    });
  });

  // 8. Dynamic Geofence Events from API
  geofenceEvents.forEach((g) => {
    unifiedAlerts.push({
      id: g.id,
      category: 'GEOFENCE',
      categoryName: '5. Geofencing',
      title: g.event_type === 'ENTRY' ? 'Geofence Zone Entry' : 'Geofence Zone Departure',
      code: g.event_type === 'ENTRY' ? 'Code 20 (GI)' : 'Code 21 (GO)',
      vehicleReg: g.registration_number,
      vehicleId: g.vehicle_id,
      driverName: g.driver_name || 'Operator',
      severity: g.event_type === 'EXIT' ? 'WARNING' : 'INFO',
      eventTime: g.event_time,
      location: `Zone: ${g.geofence_name}`,
      status: 'Recorded',
      telemetryDetail: g.dwell_duration_min ? `Dwell Time: ${g.dwell_duration_min} min` : 'Perimeter crossed',
    });
  });

  // Sort descending by eventTime
  unifiedAlerts.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());

  // Apply filters
  const filteredAlerts = unifiedAlerts.filter((a) => {
    if (activeCategory !== 'ALL' && a.category !== activeCategory) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.vehicleReg?.toLowerCase().includes(q) ||
        a.title?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="ALERT CENTRE"
        subtitle="AIS-140 Statutory Events"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Interactive Critical Alert Popup & Sound Test Bar */}
        <View style={styles.criticalTestCard}>
          <View style={styles.criticalTestHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BellRing size={16} color={colors.criticalRed} />
              <Text style={styles.criticalTestTitle}>CRITICAL ALERTS POPUP & AUDIO SOUND DEMO</Text>
            </View>
            <View style={styles.liveSoundPill}>
              <Volume2 size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
              <Text style={styles.liveSoundPillText}>Web Audio ON</Text>
            </View>
          </View>
          <Text style={styles.criticalTestSub}>
            Tap any critical trigger below to test full-screen pop-up alert with synthesized audio sound:
          </Text>

          <View style={styles.criticalTestBtnRow}>
            <TouchableOpacity
              style={[styles.criticalTestBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => simulateCriticalAlert('SOS')}
              activeOpacity={0.8}
            >
              <ShieldAlert size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.criticalTestBtnText}>🚨 SOS Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.criticalTestBtn, { backgroundColor: '#EA580C' }]}
              onPress={() => simulateCriticalAlert('TOWING')}
              activeOpacity={0.8}
            >
              <Truck size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.criticalTestBtnText}>🛞 Towing Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.criticalTestBtn, { backgroundColor: '#B91C1C' }]}
              onPress={() => simulateCriticalAlert('TILT')}
              activeOpacity={0.8}
            >
              <AlertTriangle size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.criticalTestBtnText}>⚠️ Tilt (48.5°)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.criticalTestBtn, { backgroundColor: '#D97706' }]}
              onPress={() => simulateCriticalAlert('GEOFENCE_EXIT')}
              activeOpacity={0.8}
            >
              <MapPin size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.criticalTestBtnText}>📍 Geofence Exit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.criticalTestBtn, { backgroundColor: '#0284C7' }]}
              onPress={() => simulateCriticalAlert('GEOFENCE_ENTRY')}
              activeOpacity={0.8}
            >
              <MapPin size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.criticalTestBtnText}>📍 Geofence Entry</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header Controls */}
        <View style={styles.filterBox}>
          {/* Search */}
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter alerts by vehicle, title, location..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* PRD Categories Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {[
              { id: 'ALL', label: 'All Categories' },
              { id: 'EMERGENCY', label: '1. Critical SOS' },
              { id: 'DRIVER', label: '2. Driver Intelligence' },
              { id: 'HARDWARE', label: '3. Hardware & Tamper' },
              { id: 'MOVEMENT', label: '4. Motion & Ignition' },
              { id: 'GEOFENCE', label: '5. Geofencing' },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catTab,
                  activeCategory === cat.id && styles.catTabActive,
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.catTabText,
                    activeCategory === cat.id && styles.catTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Severity Pills */}
          <View style={styles.severityRow}>
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.sevPill,
                  severityFilter === sev && styles.sevPillActive,
                ]}
                onPress={() => setSeverityFilter(sev)}
              >
                <Text
                  style={[
                    styles.sevPillText,
                    severityFilter === sev && styles.sevPillTextActive,
                  ]}
                >
                  {sev}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alerts List */}
        <View style={styles.listSection}>
          <Text style={styles.listHeading}>
            INCIDENTS & LOGS ({filteredAlerts.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 20 }} />
          ) : filteredAlerts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No alerts matching current filters.</Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                id={alert.id}
                type={alert.category}
                title={alert.title}
                vehicleReg={alert.vehicleReg}
                driverName={alert.driverName}
                severity={alert.severity}
                eventTime={alert.eventTime}
                location={alert.location}
                status={alert.status}
                onPress={() => {
                  if (alert.severity === 'CRITICAL') {
                    triggerCriticalPopup({
                      id: alert.id,
                      type: alert.soundType === 'siren' ? 'SOS' : alert.soundType === 'towing' ? 'TOWING' : alert.soundType === 'tilt' ? 'TILT' : alert.soundType === 'geofence' ? 'GEOFENCE_EXIT' : alert.soundType === 'tamper' ? 'TAMPER' : 'SOS',
                      title: alert.title.toUpperCase(),
                      subtitle: alert.telemetryDetail || 'Critical threshold breach detected on fleet asset',
                      severity: 'CRITICAL',
                      vehicleReg: alert.vehicleReg,
                      vehicleId: alert.vehicleId,
                      driverName: alert.driverName,
                      location: alert.location,
                      timestamp: new Date(alert.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      latitude: alert.latitude || 18.5912,
                      longitude: alert.longitude || 73.7389,
                      speed: alert.speed || 0,
                      metrics: [
                        { label: 'Category', value: alert.categoryName, isHighlight: true },
                        { label: 'AIS-140 Code', value: alert.code },
                        { label: 'Status', value: alert.status },
                        { label: 'Recorded Speed', value: `${alert.speed || 0} km/h` },
                      ],
                      soundType: alert.soundType || 'siren',
                    });
                  } else {
                    setSelectedAlert(alert);
                  }
                }}
                actionLabel="Details"
                onActionPress={() => setSelectedAlert(alert)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Alert Detailed Modal */}
      {Boolean(selectedAlert) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalReg}>{selectedAlert?.vehicleReg}</Text>
                <Text style={styles.modalTitle}>{selectedAlert?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAlert(null)} style={styles.modalClose}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedAlert?.latitude && selectedAlert?.longitude && (
              <View style={styles.modalMapBox}>
                <MapView
                  vehicles={[
                    {
                      vehicle_id: selectedAlert.vehicleId || 'veh_1',
                      registration_number: selectedAlert.vehicleReg,
                      make: 'Asset',
                      model: '',
                      latitude: selectedAlert.latitude,
                      longitude: selectedAlert.longitude,
                      speed: selectedAlert.speed || 0,
                      heading: 0,
                      ignition: 1,
                      movement_status: selectedAlert.severity === 'CRITICAL' ? 'emergency' : 'stopped',
                      panic_status: selectedAlert.severity === 'CRITICAL' ? 1 : 0,
                      gps_time: selectedAlert.eventTime,
                    },
                  ]}
                  center={[selectedAlert.latitude, selectedAlert.longitude]}
                  zoom={15}
                  height={160}
                />
              </View>
            )}

            <View style={styles.modalGrid}>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>PRD Category</Text>
                <Text style={styles.modalVal}>{selectedAlert?.categoryName || 'Telematics'}</Text>
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>AIS-140 Code</Text>
                <Text style={styles.modalVal}>{selectedAlert?.code || 'Table 4 ($ALT)'}</Text>
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>Timestamp</Text>
                <Text style={styles.modalVal}>
                  {selectedAlert?.eventTime ? new Date(selectedAlert.eventTime).toLocaleString() : ''}
                </Text>
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>Current Status</Text>
                <Text style={styles.modalVal}>{selectedAlert?.status || 'Logged'}</Text>
              </View>
              <View style={[styles.modalCol, { width: '100%' }]}>
                <Text style={styles.modalLabel}>Telemetry Context</Text>
                <Text style={styles.modalVal}>{selectedAlert?.telemetryDetail || 'Sensor packet ingested'}</Text>
              </View>
              <View style={[styles.modalCol, { width: '100%' }]}>
                <Text style={styles.modalLabel}>Location Address</Text>
                <Text style={styles.modalVal}>{selectedAlert?.location || 'GPS Waypoint logged'}</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              {selectedAlert?.category === 'EMERGENCY' ? (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: colors.criticalRed }]}
                  onPress={() => {
                    setSelectedAlert(null);
                    navigation.navigate('PanicSos');
                  }}
                >
                  <Text style={styles.modalActionText}>Open SOS Resolution Desk</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: colors.primaryNavy }]}
                  onPress={() => {
                    setSelectedAlert(null);
                    navigation.navigate('LiveMap', { vehicleId: selectedAlert.vehicleId });
                  }}
                >
                  <Text style={styles.modalActionText}>Track Vehicle on Live Map</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
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
  filterBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  catTabActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catTabTextActive: {
    color: '#FFFFFF',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevPill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  sevPillActive: {
    backgroundColor: colors.secondaryNavy,
  },
  sevPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sevPillTextActive: {
    color: '#FFFFFF',
  },
  listSection: {
    marginTop: 4,
  },
  listHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  emptyWrap: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 25, 47, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    maxWidth: 420,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalReg: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.criticalRed,
    marginTop: 2,
  },
  modalClose: {
    padding: 4,
  },
  modalMapBox: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    marginBottom: 14,
  },
  modalCol: {
    width: '50%',
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  modalVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  modalActionBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Critical Popup & Audio Demo Banner Styles */
  criticalTestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginBottom: 10,
    ...shadows.subtle,
  },
  criticalTestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  criticalTestTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: colors.primaryNavy,
    letterSpacing: 0.3,
  },
  liveSoundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.criticalRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveSoundPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  criticalTestSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 13,
  },
  criticalTestBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  criticalTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    ...shadows.subtle,
  },
  criticalTestBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
