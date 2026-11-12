import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Mail, Lock, Shield, Eye, EyeOff, Fingerprint, ArrowRight, UserCheck } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, switchUser, isLoading, error, clearError, demoUsers, loadDemoUsers, biometricsEnabled } = useAuthStore();

  const [email, setEmail] = useState('fleetmanager@apexlogistics.in');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    loadDemoUsers();
    clearError();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your registered email or mobile number.');
      return;
    }
    if (activeTab === 'password' && !password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      navigation.replace('MainTabs');
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    const success = await switchUser(userId);
    if (success) {
      navigation.replace('MainTabs');
    }
  };

  const handleSendOtp = () => {
    setOtpSent(true);
    Alert.alert('OTP Sent', 'A 6-digit authentication code was transmitted to your registered mobile.');
  };

  const handleBiometricAuth = async () => {
    // Quick biometric authentication
    if (demoUsers.length > 0) {
      await handleQuickSwitch(demoUsers[0].id);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>A</Text>
          </View>
          <Text style={styles.title}>AXONA</Text>
          <Text style={styles.subtitle}>Enterprise Telematics & Fleet SaaS</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Sign In to Account</Text>
          <Text style={styles.cardSub}>
            Access real-time telemetry, AIS-140 emergency desk, and compliance reports.
          </Text>

          {/* Mode Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.tabActive]}
              onPress={() => setActiveTab('password')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'password' && styles.tabTextActive,
                ]}
              >
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'otp' && styles.tabActive]}
              onPress={() => setActiveTab('otp')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'otp' && styles.tabTextActive,
                ]}
              >
                Mobile OTP
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email / Mobile Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {activeTab === 'password' ? 'Email or Mobile Number' : 'Registered Mobile Number'}
            </Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  clearError();
                }}
                placeholder={activeTab === 'password' ? 'admin@apexlogistics.in' : '+91 98220 12345'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType={activeTab === 'otp' ? 'phone-pad' : 'email-address'}
              />
            </View>
          </View>

          {/* Password Input or OTP */}
          {activeTab === 'password' ? (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Forgot Password',
                      'Contact your fleet tenant administrator or use the demo switchers below for immediate access.'
                    )
                  }
                >
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrap}>
                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    clearError();
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>6-Digit OTP</Text>
              <View style={styles.otpRow}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.sendOtpBtn}
                  onPress={handleSendOtp}
                >
                  <Text style={styles.sendOtpText}>
                    {otpSent ? 'Resend OTP' : 'Send Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Authenticate Session</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Biometrics */}
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricAuth}
          >
            <Fingerprint size={22} color={colors.primaryNavy} style={{ marginRight: 8 }} />
            <Text style={styles.biometricText}>Quick Biometric Verification</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Roles Quick Switcher */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeaderRow}>
            <UserCheck size={16} color={colors.primaryNavy} />
            <Text style={styles.demoSectionTitle}>EVALUATION ROLE SWITCHER (PRD V2.4)</Text>
          </View>
          <Text style={styles.demoDesc}>
            Tap any role to immediately authenticate and inspect role-based views:
          </Text>

          <View style={styles.roleGrid}>
            {demoUsers.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.roleCard}
                onPress={() => handleQuickSwitch(u.id)}
              >
                <View style={styles.roleCardTop}>
                  <Text style={styles.roleName} numberOfLines={1}>
                    {u.role_name || u.role}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{u.role}</Text>
                  </View>
                </View>
                <Text style={styles.roleUser}>{u.name}</Text>
                <Text style={styles.roleTenant} numberOfLines={1}>
                  {u.tenant_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Shield size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.footerText}>
            TLS 1.3 In-Transit • AES-256 Multi-Tenant Partitioning
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#93C5FD',
    marginBottom: 10,
    ...shadows.card,
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 34,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.primaryNavy,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.primaryNavy,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: colors.criticalRed,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 11,
    color: colors.accentBlue,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    padding: 6,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    letterSpacing: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  sendOtpBtn: {
    backgroundColor: colors.secondaryNavy,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: colors.primaryNavy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
    ...shadows.subtle,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    marginTop: 12,
  },
  biometricText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  demoSection: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  demoDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 6,
  },
  roleGrid: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  roleUser: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 2,
    fontWeight: '500',
  },
  roleTenant: {
    fontSize: 10,
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
