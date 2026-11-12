import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  FileText,
  Download,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  Search,
  ChevronDown,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { useTelematicsStore } from '../store/telematicsStore';
import { ReportType } from '../types';

interface EnterpriseReportsScreenProps {
  navigation: any;
  route: any;
}

const REPORT_DEFINITIONS: { id: ReportType; title: string; desc: string; columns: string[] }[] = [
  {
    id: 'movement',
    title: '1. Vehicle Movement & Breadcrumbs',
    desc: 'Second-by-second chronological breadcrumb audit of speed, heading, and ignition.',
    columns: ['Timestamp', 'Vehicle Reg', 'Speed', 'Ignition', 'Heading', 'Address', 'OSM Link'],
  },
  {
    id: 'trips',
    title: '2. Trip Summary & En-Route Stoppages',
    desc: 'Completed vehicle journeys, distances, and stoppage counts (> 3 min).',
    columns: ['Trip ID', 'Vehicle', 'Departure', 'Arrival', 'Distance', 'Stoppage Duration', 'OSM Route'],
  },
  {
    id: 'distance',
    title: '3. Distance Travelled (Mileage Summary)',
    desc: 'Aggregates daily, weekly, and monthly odometer kilometers travelled per vehicle.',
    columns: ['Date', 'Vehicle Reg', 'Model', 'Start Odo', 'End Odo', 'Total Run', 'Engine Run Hrs', 'Idle Hrs'],
  },
  {
    id: 'overspeeding',
    title: '4. Overspeeding Violation Audit',
    desc: 'Statutory speed threshold breach events with duration and recorded speed.',
    columns: ['Time', 'Vehicle Reg', 'Driver', 'Speed Recorded', 'Allowed Limit', 'Duration', 'Location'],
  },
  {
    id: 'panic',
    title: '5. Panic SOS & Emergency Audit',
    desc: 'AIS-140 emergency activations, operator acknowledgement latency and resolution audit.',
    columns: ['Trigger Time', 'Vehicle Reg', 'Driver', 'Operator Ack', 'Response Time', 'Resolution Remarks'],
  },
  {
    id: 'device-health',
    title: '6. GPS Device Health & Tamper',
    desc: 'Main battery cuts (0V), backup battery %, tamper switch, and antenna disconnects.',
    columns: ['Time', 'Vehicle Reg', 'IMEI', 'Health Event', 'Main Battery V', 'Backup %', 'Tamper'],
  },
  {
    id: 'geofence',
    title: '7. Geofence In/Out & Dwell Time',
    desc: 'Vehicle entry arrival, departure exit, and dwell times across defined depots and bays.',
    columns: ['Entry Time', 'Exit Time', 'Dwell Duration', 'Vehicle Reg', 'Geofence Zone', 'Status'],
  },
  {
    id: 'driver-intelligence',
    title: '8. Driver Intelligence & Safety',
    desc: 'Harsh braking, acceleration surge, vehicle tilt, and rash cornering G-force incidents.',
    columns: ['Time', 'Vehicle Reg', 'Driver', 'Dimension', 'G-Force Value', 'Threshold', 'Score Penalty'],
  },
];

