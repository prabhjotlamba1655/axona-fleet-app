import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import {
  X,
  Navigation,
  Power,
  Battery,
  MapPin,
  Clock,
  Phone,
  FileText,
  History,
  ShieldAlert,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { StatusBadge } from './StatusBadge';
import { LatestVehicleLocation } from '../types';

interface VehicleBottomSheetProps {
  vehicle: LatestVehicleLocation | null;
  onClose: () => void;
  navigation: any;
}

export const VehicleBottomSheet: React.FC<VehicleBottomSheetProps> = ({
  vehicle,
  onClose,
  navigation,
}) => {
  if (!vehicle) return null;

  const speed = typeof vehicle.speed === 'number' ? Math.round(vehicle.speed) : 0;
  const isIgnitionOn = vehicle.ignition === 1;
  const hasPanic = vehicle.panic_status === 1;
  const phone = vehicle.driver_phone || '+91 98220 12345';

  const handleCall = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={styles.sheetContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.regNumber}>{vehicle.registration_number}</Text>
          <Text style={styles.modelSub}>
            {vehicle.make} {vehicle.model} • {vehicle.category_name || 'Commercial'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <StatusBadge
            status={hasPanic ? 'emergency' : vehicle.movement_status}
            size="sm"
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Telematics Matrix */}
      <View style={styles.telematicsGrid}>
        <View style={styles.gridItem}>
          <Navigation size={14} color={speed > 0 ? colors.statusMoving : colors.textMuted} />
          <Text style={styles.gridLabel}>Speed</Text>
          <Text style={styles.gridValue}>{speed} km/h</Text>
        </View>

        <View style={styles.gridItem}>
          <Power size={14} color={isIgnitionOn ? colors.statusMoving : colors.criticalRed} />
          <Text style={styles.gridLabel}>Ignition</Text>
          <Text style={styles.gridValue}>{isIgnitionOn ? 'ON' : 'OFF'}</Text>
        </View>

        <View style={styles.gridItem}>
          <Battery size={14} color={colors.statusMoving} />
          <Text style={styles.gridLabel}>Backup Batt</Text>
          <Text style={styles.gridValue}>
            {vehicle.backup_battery_pct !== undefined ? `${vehicle.backup_battery_pct}%` : '96%'}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.gridLabel}>Heading</Text>
          <Text style={styles.gridValue}>{vehicle.heading || 0}°</Text>
        </View>
      </View>

      {/* Location info */}
      <View style={styles.addressBox}>
        <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.addressText} numberOfLines={2}>
            {vehicle.address || `${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}`}
          </Text>
          <Text style={styles.coordsText}>
            GPS: {vehicle.latitude.toFixed(4)}° N, {vehicle.longitude.toFixed(4)}° E •{' '}
            {vehicle.gps_time ? new Date(vehicle.gps_time).toLocaleTimeString() : 'Real-time'}
          </Text>
        </View>
      </View>

      {/* Driver Info */}
      <View style={styles.driverRow}>
        <View>
          <Text style={styles.driverLabel}>ASSIGNED DRIVER</Text>
          <Text style={styles.driverName}>{vehicle.driver_name || 'Rajesh Kumar (Active)'}</Text>
        </View>

        <TouchableOpacity style={styles.callDriverBtn} onPress={handleCall}>
          <Phone size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.callDriverText}>Call Driver</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryNavy }]}
          onPress={() => {
            onClose();
            navigation.navigate('VehicleDetails', { vehicleId: vehicle.vehicle_id });
          }}
        >
          <FileText size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondaryNavy }]}
          onPress={() => {
            onClose();
            navigation.navigate('TripHistory', { vehicleId: vehicle.vehicle_id });
          }}
        >
          <History size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.actionButtonText}>Trip History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
          onPress={() => {
            onClose();
            navigation.navigate('Alerts', { vehicleId: vehicle.vehicle_id });
          }}
        >
          <ShieldAlert size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.actionButtonText}>Alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    ...shadows.elevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
  },
  regNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  modelSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
  },
  telematicsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  gridItem: {
    alignItems: 'center',
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  coordsText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: 12,
  },
  driverLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  callDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.statusMoving,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callDriverText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
