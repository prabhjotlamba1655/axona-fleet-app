import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  RotateCcw,
  Navigation,
  Compass,
  BatteryCharging,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';

interface AlertCardProps {
  id: string;
  type: string;
  title: string;
  vehicleReg: string;
  driverName?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  eventTime: string;
  location?: string;
  status?: string;
  onPress?: () => void;
  onActionPress?: () => void;
  actionLabel?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  vehicleReg,
  driverName,
  severity = 'WARNING',
  eventTime,
  location,
  status,
  onPress,
  onActionPress,
  actionLabel,
}) => {
  const isCritical = severity === 'CRITICAL' || title.toLowerCase().includes('panic') || title.toLowerCase().includes('tilt');
  const isInfo = severity === 'INFO' || title.toLowerCase().includes('ignition');

  let IconComponent = AlertTriangle;
  let iconColor = colors.warningAmber;

  if (isCritical) {
    IconComponent = ShieldAlert;
    iconColor = colors.criticalRed;
  } else if (title.toLowerCase().includes('braking') || title.toLowerCase().includes('accel')) {
    IconComponent = Zap;
    iconColor = colors.warningAmber;
  } else if (title.toLowerCase().includes('tilt')) {
    IconComponent = RotateCcw;
    iconColor = colors.criticalRed;
  } else if (title.toLowerCase().includes('speed')) {
    IconComponent = Compass;
    iconColor = colors.warningAmber;
  } else if (title.toLowerCase().includes('battery') || title.toLowerCase().includes('power')) {
    IconComponent = BatteryCharging;
    iconColor = colors.warningAmber;
  } else if (title.toLowerCase().includes('geofence')) {
    IconComponent = Layers;
    iconColor = colors.infoBlue;
  } else if (isInfo) {
    IconComponent = Navigation;
    iconColor = colors.infoBlue;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        isCritical && styles.cardCritical,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <IconComponent size={18} color={iconColor} />
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.vehicleReg}>
            {vehicleReg} {driverName ? `• ${driverName}` : ''}
          </Text>
        </View>

        <View
          style={[
            styles.severityBadge,
            {
              backgroundColor: isCritical
                ? '#FEE2E2'
                : isInfo
                ? '#E0F2FE'
                : '#FEF3C7',
            },
          ]}
        >
          <Text
            style={[
              styles.severityText,
              {
                color: isCritical
                  ? colors.criticalRed
                  : isInfo
                  ? colors.infoBlue
                  : colors.warningAmber,
              },
            ]}
          >
            {severity}
          </Text>
        </View>
      </View>

      {location && (
        <Text style={styles.locationText} numberOfLines={1}>
          {location}
        </Text>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.timeText}>
          {new Date(eventTime).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        <View style={styles.actionWrap}>
          {status && (
            <Text style={styles.statusText}>
              Status: <Text style={{ fontWeight: '700' }}>{status}</Text>
            </Text>
          )}

          {actionLabel && onActionPress ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onActionPress}>
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : (
            <ChevronRight size={16} color={colors.textSecondary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  cardCritical: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: colors.criticalRed,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleReg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 6,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actionBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
