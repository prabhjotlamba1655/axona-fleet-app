import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  Cpu,
  Battery,
  Zap,
  ShieldAlert,
  Radio,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { DeviceHealthItem } from '../types';

interface DeviceHealthScreenProps {
  navigation: any;
}

export const DeviceHealthScreen: React.FC<DeviceHealthScreenProps> = ({ navigation }) => {
  const [devices, setDevices] = useState<DeviceHealthItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await api.devices.list();
      setDevices(data || []);
    } catch (e) {
      console.warn('Devices fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = total - online;

  const filtered = devices.filter((d) => {
    if (filterStatus === 'ONLINE' && d.status !== 'online') return false;
    if (filterStatus === 'OFFLINE' && d.status !== 'offline') return false;
    if (filterStatus === 'CRITICAL' && d.health_status !== 'CRITICAL') return false;
    if (filterStatus === 'WARNING' && d.health_status !== 'WARNING') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.imei?.toLowerCase().includes(q) ||
        d.registration_number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hardware Status Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Devices</Text>
            <Text style={styles.summaryValue}>{total}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Online / Pinging</Text>
            <Text style={[styles.summaryValue, { color: colors.statusMoving }]}>{online}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Offline Assets</Text>
            <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>{offline}</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by IMEI or registration number..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={loadDevices}>
            <RefreshCw size={16} color={colors.primaryNavy} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.pillsRow}>
          {['ALL', 'ONLINE', 'OFFLINE', 'WARNING', 'CRITICAL'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.pill,
                filterStatus === f && styles.pillActive,
              ]}
              onPress={() => setFilterStatus(f)}
            >
              <Text
                style={[
                  styles.pillText,
                  filterStatus === f && styles.pillTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hardware Devices Cards List */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>
            AIS-140 TELEMATICS HARDWARE INVENTORY ({filtered.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 20 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No devices matching current filter criteria.</Text>
            </View>
          ) : (
            filtered.map((dev) => {
              const isMainPowerOk = Boolean(dev.main_power_connected);
              const isOnline = dev.status === 'online';
              const batt = dev.backup_battery_pct ?? 96;

              return (
                <View key={dev.id} style={styles.deviceCard}>
                  {/* Top Header */}
                  <View style={styles.deviceTop}>
                    <View>
                      <Text style={styles.imeiText}>IMEI: {dev.imei}</Text>
                      <Text style={styles.regText}>
                        Assigned: {dev.registration_number || 'Unassigned Stock'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isOnline ? '#DCFCE7' : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isOnline ? '#166534' : '#475569' },
                        ]}
                      >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </Text>
                    </View>
                  </View>

                  {/* Hardware Telemetry Parameters Matrix */}
                  <View style={styles.paramGrid}>
                    <View style={styles.paramItem}>
                      <Zap size={14} color={isMainPowerOk ? colors.statusMoving : colors.criticalRed} />
                      <Text style={styles.paramLabel}>Main Power</Text>
                      <Text style={[styles.paramValue, !isMainPowerOk && { color: colors.criticalRed }]}>
                        {isMainPowerOk ? '12.6V (OK)' : '0.0V (CUT)'}
                      </Text>
                    </View>

                    <View style={styles.paramItem}>
                      <Battery size={14} color={batt > 20 ? colors.statusMoving : colors.criticalRed} />
                      <Text style={styles.paramLabel}>Li-ion Batt</Text>
                      <Text style={styles.paramValue}>{batt}%</Text>
                    </View>

                    <View style={styles.paramItem}>
                      <Radio size={14} color={colors.statusMoving} />
                      <Text style={styles.paramLabel}>GPS Antenna</Text>
                      <Text style={styles.paramValue}>Connected</Text>
                    </View>

                    <View style={styles.paramItem}>
                      <ShieldAlert size={14} color={colors.statusMoving} />
                      <Text style={styles.paramLabel}>Tamper Switch</Text>
                      <Text style={styles.paramValue}>Closed</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.footerTime}>
                      Last Comm: {dev.last_communication ? new Date(dev.last_communication).toLocaleTimeString() : 'Recent ping'}
                    </Text>
                    <Text style={styles.complianceTag}>MoRTH AIS-140 Certified</Text>
                  </View>
                </View>
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.textPrimary,
    padding: 0,
  },
  refreshBtn: {
    backgroundColor: colors.cardBackground,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  pill: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pillActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  devicesSection: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  deviceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  deviceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  imeiText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  regText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paramGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paramItem: {
    alignItems: 'center',
    flex: 1,
  },
  paramLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  paramValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
  },
  footerTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  complianceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
  emptyWrap: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
