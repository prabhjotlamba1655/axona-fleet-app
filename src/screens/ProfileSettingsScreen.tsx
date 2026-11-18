import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import {
  User,
  Building2,
  Shield,
  Fingerprint,
  Volume2,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Server,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { useTelematicsStore } from '../store/telematicsStore';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { APP_CONFIG } from '../constants/config';

interface ProfileSettingsScreenProps {
  navigation: any;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  navigation,
}) => {
  const { user, logout, biometricsEnabled, setBiometricsEnabled, demoUsers, switchUser } = useAuthStore();
  const { wsStatus, toggleSiren, sirenActive } = useTelematicsStore();

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [urlSaved, setUrlSaved] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to terminate this authenticated session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
    Alert.alert('Configuration Saved', 'API Endpoint updated. Reconnecting services.');
  };

  const handleRoleSwitch = async (userId: string) => {
    const ok = await switchUser(userId);
    if (ok) {
      Alert.alert('Role Switched', 'Permissions and tenant data re-synchronized.');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="PROFILE & SETTINGS"
        subtitle="User Preferences & Auth"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Authorized Operator'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'operator@axonafleet.com'}</Text>
            <View style={styles.roleBadge}>
              <Shield size={12} color="#1E40AF" style={{ marginRight: 4 }} />
              <Text style={styles.roleText}>{user?.role_name || user?.role || 'Company Admin'}</Text>
            </View>
          </View>
        </View>

        {/* Tenant Information Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Building2 size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>TENANT & ORGANIZATION</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Tenant</Text>
            <Text style={styles.infoVal}>{user?.tenant_name || 'Apex Commercial Logistics LLP'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tenant ID</Text>
            <Text style={styles.infoVal}>{user?.tenant_id || 'tenant_apex'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telematics Stream</Text>
            <Text style={[styles.infoVal, { color: wsStatus === 'CONNECTED' ? colors.statusMoving : colors.warningAmber }]}>
              {wsStatus}
            </Text>
          </View>
        </View>

        {/* Evaluation Role Switcher */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Shield size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>ROLE-BASED ACCESS CONTROL (RBAC)</Text>
          </View>

          <Text style={styles.cardSub}>Switch roles to audit screen permissions and authorizations:</Text>

          <View style={styles.roleGrid}>
            {demoUsers.map((u) => {
              const isCurrent = user?.id === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.roleBtn, isCurrent && styles.roleBtnActive]}
                  onPress={() => handleRoleSwitch(u.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleBtnTitle, isCurrent && styles.roleBtnTitleActive]}>
                      {u.role_name}
                    </Text>
                    <Text style={styles.roleBtnSub}>{u.name}</Text>
                  </View>
                  {isCurrent && <CheckCircle2 size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Security & Preferences */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Fingerprint size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>SECURITY & APP PREFERENCES</Text>
          </View>

          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Biometric Authentication</Text>
              <Text style={styles.prefSub}>Unlock with FaceID / TouchID</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#CBD5E1', true: colors.accentBlue }}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.prefTitle}>Audible Emergency Siren</Text>
              <Text style={styles.prefSub}>Continuous audible alarm on SOS events</Text>
            </View>
            <Switch
              value={sirenActive}
              onValueChange={(val) => toggleSiren(val)}
              trackColor={{ false: '#CBD5E1', true: colors.criticalRed }}
            />
          </View>
        </View>

        {/* Backend Endpoint Override (for device testing) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Server size={16} color={colors.primaryNavy} />
            <Text style={styles.cardTitle}>GATEWAY ENDPOINT CONFIGURATION</Text>
          </View>

          <Text style={styles.cardSub}>Target API URL for real devices or remote environments:</Text>
          <View style={styles.urlInputRow}>
            <TextInput
              style={styles.urlInput}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="http://192.168.1.100:5055/api"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveApiUrl}>
              <Save size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {urlSaved && <Text style={styles.savedHint}>✓ Endpoint successfully updated</Text>}
        </View>

        {/* App Info & Sign Out */}
        <View style={styles.footerSection}>
          <Text style={styles.footerBrand}>AXONA FLEET MANAGEMENT</Text>
          <Text style={styles.footerVendor}>Developed by Axona Software LLP</Text>
          <Text style={styles.footerVersion}>Version 2.4.0 (Enterprise Production Build)</Text>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Sign Out of Axona</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.card,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 14,
    ...shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roleGrid: {
    gap: 8,
  },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  roleBtnActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  roleBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  roleBtnTitleActive: {
    color: '#FFFFFF',
  },
  roleBtnSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  prefTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  prefSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.textPrimary,
  },
  saveUrlBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  savedHint: {
    fontSize: 11,
    color: colors.statusMoving,
    fontWeight: '700',
    marginTop: 6,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.primaryNavy,
  },
  footerVendor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerVersion: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.criticalRed,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
