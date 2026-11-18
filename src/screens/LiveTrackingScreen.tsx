import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  ExternalLink,
  Compass,
  Power,
  Battery,
  MapPin,
  Layers,
  RefreshCw,
  X,
  ChevronRight,
  ChevronDown,
  Truck,
  ShieldAlert,
  Radio,
  Navigation,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { useTelematicsStore } from '../store/telematicsStore';
import { LatestVehicleLocation, TripWaypoint } from '../types';

interface LiveTrackingScreenProps {
  navigation: any;
  route: any;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    livePositions,
    categories,
    selectedVehicle,
    setSelectedVehicle,
    fetchLivePositions,
    fetchCategories,
  } = useTelematicsStore();

  const [autoFollow, setAutoFollow] = useState(true);
  const [showTrail, setShowTrail] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  useEffect(() => {
    fetchLivePositions();
    fetchCategories();

    if (route?.params?.vehicleId && livePositions[route.params.vehicleId]) {
      setSelectedVehicle(livePositions[route.params.vehicleId]);
    }
  }, [route?.params]);

  const vehiclesList: LatestVehicleLocation[] = useMemo(() => {
    const list = Object.values(livePositions);
    return list;
  }, [livePositions]);

  const filteredVehicles = vehiclesList;

  // Ensure an active vehicle is selected by default (matches website view in Img 2)
  useEffect(() => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
    } else if (
      selectedVehicle &&
      !filteredVehicles.some((v) => v.vehicle_id === selectedVehicle.vehicle_id) &&
      filteredVehicles.length > 0
    ) {
      setSelectedVehicle(filteredVehicles[0]);
    }
  }, [filteredVehicles, selectedVehicle]);

  // Active target vehicle details
  const activeVehicle = selectedVehicle || filteredVehicles[0] || vehiclesList[0];

  const currentSpeed = activeVehicle ? Math.round(activeVehicle.speed || 0) : 0;
  const speedLimit = activeVehicle?.speed_limit || 80;
  const heading = activeVehicle?.heading || 0;
  const isIgnitionOn = activeVehicle?.ignition === 1;
  const batteryPct = activeVehicle?.backup_battery_pct || 95;
  const lat = activeVehicle?.latitude ? activeVehicle.latitude.toFixed(4) : '18.5912';
  const lon = activeVehicle?.longitude ? activeVehicle.longitude.toFixed(4) : '73.7389';
  const fullLat = activeVehicle?.latitude ? activeVehicle.latitude.toFixed(5) : '18.59120';
  const fullLon = activeVehicle?.longitude ? activeVehicle.longitude.toFixed(5) : '73.73890';
  const defaultAddress =
    activeVehicle?.address ||
    'Sector 70, Mamura, Noida, Dadri, Gautam Buddha Nagar, Uttar Pradesh, 201316, India';

  // Helper for vehicle status badges
  const getVehicleStatusBadge = (v: LatestVehicleLocation) => {
    const isOff = v.movement_status === 'offline';
    const isEmerg = v.panic_status === 1;

    if (isEmerg) {
      return { label: 'SOS ALERT', bg: '#FEE2E2', color: colors.criticalRed };
    } else if (v.movement_status === 'moving') {
      return { label: 'MOVING', bg: '#DCFCE7', color: colors.statusMoving };
    } else if (v.movement_status === 'idle') {
      return { label: 'IDLE', bg: '#FEF3C7', color: colors.statusIdle };
    } else if (isOff) {
      return { label: 'OFFLINE GPS', bg: '#F1F5F9', color: colors.textMuted };
    }
    return { label: 'STOPPED', bg: '#E0F2FE', color: colors.accentBlue };
  };

  const activeBadge = activeVehicle ? getVehicleStatusBadge(activeVehicle) : null;

  // Simulated GPS trail for the active vehicle when showTrail is enabled
  const trailWaypoints: TripWaypoint[] = useMemo(() => {
    if (!showTrail || !activeVehicle) return [];
    const baseLat = activeVehicle.latitude;
    const baseLon = activeVehicle.longitude;
    return [
      {
        latitude: baseLat - 0.008,
        longitude: baseLon - 0.015,
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        speed: 42,
        ignition: 1,
        heading: (heading + 15) % 360,
      },
      {
        latitude: baseLat - 0.005,
        longitude: baseLon - 0.009,
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        speed: 38,
        ignition: 1,
        heading: heading,
      },
      {
        latitude: baseLat - 0.002,
        longitude: baseLon - 0.004,
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        speed: 15,
        ignition: 1,
        heading: heading,
      },
      {
        latitude: baseLat,
        longitude: baseLon,
        timestamp: new Date().toISOString(),
        speed: activeVehicle.speed || 0,
        ignition: activeVehicle.ignition || 0,
        heading: heading,
        is_stop: activeVehicle.speed === 0 ? 1 : 0,
        stop_duration_min: 16,
      },
    ];
  }, [showTrail, activeVehicle, heading]);

  const handleOpenOsm = () => {
    const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showHome={true}
        title="LIVE TRACKING"
        subtitle="AIS-140 Real-Time Telematics Map"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Control Bar: Gateway Status & AIS-140 Map Controls (Website Parity) */}
        <View style={styles.topControlCard}>
          <View style={styles.gatewayRow}>
            <View style={styles.gatewayBadge}>
              <View style={styles.gatewayDot} />
              <Text style={styles.gatewayText}>AIS-140 Gateway Live</Text>
            </View>
            <View style={styles.osmBadge}>
              <Layers size={11} color={colors.primaryNavy} style={{ marginRight: 4 }} />
              <Text style={styles.osmBadgeText}>Map: OpenStreetMap</Text>
            </View>
          </View>

          {/* AIS-140 Real-Time Telematics Map Title & Toggles */}
          <View style={styles.mapTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Radio size={15} color={colors.accentBlue} />
              <Text style={styles.mapCardTitle}>AIS-140 Real-Time Telematics Map</Text>
            </View>
          </View>

          {/* Checkboxes Row: Auto-Follow & Show GPS Trail */}
          <View style={styles.checkboxesRow}>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => setAutoFollow(!autoFollow)}
              activeOpacity={0.7}
            >
              {autoFollow ? (
                <CheckSquare size={16} color={colors.accentBlue} />
              ) : (
                <Square size={16} color={colors.textSecondary} />
              )}
              <Text style={styles.checkboxLabel}>Auto-Follow Selected</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => setShowTrail(!showTrail)}
              activeOpacity={0.7}
            >
              {showTrail ? (
                <CheckSquare size={16} color={colors.accentBlue} />
              ) : (
                <Square size={16} color={colors.textSecondary} />
              )}
              <Text style={styles.checkboxLabel}>Show GPS Trail</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicles Dropdown Selector */}
        <View style={styles.vehiclesSection}>
          <View style={styles.vehiclesSectionHeader}>
            <Text style={styles.vehiclesSectionTitle}>
              VEHICLES ({filteredVehicles.length})
            </Text>
            <Text style={styles.vehiclesTelematicsTag}>SELECT VEHICLE</Text>
          </View>

          {/* Dropdown Trigger Header */}
          <TouchableOpacity
            style={[
              styles.vehicleDropdownTrigger,
              isVehicleDropdownOpen && styles.vehicleDropdownTriggerOpen,
            ]}
            onPress={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownLeftCol}>
              <View style={styles.dropdownIconBox}>
                <Truck size={18} color={colors.primaryNavy} />
              </View>
              <View style={styles.dropdownTextWrap}>
                <View style={styles.dropdownRegRow}>
                  <Text style={styles.dropdownRegText} numberOfLines={1}>
                    {activeVehicle?.registration_number || 'Select Vehicle'}
                  </Text>
                  {activeBadge && (
                    <View style={[styles.reelStatusBadge, { backgroundColor: activeBadge.bg, marginLeft: 6 }]}>
                      <Text style={[styles.reelStatusText, { color: activeBadge.color }]}>
                        {activeBadge.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dropdownSubText} numberOfLines={1}>
                  {activeVehicle
                    ? `${activeVehicle.make} ${activeVehicle.model} • ${currentSpeed} km/h • Ign: ${isIgnitionOn ? 'ON' : 'OFF'}`
                    : 'Tap to choose vehicle from fleet'}
                </Text>
              </View>
            </View>

            <View style={styles.dropdownChevronWrap}>
              <ChevronDown
                size={18}
                color={colors.primaryNavy}
                style={{ transform: [{ rotate: isVehicleDropdownOpen ? '180deg' : '0deg' }] }}
              />
            </View>
          </TouchableOpacity>

          {/* Dropdown Menu Options */}
          {isVehicleDropdownOpen && (
            <View style={styles.vehicleDropdownMenu}>
              <ScrollView
                style={styles.dropdownScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {filteredVehicles.map((v, idx) => {
                  const isSelected = activeVehicle?.vehicle_id === v.vehicle_id;
                  const badge = getVehicleStatusBadge(v);
                  const spd = Math.round(v.speed || 0);
                  const ign = v.ignition === 1;

                  return (
                    <TouchableOpacity
                      key={v.vehicle_id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                        idx === filteredVehicles.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => {
                        setSelectedVehicle(v);
                        setIsVehicleDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <View style={styles.dropdownItemTitleRow}>
                          <Text style={[styles.dropdownItemReg, isSelected && styles.dropdownItemRegActive]}>
                            {v.registration_number}
                          </Text>
                          <View style={[styles.reelStatusBadge, { backgroundColor: badge.bg, marginLeft: 6 }]}>
                            <Text style={[styles.reelStatusText, { color: badge.color }]}>
                              {badge.label}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.dropdownItemModel} numberOfLines={1}>
                          {v.make} {v.model}
                        </Text>
                        <Text style={styles.dropdownItemTelematics}>
                          Speed: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{spd} km/h</Text>
                          {'  '}•{'  '}
                          Ignition: <Text style={{ fontWeight: '700', color: ign ? colors.statusMoving : colors.criticalRed }}>{ign ? 'ON' : 'OFF'}</Text>
                        </Text>
                      </View>

                      {isSelected ? (
                        <View style={styles.dropdownItemCheck}>
                          <Check size={14} color="#FFFFFF" />
                        </View>
                      ) : (
                        <ChevronRight size={16} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Map View Card with OpenStreetMap and Live Positioning */}
        <View style={[styles.mapCard, isMapExpanded && styles.mapCardExpanded]}>
          <MapView
            vehicles={filteredVehicles}
            selectedVehicleId={activeVehicle?.vehicle_id}
            onSelectVehicle={(v) => setSelectedVehicle(v)}
            waypoints={trailWaypoints}
            height={isMapExpanded ? 460 : 270}
            center={
              activeVehicle
                ? [activeVehicle.latitude, activeVehicle.longitude]
                : [18.5912, 73.7389]
            }
            zoom={autoFollow && activeVehicle ? 15 : 12}
          />

          {/* Floating Showing Count Overlay */}
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              ● AIS-140 LIVE • Showing {filteredVehicles.length} of {vehiclesList.length} Vehicles
            </Text>
          </View>

          {/* Map Expand / Minimize Button */}
          <TouchableOpacity
            style={styles.expandFab}
            onPress={() => setIsMapExpanded(!isMapExpanded)}
          >
            {isMapExpanded ? (
              <Minimize2 size={16} color={colors.primaryNavy} />
            ) : (
              <Maximize2 size={16} color={colors.primaryNavy} />
            )}
          </TouchableOpacity>

          {/* Refresh FAB Button */}
          <TouchableOpacity
            style={styles.refreshFab}
            onPress={() => fetchLivePositions()}
          >
            <RefreshCw size={16} color={colors.primaryNavy} />
          </TouchableOpacity>
        </View>

        {/* Selected Vehicle Telematics Detail Card (Matching Website Img 2 1:1) */}
        {activeVehicle && (
          <View style={styles.telematicsCard}>
            {/* Header: Direction Badge + Vehicle Details + OpenStreetMap Link */}
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleWrap}>
                <View style={styles.arrowIconBadge}>
                  <Navigation
                    size={17}
                    color="#FFFFFF"
                    style={{ transform: [{ rotate: `${heading}deg` }] }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailRegText}>{activeVehicle.registration_number}</Text>
                  <Text style={styles.detailModelSub} numberOfLines={1}>
                    {activeVehicle.make} {activeVehicle.model} • IMEI: {activeVehicle.imei || '354002394481335'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.osmLinkBtn} onPress={handleOpenOsm}>
                <Text style={styles.osmLinkText}>OpenStreetMap Link</Text>
                <ExternalLink size={12} color={colors.accentBlue} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* 5 Key AIS-140 Telematics Metric Cards (Matching Website Img 2) */}
            <View style={styles.metricsGrid}>
              {/* CURRENT SPEED */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>CURRENT SPEED</Text>
                <Text style={styles.metricValue}>{currentSpeed} km/h</Text>
                <Text style={styles.metricSub}>Limit: {speedLimit} km/h</Text>
              </View>

              {/* DIRECTION / HEADING */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DIRECTION / HEADING</Text>
                <Text style={styles.metricValue}>🧭 {heading}°</Text>
                <Text style={styles.metricSub}>Azimuth Angle</Text>
              </View>

              {/* IGNITION STATUS */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>IGNITION STATUS</Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: isIgnitionOn ? colors.statusMoving : colors.criticalRed },
                  ]}
                >
                  {isIgnitionOn ? 'ON' : 'OFF'}
                </Text>
                <Text style={styles.metricSub}>Digital Input 1</Text>
              </View>

              {/* POWER / BATTERY */}
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>POWER / BATTERY</Text>
                <Text style={[styles.metricValue, { color: colors.statusMoving }]}>
                  {batteryPct}%
                </Text>
                <Text style={[styles.metricSub, { color: colors.statusMoving, fontWeight: '700' }]}>
                  Main Battery OK
                </Text>
              </View>

              {/* COORDINATES */}
              <View style={[styles.metricBox, styles.metricBoxFull]}>
                <Text style={styles.metricLabel}>COORDINATES</Text>
                <Text style={styles.metricValue}>
                  {lat}, {lon}
                </Text>
                <Text style={styles.metricSub}>WGS84 GPS Fix</Text>
              </View>
            </View>

            {/* Address Banner */}
            <View style={styles.addressBanner}>
              <MapPin size={14} color={colors.accentBlue} style={{ marginRight: 6, marginTop: 2, flexShrink: 0 }} />
              <Text style={styles.addressText}>
                <Text style={{ fontWeight: '800', color: colors.textPrimary }}>Address: </Text>
                {defaultAddress} ({fullLat}, {fullLon})
              </Text>
            </View>

            {/* Quick Action Navigation Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.tripHistoryBtn}
                onPress={() =>
                  navigation.navigate('TripHistory', {
                    vehicleId: activeVehicle.vehicle_id,
                  })
                }
              >
                <Text style={styles.tripHistoryBtnText}>Trip History</Text>
                <ChevronRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 12,
    paddingBottom: 150,
  },

  // Top Control Card
  topControlCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  gatewayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 106, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 106, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  gatewayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.statusMoving,
    marginRight: 6,
  },
  gatewayText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.statusMoving,
    letterSpacing: 0.3,
  },
  osmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  osmBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryNavy,
  },

  mapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.2,
  },

  checkboxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
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
    fontWeight: '600',
  },
  categoryDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    maxWidth: 120,
  },
  categoryDropdownBtnActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  categoryDropdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  categoryDrawer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  categoryDrawerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  categoryChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  catChipActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  statusPillsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statusPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },

  // Vehicles Dropdown Selector
  vehiclesSection: {
    marginBottom: 12,
    zIndex: 100,
  },
  vehiclesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  vehiclesSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  vehiclesTelematicsTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.accentBlue,
    letterSpacing: 0.4,
  },
  vehicleDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...shadows.subtle,
  },
  vehicleDropdownTriggerOpen: {
    borderColor: colors.primaryNavy,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#F8FAFC',
  },
  dropdownLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownRegText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  dropdownSubText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  dropdownChevronWrap: {
    padding: 4,
  },
  vehicleDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.primaryNavy,
    maxHeight: 280,
    ...shadows.medium,
  },
  dropdownScrollView: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: '#FFFFFF',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  dropdownItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dropdownItemReg: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownItemRegActive: {
    color: colors.primaryNavy,
    fontWeight: '800',
  },
  dropdownItemModel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  dropdownItemTelematics: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dropdownItemCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  reelStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },

  // Map Card
  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
    position: 'relative',
    ...shadows.subtle,
  },
  mapCardExpanded: {
    height: 460,
  },
  countBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(11, 30, 56, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 5,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  expandFab: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    zIndex: 5,
  },
  refreshFab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.elevated,
    zIndex: 5,
  },

  // Selected Vehicle Telematics Detail Card (Matching Website Img 2)
  telematicsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  detailTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  arrowIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailRegText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.3,
  },
  detailModelSub: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  osmLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: 'rgba(0, 102, 204, 0.04)',
    flexShrink: 0,
  },
  osmLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },

  // 5 KPI Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    width: '48.5%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricBoxFull: {
    width: '100%',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Address Banner
  addressBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(10, 25, 47, 0.04)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceLight,
  },
  profileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  tripHistoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryNavy,
  },
  tripHistoryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
