import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import {
  ShieldAlert,
  Bell,
  Volume2,
  VolumeX,
  ChevronRight,
  ArrowLeft,
  Home,
  Truck,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useTelematicsStore } from '../store/telematicsStore';

interface HeaderProps {
  navigation: any;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showHome?: boolean;
  vehicleReg?: string;
}

export const Header: React.FC<HeaderProps> = ({
  navigation,
  title,
  subtitle,
  showBack = false,
  showHome = true,
  vehicleReg,
}) => {
  const { user } = useAuthStore();
  const { kpis, wsStatus, panicEvents, sirenActive, toggleSiren } = useTelematicsStore();

  const [fadeAnim] = useState(new Animated.Value(1));

  const hasActiveSos =
    kpis.activeSosAlerts > 0 ||
    panicEvents.some((p) => p.status === 'New' || p.status === 'Acknowledged');

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

  const activePanic = panicEvents.find(
    (p) => p.status === 'New' || p.status === 'Acknowledged'
  );

  const handleGoHome = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleGoHome();
    }
  };

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
                {activePanic
                  ? `${activePanic.registration_number} - ${activePanic.address || 'Emergency triggered'}`
                  : 'Unacknowledged panic events pending response'}
              </Text>
            </View>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sirenToggle}
            onPress={() => toggleSiren()}
            accessibilityLabel={sirenActive ? 'Mute Siren' : 'Unmute Siren'}
          >
            {sirenActive ? (
              <Volume2 size={18} color="#FFFFFF" />
            ) : (
              <VolumeX size={18} color="#FECACA" />
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main Navigation Bar */}
      <View style={styles.mainBar}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleGoBack}
              accessibilityLabel="Back"
            >
              <ArrowLeft size={14} color="#FFFFFF" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          {showHome && (
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={handleGoHome}
              accessibilityLabel="Home Dashboard"
            >
              <Home size={14} color="#FFFFFF" />
              <Text style={styles.homeBtnText}>Home</Text>
            </TouchableOpacity>
          )}

          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Image
                source={require('../../assets/axona-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandTextWrap}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle} numberOfLines={1}>
                  {title || 'AXONA'}
                </Text>
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
                {subtitle || user?.tenant_name || 'Fleet Management Platform'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={17} color="#FFFFFF" />
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

      {/* Prominent Vehicle Number Banner if specified */}
      {vehicleReg ? (
        <View style={styles.vehicleContextBar}>
          <View style={styles.vehicleContextBadge}>
            <Truck size={14} color="#60A5FA" style={{ marginRight: 6 }} />
            <Text style={styles.vehicleContextLabel}>ACTIVE VEHICLE:</Text>
            <Text style={styles.vehicleContextReg}>{vehicleReg}</Text>
          </View>
          <TouchableOpacity
            style={styles.quickHomePill}
            onPress={handleGoHome}
            accessibilityLabel="Return Home"
          >
            <Home size={12} color="#93C5FD" style={{ marginRight: 4 }} />
            <Text style={styles.quickHomePillText}>Home</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryNavy,
    zIndex: 100,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.primaryNavy,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 3,
    flexShrink: 0,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#0066CC',
    borderWidth: 1,
    borderColor: '#60A5FA',
    gap: 3,
    flexShrink: 0,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1.2,
    borderColor: '#60A5FA',
    overflow: 'hidden',
    padding: 1.5,
    flexShrink: 0,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 4,
    marginRight: 3,
  },
  wsLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.3,
  },
  companySub: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    marginLeft: 6,
  },
  actionBtn: {
    padding: 6,
    position: 'relative',
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  alertCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.criticalRed,
    borderWidth: 1.2,
    borderColor: colors.primaryNavy,
  },
  avatarBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  vehicleContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#07162C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
  },
  vehicleContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleContextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  vehicleContextReg: {
    fontSize: 13,
    fontWeight: '900',
    color: '#60A5FA',
    letterSpacing: 0.6,
  },
  quickHomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickHomePillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
});
