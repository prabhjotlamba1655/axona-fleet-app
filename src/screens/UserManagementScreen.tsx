import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  Mail,
  Phone,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { shadows } from '../theme/spacing';
import { Header } from '../components/Header';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User, UserRole } from '../types';

interface UserManagementScreenProps {
  navigation: any;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  navigation,
}) => {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('dispatcher');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.list();
      setUsers(data || []);
    } catch (e) {
      console.warn('Users fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, userName: string) => {
    try {
      const res = await api.users.toggleActive(userId);
      Alert.alert('Status Updated', `${userName} is now ${res.is_active ? 'Active' : 'Deactivated'}.`);
      loadUsers();
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle user status.');
    }
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert('Required', 'Please fill name and email.');
      return;
    }

    try {
      await api.users.create({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        role: newRole,
      });

      setModalVisible(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      loadUsers();
      Alert.alert('User Provisioned', 'User account successfully created.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create user');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        navigation={navigation}
        showBack={true}
        showHome={true}
        title="USER MANAGEMENT"
        subtitle="RBAC & Asset Assignments"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.heading}>TENANT USER MANAGEMENT</Text>
            <Text style={styles.subHeading}>Role-Based Access Control (RBAC Hierarchy)</Text>
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <UserPlus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add User</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={{ marginVertical: 30 }} />
        ) : users.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        ) : (
          users.map((u) => {
            const isActive = (u as any).is_active !== 0;
            return (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <View style={styles.roleBadge}>
                      <Shield size={10} color="#1E40AF" style={{ marginRight: 4 }} />
                      <Text style={styles.roleText}>{u.role_name || u.role}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.statusToggle, isActive ? styles.statusActive : styles.statusInactive]}
                    onPress={() => handleToggleActive(u.id, u.name)}
                  >
                    <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add User Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provision New Tenant User</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ramesh Gupta"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Corporate Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ramesh@apexlogistics.in"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98111 22334"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>User Role</Text>
              <View style={styles.rolePickRow}>
                {[
                  { id: 'dispatcher', label: 'Fleet Dispatcher / NOC' },
                  { id: 'company_admin', label: 'Company Admin' },
                  { id: 'viewer', label: 'Viewer / Auditor' },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.rolePickBtn,
                      newRole === r.id && styles.rolePickBtnActive,
                    ]}
                    onPress={() => setNewRole(r.id as any)}
                  >
                    <Text
                      style={[
                        styles.rolePickText,
                        newRole === r.id && styles.rolePickTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreateUser}
              >
                <Text style={styles.createBtnText}>Create User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  subHeading: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.subtle,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  statusToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#166534',
  },
  statusTextInactive: {
    color: '#991B1B',
  },
  emptyWrap: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 25, 47, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryNavy,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rolePickRow: {
    gap: 6,
  },
  rolePickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  rolePickBtnActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  rolePickText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rolePickTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: colors.primaryNavy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
