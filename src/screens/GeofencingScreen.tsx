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
  Alert,
} from 'react-native';
import {
  Layers,
  MapPin,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  Shield,
  ArrowRight,
  Truck,
  X,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Geofence, GeofenceEvent } from '../types';

interface GeofencingScreenProps {
  navigation: any;
}

export const GeofencingScreen: React.FC<GeofencingScreenProps> = ({ navigation }) => {
  const { canManageGeofences } = useAuthStore();

  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [loading, setLoading] = useState(false);

  // Creation modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneRadius, setNewZoneRadius] = useState('500');
  const [newZoneLat, setNewZoneLat] = useState('18.5912');
  const [newZoneLon, setNewZoneLon] = useState('73.7389');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [geoList, evList] = await Promise.all([
        api.geofences.list(),
        api.geofences.getEvents(25),
      ]);
      setGeofences(geoList || []);
      setEvents(evList || []);
      if (geoList && geoList.length > 0 && !selectedGeofence) {
        setSelectedGeofence(geoList[0]);
      }
    } catch (e) {
      console.warn('Geofences fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGeofence = async () => {
    if (!newZoneName.trim()) {
      Alert.alert('Required', 'Please enter a name for the geofence perimeter.');
      return;
    }

    try {
      await api.geofences.create({
        name: newZoneName.trim(),
        zone_type: 'circular',
        latitude: parseFloat(newZoneLat) || 18.5912,
        longitude: parseFloat(newZoneLon) || 73.7389,
        radius_meters: parseInt(newZoneRadius) || 500,
        is_active: 1,
      });

      setCreateModalVisible(false);
      setNewZoneName('');
      loadData();
      Alert.alert('Success', 'Geofence zone registered and armed.');
    } catch (e) {
      Alert.alert('Error', 'Failed to create geofence perimeter.');
    }
  };

  const handleDeleteGeofence = (id: string, name: string) => {
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete perimeter '${name}'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.geofences.delete(id);
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Could not delete geofence.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Header Preview */}
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <View style={styles.titleWrap}>
              <Layers size={16} color={colors.primaryNavy} />
              <Text style={styles.mapTitle}>ACTIVE PERIMETER ZONES</Text>
            </View>

            {canManageGeofences() && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>New Geofence</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mapBox}>
            <MapView
              geofences={geofences}
              center={
                selectedGeofence
                  ? [selectedGeofence.latitude, selectedGeofence.longitude]
                  : [18.5912, 73.7389]
              }
              zoom={13}
              height={220}
            />
          </View>
        </View>

        {/* Geofences List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            REGISTERED ZONES & HUBS ({geofences.length})
          </Text>

          {geofences.map((geo) => {
            const isSelected = selectedGeofence?.id === geo.id;
            return (
              <TouchableOpacity
                key={geo.id}
                style={[
                  styles.geoItem,
                  isSelected && styles.geoItemSelected,
                ]}
                onPress={() => setSelectedGeofence(geo)}
              >
                <View style={styles.geoLeft}>
                  <View style={styles.geoBadge}>
                    <Text style={styles.geoBadgeText}>
                      {geo.zone_type === 'circular' ? 'Circle' : 'Polygon'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.geoName}>{geo.name}</Text>
                    <Text style={styles.geoCoords}>
                      Radius: {geo.radius_meters || 500}m • {geo.latitude?.toFixed(4)}, {geo.longitude?.toFixed(4)}
                    </Text>
                  </View>
                </View>

                {canManageGeofences() && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteGeofence(geo.id, geo.name)}
                  >
                    <Trash2 size={16} color={colors.criticalRed} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Geofence In/Out Audit Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENTRY & EXIT DWELL AUDIT LOGS</Text>

          {events.length === 0 ? (
            <Text style={styles.emptyText}>No spatial boundary crossing events logged.</Text>
          ) : (
            events.map((ev) => (
              <View key={ev.id} style={styles.logCard}>
                <View style={styles.logTop}>
                  <Text style={styles.logReg}>{ev.registration_number}</Text>
                  <View
                    style={[
                      styles.logBadge,
                      ev.event_type === 'ENTRY' ? styles.badgeEntry : styles.badgeExit,
                    ]}
                  >
                    <Text style={styles.logBadgeText}>
                      {ev.event_type === 'ENTRY' ? 'ZONE ENTRY (IN)' : 'ZONE EXIT (OUT)'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.logZone}>Perimeter: {ev.geofence_name}</Text>
                <View style={styles.logFooter}>
                  <Text style={styles.logTime}>
                    {new Date(ev.event_time).toLocaleString()}
                  </Text>
                  {ev.dwell_duration_min ? (
                    <Text style={styles.logDwell}>
                      Dwell Time: {ev.dwell_duration_min} min
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Creation Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Arm New Geofence Perimeter</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Zone Name / Depot ID</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apex Hinjawadi Central Logistics Hub"
                placeholderTextColor={colors.textMuted}
                value={newZoneName}
                onChangeText={setNewZoneName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Perimeter Radius (Meters)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="500"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={newZoneRadius}
                onChangeText={setNewZoneRadius}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  style={styles.textInput}
                  value={newZoneLat}
                  onChangeText={setNewZoneLat}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  style={styles.textInput}
                  value={newZoneLon}
                  onChangeText={setNewZoneLon}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreateGeofence}
              >
                <Text style={styles.confirmText}>Arm Perimeter</Text>
              </TouchableOpacity>
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
  mapCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.card,
  },
  mapCardHeader: {
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
  mapTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapBox: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  geoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  geoItemSelected: {
    borderColor: colors.accentBlue,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentBlue,
  },
  geoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  geoBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  geoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  geoName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  geoCoords: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  logCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logReg: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeEntry: {
    backgroundColor: '#DCFCE7',
  },
  badgeExit: {
    backgroundColor: '#FEF3C7',
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logZone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
    marginTop: 6,
  },
  logTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  logDwell: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
