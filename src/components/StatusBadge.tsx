import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { MovementStatus } from '../types';

interface StatusBadgeProps {
  status: MovementStatus | 'emergency' | 'online' | 'offline' | 'disconnected' | 'Safe' | 'Moderate Risk' | 'High Risk' | 'New' | 'Acknowledged' | 'In Progress' | 'Resolved';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  let bgColor = colors.badgeBackground;
  let textColor = colors.textPrimary;
  let dotColor = colors.textSecondary;
  let text = label;

  switch (status) {
    case 'moving':
      bgColor = '#DCFCE7';
      textColor = '#166534';
      dotColor = colors.statusMoving;
      text = text || 'Moving';
      break;
    case 'idle':
      bgColor = '#FEF3C7';
      textColor = '#92400E';
      dotColor = colors.statusIdle;
      text = text || 'Idle (Eng ON)';
      break;
    case 'stopped':
      bgColor = '#DBEAFE';
      textColor = '#1E40AF';
      dotColor = colors.statusStopped;
      text = text || 'Stopped';
      break;
    case 'emergency':
    case 'New':
    case 'High Risk':
      bgColor = '#FEE2E2';
      textColor = '#991B1B';
      dotColor = colors.statusEmergency;
      text = text || 'Emergency';
      break;
    case 'offline':
    case 'disconnected':
      bgColor = '#F1F5F9';
      textColor = '#475569';
      dotColor = colors.statusDisconnected;
      text = text || 'Offline';
      break;
    case 'online':
    case 'Safe':
    case 'Resolved':
      bgColor = '#DCFCE7';
      textColor = '#166534';
      dotColor = colors.successGreen;
      text = text || 'Healthy';
      break;
    case 'Acknowledged':
    case 'In Progress':
    case 'Moderate Risk':
      bgColor = '#FEF3C7';
      textColor = '#92400E';
      dotColor = colors.warningAmber;
      text = text || status;
      break;
    default:
      text = text || String(status);
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        isSmall && styles.badgeSmall,
        isLarge && styles.badgeLarge,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          isSmall && styles.dotSmall,
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall && styles.textSmall,
          isLarge && styles.textLarge,
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 13,
  },
});
