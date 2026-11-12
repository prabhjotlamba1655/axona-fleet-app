import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  // Active playback state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [waypoints, setWaypoints] = useState<TripWaypoint[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x

  const playbackTimerRef = useRef<any>(null);

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
      setTrips(data);
      if (data.length > 0 && !selectedTrip) {
        // Automatically load playback for the first trip
        loadTripPlayback(data[0]);
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

  // En-route stoppages per PRD rule (speed = 0 and ignition = OFF for > 3 min)
  const stoppages = waypoints
    .map((w, index) => ({ ...w, waypointIndex: index }))
    .filter((w) => w.is_stop === 1);

  const handleSelectStoppage = (wpIndex: number) => {
    pausePlayback();
    setPlaybackIndex(wpIndex);
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Preset Date Filters */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <View style={styles.titleWrap}>
              <Calendar size={14} color={colors.primaryNavy} />
              <Text style={styles.filterTitle}>HISTORY WINDOW (90-DAY RETENTION HORIZON)</Text>
            </View>
          </View>

          <View style={styles.filterPillsRow}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: '90days', label: '90 Days (Max)' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  dateFilter === f.id && styles.filterPillActive,
                ]}
                onPress={() => setDateFilter(f.id as any)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    dateFilter === f.id && styles.filterPillTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Animated Route Playback Map Canvas */}
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <View>
              <Text style={styles.playerTitle}>
                {selectedTrip ? `ROUTE REPLAY: ${selectedTrip.registration_number}` : 'ROUTE REPLAY PLAYER'}
              </Text>
              <Text style={styles.playerSub}>
                {selectedTrip
                  ? `${selectedTrip.distance_km} km • ${selectedTrip.duration_minutes} min • ${selectedTrip.stops_count} Stoppages`
                  : 'Select a trip from history below'}
              </Text>
            </View>
            <View style={styles.speedBadge}>
              <Text style={styles.speedBadgeText}>{playbackSpeed}x Speed</Text>
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

          {/* Live Playback Telematics Bar */}
          <View style={styles.liveTelematicsBar}>
            <View style={styles.telemItem}>
              <Text style={styles.telemLabel}>Speed</Text>
              <Text style={styles.telemVal}>{currentWp ? Math.round(currentWp.speed) : 0} km/h</Text>
            </View>
            <View style={styles.telemItem}>
              <Text style={styles.telemLabel}>Heading</Text>
              <Text style={styles.telemVal}>{currentWp?.heading || 0}°</Text>
            </View>
            <View style={styles.telemItem}>
              <Text style={styles.telemLabel}>Ignition</Text>
              <Text
                style={[
                  styles.telemVal,
                  { color: currentWp?.ignition ? colors.statusMoving : colors.criticalRed },
                ]}
              >
                {currentWp?.ignition ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.telemItem}>
              <Text style={styles.telemLabel}>Progress</Text>
              <Text style={styles.telemVal}>
                {waypoints.length > 0
                  ? `${Math.round(((playbackIndex + 1) / waypoints.length) * 100)}%`
                  : '0%'}
              </Text>
            </View>
          </View>

          {/* Player Controls Bar */}
          <View style={styles.controlsBar}>
            <TouchableOpacity style={styles.controlBtn} onPress={resetPlayback}>
              <RotateCcw size={18} color={colors.primaryNavy} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
              {isPlaying ? (
                <Pause size={20} color="#FFFFFF" />
              ) : (
                <Play size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            {/* Speed Multiplier Cycle Button (1x -> 2x -> 5x -> 10x) */}
            <TouchableOpacity
              style={styles.speedCycleBtn}
              onPress={() => {
                const nextSpeed =
                  playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : playbackSpeed === 5 ? 10 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
            >
              <FastForward size={14} color={colors.primaryNavy} style={{ marginRight: 4 }} />
              <Text style={styles.speedCycleText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* En-Route Stoppages Breakdown Panel (PRD 4.3 Mandatory) */}
        {stoppages.length > 0 && (
          <View style={styles.stoppagesCard}>
            <View style={styles.stoppagesHeader}>
              <Square size={16} color={colors.criticalRed} />
              <Text style={styles.stoppagesTitle}>
                EN-ROUTE STOPPAGES BREAKDOWN ({stoppages.length} HALTS &gt; 3 MIN)
              </Text>
            </View>
            <Text style={styles.stoppagesSub}>
              Tap any stoppage point to immediately seek replay timeline and viewport:
            </Text>

            <View style={styles.stoppageList}>
              {stoppages.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.stoppageItem,
                    playbackIndex === s.waypointIndex && styles.stoppageItemActive,
                  ]}
                  onPress={() => handleSelectStoppage(s.waypointIndex)}
                >
                  <View style={styles.stoppageLeft}>
                    <Text style={styles.stopNum}>🛑 Stop #{idx + 1}</Text>
                    <Text style={styles.stopAddr} numberOfLines={1}>
                      {s.address || 'Commercial inspection / Depot stop'}
                    </Text>
                  </View>
                  <View style={styles.stopDurationBadge}>
                    <Text style={styles.stopDurationText}>
                      {s.stop_duration_min || 8} min
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Completed Trips List */}
        <View style={styles.tripsSection}>
          <Text style={styles.sectionHeading}>COMPLETED TRIPS HISTORY</Text>

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
                        From: {trip.start_address || 'Origin Depot'}
                      </Text>
                    </View>
                    <View style={styles.routePoint}>
                      <View style={[styles.dot, { backgroundColor: colors.criticalRed }]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        To: {trip.end_address || 'Destination Hub'}
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
  filterSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  playerCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.card,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  playerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  speedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  speedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  mapWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
  },
  liveTelematicsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  telemItem: {
    alignItems: 'center',
    flex: 1,
  },
  telemLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  telemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  speedCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  speedCycleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  stoppagesCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.card,
  },
  stoppagesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stoppagesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.criticalRed,
    letterSpacing: 0.3,
  },
  stoppagesSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  stoppageList: {
    gap: 6,
  },
  stoppageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  stoppageItemActive: {
    borderColor: colors.criticalRed,
    backgroundColor: '#FFF5F5',
  },
  stoppageLeft: {
    flex: 1,
    marginRight: 8,
  },
  stopNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stopAddr: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  stopDurationBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stopDurationText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.criticalRed,
  },
  tripsSection: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  tripCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  tripCardSelected: {
    borderColor: colors.accentBlue,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBlue,
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripId: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  tripReg: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tripDistanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tripDistText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  routeRoute: {
    marginVertical: 6,
    gap: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  routeText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    marginTop: 6,
  },
  tripFootMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyWrap: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
