import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Navigation2, Power, Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { StatusBadge } from './StatusBadge';
import { LatestVehicleLocation, Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle | (LatestVehicleLocation & { id?: string });
  location?: LatestVehicleLocation;
  onPress?: () => void;
  onTrackPress?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  location,
  onPress,
  onTrackPress,
}) => {
  const regNumber = vehicle.registration_number || 'N/A';
  const make = vehicle.make || '';
  const model = vehicle.model || '';
  const category = (vehicle as any).category_name || 'Commercial';

  // Extract location fields
  const loc = location || (vehicle as LatestVehicleLocation);
  const speed = typeof loc.speed === 'number' ? Math.round(loc.speed) : 0;
  const ignition = loc.ignition === 1;
  const status = loc.panic_status === 1 ? 'emergency' : loc.movement_status || 'offline';
  const address = loc.address || 'Location coordinates logged';
  const hasPanic = loc.panic_status === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        hasPanic && styles.cardPanic,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.regContainer}>
          <Text style={styles.regNumber}>{regNumber}</Text>
          <Text style={styles.modelText}>
            {make} {model}
          </Text>
        </View>

        <StatusBadge status={status} size="sm" />
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.pill}>
          <Navigation2
            size={12}
            color={speed > 0 ? colors.statusMoving : colors.textMuted}
            style={styles.pillIcon}
          />
          <Text style={styles.pillText}>{speed} km/h</Text>
        </View>

        <View style={styles.pill}>
          <Power
            size={12}
            color={ignition ? colors.statusMoving : colors.criticalRed}
            style={styles.pillIcon}
          />
          <Text style={styles.pillText}>{ignition ? 'IGN ON' : 'IGN OFF'}</Text>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <MapPin size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={styles.addressText} numberOfLines={1}>
          {address}
        </Text>
      </View>

      {hasPanic && (
        <View style={styles.panicWarning}>
          <AlertTriangle size={13} color={colors.criticalRed} style={{ marginRight: 4 }} />
          <Text style={styles.panicWarningText}>Active AIS-140 Panic Alarm Triggered</Text>
        </View>
      )}

      {/* Footer / Quick Actions */}
      <View style={styles.footerRow}>
        <View style={styles.timeWrap}>
          <Clock size={11} color={colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={styles.timeText}>
            {loc.gps_time ? new Date(loc.gps_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </Text>
        </View>

        <View style={styles.actionLinks}>
          {onTrackPress && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={onTrackPress}
            >
              <Text style={styles.trackBtnText}>Live Track</Text>
            </TouchableOpacity>
          )}
          <ChevronRight size={16} color={colors.accentBlue} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  cardPanic: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regContainer: {
    flex: 1,
  },
  regNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  modelText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryPill: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondaryNavy,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  panicWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  panicWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.criticalRed,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
