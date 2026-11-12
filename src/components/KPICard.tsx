import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  isCritical?: boolean;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = colors.primaryNavy,
  isCritical = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        isCritical && styles.cardCritical,
        { borderLeftColor: accentColor },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <View style={styles.bottomRow}>
        <Text
          style={[
            styles.value,
            { color: isCritical ? colors.criticalRed : colors.textPrimary },
          ]}
        >
          {value}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  cardCritical: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderLeftColor: colors.criticalRed,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  iconContainer: {
    marginLeft: 6,
  },
  bottomRow: {
    marginTop: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
