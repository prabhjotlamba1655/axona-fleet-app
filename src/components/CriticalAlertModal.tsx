import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Volume2,
  VolumeX,
  X,
  Navigation,
  CheckCircle,
  Truck,
  Activity,
  Layers,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { useTelematicsStore } from '../store/telematicsStore';
import { soundService } from '../services/soundService';
import { navigationRef } from '../navigation';

export const CriticalAlertModal: React.FC = () => {
  const { activeCriticalPopup, dismissCriticalPopup, setSelectedVehicle, livePositions } =
    useTelematicsStore();

  const [isMuted, setIsMuted] = useState(soundService.isMuted);

  if (!activeCriticalPopup) return null;

  const handleToggleMute = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  const handleViewOnMap = () => {
    const vId = activeCriticalPopup.vehicleId;
    if (vId && livePositions[vId]) {
      setSelectedVehicle(livePositions[vId]);
    }
    soundService.stop();
    dismissCriticalPopup();

    if (navigationRef.isReady()) {
      navigationRef.navigate('MainTabs', {
        screen: 'LiveMap',
      });
    }
  };

  const handleAcknowledge = () => {
    soundService.stop();
    dismissCriticalPopup();
  };

  const handleDismiss = () => {
    soundService.stop();
    dismissCriticalPopup();
  };

  // Determine icon & header accent by alert type
  let alertIcon = <ShieldAlert size={26} color="#DC2626" />;
  let accentColor = '#DC2626';
  let badgeLabel = 'CRITICAL ALERT';

  if (activeCriticalPopup.type === 'TOWING') {
    alertIcon = <Truck size={26} color="#EA580C" />;
    accentColor = '#EA580C';
    badgeLabel = 'UNAUTHORIZED MOTION';
  } else if (activeCriticalPopup.type === 'TILT') {
    alertIcon = <AlertTriangle size={26} color="#DC2626" />;
    accentColor = '#DC2626';
    badgeLabel = 'ROLLOVER RISK';
  } else if (
    activeCriticalPopup.type === 'GEOFENCE_EXIT' ||
    activeCriticalPopup.type === 'GEOFENCE_ENTRY'
  ) {
    alertIcon = <MapPin size={26} color="#D97706" />;
    accentColor = '#D97706';
    badgeLabel = 'GEOFENCE BREACH';
  } else if (activeCriticalPopup.type === 'TAMPER') {
    alertIcon = <Zap size={26} color="#B91C1C" />;
    accentColor = '#B91C1C';
    badgeLabel = 'BATTERY CUT & TAMPER';
  }

  return (
    <Modal
      transparent
      visible={Boolean(activeCriticalPopup)}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View style={[styles.popupCard, { borderColor: accentColor }]}>
          {/* Top Emergency Radar Banner */}
          <View style={[styles.topBanner, { backgroundColor: accentColor }]}>
            <View style={styles.topBannerLeft}>
              <View style={styles.blinkingDot} />
              <Text style={styles.topBannerTag}>{badgeLabel}</Text>
            </View>

            <View style={styles.topBannerControls}>
              <TouchableOpacity
                style={styles.soundButton}
                onPress={handleToggleMute}
                activeOpacity={0.7}
                accessibilityLabel="Toggle sound"
              >
                {isMuted ? (
                  <VolumeX size={16} color="#FFFFFF" />
                ) : (
                  <Volume2 size={16} color="#FFFFFF" />
                )}
                <Text style={styles.soundButtonText}>{isMuted ? 'Muted' : 'Sound ON'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleDismiss}
                activeOpacity={0.7}
                accessibilityLabel="Close"
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Card Content */}
          <View style={styles.contentWrap}>
            {/* Header with Icon and Title */}
            <View style={styles.headerRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
                {alertIcon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: accentColor }]}>
                  {activeCriticalPopup.title}
                </Text>
                <Text style={styles.alertSubtitle}>
                  {activeCriticalPopup.subtitle}
                </Text>
              </View>
            </View>

            {/* Vehicle Identification Box */}
            <View style={styles.vehicleBox}>
              <View style={styles.vehicleBoxLeft}>
                <Text style={styles.vehicleRegText}>
                  {activeCriticalPopup.vehicleReg}
                </Text>
                {Boolean(activeCriticalPopup.driverName) && (
                  <Text style={styles.driverText}>
                    Driver: {activeCriticalPopup.driverName}
                  </Text>
                )}
              </View>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>
                  {activeCriticalPopup.timestamp}
                </Text>
              </View>
            </View>

            {/* Location Row */}
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.accentBlue} style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={styles.locationText} numberOfLines={2}>
                {activeCriticalPopup.location}
              </Text>
            </View>

            {/* 4-Item Telemetry Matrix */}
            <View style={styles.metricsGrid}>
              {activeCriticalPopup.metrics.map((m, idx) => (
                <View key={idx} style={styles.metricItem}>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      m.isHighlight && { color: accentColor, fontWeight: '900' },
                    ]}
                  >
                    {m.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.mapBtn]}
                onPress={handleViewOnMap}
                activeOpacity={0.8}
              >
                <Navigation size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>View on Live Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.ackBtn, { backgroundColor: accentColor }]}
                onPress={handleAcknowledge}
                activeOpacity={0.8}
              >
                <CheckCircle size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 35, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    zIndex: 99999,
  },
  popupCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    ...shadows.large,
    elevation: 24,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  topBannerTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  topBannerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  soundButtonText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 2,
  },
  contentWrap: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 15,
  },
  vehicleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  vehicleBoxLeft: {
    flex: 1,
  },
  vehicleRegText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primaryNavy,
    letterSpacing: 0.4,
  },
  driverText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  timeTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  timeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 9,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 10.5,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    ...shadows.subtle,
  },
  mapBtn: {
    backgroundColor: colors.primaryNavy,
  },
  ackBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
