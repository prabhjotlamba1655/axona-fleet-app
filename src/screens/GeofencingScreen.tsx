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
  Check,
  Compass,
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
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="GEOFENCING"
        subtitle="Spatial Perimeters & Dwell"
      />

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

      {/* Creation Modal Overlay (Contained within mobile viewport) */}
      {createModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalIconBadge}>
                  <Shield size={18} color={colors.accentBlue} />
                </View>
                <View>
                  <Text style={styles.modalHeading}>Arm New Geofence</Text>
                  <Text style={styles.modalSubheading}>AIS-140 Spatial Perimeter Zone</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCreateModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* Field 1: Zone Name / Depot ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ZONE NAME / DEPOT ID *</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Apex Hinjawadi Central Logistics Hub"
                    placeholderTextColor={colors.textMuted}
                    value={newZoneName}
                    onChangeText={setNewZoneName}
                  />
                </View>
              </View>

              {/* Field 2: Perimeter Radius */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>PERIMETER RADIUS *</Text>
                  <Text style={styles.inputHelperText}>{newZoneRadius} meters</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Compass size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="500"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={newZoneRadius}
                    onChangeText={setNewZoneRadius}
                  />
                  <View style={styles.inputUnitBadge}>
                    <Text style={styles.inputUnitText}>Meters</Text>
                  </View>
                </View>

                {/* Radius Presets */}
                <View style={styles.radiusPresetsRow}>
                  {[100, 250, 500, 1000, 2000].map((r) => {
                    const isSelected = newZoneRadius === r.toString();
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.radiusChip, isSelected && styles.radiusChipActive]}
                        onPress={() => setNewZoneRadius(r.toString())}
                      >
                        <Text style={[styles.radiusChipText, isSelected && styles.radiusChipTextActive]}>
                          {r >= 1000 ? `${r / 1000} km` : `${r}m`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Field 3: GPS Coordinates */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CENTER COORDINATES (WGS84) *</Text>
                <View style={styles.coordsRow}>
                  <View style={styles.coordCol}>
                    <Text style={styles.coordLabel}>Latitude</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.coordInput}
                        value={newZoneLat}
                        onChangeText={setNewZoneLat}
                        keyboardType="numeric"
                        placeholder="18.5912"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.coordCol}>
                    <Text style={styles.coordLabel}>Longitude</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.coordInput}
                        value={newZoneLon}
                        onChangeText={setNewZoneLon}
                        keyboardType="numeric"
                        placeholder="73.7389"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>

                {/* Quick Depot Presets */}
                <View style={styles.depotPresetsRow}>
                  <Text style={styles.depotPresetsLabel}>PRESETS:</Text>
                  <TouchableOpacity
                    style={styles.depotPresetBtn}
                    onPress={() => {
                      setNewZoneLat('18.5912');
                      setNewZoneLon('73.7389');
                      if (!newZoneName) setNewZoneName('Apex Hinjawadi Central Logistics Hub');
                    }}
                  >
                    <Text style={styles.depotPresetText}>Hinjawadi HQ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.depotPresetBtn}
                    onPress={() => {
                      setNewZoneLat('18.5089');
                      setNewZoneLon('73.9260');
                      if (!newZoneName) setNewZoneName('Magarpatta Cybercity Hub');
                    }}
                  >
                    <Text style={styles.depotPresetText}>Magarpatta Hub</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Statutory AIS-140 Policy Banner */}
              <View style={styles.statutoryBanner}>
                <Check size={13} color={colors.statusMoving} style={{ marginRight: 6 }} />
                <Text style={styles.statutoryText}>
                  Breach Triggers: Entry, Exit & Dwell Audit Logged
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
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
                <Shield size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmText}>Arm Perimeter</Text>
              </TouchableOpacity>
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
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 356,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.strong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.2,
  },
  modalSubheading: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    paddingBottom: 4,
  },
  inputGroup: {
    marginBottom: 11,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  inputHelperText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: 0,
  },
  inputUnitBadge: {
    backgroundColor: 'rgba(10, 25, 47, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inputUnitText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  radiusPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  radiusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  radiusChipActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  radiusChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  coordCol: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  coordInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: 0,
  },
  depotPresetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  depotPresetsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  depotPresetBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(0, 102, 204, 0.07)',
    borderRadius: 5,
  },
  depotPresetText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  statutoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 106, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 106, 0.2)',
  },
  statutoryText: {
    fontSize: 10,
    color: colors.statusMoving,
    fontWeight: '600',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  cancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryNavy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
