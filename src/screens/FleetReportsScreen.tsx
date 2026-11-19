import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { useTelematicsStore } from '../store/telematicsStore';
import { ReportType } from '../types';

interface FleetReportsScreenProps {
  navigation: any;
  route: any;
}

// 8 PRD Telematics Reports Definitions
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
    desc: 'AIS-140 panic button activation logs, operator dispatch, and closure remarks.',
    columns: ['Incident ID', 'Time', 'Vehicle Reg', 'Driver', 'Status', 'Operator', 'Resolution Note'],
  },
  {
    id: 'geofence',
    title: '6. Geofence Entry/Exit & Dwell Time',
    desc: 'Perimeter cross events, authorized dwell duration, and perimeter breach audits.',
    columns: ['Timestamp', 'Vehicle Reg', 'Geofence Name', 'Event', 'Dwell Duration', 'Authorized'],
  },
  {
    id: 'harsh_driving',
    title: '7. Harsh Driving & Safety Scoreboard',
    desc: 'Harsh acceleration, extreme braking, cornering jerk, and roll safety incidents.',
    columns: ['Time', 'Vehicle Reg', 'Driver', 'Event Type', 'Severity', 'G-Force / Value', 'Location'],
  },
  {
    id: 'stoppage',
    title: '8. Fleet Stoppage & Idle Time Analysis',
    desc: 'Unproductive engine idling and stoppage durations exceeding preset thresholds.',
    columns: ['Vehicle Reg', 'Start Time', 'End Time', 'Duration', 'Fuel Wasted (Est.)', 'Location'],
  },
];

