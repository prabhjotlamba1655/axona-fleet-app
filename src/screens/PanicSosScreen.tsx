import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  User,
  Cpu,
  RotateCcw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { MapView } from '../components/MapView';
import { useTelematicsStore } from '../store/telematicsStore';
import { useAuthStore } from '../store/authStore';
import { PanicEvent, PanicStatus } from '../types';

interface PanicSosScreenProps {
  navigation: any;
}

export const PanicSosScreen: React.FC<PanicSosScreenProps> = ({ navigation }) => {
  const { user, canAcknowledgeAlerts } = useAuthStore();
  const {
    panicEvents,
    fetchPanicEvents,
    acknowledgePanic,
    resolvePanic,
    simulatePanic,
    sirenActive,
    toggleSiren,
  } = useTelematicsStore();

  const [selectedIncident, setSelectedIncident] = useState<PanicEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetStatus, setTargetStatus] = useState<PanicStatus>('Acknowledged');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPanicEvents();
  }, []);

  useEffect(() => {
    if (panicEvents.length > 0 && !selectedIncident) {
      setSelectedIncident(panicEvents[0]);
    }
  }, [panicEvents]);

  const handleOpenStatusModal = (incident: PanicEvent, nextStatus: PanicStatus) => {
    setSelectedIncident(incident);
    setTargetStatus(nextStatus);
    setRemarks('');
    setModalVisible(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedIncident) return;
    if (!remarks.trim()) {
      Alert.alert('Mandatory Remarks', 'The PRD requires mandatory operator audit remarks for acknowledging or resolving SOS incidents.');
      return;
    }

    setActionLoading(true);
    let success = false;
    if (targetStatus === 'Acknowledged') {
      success = await acknowledgePanic(selectedIncident.id, remarks.trim());
    } else {
      success = await resolvePanic(selectedIncident.id, remarks.trim());
    }
    setActionLoading(false);

    if (success) {
      setModalVisible(false);
      Alert.alert('Status Updated', `Incident marked as ${targetStatus}. Audit trail updated.`);
    } else {
      Alert.alert('Failed', 'Could not update panic incident status.');
    }
  };

  const handleSimulateNewSOS = async () => {
    const res = await simulatePanic();
    if (res) {
      Alert.alert('New Emergency Ingested', `Live AIS-140 panic packet fired for ${res.vehicle}`);
    }
  };

  const activeCount = panicEvents.filter((p) => p.status === 'New' || p.status === 'Acknowledged').length;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Critical Command Banner */}
        <View style={styles.criticalHeaderCard}>
          <View style={styles.bannerTop}>
            <View style={styles.badgeWrap}>
              <ShieldAlert size={20} color="#FFFFFF" />
              <Text style={styles.badgeText}>STATUTORY AIS-140 EMERGENCY MONITOR</Text>
            </View>

            <TouchableOpacity
              style={styles.sirenBtn}
              onPress={() => toggleSiren()}
            >
              {sirenActive ? (
                <Volume2 size={16} color="#FFFFFF" />
              ) : (
                <VolumeX size={16} color="#FECACA" />
              )}
              <Text style={styles.sirenBtnText}>
                {sirenActive ? 'Siren Muted' : 'Sound Alarm'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.bannerCounter}>
            {activeCount} PENDING EMERGENCY {activeCount === 1 ? 'INCIDENT' : 'INCIDENTS'}
          </Text>
          <Text style={styles.bannerSub}>
            MoRTH Public Safety Protocol: Acknowledge within 120s with mandatory operator remarks.
          </Text>

          <View style={styles.emergencyCtas}>
            <TouchableOpacity
              style={styles.sosTestBtn}
              onPress={handleSimulateNewSOS}
            >
              <Flame size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.sosTestText}>Trigger Test Panic SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.call112Btn}
              onPress={() => Linking.openURL('tel:112')}
            >
              <Phone size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.call112Text}>Call 112 (National ERSS)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected Incident Telematics Details */}
        {selectedIncident && (
          <View style={styles.incidentCard}>
            <View style={styles.incidentTop}>
              <View>
                <Text style={styles.incidentReg}>
                  {selectedIncident.registration_number}
                </Text>
                <Text style={styles.incidentTime}>
                  Triggered: {new Date(selectedIncident.event_time).toLocaleString()}
                </Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  selectedIncident.status === 'New'
                    ? styles.statusNew
                    : selectedIncident.status === 'Acknowledged'
                    ? styles.statusAck
                    : styles.statusRes,
                ]}
              >
                <Text style={styles.statusPillText}>{selectedIncident.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Map Preview for Incident */}
            <View style={styles.mapBox}>
              <MapView
                vehicles={[
                  {
                    vehicle_id: selectedIncident.vehicle_id,
                    registration_number: selectedIncident.registration_number,
                    make: 'Vehicle',
                    model: 'In Emergency',
                    latitude: selectedIncident.latitude,
                    longitude: selectedIncident.longitude,
                    speed: selectedIncident.speed || 0,
                    heading: 0,
                    ignition: 1,
                    movement_status: 'emergency',
                    panic_status: 1,
                    gps_time: selectedIncident.event_time,
                  },
                ]}
                selectedVehicleId={selectedIncident.vehicle_id}
                center={[selectedIncident.latitude, selectedIncident.longitude]}
                zoom={15}
                height={180}
              />
            </View>

            {/* Info Grid */}
            <View style={styles.detailGrid}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Assigned Driver</Text>
                <Text style={styles.gridVal}>
                  {selectedIncident.owner_name || 'Assigned Driver'}
                </Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Driver Contact</Text>
                <Text style={styles.gridVal}>
                  {selectedIncident.owner_phone || '+91 98220 12345'}
                </Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Emergency Contact</Text>
                <Text style={styles.gridVal}>
                  {selectedIncident.emergency_contact_phone || '+91 98765 43210'}
                </Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Device IMEI</Text>
                <Text style={styles.gridVal}>
                  {selectedIncident.device_imei || '863124059123456'}
                </Text>
              </View>

              <View style={[styles.gridCol, { width: '100%' }]}>
                <Text style={styles.gridLabel}>Incident Location</Text>
                <Text style={styles.gridVal}>
                  {selectedIncident.address || `${selectedIncident.latitude.toFixed(5)}, ${selectedIncident.longitude.toFixed(5)}`}
                </Text>
              </View>

              {selectedIncident.remarks && (
                <View style={[styles.gridCol, { width: '100%', backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 6 }]}>
                  <Text style={styles.gridLabel}>Operator Remarks History</Text>
                  <Text style={styles.remarksText}>{selectedIncident.remarks}</Text>
                  {selectedIncident.acknowledged_by_name && (
                    <Text style={styles.ackMeta}>
                      Ack by: {selectedIncident.acknowledged_by_name} at {new Date(selectedIncident.acknowledged_at || '').toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* 4-Stage Resolution Action Buttons */}
            {canAcknowledgeAlerts() && (
              <View style={styles.workflowRow}>
                {selectedIncident.status === 'New' && (
                  <TouchableOpacity
                    style={[styles.workflowBtn, { backgroundColor: colors.warningAmber }]}
                    onPress={() => handleOpenStatusModal(selectedIncident, 'Acknowledged')}
                  >
                    <CheckCircle size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.workflowBtnText}>Acknowledge SOS</Text>
                  </TouchableOpacity>
                )}

                {selectedIncident.status === 'Acknowledged' && (
                  <TouchableOpacity
                    style={[styles.workflowBtn, { backgroundColor: colors.statusMoving }]}
                    onPress={() => handleOpenStatusModal(selectedIncident, 'Resolved')}
                  >
                    <CheckCircle size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.workflowBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.workflowBtn, { backgroundColor: colors.primaryNavy }]}
                  onPress={() =>
                    Linking.openURL(`tel:${selectedIncident.owner_phone || '+919822012345'}`)
                  }
                >
                  <Phone size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.workflowBtnText}>Call Driver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* All Panic Incidents List */}
        <View style={styles.listSection}>
          <Text style={styles.listHeading}>INCIDENT QUEUE & AUDIT ARCHIVE</Text>

          {panicEvents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            return (
              <TouchableOpacity
                key={incident.id}
                style={[
                  styles.incidentItem,
                  isSelected && styles.incidentItemSelected,
                  incident.status === 'New' && styles.incidentItemNew,
                ]}
                onPress={() => setSelectedIncident(incident)}
              >
                <View style={styles.itemTop}>
                  <Text style={styles.itemReg}>{incident.registration_number}</Text>
                  <Text
                    style={[
                      styles.itemStatus,
                      {
                        color:
                          incident.status === 'New'
                            ? colors.criticalRed
                            : incident.status === 'Acknowledged'
                            ? colors.warningAmber
                            : colors.statusMoving,
                      },
                    ]}
                  >
                    {incident.status}
                  </Text>
                </View>
                <Text style={styles.itemAddress} numberOfLines={1}>
                  {incident.address || `${incident.latitude}, ${incident.longitude}`}
                </Text>
                <Text style={styles.itemTime}>
                  {new Date(incident.event_time).toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Mandatory Remarks Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update Emergency Status: {targetStatus.toUpperCase()}
            </Text>
            <Text style={styles.modalSub}>
              Enter mandatory NOC dispatch & resolution remarks for compliance audit log:
            </Text>

            <TextInput
              style={styles.remarksInput}
              placeholder="e.g. Driver verified safe, emergency desk dispatched highway patrol."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={remarks}
              onChangeText={setRemarks}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleConfirmStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Confirm Audit Entry</Text>
                )}
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
  criticalHeaderCard: {
    backgroundColor: colors.criticalRed,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    ...shadows.emergency,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sirenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  sirenBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bannerCounter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerSub: {
    color: '#FEE2E2',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 14,
  },
  emergencyCtas: {
    flexDirection: 'row',
    gap: 8,
  },
  sosTestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingVertical: 8,
    borderRadius: 6,
  },
  sosTestText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  call112Btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 6,
  },
  call112Text: {
    color: colors.criticalRed,
    fontSize: 11,
    fontWeight: '800',
  },
  incidentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
    ...shadows.card,
  },
  incidentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  incidentReg: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  incidentTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusNew: {
    backgroundColor: '#FEE2E2',
  },
  statusAck: {
    backgroundColor: '#FEF3C7',
  },
  statusRes: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  mapBox: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    marginBottom: 12,
  },
  gridCol: {
    width: '50%',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  remarksText: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  ackMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  workflowRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
  },
  workflowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  workflowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listSection: {
    marginTop: 6,
  },
  listHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  incidentItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  incidentItemSelected: {
    borderColor: colors.criticalRed,
    borderLeftWidth: 4,
    borderLeftColor: colors.criticalRed,
  },
  incidentItemNew: {
    backgroundColor: '#FFF5F5',
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemReg: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemAddress: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    ...shadows.elevated,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  remarksInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCancelText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSubmitText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
