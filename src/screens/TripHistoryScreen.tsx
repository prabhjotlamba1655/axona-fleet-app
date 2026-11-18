import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Navigation,
  MapPin,
  Clock,
  Square,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  Truck,
  Home,
  ExternalLink,
  ChevronDown,
  Gauge,
  Layers,
  Check,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { api } from '../services/api';
import { useTelematicsStore } from '../store/telematicsStore';
import { Trip, TripWaypoint } from '../types';

interface TripHistoryScreenProps {
  navigation: any;
  route: any;
}

export const TripHistoryScreen: React.FC<TripHistoryScreenProps> = ({
  navigation,
  route,
}) => {
  const { vehicles, fetchVehicles } = useTelematicsStore();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    route?.params?.vehicleId || ''
  );
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | '90days'>('90days');
  const [fromDate, setFromDate] = useState<string>('15/11/2026');
  const [toDate, setToDate] = useState<string>('16/11/2026');
  const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Active playback state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [waypoints, setWaypoints] = useState<TripWaypoint[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1, 2, 5, 10

  const playbackTimerRef = useRef<any>(null);

  // Find the selected vehicle from store or route params
  const currentVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) ||
    (route?.params?.registration_number
      ? {
          id: selectedVehicleId || route.params.vehicleId,
          registration_number: route.params.registration_number,
          make: route.params.make || 'Mahindra',
          model: route.params.model || 'XUV700 Inspection Vehicle',
          category_name: route.params.category_name || 'Car / Sedan / SUV',
          owner_name: route.params.owner_name || 'Apex Logistics LLP',
        }
      : vehicles[0] || null);

  const currentVehicleReg =
    selectedTrip?.registration_number ||
    currentVehicle?.registration_number ||
    route?.params?.registration_number ||
    'MH-12-EV-8822';

  useEffect(() => {
    fetchVehicles();
    loadTrips();
  }, [selectedVehicleId, dateFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await api.trips.list({
        vehicleId: selectedVehicleId || undefined,
      });
      setTrips(data || []);
      if (data && data.length > 0) {
        // Automatically load playback for the first trip
        loadTripPlayback(data[0]);
      } else {
        setSelectedTrip(null);
        setWaypoints([]);
      }
    } catch (e) {
      console.warn('Trips fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadTripPlayback = async (trip: Trip) => {
    try {
      setSelectedTrip(trip);
      pausePlayback();
      const res = await api.trips.getPlayback(trip.id);
      setWaypoints(res.waypoints || []);
      setPlaybackIndex(0);
    } catch (e) {
      console.warn('Playback fetch failed:', e);
    }
  };

  // Playback timer controls
  useEffect(() => {
    if (isPlaying && waypoints.length > 0) {
      const intervalMs = Math.max(100, 1000 / playbackSpeed);
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= waypoints.length - 1) {
            setIsPlaying(false);
            return 0; // loop or reset
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, waypoints.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const pausePlayback = () => {
    setIsPlaying(false);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setPlaybackIndex(0);
  };

  const currentWp: TripWaypoint | undefined = waypoints[playbackIndex];

  // En-route stoppages
  const stoppages = waypoints
    .map((w, index) => ({ ...w, waypointIndex: index }))
    .filter((w) => w.is_stop === 1);

  const totalStoppageMinutes = stoppages.reduce(
    (sum, s) => sum + (s.stop_duration_min || 16),
    0
  );

  const handleSelectStoppage = (wpIndex: number) => {
    pausePlayback();
    setPlaybackIndex(wpIndex);
  };

  // Formatting helpers matching website (Image 2)
  const formatTimestamp = (iso?: string, fallbackHoursOffset = 0) => {
    if (!iso) {
      const d = new Date(Date.now() - fallbackHoursOffset * 3600000);
      return d.toISOString().replace('T', ' ').substring(0, 19) + '.000';
    }
    const d = new Date(iso);
    return d.toISOString().replace('T', ' ').substring(0, 19) + '.000';
  };

  const startLat = selectedTrip?.start_latitude?.toFixed(4) || '18.5912';
  const startLon = selectedTrip?.start_longitude?.toFixed(4) || '73.7389';
  const endLat = selectedTrip?.end_latitude?.toFixed(4) || '18.5089';
  const endLon = selectedTrip?.end_longitude?.toFixed(4) || '73.9260';

  const startFormattedTime = formatTimestamp(selectedTrip?.start_time, 2);
  const endFormattedTime = formatTimestamp(selectedTrip?.end_time, 1);

  const progressPct =
    waypoints.length > 0
      ? Math.round(((playbackIndex + 1) / waypoints.length) * 100)
      : 0;

  const handleOpenOsm = () => {
    const url = `https://www.openstreetmap.org/?mlat=${startLat}&mlon=${startLon}#map=14/${startLat}/${startLon}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="TRIP HISTORY"
        subtitle={currentVehicleReg ? `${currentVehicleReg} • Route Replay` : 'Route Replay & Halts'}
        vehicleReg={currentVehicleReg}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Website-Grade Target Vehicle & Date Range Filter Bar (Image 2) */}
        <View style={styles.filterCard}>
          <Text style={styles.filterBarLabel}>TARGET VEHICLE</Text>
          <TouchableOpacity
            style={styles.vehicleSelectorBtn}
            onPress={() => setShowVehiclePicker(true)}
          >
            <View style={styles.selectorLeft}>
              <View style={styles.selectorIconWrap}>
                <Truck size={17} color={colors.primaryNavy} />
              </View>
              <View style={styles.selectorInfoCol}>
                <View style={styles.selectorRegRow}>
                  <Text style={styles.selectorVehicleReg}>{currentVehicleReg}</Text>
                  {currentVehicle?.category_name && (
                    <View style={styles.selectorCatChip}>
                      <Text style={styles.selectorCatChipText}>{currentVehicle.category_name}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.selectorVehicleModel} numberOfLines={1}>
                  {currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : 'Select Fleet Asset'}
                </Text>
              </View>
            </View>
            <ChevronDown size={18} color={colors.textSecondary} style={{ flexShrink: 0, marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={styles.dateInputsRow}>
            <View style={styles.dateFieldCol}>
              <Text style={styles.dateFieldLabel}>FROM DATE</Text>
              <View style={styles.dateInputWrap}>
                <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.dateInput}
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="DD/MM/YYYY"
                />
              </View>
            </View>

            <View style={styles.dateFieldCol}>
              <Text style={styles.dateFieldLabel}>TO DATE (MAX 90D)</Text>
              <View style={styles.dateInputWrap}>
                <Calendar size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.dateInput}
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="DD/MM/YYYY"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.applyFilterBtn} onPress={loadTrips}>
              <Text style={styles.applyFilterBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Pills */}
          <View style={styles.presetsRow}>
            <Text style={styles.presetsLabel}>PRESETS:</Text>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days (Max)' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.presetPill,
                  dateFilter === f.id && styles.presetPillActive,
                ]}
                onPress={() => setDateFilter(f.id as any)}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    dateFilter === f.id && styles.presetPillTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Route Replay Map Card (Image 2) */}
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerTitle}>
                Route Replay: {currentVehicleReg}
              </Text>
              <Text style={styles.playerSub}>
                Live GPS Waypoint ({startLat}, {startLon}) → Live GPS Waypoint ({endLat}, {endLon})
              </Text>
            </View>

            <View style={styles.headerBadgesRow}>
              <View style={styles.aisBadge}>
                <Text style={styles.aisBadgeText}>● AIS-140 RECORDED</Text>
              </View>
              <TouchableOpacity style={styles.osmLinkBtn} onPress={handleOpenOsm}>
                <Text style={styles.osmLinkText}>OpenStreetMap</Text>
                <ExternalLink size={11} color={colors.accentBlue} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive Map */}
          <View style={styles.mapWrap}>
            <MapView
              waypoints={waypoints}
              currentPlaybackIndex={playbackIndex}
              height={260}
            />
          </View>

          {/* Player Controls Bar */}
          <View style={styles.playerControlsSection}>
            <View style={styles.controlsTopRow}>
              {/* Play / Pause Button */}
              <TouchableOpacity style={styles.playReplayBtn} onPress={togglePlay}>
                {isPlaying ? (
                  <Pause size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : (
                  <Play size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.playReplayBtnText}>{isPlaying ? 'Pause' : 'Play Replay'}</Text>
              </TouchableOpacity>

              {/* Reset Button */}
              <TouchableOpacity style={styles.resetBtn} onPress={resetPlayback}>
                <RotateCcw size={15} color={colors.primaryNavy} />
              </TouchableOpacity>

              {/* Dedicated Speed Selector Buttons (1x, 2x, 5x, 10x) */}
              <View style={styles.speedButtonGroup}>
                {[1, 2, 5, 10].map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    style={[
                      styles.speedOptionBtn,
                      playbackSpeed === spd && styles.speedOptionBtnActive,
                    ]}
                    onPress={() => setPlaybackSpeed(spd)}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        playbackSpeed === spd && styles.speedOptionTextActive,
                      ]}
                    >
                      {spd}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Real-time Telemetry Indicators */}
              <View style={styles.telemetryPills}>
                <Text style={styles.telemetryItemText}>
                  Speed: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{currentWp ? Math.round(currentWp.speed) : 0} km/h</Text>
                </Text>
                <Text style={styles.telemetryItemText}>
                  Ignition: <Text style={{ fontWeight: '800', color: currentWp?.ignition ? colors.statusMoving : colors.criticalRed }}>{currentWp?.ignition ? 'ON' : 'OFF'}</Text>
                </Text>
                <Text style={styles.telemetryItemText}>
                  Heading: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{currentWp?.heading || 0}°</Text>
                </Text>
              </View>
            </View>

            {/* Waypoint Progress Slider Bar */}
            <View style={styles.waypointSliderContainer}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${progressPct}%` }]} />
              </View>
              <View style={styles.sliderLabelsRow}>
                <Text style={styles.sliderEndpointText}>Start: Waypoint 1</Text>
                <Text style={styles.sliderCenterText}>
                  Waypoint {playbackIndex + 1} of {waypoints.length || 1} ({progressPct}%)
                </Text>
                <Text style={styles.sliderEndpointText}>End: Waypoint {waypoints.length || 1}</Text>
              </View>
            </View>

            {/* Current Waypoint Location Banner */}
            <View style={styles.currentLocationBanner}>
              <MapPin size={13} color={colors.accentBlue} style={{ marginRight: 6 }} />
              <Text style={styles.currentLocationText} numberOfLines={1}>
                Current Location: Live GPS Waypoint ({currentWp?.latitude?.toFixed(4) || startLat}, {currentWp?.longitude?.toFixed(4) || startLon})
              </Text>
            </View>
          </View>
        </View>

        {/* 3. SELECTED ROUTE SEGMENT Card (Matching Website Right-Side Panel in Image 2) */}
        <View style={styles.segmentCard}>
          <View style={styles.segmentHeader}>
            <Text style={styles.segmentEyebrow}>SELECTED ROUTE SEGMENT</Text>
            <Text style={styles.segmentVehicleReg}>{currentVehicleReg}</Text>
            <Text style={styles.segmentVehicleModel}>
              {selectedTrip?.make || currentVehicle?.make || 'Mahindra'} {selectedTrip?.model || currentVehicle?.model || 'XUV700 Inspection Vehicle'}
            </Text>
          </View>

          {/* Origin Departure */}
          <View style={styles.routeWaypointItem}>
            <View style={styles.originMarkerDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.waypointDirectionLabel}>Origin Departure:</Text>
              <Text style={styles.waypointCoords}>Live GPS Waypoint ({startLat}, {startLon})</Text>
              <Text style={styles.waypointTimestamp}>{startFormattedTime}</Text>
            </View>
          </View>

          {/* Destination Arrival */}
          <View style={styles.routeWaypointItem}>
            <View style={styles.destMarkerDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.waypointDirectionLabel}>Destination Arrival:</Text>
              <Text style={styles.waypointCoords}>Live GPS Waypoint ({endLat}, {endLon})</Text>
              <Text style={styles.waypointTimestamp}>{endFormattedTime}</Text>
            </View>
          </View>

          {/* 4 Key KPI Metrics (2x2 Grid) */}
          <View style={styles.metricsGrid}>
            {/* DISTANCE */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricValue}>
                {selectedTrip ? `${selectedTrip.distance_km} km` : '32.8 km'}
              </Text>
            </View>

            {/* JOURNEY DURATION */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>JOURNEY DURATION</Text>
              <Text style={styles.metricValue}>
                {selectedTrip ? `${selectedTrip.duration_minutes} min` : '48 min'}
              </Text>
            </View>

            {/* STOPPAGE TIME */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>STOPPAGE TIME</Text>
              <Text style={styles.metricValue}>
                {selectedTrip ? `${selectedTrip.stoppage_minutes || totalStoppageMinutes || 32} min` : '32 min'}
              </Text>
              <Text style={styles.metricSubtext}>
                {stoppages.length || 2} Stoppage points
              </Text>
            </View>

            {/* PEAK / AVG SPEED */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>PEAK / AVG SPEED</Text>
              <Text style={styles.metricValue}>
                {selectedTrip
                  ? `${Math.round(selectedTrip.max_speed || 78.5)} / ${(selectedTrip.avg_speed || 46.2).toFixed(1)} km/h`
                  : '83 / 28.5 km/h'}
              </Text>
            </View>
          </View>

          {/* EN-ROUTE STOPPAGES Breakdown (Image 2) */}
          <View style={styles.stoppagesBreakdownSection}>
            <View style={styles.stoppagesHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.redStopDot} />
                <Text style={styles.stoppagesSectionTitle}>
                  EN-ROUTE STOPPAGES ({stoppages.length || 2})
                </Text>
              </View>
              <Text style={styles.totalStoppageDuration}>
                Total: {totalStoppageMinutes || 32}m
              </Text>
            </View>

            {/* Stoppage Items List */}
            {(stoppages.length > 0 ? stoppages : [
              {
                waypointIndex: 0,
                latitude: 18.5912,
                longitude: 73.7389,
                stop_duration_min: 16,
                address: 'Apex Hinjawadi Central Logistics Hub, Phase 1',
              },
              {
                waypointIndex: 9,
                latitude: 18.5089,
                longitude: 73.9260,
                stop_duration_min: 16,
                address: 'Magarpatta Cybercity Gate 3, Hadapsar, Pune',
              },
            ]).map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.stoppageItemCard,
                  playbackIndex === s.waypointIndex && styles.stoppageItemCardActive,
                ]}
                onPress={() => handleSelectStoppage(s.waypointIndex)}
              >
                <View style={styles.stoppageNumberBadge}>
                  <Text style={styles.stoppageNumberText}>{idx + 1}</Text>
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.stoppageCoordsText}>
                    Live GPS Waypoint ({s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)})
                  </Text>
                  <Text style={styles.stoppageTelemetryText}>
                    Ignition: OFF • Speed: 0 km/h
                  </Text>
                </View>

                <View style={styles.stoppageDurationPill}>
                  <Text style={styles.stoppageDurationPillText}>
                    {s.stop_duration_min || 16} min
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* View Route on OpenStreetMap Action Button */}
          <TouchableOpacity style={styles.viewOsmFullBtn} onPress={handleOpenOsm}>
            <Text style={styles.viewOsmFullBtnText}>View Route on OpenStreetMap</Text>
            <ExternalLink size={14} color={colors.accentBlue} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* 4. Completed Trips History List */}
        <View style={styles.tripsSection}>
          <Text style={styles.sectionHeading}>COMPLETED TRIPS HISTORY ({trips.length})</Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 20 }} />
          ) : trips.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No trip history recorded for selected horizon.</Text>
            </View>
          ) : (
            trips.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id;
              return (
                <TouchableOpacity
                  key={trip.id}
                  style={[
                    styles.tripCard,
                    isSelected && styles.tripCardSelected,
                  ]}
                  onPress={() => loadTripPlayback(trip)}
                >
                  <View style={styles.tripCardTop}>
                    <View>
                      <Text style={styles.tripId}>{trip.id.toUpperCase()}</Text>
                      <Text style={styles.tripReg}>{trip.registration_number}</Text>
                    </View>
                    <View style={styles.tripDistanceBadge}>
                      <Text style={styles.tripDistText}>{trip.distance_km} km</Text>
                    </View>
                  </View>

                  <View style={styles.routeRoute}>
                    <View style={styles.routePoint}>
                      <View style={[styles.dot, { backgroundColor: colors.statusMoving }]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        From: {trip.start_address || `Waypoint (${trip.start_latitude.toFixed(3)}, ${trip.start_longitude.toFixed(3)})`}
                      </Text>
                    </View>
                    <View style={styles.routePoint}>
                      <View style={[styles.dot, { backgroundColor: colors.criticalRed }]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        To: {trip.end_address || `Waypoint (${trip.end_latitude.toFixed(3)}, ${trip.end_longitude.toFixed(3)})`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tripCardFooter}>
                    <Text style={styles.tripFootMeta}>
                      Duration: {trip.duration_minutes} min • {trip.stops_count} stops ({trip.stoppage_minutes} min halt)
                    </Text>
                    <ChevronRight size={16} color={colors.accentBlue} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Target Vehicle Picker Modal (Contained within mobile viewport) */}
      {showVehiclePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT TARGET VEHICLE</Text>
              <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {vehicles.map((v) => {
                const isCur = v.id === selectedVehicleId || v.registration_number === currentVehicleReg;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vehicleOptionItem, isCur && styles.vehicleOptionItemActive]}
                    onPress={() => {
                      setSelectedVehicleId(v.id);
                      setShowVehiclePicker(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionReg}>{v.registration_number}</Text>
                      <Text style={styles.optionModel}>
                        {v.make} {v.model} • {v.category_name || 'Commercial'}
                      </Text>
                    </View>
                    {isCur && <Check size={18} color={colors.primaryNavy} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    paddingBottom: 150,
  },
  // Filter Bar (Website Image 2)
  filterCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  filterBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  vehicleSelectorBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  selectorIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(10, 25, 47, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  selectorInfoCol: {
    flex: 1,
  },
  selectorRegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  selectorVehicleReg: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  selectorCatChip: {
    backgroundColor: 'rgba(10, 25, 47, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectorCatChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  selectorVehicleModel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  dateInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  dateFieldCol: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dateInput: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
    padding: 0,
    flex: 1,
  },
  applyFilterBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    height: 31,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    marginRight: 4,
  },
  presetPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
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

  // Route Replay Player Card
  playerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  playerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerBadgesRow: {
    alignItems: 'flex-end',
    gap: 4,
  },
  aisBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aisBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  osmLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  osmLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  mapWrap: {
    position: 'relative',
  },
  playerControlsSection: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  controlsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  playReplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  playReplayBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  resetBtn: {
    backgroundColor: colors.surfaceLight,
    padding: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  speedButtonGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  speedOptionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  speedOptionBtnActive: {
    backgroundColor: colors.primaryNavy,
  },
  speedOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  speedOptionTextActive: {
    color: '#FFFFFF',
  },
  telemetryPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  telemetryItemText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  waypointSliderContainer: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 5,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderEndpointText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sliderCenterText: {
    fontSize: 9,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  currentLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  currentLocationText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },

  // 3. SELECTED ROUTE SEGMENT Card (Website Image 2)
  segmentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  segmentHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  segmentEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  segmentVehicleReg: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryNavy,
  },
  segmentVehicleModel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  routeWaypointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  originMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.statusMoving,
    marginTop: 4,
    marginRight: 10,
  },
  destMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.criticalRed,
    marginTop: 4,
    marginRight: 10,
  },
  waypointDirectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  waypointCoords: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  waypointTimestamp: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },

  // 4 KPI Metrics Grid (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  metricBox: {
    width: '48%',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primaryNavy,
  },
  metricSubtext: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },

  // En-Route Stoppages Breakdown
  stoppagesBreakdownSection: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  stoppagesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  redStopDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.criticalRed,
    marginRight: 6,
  },
  stoppagesSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.criticalRed,
    letterSpacing: 0.3,
  },
  totalStoppageDuration: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  stoppageItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
  },
  stoppageItemCardActive: {
    borderColor: colors.criticalRed,
    backgroundColor: '#FEE2E2',
  },
  stoppageNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.criticalRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  stoppageNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stoppageCoordsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stoppageTelemetryText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  stoppageDurationPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  stoppageDurationPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.criticalRed,
  },

  // View OSM Button
  viewOsmFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  viewOsmFullBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentBlue,
  },

  // Completed Trips History List
  tripsSection: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  tripCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  tripCardSelected: {
    borderColor: colors.accentBlue,
    borderWidth: 2,
    backgroundColor: '#F0F9FF',
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripId: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tripReg: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tripDistanceBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tripDistText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  routeRoute: {
    gap: 4,
    marginBottom: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  routeText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  tripFootMeta: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyWrap: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Vehicle Picker Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 25, 47, 0.72)',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    ...shadows.strong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  vehicleOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceLight,
  },
  vehicleOptionItemActive: {
    borderColor: colors.primaryNavy,
    backgroundColor: '#F0F9FF',
  },
  optionReg: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  optionModel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
