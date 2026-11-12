import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ShieldAlert, Bell, Volume2, VolumeX, Radio, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useTelematicsStore } from '../store/telematicsStore';

interface HeaderProps {
  navigation: any;
  title?: string;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ navigation, title, showBack }) => {
  const { user } = useAuthStore();
  const { kpis, wsStatus, panicEvents, sirenActive, toggleSiren } = useTelematicsStore();

  const [fadeAnim] = useState(new Animated.Value(1));

  const hasActiveSos = kpis.activeSosAlerts > 0 || panicEvents.some((p) => p.status === 'New' || p.status === 'Acknowledged');

  // Pulsing animation for emergency banner
  useEffect(() => {
    if (hasActiveSos) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasActiveSos, fadeAnim]);

  const activePanic = panicEvents.find((p) => p.status === 'New' || p.status === 'Acknowledged');

  return (
    <View style={styles.container}>
      {/* Persistent Flashing Emergency Alert Banner */}
      {hasActiveSos && (
        <Animated.View style={[styles.emergencyBanner, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.emergencyContent}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PanicSos')}
          >
            <ShieldAlert size={18} color="#FFFFFF" style={styles.emergencyIcon} />
            <View style={styles.emergencyTextWrap}>
              <Text style={styles.emergencyTitle}>
                CRITICAL AIS-140 SOS ALERT ({kpis.activeSosAlerts})
              </Text>
              <Text style={styles.emergencySubtitle} numberOfLines={1}>
                {activePanic ? `${activePanic.registration_number} - ${activePanic.address || 'Emergency triggered'}` : 'Unacknowledged panic events pending response'}
              </Text>
            </View>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sirenToggle}
            onPress={() => toggleSiren()}
            accessibilityLabel={sirenActive ? 'Mute Siren' : 'Unmute Siren'}
          >
            {sirenActive ? <Volume2 size={18} color="#FFFFFF" /> : <VolumeX size={18} color="#FECACA" />}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main Bar */}
      <View style={styles.mainBar}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>A</Text>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>AXONA</Text>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      wsStatus === 'CONNECTED'
                        ? colors.statusMoving
                        : wsStatus === 'CONNECTING'
                        ? colors.statusIdle
                        : colors.statusDisconnected,
                  },
                ]}
              />
              <Text style={styles.wsLabel}>
                {wsStatus === 'CONNECTED' ? 'LIVE' : wsStatus === 'CONNECTING' ? 'SYNC' : 'OFFLINE'}
              </Text>
            </View>
            <Text style={styles.companySub} numberOfLines={1}>
              {user?.tenant_name || 'Fleet Management Platform'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={20} color="#FFFFFF" />
            {hasActiveSos && <View style={styles.alertCountBadge} />}
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryNavy,
  },
  emergencyBanner: {
    backgroundColor: colors.criticalRed,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#B91C1C',
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  emergencyIcon: {
    marginRight: 8,
  },
  emergencyTextWrap: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emergencySubtitle: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '500',
  },
  sirenToggle: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 6,
  },
  mainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primaryNavy,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#60A5FA',
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: -1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
    marginRight: 4,
  },
  wsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  companySub: {
    color: '#94A3B8',
    fontSize: 11,
    maxWidth: 200,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    position: 'relative',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  alertCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.criticalRed,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
