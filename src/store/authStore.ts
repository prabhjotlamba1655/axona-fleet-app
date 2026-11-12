import { create } from 'zustand';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { APP_CONFIG } from '../constants/config';
import { telematicsWS } from '../services/websocket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricsEnabled: boolean;
  demoUsers: User[];

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  switchUser: (userId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  loadDemoUsers: () => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  clearError: () => void;

  // RBAC checks
  canAcknowledgeAlerts: () => boolean;
  canManageUsers: () => boolean;
  canConfigureOTA: () => boolean;
  canManageGeofences: () => boolean;
  isViewer: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricsEnabled: false,
  demoUsers: [],

  clearError: () => set({ error: null }),

  loadDemoUsers: async () => {
    try {
      const users = await api.auth.getDemoUsers();
      set({ demoUsers: users });
    } catch (e) {
      console.warn('Failed to load demo users:', e);
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = await storage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const userJson = await storage.getItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      const bio = await storage.getItem(APP_CONFIG.STORAGE_KEYS.BIOMETRICS_ENABLED);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          token,
          user,
          isAuthenticated: true,
          biometricsEnabled: bio === 'true',
          isLoading: false,
        });
        telematicsWS.connect();
      } else {
        // Fallback or unauthenticated
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (err: any) {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.message,
      });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(email, password);
      await storage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, res.token);
      await storage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));

      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      });

      telematicsWS.connect();
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      return false;
    }
  },

  switchUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.switchUser(userId);
      await storage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, res.token);
      await storage.setItem(APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));

      set({
        token: res.token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      });

      telematicsWS.connect();
      return true;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'User switch failed' });
      return false;
    }
  },

  logout: async () => {
    telematicsWS.disconnect();
    await storage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await storage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setBiometricsEnabled: async (enabled: boolean) => {
    await storage.setItem(APP_CONFIG.STORAGE_KEYS.BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
    set({ biometricsEnabled: enabled });
  },

  // Role permissions per Section 4 of PRD v2.4
  canAcknowledgeAlerts: () => {
    const role = get().user?.role;
    return role === 'super_admin' || role === 'company_admin' || role === 'dispatcher';
  },

  canManageUsers: () => {
    const role = get().user?.role;
    return role === 'super_admin' || role === 'company_admin';
  },

  canConfigureOTA: () => {
    const role = get().user?.role;
    return role === 'super_admin' || role === 'company_admin';
  },

  canManageGeofences: () => {
    const role = get().user?.role;
    return role === 'super_admin' || role === 'company_admin';
  },

  isViewer: () => {
    const role = get().user?.role;
    return role === 'viewer';
  },
}));
