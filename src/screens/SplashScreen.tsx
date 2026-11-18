import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, Image } from 'react-native';
import { colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Verify session
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Axona Official Brand Logo */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/axona-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.brandTitle}>AXONA</Text>
        <Text style={styles.productSubtitle}>FLEET MANAGEMENT</Text>

        <View style={styles.pillTag}>
          <Text style={styles.pillText}>MoRTH AIS-140 COMPLIANT</Text>
        </View>

        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color="#60A5FA" />
          <Text style={styles.loadingText}>Connecting to Telematics Gateway...</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.vendorText}>By Axona Software LLP</Text>
        <Text style={styles.versionText}>PRD v2.4 Enterprise Edition</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#60A5FA',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    padding: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 4,
  },
  productSubtitle: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  pillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 32,
  },
  pillText: {
    color: '#E0F2FE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  loaderWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  vendorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  versionText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },
});
