import axios, { AxiosInstance } from 'axios';
import { APP_CONFIG } from '../constants/config';
import { storage } from './storage';
import {
  User,
  Vehicle,
  VehicleCategory,
  LatestVehicleLocation,
  DashboardData,
  Trip,
  TripWaypoint,
  PanicEvent,
  PanicStatus,
  DriverIntelligenceEvent,
  DriverLeaderboardItem,
  DeviceIMUConfig,
  Geofence,
  GeofenceEvent,
  DeviceHealthItem,
  ReportType,
  ReportQueryFilter,
} from '../types';

let currentBaseUrl = APP_CONFIG.DEFAULT_API_BASE_URL;

export const setApiBaseUrl = (url: string) => {
  currentBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  apiClient.defaults.baseURL = currentBaseUrl;
};

export const getApiBaseUrl = () => currentBaseUrl;

export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach JWT Token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await storage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // continue without token
  }
  return config;
});

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network communication failed';
    return Promise.reject(new Error(message));
  }
);

// Typed API services
export const api = {
  auth: {
    async login(email: string, password: string):Promise<{ token: string; user: User }> {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    },
    async getDemoUsers(): Promise<User[]> {
      const res = await apiClient.get('/auth/demo-users');
      return res.data;
    },
    async switchUser(userId: string): Promise<{ token: string; user: User }> {
      const res = await apiClient.post('/auth/switch-user', { userId });
      return res.data;
    },
  },

  tracking: {
    async getDashboardStats(): Promise<DashboardData> {
      const res = await apiClient.get('/tracking/dashboard-stats');
      return res.data;
    },
    async getLivePositions(): Promise<LatestVehicleLocation[]> {
      const res = await apiClient.get('/tracking/live');
      return res.data;
    },
    async getTrail(vehicleId: string): Promise<TripWaypoint[]> {
      const res = await apiClient.get(`/tracking/trail/${vehicleId}`);
      return res.data;
    },
  },

  vehicles: {
    async list(params?: { category?: string; status?: string; search?: string }): Promise<Vehicle[]> {
      const res = await apiClient.get('/vehicles', { params });
      return res.data;
    },
    async getById(id: string): Promise<Vehicle> {
      const res = await apiClient.get(`/vehicles/${id}`);
      return res.data;
    },
    async getCategories(): Promise<VehicleCategory[]> {
      const res = await apiClient.get('/vehicles/categories');
      return res.data;
    },
  },

  trips: {
    async list(params?: { vehicleId?: string; startDate?: string; endDate?: string }): Promise<Trip[]> {
      const res = await apiClient.get('/trips', { params });
      return res.data;
    },
    async getPlayback(tripId: string): Promise<{
      trip: Trip;
      waypoints: TripWaypoint[];
      stoppages: any[];
    }> {
      const res = await apiClient.get(`/trips/${tripId}/playback`);
      return res.data;
    },
  },

  panic: {
    async list(status?: PanicStatus): Promise<PanicEvent[]> {
      const res = await apiClient.get('/panic', { params: status ? { status } : {} });
      return res.data;
    },
    async updateStatus(id: string, status: PanicStatus, remarks: string): Promise<{ message: string }> {
      const res = await apiClient.post(`/panic/${id}/status`, { status, remarks });
      return res.data;
    },
    async simulate(vehicleId?: string): Promise<{ message: string; panicId: string; vehicle: string }> {
      const res = await apiClient.post('/panic/simulate', { vehicleId });
      return res.data;
    },
  },

  driverIntelligence: {
    async getSummary(params?: { vehicleId?: string }): Promise<{
      success: boolean;
      vehicle?: any;
      kpis: {
        totalEvents: number;
        harshBraking: number;
        harshAccel: number;
        vehicleTilt: number;
        rashDriving: number;
        overspeeding: number;
        criticalCount: number;
        fleetSafetyScore: number;
        protocol: string;
      };
    }> {
      const res = await apiClient.get('/driver-intelligence/summary', { params });
      return res.data;
    },
    async getEvents(params?: {
      vehicleId?: string;
      eventType?: string;
      severity?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }): Promise<DriverIntelligenceEvent[]> {
      const res = await apiClient.get('/driver-intelligence/events', { params });
      return res.data;
    },
    async getLeaderboard(): Promise<DriverLeaderboardItem[]> {
      const res = await apiClient.get('/driver-intelligence/leaderboard');
      return res.data;
    },
    async getDeviceConfig(deviceId: string): Promise<{
      config: DeviceIMUConfig;
      commandString: string;
      imuCommand: string;
      docsReference: Record<string, string>;
    }> {
      const res = await apiClient.get(`/driver-intelligence/device-config/${deviceId}`);
      return res.data;
    },
  },

  geofences: {
    async list(): Promise<Geofence[]> {
      const res = await apiClient.get('/geofences');
      return res.data;
    },
    async create(data: Partial<Geofence>): Promise<Geofence> {
      const res = await apiClient.post('/geofences', data);
      return res.data;
    },
    async delete(id: string): Promise<{ message: string }> {
      const res = await apiClient.delete(`/geofences/${id}`);
      return res.data;
    },
    async getEvents(limit = 50): Promise<GeofenceEvent[]> {
      const res = await apiClient.get('/geofences/events', { params: { limit } });
      return res.data;
    },
  },

  devices: {
    async list(): Promise<DeviceHealthItem[]> {
      const res = await apiClient.get('/devices');
      return res.data;
    },
    async getRawLogs(limit = 50): Promise<any[]> {
      const res = await apiClient.get('/devices/raw-logs', { params: { limit } });
      return res.data;
    },
  },

  reports: {
    async getReport(
      reportType: ReportType,
      filters: ReportQueryFilter
    ): Promise<{
      reportType: string;
      dateRange: { startDate: string | null; endDate: string | null; maxDays: number };
      generatedAt: string;
      recordCount: number;
      data: any[];
    }> {
      const res = await apiClient.get(`/reports/${reportType}`, { params: filters });
      return res.data;
    },
    getCsvUrl(reportType: ReportType, filters: ReportQueryFilter): string {
      const queryParams = new URLSearchParams();
      queryParams.set('exportFormat', 'csv');
      if (filters.preset) queryParams.set('preset', filters.preset);
      if (filters.vehicleId) queryParams.set('vehicleId', filters.vehicleId);
      if (filters.startDate) queryParams.set('startDate', filters.startDate);
      if (filters.endDate) queryParams.set('endDate', filters.endDate);
      if (filters.eventType) queryParams.set('eventType', filters.eventType);
      return `${currentBaseUrl}/reports/${reportType}?${queryParams.toString()}`;
    },
  },

  users: {
    async list(): Promise<User[]> {
      const res = await apiClient.get('/users');
      return res.data;
    },
    async create(data: Partial<User>): Promise<User> {
      const res = await apiClient.post('/users', data);
      return res.data;
    },
    async toggleActive(userId: string): Promise<{ message: string; is_active: boolean }> {
      const res = await apiClient.post(`/users/${userId}/toggle-active`);
      return res.data;
    },
  },

  settings: {
    async getSettings(): Promise<any> {
      const res = await apiClient.get('/settings');
      return res.data;
    },
  },
};
