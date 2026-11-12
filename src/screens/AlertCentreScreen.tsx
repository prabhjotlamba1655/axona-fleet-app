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
  const { panicEvents, fetchPanicEvents } = useTelematicsStore();

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

  // Category 1: Critical Emergency
  panicEvents.forEach((p) => {
    unifiedAlerts.push({
      id: p.id,
      category: 'EMERGENCY',
      categoryName: '1. Critical Emergency',
      title: 'AIS-140 Panic SOS Triggered',
      code: 'Code 01 ($ALT)',
      vehicleReg: p.registration_number,
      vehicleId: p.vehicle_id,
      driverName: p.owner_name || 'Driver',
      severity: 'CRITICAL',
      eventTime: p.event_time,
      location: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      status: p.status,
      speed: p.speed,
      telemetryDetail: `Device IMEI: ${p.device_imei || '863124059123456'} • Speed: ${p.speed || 0} km/h`,
    });
  });

  // Category 2: Driver Intelligence
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

  // Category 5: Geofencing
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
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                onPress={() => setSelectedAlert(alert)}
                actionLabel="Details"
                onActionPress={() => setSelectedAlert(alert)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Alert Detailed Modal */}
      <Modal visible={Boolean(selectedAlert)} transparent animationType="fade">
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
      </Modal>
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
});
