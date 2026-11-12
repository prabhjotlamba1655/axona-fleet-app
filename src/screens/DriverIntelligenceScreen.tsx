import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  Award,
  Zap,
  RotateCcw,
  Compass,
  AlertTriangle,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
  Calendar,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { DriverLeaderboardItem, DriverIntelligenceEvent, DeviceIMUConfig } from '../types';

interface DriverIntelligenceScreenProps {
  navigation: any;
  route: any;
}

export const DriverIntelligenceScreen: React.FC<DriverIntelligenceScreenProps> = ({
  navigation,
  route,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'events' | 'imuConfig'>('leaderboard');
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | '90days'>('7days');
  const [summary, setSummary] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<DriverLeaderboardItem[]>([]);
  const [events, setEvents] = useState<DriverIntelligenceEvent[]>([]);
  const [imuConfig, setImuConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, leadRes, evRes] = await Promise.all([
        api.driverIntelligence.getSummary(),
        api.driverIntelligence.getLeaderboard(),
        api.driverIntelligence.getEvents({ limit: 40 }),
      ]);
      setSummary(sumRes?.kpis || null);
      setLeaderboard(leadRes || []);
      setEvents(evRes || []);

      // Load IMU config for sample device
      const configRes = await api.driverIntelligence.getDeviceConfig('dev_101');
      setImuConfig(configRes);
    } catch (e) {
      console.warn('Driver intelligence fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = summary || {
    fleetSafetyScore: 88,
    totalEvents: 42,
    harshBraking: 12,
    harshAccel: 14,
    vehicleTilt: 1,
    rashDriving: 6,
    overspeeding: 9,
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Fleet Safety Score Hero Banner */}
        <View style={styles.scoreHeroCard}>
          <View style={styles.scoreHeroTop}>
            <View>
              <Text style={styles.scoreHeroLabel}>FLEET SAFETY SCORE (PRD V2.4)</Text>
              <Text style={styles.scoreHeroValue}>{kpis.fleetSafetyScore} / 100</Text>
              <Text style={styles.scoreTierBadge}>
                {kpis.fleetSafetyScore >= 90
                  ? 'Safe / Defensive Fleet (Tier 1)'
                  : kpis.fleetSafetyScore >= 75
                  ? 'Moderate / Caution Required (Tier 2)'
                  : 'High Risk / Needs Training (Tier 3)'}
              </Text>
            </View>

            <View style={styles.scoreFormulaBox}>
              <Award size={34} color="#60A5FA" />
            </View>
          </View>

          <View style={styles.formulaNote}>
            <Shield size={12} color="#93C5FD" style={{ marginRight: 6 }} />
            <Text style={styles.formulaText}>
              Algorithm: 100 - (3×HB + 2×HA + 10×Tilt + 5×Rash + 2×Overspeed)
            </Text>
          </View>
        </View>

        {/* Timeframe Filter Pills */}
        <View style={styles.timeframeRow}>
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: '90days', label: '90 Days' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.timePill,
                timeframe === t.id && styles.timePillActive,
              ]}
              onPress={() => setTimeframe(t.id as any)}
            >
              <Text
                style={[
                  styles.timePillText,
                  timeframe === t.id && styles.timePillTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* The 5 Behavioral Dimensions KPI Matrix */}
        <View style={styles.dimensionsSection}>
          <Text style={styles.sectionHeader}>5 BEHAVIORAL DIMENSIONS (100Hz MEMS IMU)</Text>

          <View style={styles.dimGrid}>
            {/* 1. Harsh Braking */}
            <View style={styles.dimCard}>
              <View style={styles.dimIconWrap}>
                <Zap size={16} color={colors.warningAmber} />
              </View>
              <Text style={styles.dimCount}>{kpis.harshBraking}</Text>
              <Text style={styles.dimTitle}>Harsh Braking</Text>
              <Text style={styles.dimSpec}>Code 13 • &gt; 0.55g</Text>
            </View>

            {/* 2. Harsh Accel */}
            <View style={styles.dimCard}>
              <View style={styles.dimIconWrap}>
                <Zap size={16} color={colors.warningAmber} />
              </View>
              <Text style={styles.dimCount}>{kpis.harshAccel}</Text>
              <Text style={styles.dimTitle}>Harsh Accel</Text>
              <Text style={styles.dimSpec}>Code 14 • &gt; 0.43g</Text>
            </View>

            {/* 3. Vehicle Tilt */}
            <View style={[styles.dimCard, kpis.vehicleTilt > 0 && styles.dimCardCritical]}>
              <View style={[styles.dimIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <RotateCcw size={16} color={colors.criticalRed} />
              </View>
              <Text style={[styles.dimCount, { color: colors.criticalRed }]}>{kpis.vehicleTilt}</Text>
              <Text style={styles.dimTitle}>Vehicle Tilt</Text>
              <Text style={styles.dimSpec}>Code 22 • &gt; 45° Lean</Text>
            </View>

            {/* 4. Rash Driving */}
            <View style={styles.dimCard}>
              <View style={styles.dimIconWrap}>
                <AlertTriangle size={16} color={colors.warningAmber} />
              </View>
              <Text style={styles.dimCount}>{kpis.rashDriving}</Text>
              <Text style={styles.dimTitle}>Rash Driving</Text>
              <Text style={styles.dimSpec}>Code 15 • 30km/h 0.47g</Text>
            </View>

            {/* 5. Overspeeding */}
            <View style={styles.dimCard}>
              <View style={styles.dimIconWrap}>
                <Compass size={16} color={colors.warningAmber} />
              </View>
              <Text style={styles.dimCount}>{kpis.overspeeding}</Text>
              <Text style={styles.dimTitle}>Overspeeding</Text>
              <Text style={styles.dimSpec}>Code 17 • &gt; 70 km/h</Text>
            </View>
          </View>
        </View>

        {/* Tab Toggle: Leaderboard vs Live Incidents vs IMU Config */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'leaderboard' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'leaderboard' && styles.toggleBtnTextActive,
              ]}
            >
              Driver Leaderboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'events' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('events')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'events' && styles.toggleBtnTextActive,
              ]}
            >
              IMU Incidents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'imuConfig' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('imuConfig')}
          >
            <Text
              style={[
                styles.toggleBtnText,
                activeTab === 'imuConfig' && styles.toggleBtnTextActive,
              ]}
            >
              AIS-140 Config
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Driver Leaderboard */}
        {activeTab === 'leaderboard' && (
          <View style={styles.sectionWrap}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 20 }} />
            ) : leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No driver rankings found.</Text>
            ) : (
              leaderboard.map((item) => (
                <View key={item.vehicleId} style={styles.rankCard}>
                  <View style={styles.rankLeft}>
                    <View
                      style={[
                        styles.rankBadge,
                        item.rank === 1 && { backgroundColor: '#F59E0B' },
                        item.rank === 2 && { backgroundColor: '#94A3B8' },
                        item.rank === 3 && { backgroundColor: '#B45309' },
                      ]}
                    >
                      <Text style={styles.rankBadgeText}>#{item.rank}</Text>
                    </View>
                    <View>
                      <Text style={styles.driverName}>{item.driverName}</Text>
                      <Text style={styles.driverSub}>
                        {item.registrationNumber} • {item.vehicleName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rankRight}>
                    <Text
                      style={[
                        styles.driverScore,
                        {
                          color:
                            item.safetyScore >= 90
                              ? colors.statusMoving
                              : item.safetyScore >= 75
                              ? colors.warningAmber
                              : colors.criticalRed,
                        },
                      ]}
                    >
                      {item.safetyScore}
                    </Text>
                    <Text style={styles.violationsSub}>{item.totalViolations} violations</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 2: IMU Incidents */}
        {activeTab === 'events' && (
          <View style={styles.sectionWrap}>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventCard}>
                <View style={styles.eventTop}>
                  <Text style={styles.eventTitle}>{ev.event_type.replace('_', ' ')}</Text>
                  <Text
                    style={[
                      styles.eventSeverity,
                      { color: ev.severity === 'CRITICAL' ? colors.criticalRed : colors.warningAmber },
                    ]}
                  >
                    {ev.severity}
                  </Text>
                </View>
                <Text style={styles.eventVehicle}>
                  {ev.registration_number} • {ev.vehicle_model || 'Commercial'}
                </Text>
                <Text style={styles.eventLoc} numberOfLines={1}>
                  {ev.address || `${ev.latitude}, ${ev.longitude}`}
                </Text>
                <Text style={styles.eventTime}>{new Date(ev.event_time).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: AIS-140 IMU Config */}
        {activeTab === 'imuConfig' && (
          <View style={styles.configCard}>
            <View style={styles.configHeader}>
              <Sliders size={16} color={colors.primaryNavy} />
              <Text style={styles.configTitle}>tnavIC AIS-140 CALIBRATION PARAMETERS</Text>
            </View>

            <View style={styles.configItem}>
              <Text style={styles.configKey}>Harsh Braking Threshold (HBT)</Text>
              <Text style={styles.configVal}>0.55g deceleration</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configKey}>Harsh Acceleration Threshold (HAT)</Text>
              <Text style={styles.configVal}>0.43g forward surge</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configKey}>Vehicle Tilt Limit (TA)</Text>
              <Text style={styles.configVal}>45.0° angular lean</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configKey}>Rash Turning Speed / G (RTT / HTA)</Text>
              <Text style={styles.configVal}>30 km/h + 0.47g lateral</Text>
            </View>
            <View style={styles.configItem}>
              <Text style={styles.configKey}>Speed Limit (SL)</Text>
              <Text style={styles.configVal}>70 km/h (Configurable)</Text>
            </View>

            {imuConfig?.commandString && (
              <View style={styles.cmdBox}>
                <Text style={styles.cmdLabel}>OTA Command Payload:</Text>
                <Text style={styles.cmdText}>{imuConfig.commandString}</Text>
              </View>
            )}
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
    padding: 16,
    paddingBottom: 40,
  },
  scoreHeroCard: {
    backgroundColor: colors.primaryNavy,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    ...shadows.card,
  },
  scoreHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreHeroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  scoreHeroValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  scoreTierBadge: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreFormulaBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#60A5FA',
  },
  formulaNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  formulaText: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '500',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  timePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  timePillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timePillTextActive: {
    color: '#FFFFFF',
  },
  dimensionsSection: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dimGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  dimCardCritical: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  dimIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dimCount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  dimTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dimSpec: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryNavy,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionWrap: {
    gap: 8,
  },
  rankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  driverScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  violationsSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  eventCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventSeverity: {
    fontSize: 11,
    fontWeight: '800',
  },
  eventVehicle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventLoc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  configCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  configTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  configKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  configVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cmdBox: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  cmdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  cmdText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryNavy,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 20,
  },
});