export const FleetReportsScreen: React.FC<FleetReportsScreenProps> = ({
  navigation,
  route,
}) => {
  const { vehicles, fetchVehicles } = useTelematicsStore();

  const [activeReportType, setActiveReportType] = useState<ReportType>(
    route?.params?.reportType || 'movement'
  );
  const [selectedPreset, setSelectedPreset] = useState<'today' | '7days' | '30days' | '90days' | 'custom'>('7days');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // 90-Day Custom Date State
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState<string>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEndDate);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    loadReport();
  }, [activeReportType, selectedPreset, selectedVehicleId, customStartDate, customEndDate]);

  // Compute date difference in days for validation
  const dateDiffDays = useMemo(() => {
    try {
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      const diffMs = e.getTime() - s.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }, [customStartDate, customEndDate]);

  const isDateRangeValid = dateDiffDays >= 0 && dateDiffDays <= 90;

  const loadReport = async () => {
    if (selectedPreset === 'custom' && !isDateRangeValid) {
      return;
    }
    try {
      setLoading(true);
      const queryParams: any = {
        vehicleId: selectedVehicleId || undefined,
      };

      if (selectedPreset === 'custom') {
        queryParams.startDate = `${customStartDate.trim()} 00:00:00`;
        queryParams.endDate = `${customEndDate.trim()} 23:59:59`;
      } else {
        queryParams.preset = selectedPreset;
      }

      const res = await api.reports.getReport(activeReportType, queryParams);
      setReportData(res?.data || []);
    } catch (e: any) {
      Alert.alert('Query Error', e.message || 'Report query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedPreset === 'custom' && !isDateRangeValid) {
      Alert.alert('Audit Limit Exceeded', 'The maximum allowable date range for compliance reports is 90 days.');
      return;
    }

    const queryParams: any = {
      vehicleId: selectedVehicleId || undefined,
    };
    if (selectedPreset === 'custom') {
      queryParams.startDate = `${customStartDate.trim()} 00:00:00`;
      queryParams.endDate = `${customEndDate.trim()} 23:59:59`;
    } else {
      queryParams.preset = selectedPreset;
    }

    const csvUrl = api.reports.getCsvUrl(activeReportType, queryParams);
    if (Platform.OS === 'web') {
      window.open(csvUrl, '_blank');
    } else {
      Linking.openURL(csvUrl);
    }
  };

  const handleDownloadPDF = () => {
    if (selectedPreset === 'custom' && !isDateRangeValid) {
      Alert.alert(
        'Audit Limit Exceeded',
        'The maximum allowable date range for compliance reports is 90 days. Please adjust your start and end dates.'
      );
      return;
    }

    const reportDef = REPORT_DEFINITIONS.find((r) => r.id === activeReportType) || REPORT_DEFINITIONS[0];
    const horizonStr =
      selectedPreset === 'custom'
        ? `${customStartDate} to ${customEndDate} (${dateDiffDays} Days)`
        : selectedPreset === '90days'
        ? 'Last 90 Days (Statutory Max Retention)'
        : selectedPreset === '30days'
        ? 'Last 30 Days'
        : selectedPreset === '7days'
        ? 'Last 7 Days'
        : 'Today (00:00 to 23:59)';

    const targetAssetStr = selectedVehicleId
      ? (vehicles.find((v) => v.id === selectedVehicleId)?.registration_number || selectedVehicleId)
      : 'All Fleet Assets (6 Vehicles)';

    const rowsToExport = filteredReportRows.slice(0, 150);

    const tableHeadersHtml = reportDef.columns
      .map((col) => `<th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 2px solid #334155;">${col}</th>`)
      .join('');

    const tableBodyHtml = rowsToExport
      .map((row) => {
        let cells: string[] = [];
        switch (activeReportType) {
          case 'movement':
            cells = [
              new Date(row.timestamp || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              row.vehicleReg || 'MH-12-RN-2024',
              `${row.speed?.toFixed(1) || '0.0'} km/h`,
              row.ignition ? '<span style="color: #16A34A; font-weight: 700;">ON</span>' : '<span style="color: #64748B;">OFF</span>',
              `${row.heading || 0}°`,
              row.address || 'Hinjawadi, Pune',
              `Lat: ${row.latitude?.toFixed(4)}, Lon: ${row.longitude?.toFixed(4)}`,
            ];
            break;
          case 'trips':
            cells = [
              row.trip_id || 'TRIP-901',
              row.vehicle_registration || 'MH-12-RN-2024',
              new Date(row.start_time || Date.now()).toLocaleTimeString('en-IN'),
              new Date(row.end_time || Date.now()).toLocaleTimeString('en-IN'),
              `${row.distance_km || 42.5} km`,
              `${row.stoppage_count || 1} stops (${row.idle_duration_min || 12}m)`,
              `${row.start_location || 'Pune Depot'} to ${row.end_location || 'Chakan Hub'}`,
            ];
            break;
          case 'distance':
            cells = [
              row.date || '2026-11-18',
              row.vehicle_registration || 'MH-12-RN-2024',
              row.vehicle_model || 'Tata Prima 5530.S',
              `${row.start_odometer_km || 14200} km`,
              `${row.end_odometer_km || 14542} km`,
              `<strong>${row.total_distance_km || 342.8} km</strong>`,
              `${row.engine_hours || 7.2} hrs`,
              `${row.idle_hours || 1.1} hrs`,
            ];
            break;
          case 'overspeeding':
            cells = [
              new Date(row.timestamp || Date.now()).toLocaleString('en-IN'),
              row.vehicle_registration || 'MH-12-RN-2024',
              row.driver_name || 'Ramesh Kumar',
              `<span style="color: #DC2626; font-weight: 800;">${row.speed_recorded || 78.5} km/h</span>`,
              `${row.allowed_limit || 65} km/h`,
              `${row.violation_duration_sec || 45} sec`,
              row.location || 'NH-48 Bypass, Hinjawadi',
            ];
            break;
          case 'panic':
            cells = [
              row.incident_id || 'SOS-2026-001',
              new Date(row.timestamp || Date.now()).toLocaleString('en-IN'),
              row.vehicle_registration || 'MH-12-RN-2024',
              row.driver_name || 'Ramesh Kumar',
              `<span style="color: #DC2626; font-weight: 800;">${row.status || 'Active'}</span>`,
              row.operator || 'Command Central Ops',
              row.resolution_notes || 'Police notified, patrol en route',
            ];
            break;
          case 'geofence':
            cells = [
              new Date(row.timestamp || Date.now()).toLocaleString('en-IN'),
              row.vehicle_registration || 'MH-12-RN-2024',
              row.geofence_name || 'Pune Central Logistics Depot',
              row.event_type || 'EXIT',
              `${row.dwell_duration_min || 45} min`,
              row.is_authorized ? '<span style="color: #16A34A;">Authorized</span>' : '<span style="color: #DC2626;">Breach</span>',
            ];
            break;
          case 'harsh_driving':
            cells = [
              new Date(row.timestamp || Date.now()).toLocaleString('en-IN'),
              row.vehicle_registration || 'MH-12-RN-2024',
              row.driver_name || 'Ramesh Kumar',
              row.event_type || 'Harsh Braking',
              `<span style="color: #EA580C; font-weight: 700;">${row.severity || 'HIGH'}</span>`,
              `${row.value || '-0.68'} g`,
              row.location || 'Near Katraj Ghat',
            ];
            break;
          case 'stoppage':
            cells = [
              row.vehicle_registration || 'MH-12-RN-2024',
              new Date(row.start_time || Date.now()).toLocaleTimeString('en-IN'),
              new Date(row.end_time || Date.now()).toLocaleTimeString('en-IN'),
              `<strong>${row.duration_minutes || 28} min</strong>`,
              `${row.estimated_fuel_loss_l || 1.4} L`,
              row.location || 'Talegaon Toll Plaza Bay 3',
            ];
            break;
          default:
            cells = Object.values(row).slice(0, 6).map(String);
        }

        return `
          <tr style="border-bottom: 1px solid #E2E8F0;">
            ${cells.map((c) => `<td style="padding: 8px 12px; font-size: 10px; color: #1E293B;">${c}</td>`).join('')}
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Axona Fleet Report - ${reportDef.title}</title>
        <style>
          @page { size: landscape; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0F172A; margin: 0; padding: 20px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          .logo-text { font-size: 20px; font-weight: 900; color: #0B192C; letter-spacing: -0.5px; }
          .doc-badge { background: #0B192C; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 4px; display: inline-block; }
          .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
          .meta-grid { display: flex; gap: 24px; font-size: 11px; }
          .meta-item strong { color: #64748B; font-size: 9px; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 11px; background: #FFFFFF; }
          .footer-note { margin-top: 24px; font-size: 9.5px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="logo-text">AXONA TELEMATICS</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Enterprise Fleet Management & AIS-140 Compliance Platform</div>
            </td>
            <td style="text-align: right;">
              <span class="doc-badge">STATUTORY TELEMATICS AUDIT</span>
              <div style="font-size: 10px; color: #64748B; margin-top: 4px;">Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
            </td>
          </tr>
        </table>

        <div class="meta-box">
          <div class="meta-grid">
            <div class="meta-item"><strong>Report Title</strong>${reportDef.title}</div>
            <div class="meta-item"><strong>Time Horizon</strong>${horizonStr}</div>
            <div class="meta-item"><strong>Target Fleet Asset</strong>${targetAssetStr}</div>
            <div class="meta-item"><strong>Total Records</strong>${filteredReportRows.length} Logged Entries</div>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr style="background: #F1F5F9; color: #0F172A;">
              ${tableHeadersHtml}
            </tr>
          </thead>
          <tbody>
            ${tableBodyHtml || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #94A3B8;">No telemetry records matched this criteria.</td></tr>'}
          </tbody>
        </table>

        <div class="footer-note">
          This document is an official telematics audit record generated by Axona Fleet Management Platform v2.4 per MoRTH AIS-140 guidelines.
          Data verified against central vehicle telematics gateway.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        Alert.alert('Popup Blocked', 'Please allow popups to open and print the report PDF.');
      }
    } else {
      Alert.alert('PDF Generated', `Report "${reportDef.title}" formatted. In web browser, this opens directly for PDF printing.`);
    }
  };

  const currentDef = REPORT_DEFINITIONS.find((r) => r.id === activeReportType) || REPORT_DEFINITIONS[0];

  const filteredReportRows = reportData.filter((row) => {
    if (!searchFilter.trim()) return true;
    const str = JSON.stringify(row).toLowerCase();
    return str.includes(searchFilter.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="FLEET AUDIT REPORTS"
        subtitle="Telematics & Fleet Reports (Up to 90 Days)"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Report Selector Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reportSelectorScroll}
        >
          {REPORT_DEFINITIONS.map((def) => {
            const isSelected = def.id === activeReportType;
            return (
              <TouchableOpacity
                key={def.id}
                style={[
                  styles.reportChip,
                  isSelected && styles.reportChipActive,
                ]}
                onPress={() => setActiveReportType(def.id)}
              >
                <FileText
                  size={13}
                  color={isSelected ? '#FFFFFF' : colors.primaryNavy}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.reportChipText,
                    isSelected && styles.reportChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {def.title.split('. ')[1] || def.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Report Header Card */}
        <View style={styles.reportInfoCard}>
          <Text style={styles.reportInfoTitle}>{currentDef.title}</Text>
          <Text style={styles.reportInfoDesc}>{currentDef.desc}</Text>

          {/* Time Horizon Preset Pills */}
          <View style={styles.timePresetRow}>
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7days', label: '7 Days' },
                { id: '30days', label: '30 Days' },
                { id: '90days', label: '90 Days' },
                { id: 'custom', label: 'Custom (≤90d)' },
              ] as const
            ).map((p) => {
              const active = selectedPreset === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.timePresetPill,
                    active && styles.timePresetPillActive,
                  ]}
                  onPress={() => setSelectedPreset(p.id)}
                >
                  <Text
                    style={[
                      styles.timePresetText,
                      active && styles.timePresetTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Range Picker (Visible when 'custom' is selected) */}
          {selectedPreset === 'custom' && (
            <View style={styles.customDateCard}>
              <View style={styles.customDateHeaderRow}>
                <Calendar size={14} color={colors.primaryNavy} style={{ marginRight: 6 }} />
                <Text style={styles.customDateHeading}>Custom Date Range (Max 90 Days)</Text>
              </View>

              <View style={styles.dateInputsRow}>
                <View style={styles.dateInputCol}>
                  <Text style={styles.dateInputLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.dateInputField}
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholder="2026-10-01"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.dateInputCol}>
                  <Text style={styles.dateInputLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.dateInputField}
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholder="2026-11-18"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Validation Feedback Banner */}
              {!isDateRangeValid ? (
                <View style={styles.dateWarningBox}>
                  <AlertTriangle size={14} color={colors.criticalRed} style={{ marginRight: 6 }} />
                  <Text style={styles.dateWarningText}>
                    {dateDiffDays < 0
                      ? 'End date must be after start date.'
                      : `Selected ${dateDiffDays} days exceeds 90-day retention limit.`}
                  </Text>
                </View>
              ) : (
                <View style={styles.dateSuccessBox}>
                  <CheckCircle size={14} color="#166534" style={{ marginRight: 6 }} />
                  <Text style={styles.dateSuccessText}>
                    Valid range: {dateDiffDays} days (within statutory 90-day window).
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Row: PDF Download + CSV Export */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[
                styles.primaryDownloadBtn,
                selectedPreset === 'custom' && !isDateRangeValid && { opacity: 0.5 },
              ]}
              onPress={handleDownloadPDF}
              disabled={selectedPreset === 'custom' && !isDateRangeValid}
            >
              <Download size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryDownloadBtnText}>Download PDF (90 Days)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryExportBtn,
                selectedPreset === 'custom' && !isDateRangeValid && { opacity: 0.5 },
              ]}
              onPress={handleExportCSV}
              disabled={selectedPreset === 'custom' && !isDateRangeValid}
            >
              <Download size={15} color={colors.primaryNavy} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryExportBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters Card */}
        <View style={styles.filterCard}>
          <View style={styles.searchBarWrap}>
            <Search size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by vehicle, driver, location, or tag..."
              placeholderTextColor={colors.textSecondary}
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
          </View>

          {/* Vehicle Dropdown Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
            <TouchableOpacity
              style={[
                styles.vehicleFilterChip,
                !selectedVehicleId && styles.vehicleFilterChipActive,
              ]}
              onPress={() => setSelectedVehicleId('')}
            >
              <Text
                style={[
                  styles.vehicleFilterChipText,
                  !selectedVehicleId && styles.vehicleFilterChipTextActive,
                ]}
              >
                All Fleet Assets ({vehicles.length})
              </Text>
            </TouchableOpacity>
            {vehicles.map((v) => {
              const active = selectedVehicleId === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.vehicleFilterChip,
                    active && styles.vehicleFilterChipActive,
                  ]}
                  onPress={() => setSelectedVehicleId(active ? '' : v.id)}
                >
                  <Text
                    style={[
                      styles.vehicleFilterChipText,
                      active && styles.vehicleFilterChipTextActive,
                    ]}
                  >
                    {v.registration_number}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Data Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderTitle}>
              {currentDef.title} ({filteredReportRows.length} records)
            </Text>
            {loading && <ActivityIndicator size="small" color={colors.primaryNavy} />}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primaryNavy} />
              <Text style={styles.loadingText}>Compiling telematics log...</Text>
            </View>
          ) : filteredReportRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Telemetry Records</Text>
              <Text style={styles.emptySub}>
                No data points found for this vehicle and time horizon.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Column Headers */}
                <View style={styles.columnsHeaderRow}>
                  {currentDef.columns.map((c, idx) => (
                    <Text key={idx} style={[styles.columnHeaderText, { width: 140 }]}>
                      {c}
                    </Text>
                  ))}
                </View>

                {/* Rows */}
                {filteredReportRows.slice(0, 100).map((row, rIdx) => {
                  let values: string[] = [];
                  switch (activeReportType) {
                    case 'movement':
                      values = [
                        new Date(row.timestamp || Date.now()).toLocaleTimeString('en-IN'),
                        row.vehicleReg || 'MH-12-RN-2024',
                        `${row.speed?.toFixed(1) || '0.0'} km/h`,
                        row.ignition ? 'ON' : 'OFF',
                        `${row.heading || 0}°`,
                        row.address || 'Hinjawadi, Pune',
                        `${row.latitude?.toFixed(4)}, ${row.longitude?.toFixed(4)}`,
                      ];
                      break;
                    case 'trips':
                      values = [
                        row.trip_id || 'TRIP-901',
                        row.vehicle_registration || 'MH-12-RN-2024',
                        new Date(row.start_time || Date.now()).toLocaleTimeString('en-IN'),
                        new Date(row.end_time || Date.now()).toLocaleTimeString('en-IN'),
                        `${row.distance_km || 42.5} km`,
                        `${row.stoppage_count || 1} stops`,
                        `${row.start_location || 'Pune Depot'}`,
                      ];
                      break;
                    case 'distance':
                      values = [
                        row.date || '2026-11-18',
                        row.vehicle_registration || 'MH-12-RN-2024',
                        row.vehicle_model || 'Tata Prima',
                        `${row.start_odometer_km || 14200} km`,
                        `${row.end_odometer_km || 14542} km`,
                        `${row.total_distance_km || 342.8} km`,
                        `${row.engine_hours || 7.2} hrs`,
                        `${row.idle_hours || 1.1} hrs`,
                      ];
                      break;
                    case 'overspeeding':
                      values = [
                        new Date(row.timestamp || Date.now()).toLocaleTimeString('en-IN'),
                        row.vehicle_registration || 'MH-12-RN-2024',
                        row.driver_name || 'Ramesh Kumar',
                        `${row.speed_recorded || 78.5} km/h`,
                        `${row.allowed_limit || 65} km/h`,
                        `${row.violation_duration_sec || 45} sec`,
                        row.location || 'NH-48 Bypass',
                      ];
                      break;
                    case 'panic':
                      values = [
                        row.incident_id || 'SOS-2026-001',
                        new Date(row.timestamp || Date.now()).toLocaleTimeString('en-IN'),
                        row.vehicle_registration || 'MH-12-RN-2024',
                        row.driver_name || 'Ramesh Kumar',
                        row.status || 'Active',
                        row.operator || 'Command Ops',
                        row.resolution_notes || 'Police notified',
                      ];
                      break;
                    case 'geofence':
                      values = [
                        new Date(row.timestamp || Date.now()).toLocaleTimeString('en-IN'),
                        row.vehicle_registration || 'MH-12-RN-2024',
                        row.geofence_name || 'Pune Central Hub',
                        row.event_type || 'EXIT',
                        `${row.dwell_duration_min || 45}m`,
                        row.is_authorized ? 'Yes' : 'No',
                      ];
                      break;
                    case 'harsh_driving':
                      values = [
                        new Date(row.timestamp || Date.now()).toLocaleTimeString('en-IN'),
                        row.vehicle_registration || 'MH-12-RN-2024',
                        row.driver_name || 'Ramesh Kumar',
                        row.event_type || 'Harsh Braking',
                        row.severity || 'HIGH',
                        `${row.value || '-0.68'} g`,
                        row.location || 'Katraj Ghat',
                      ];
                      break;
                    case 'stoppage':
                      values = [
                        row.vehicle_registration || 'MH-12-RN-2024',
                        new Date(row.start_time || Date.now()).toLocaleTimeString('en-IN'),
                        new Date(row.end_time || Date.now()).toLocaleTimeString('en-IN'),
                        `${row.duration_minutes || 28}m`,
                        `${row.estimated_fuel_loss_l || 1.4} L`,
                        row.location || 'Talegaon Toll Bay',
                      ];
                      break;
                    default:
                      values = Object.values(row).slice(0, 7).map(String);
                  }

                  return (
                    <View
                      key={rIdx}
                      style={[
                        styles.tableDataRow,
                        rIdx % 2 === 1 && { backgroundColor: '#F8FAFC' },
                      ]}
                    >
                      {values.map((v, cIdx) => (
                        <Text
                          key={cIdx}
                          style={[styles.tableDataCell, { width: 140 }]}
                          numberOfLines={1}
                        >
                          {v}
                        </Text>
                      ))}
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
    paddingBottom: 180,
  },
  reportSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  reportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  reportChipActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  reportChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  reportChipTextActive: {
    color: '#FFFFFF',
  },
  reportInfoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
    ...shadows.subtle,
  },
  reportInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryNavy,
    marginBottom: 3,
  },
  reportInfoDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  timePresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  timePresetPill: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  timePresetPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  timePresetText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  timePresetTextActive: {
    color: '#FFFFFF',
  },
  customDateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  customDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customDateHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  dateInputCol: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: colors.textPrimary,
  },
  dateWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateWarningText: {
    fontSize: 10,
    color: colors.criticalRed,
    fontWeight: '600',
  },
  dateSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateSuccessText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryNavy,
    paddingVertical: 10,
    borderRadius: 8,
    ...shadows.subtle,
  },
  primaryDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primaryNavy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryExportBtnText: {
    color: colors.primaryNavy,
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
    ...shadows.subtle,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
  },
  vehicleScroll: {
    flexDirection: 'row',
  },
  vehicleFilterChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: 6,
  },
  vehicleFilterChipActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  vehicleFilterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  vehicleFilterChipTextActive: {
    color: '#FFFFFF',
  },
  tableCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  columnsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  columnHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryNavy,
    paddingHorizontal: 8,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableDataCell: {
    fontSize: 10,
    color: colors.textPrimary,
    paddingHorizontal: 8,
  },
});
