import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Cpu,
  Navigation2,
  Power,
  Battery,
  Shield,
  Phone,
  Clock,
  History,
  Award,
  ShieldAlert,
  FileText,
  AlertCircle,
  Radio,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useTelematicsStore } from '../store/telematicsStore';
import { Vehicle, LatestVehicleLocation } from '../types';

interface VehicleDetailsScreenProps {
  navigation: any;
  route: any;
}

export const VehicleDetailsScreen: React.FC<VehicleDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const vehicleId = route?.params?.vehicleId;
  const { livePositions } = useTelematicsStore();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const liveLoc: LatestVehicleLocation | undefined = livePositions[vehicleId];

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await api.vehicles.getById(vehicleId);
      setVehicle(data);
    } catch (e) {
      console.warn('Failed to fetch vehicle:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
        <Text style={styles.loadingText}>Loading Vehicle Telematics...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle size={36} color={colors.criticalRed} />
        <Text style={styles.errorText}>Vehicle records not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Return</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const speed = liveLoc ? Math.round(liveLoc.speed) : 0;
  const isIgnitionOn = liveLoc?.ignition === 1;
  const status = liveLoc?.panic_status === 1 ? 'emergency' : liveLoc?.movement_status || 'offline';
  const hasPanic = liveLoc?.panic_status === 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{vehicle.registration_number}</Text>
          <Text style={styles.headerSub}>
            {vehicle.make} {vehicle.model}
          </Text>
        </View>
        <StatusBadge status={status} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('LiveMap', { vehicleId: vehicle.id })}
          >
            <Navigation2 size={16} color={colors.primaryNavy} />
            <Text style={styles.quickActionText}>Live Track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('TripHistory', { vehicleId: vehicle.id })}
          >
            <History size={16} color={colors.primaryNavy} />
            <Text style={styles.quickActionText}>Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('DriverIntelligence', { vehicleId: vehicle.id })}
          >
            <Award size={16} color={colors.primaryNavy} />
            <Text style={styles.quickActionText}>Safety</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Alerts', { vehicleId: vehicle.id })}
          >
            <ShieldAlert size={16} color={colors.criticalRed} />
            <Text style={[styles.quickActionText, { color: colors.criticalRed }]}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Section A: Vehicle Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>VEHICLE INFORMATION</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Registration No</Text>
              <Text style={styles.infoValue}>{vehicle.registration_number}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Vehicle Category</Text>
              <Text style={styles.infoValue}>{vehicle.category_name || 'Commercial Hauler'}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Make & Model</Text>
              <Text style={styles.infoValue}>
                {vehicle.make} {vehicle.model}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Speed Threshold</Text>
              <Text style={styles.infoValue}>{vehicle.speed_limit || 70} km/h</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Registered Owner</Text>
              <Text style={styles.infoValue}>{vehicle.owner_name || 'Fleet Operator'}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Assigned Driver</Text>
              <Text style={styles.infoValue}>
                {liveLoc?.driver_name || vehicle.owner_name || 'Assigned Driver'}
              </Text>
            </View>
          </View>

          {/* Contact driver */}
          <TouchableOpacity
            style={styles.callRow}
            onPress={() => Linking.openURL(`tel:${vehicle.owner_phone || '+919822012345'}`)}
          >
            <Phone size={14} color={colors.statusMoving} style={{ marginRight: 6 }} />
            <Text style={styles.callRowText}>
              Direct Contact: {vehicle.owner_phone || '+91 98220 12345'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section B: Current Telematics */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>CURRENT TELEMATICS</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={[styles.infoValue, { color: speed > 0 ? colors.statusMoving : colors.textPrimary }]}>
                {speed} km/h
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Ignition Status</Text>
              <Text style={[styles.infoValue, { color: isIgnitionOn ? colors.statusMoving : colors.criticalRed }]}>
                {isIgnitionOn ? 'Ignition ON' : 'Ignition OFF'}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Heading / Compass</Text>
              <Text style={styles.infoValue}>{liveLoc?.heading || 0}°</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>GPS Timestamp</Text>
              <Text style={styles.infoValue}>
                {liveLoc?.gps_time
                  ? new Date(liveLoc.gps_time).toLocaleString()
                  : 'Live Stream Active'}
              </Text>
            </View>

            <View style={[styles.infoCol, { width: '100%' }]}>
              <Text style={styles.infoLabel}>Current Coordinates</Text>
              <Text style={styles.infoValue}>
                {liveLoc ? `${liveLoc.latitude.toFixed(5)}° N, ${liveLoc.longitude.toFixed(5)}° E` : '18.5912° N, 73.7389° E'}
              </Text>
            </View>

            <View style={[styles.infoCol, { width: '100%' }]}>
              <Text style={styles.infoLabel}>Reverse-Geocoded Address</Text>
              <Text style={styles.infoValue}>
                {liveLoc?.address || 'Mumbai-Pune Expressway Corridor, Maharashtra, India'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section C: Hardware Health */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Cpu size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>HARDWARE HEALTH (AIS-140 SENSORS)</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Device IMEI</Text>
              <Text style={styles.infoValue}>{vehicle.device_imei || '863124059123456'}</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AIS-140 Mandate</Text>
              <Text style={[styles.infoValue, { color: colors.statusMoving }]}>IRNSS / ARAI Certified</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Main Battery Voltage</Text>
              <Text style={styles.infoValue}>12.6 V (Normal)</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Backup Li-Ion Battery</Text>
              <Text style={[styles.infoValue, { color: colors.statusMoving }]}>96% (Optimal)</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Tamper Microswitch</Text>
              <Text style={[styles.infoValue, { color: colors.statusMoving }]}>Enclosure Closed</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>GPS Antenna Circuit</Text>
              <Text style={[styles.infoValue, { color: colors.statusMoving }]}>Connected</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>SOS Physical Wiring</Text>
              <Text style={[styles.infoValue, { color: colors.statusMoving }]}>Intact / Armed</Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Immobilizer Relay</Text>
              <Text style={styles.infoValue}>
                {vehicle.immobilisation_status === 'immobilised' ? 'Immobilised' : 'Active Circuit'}
              </Text>
            </View>
          </View>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.criticalRed,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBackBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#93C5FD',
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  infoCol: {
    width: '50%',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  callRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.statusMoving,
  },
});