export const EnterpriseReportsScreen: React.FC<EnterpriseReportsScreenProps> = ({
  navigation,
  route,
}) => {
  const { vehicles, fetchVehicles } = useTelematicsStore();

  const [activeReportType, setActiveReportType] = useState<ReportType>(
    route?.params?.reportType || 'movement'
  );
  const [selectedPreset, setSelectedPreset] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchVehicles();
    loadReport();
  }, [activeReportType, selectedPreset, selectedVehicleId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getReport(activeReportType, {
        preset: selectedPreset,
        vehicleId: selectedVehicleId || undefined,
      });
      setReportData(res?.data || []);
    } catch (e: any) {
      Alert.alert('Query Error', e.message || 'Report query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvUrl = api.reports.getCsvUrl(activeReportType, {
      preset: selectedPreset,
      vehicleId: selectedVehicleId || undefined,
    });

    if (Platform.OS === 'web') {
      window.open(csvUrl, '_blank');
    } else {
      Linking.openURL(csvUrl);
    }
  };

  const currentDef = REPORT_DEFINITIONS.find((r) => r.id === activeReportType) || REPORT_DEFINITIONS[0];

  const filteredRows = reportData.filter((row) => {
    if (!searchFilter.trim()) return true;
    const str = JSON.stringify(row).toLowerCase();
    return str.includes(searchFilter.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Report Selector Card */}
        <View style={styles.selectorCard}>
          <Text style={styles.selectorHeading}>SELECT PRD COMPLIANCE REPORT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            {REPORT_DEFINITIONS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.reportTab,
                  activeReportType === r.id && styles.reportTabActive,
                ]}
                onPress={() => setActiveReportType(r.id)}
              >
                <Text
                  style={[
                    styles.reportTabText,
                    activeReportType === r.id && styles.reportTabTextActive,
                  ]}
                >
                  {r.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.reportDesc}>{currentDef.desc}</Text>
        </View>

        {/* 90-Day Policy Preset Controls & Export */}
        <View style={styles.controlsCard}>
          <View style={styles.controlsHeader}>
            <View style={styles.titleWrap}>
              <Calendar size={14} color={colors.primaryNavy} />
              <Text style={styles.controlsTitle}>TIME HORIZON (MAX 90 DAYS)</Text>
            </View>

            <TouchableOpacity style={styles.csvExportBtn} onPress={handleExportCSV}>
              <Download size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.csvExportText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetRow}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days (Max)' },
            ].map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.presetPill,
                  selectedPreset === p.id && styles.presetPillActive,
                ]}
                onPress={() => setSelectedPreset(p.id as any)}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    selectedPreset === p.id && styles.presetPillTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Search */}
          <View style={styles.searchBar}>
            <Search size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search records in generated audit report..."
              placeholderTextColor={colors.textMuted}
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
          </View>
        </View>

        {/* Report Output Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableTitle}>
              {currentDef.title.toUpperCase()} ({filteredRows.length} RECORDS)
            </Text>
            <Text style={styles.auditStamp}>90-Day Indexed Time-Series</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 30 }} />
          ) : filteredRows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No records returned for the requested parameters.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View style={styles.thRow}>
                  {currentDef.columns.map((col, idx) => (
                    <Text key={idx} style={[styles.thCell, idx === 0 && { width: 140 }]}>
                      {col}
                    </Text>
                  ))}
                </View>

                {/* Table Rows */}
                {filteredRows.slice(0, 100).map((row, rIdx) => {
                  const lat = row.latitude;
                  const lon = row.longitude;
                  const osmUrl =
                    lat && lon
                      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
                      : null;

                  return (
                    <View
                      key={rIdx}
                      style={[styles.trRow, rIdx % 2 === 1 && styles.trRowAlt]}
                    >
                      <Text style={[styles.tdCell, { width: 140 }]}>
                        {row.timestamp || row.start_time || row.event_time || row.violation_time || row.entry_timestamp || row.date || 'Record'}
                      </Text>
                      <Text style={styles.tdCell}>
                        {row.vehicle_registration || row.registration_number || 'N/A'}
                      </Text>
                      <Text style={styles.tdCell}>
                        {row.speed !== undefined
                          ? `${row.speed} km/h`
                          : row.distance_km !== undefined
                          ? `${row.distance_km} km`
                          : row.incident_dimension || row.event_type || row.health_event_type || row.driver_name || '-'}
                      </Text>
                      <Text style={styles.tdCell}>
                        {row.ignition !== undefined
                          ? row.ignition === 1 ? 'ON' : 'OFF'
                          : row.duration_minutes !== undefined
                          ? `${row.duration_minutes}m`
                          : row.total_run_km !== undefined
                          ? `${row.total_run_km} km`
                          : row.speed_recorded !== undefined
                          ? `${row.speed_recorded} km/h`
                          : row.hardware_value || row.dwell_duration || '-'}
                      </Text>
                      <Text style={styles.tdCell}>
                        {row.heading !== undefined
                          ? `${row.heading}°`
                          : row.total_stops !== undefined
                          ? `${row.total_stops} stops`
                          : row.allowed_speed !== undefined
                          ? `${row.allowed_speed} km/h`
                          : row.operator_acknowledged || row.main_battery_voltage || row.calibrated_threshold || '-'}
                      </Text>
                      <Text style={[styles.tdCell, { maxWidth: 160 }]} numberOfLines={1}>
                        {row.location_address || row.address || row.destination || row.resolution_remarks || row.action_required || '-'}
                      </Text>
                      <View style={styles.tdCell}>
                        {osmUrl ? (
                          <TouchableOpacity
                            onPress={() => {
                              if (Platform.OS === 'web') window.open(osmUrl, '_blank');
                              else Linking.openURL(osmUrl);
                            }}
                            style={styles.osmLinkBtn}
                          >
                            <Text style={styles.osmLinkText}>View on OSM</Text>
                            <ExternalLink size={10} color={colors.accentBlue} />
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.metaSub}>-</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
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
  selectorCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  selectorHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tabScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reportTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  reportTabActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  reportTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  reportTabTextActive: {
    color: '#FFFFFF',
  },
  reportDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  controlsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  csvExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusMoving,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  csvExportText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  presetPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  presetPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    padding: 0,
  },
  tableCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  auditStamp: {
    fontSize: 10,
    color: colors.textMuted,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  thCell: {
    width: 120,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryNavy,
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  trRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdCell: {
    width: 120,
    fontSize: 11,
    color: colors.textPrimary,
  },
  osmLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  osmLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  metaSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
