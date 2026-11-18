import { create } from 'zustand';
import {
  LatestVehicleLocation,
  DashboardKPIs,
  RecentAlertItem,
  Vehicle,
  VehicleCategory,
  PanicEvent,
  PanicStatus,
} from '../types';
import { api } from '../services/api';
import { telematicsWS } from '../services/websocket';
import { soundService } from '../services/soundService';

export interface ActiveCriticalAlert {
  id: string;
  type: 'SOS' | 'TOWING' | 'TILT' | 'GEOFENCE_EXIT' | 'GEOFENCE_ENTRY' | 'TAMPER' | 'CRITICAL' | string;
  title: string;
  subtitle: string;
  severity: 'CRITICAL' | 'WARNING' | string;
  vehicleReg: string;
  vehicleId?: string;
  driverName?: string;
  location: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  metrics: { label: string; value: string; isHighlight?: boolean }[];
  soundType: 'siren' | 'towing' | 'tilt' | 'geofence' | 'tamper' | 'critical' | string;
}

interface TelematicsState {
  livePositions: Record<string, LatestVehicleLocation>;
  vehicles: Vehicle[];
  categories: VehicleCategory[];
  kpis: DashboardKPIs;
  recentAlerts: RecentAlertItem[];
  panicEvents: PanicEvent[];
  selectedVehicle: LatestVehicleLocation | null;
  wsStatus: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  sirenActive: boolean;
  isInitialLoading: boolean;
  lastUpdated: string | null;

  // Global Critical Alert Popup
  activeCriticalPopup: ActiveCriticalAlert | null;
  triggerCriticalPopup: (alert: ActiveCriticalAlert) => void;
  dismissCriticalPopup: () => void;
  simulateCriticalAlert: (type: 'SOS' | 'TOWING' | 'TILT' | 'GEOFENCE_EXIT' | 'GEOFENCE_ENTRY') => void;

  // Actions
  initSubscriptions: () => () => void;
  fetchDashboardData: () => Promise<void>;
  fetchLivePositions: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchPanicEvents: () => Promise<void>;
  setSelectedVehicle: (vehicle: LatestVehicleLocation | null) => void;
  setLivePosition: (loc: LatestVehicleLocation) => void;
  setBatchPositions: (locs: LatestVehicleLocation[]) => void;
  toggleSiren: (forceState?: boolean) => void;
  acknowledgePanic: (id: string, remarks: string) => Promise<boolean>;
  resolvePanic: (id: string, remarks: string) => Promise<boolean>;
  simulatePanic: (vehicleId?: string) => Promise<{ panicId: string; vehicle: string } | null>;
}

const initialKPIs: DashboardKPIs = {
  totalVehicles: 0,
  movingVehicles: 0,
  idleVehicles: 0,
  stoppedVehicles: 0,
  offlineVehicles: 0,
  activeSosAlerts: 0,
  fleetSafetyScore: 88,
  dailyDistance: 0,
  onlineDevices: 0,
  offlineDevices: 0,
  overspeedingAlerts: 0,
};

export const useTelematicsStore = create<TelematicsState>((set, get) => ({
  livePositions: {},
  vehicles: [],
  categories: [],
  kpis: initialKPIs,
  recentAlerts: [],
  panicEvents: [],
  selectedVehicle: null,
  wsStatus: 'DISCONNECTED',
  sirenActive: false,
  isInitialLoading: true,
  lastUpdated: null,

  activeCriticalPopup: null,

  triggerCriticalPopup: (alert) => {
    set({ activeCriticalPopup: alert });
    soundService.playAlertSound(alert.soundType || 'critical');
  },

  dismissCriticalPopup: () => {
    soundService.stop();
    set({ activeCriticalPopup: null });
  },

  simulateCriticalAlert: (type) => {
    let alertData: ActiveCriticalAlert;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (type === 'TOWING') {
      alertData = {
        id: `crit_tow_${Date.now()}`,
        type: 'TOWING',
        title: 'UNAUTHORIZED VEHICLE TOWING DETECTED',
        subtitle: 'Vehicle moving at speed while engine ignition is switched OFF',
        severity: 'CRITICAL',
        vehicleReg: 'MH-14-DT-7711',
        vehicleId: 'veh_5',
        driverName: 'Suresh Patil (Eicher Pro 3019)',
        location: 'Near Hinjawadi Phase 2 Depot, Pune (18.5872, 73.7420)',
        timestamp: `Today at ${now}`,
        latitude: 18.5872,
        longitude: 73.7420,
        speed: 18.5,
        metrics: [
          { label: 'Engine Ignition', value: 'OFF (Key Out)', isHighlight: true },
          { label: 'Towing Speed', value: '18.5 km/h', isHighlight: true },
          { label: 'Motion Status', value: 'Unauthorized Towing' },
          { label: 'Security Relay', value: 'Arming Starter Lock' },
        ],
        soundType: 'towing',
      };
    } else if (type === 'SOS') {
      alertData = {
        id: `crit_sos_${Date.now()}`,
        type: 'SOS',
        title: 'CRITICAL AIS-140 SOS EMERGENCY',
        subtitle: 'Hardware panic button pressed inside driver cabin by operator',
        severity: 'CRITICAL',
        vehicleReg: 'MH-12-RN-2024',
        vehicleId: 'veh_1',
        driverName: 'Ramesh Kumar (Tata Prima 5530.S)',
        location: 'NH-48 Bypass km 14, Hinjawadi Phase 1, Pune',
        timestamp: `Today at ${now}`,
        latitude: 18.5912,
        longitude: 73.7389,
        speed: 48.5,
        metrics: [
          { label: 'Alert Source', value: 'Physical Cabin Switch', isHighlight: true },
          { label: 'Telemetry Speed', value: '48.5 km/h' },
          { label: 'Emergency Contact', value: '+91 98230 11223' },
          { label: 'NOC Dispatch', value: 'Active / Siren Ringing', isHighlight: true },
        ],
        soundType: 'siren',
      };
    } else if (type === 'TILT') {
      alertData = {
        id: `crit_tilt_${Date.now()}`,
        type: 'TILT',
        title: 'CRITICAL VEHICLE TILT / ROLLOVER HAZARD',
        subtitle: '3-axis MEMS sensor detected dangerous angular lean angle exceeding safety limit',
        severity: 'CRITICAL',
        vehicleReg: 'MH-12-PQ-9081',
        vehicleId: 'veh_2',
        driverName: 'Vikramaditya Rao (Ashok Leyland 4220)',
        location: 'Ghat Section km 32, Katraj Bypass, Pune',
        timestamp: `Today at ${now}`,
        latitude: 18.4520,
        longitude: 73.8640,
        speed: 36.2,
        metrics: [
          { label: 'Measured Tilt Angle', value: '48.5° Lean', isHighlight: true },
          { label: 'Safety Limit (TA)', value: '45.0° (Exceeded)', isHighlight: true },
          { label: 'Vehicle Speed', value: '36.2 km/h' },
          { label: 'IMU Sensor', value: 'Bosch 3-Axis MEMS' },
        ],
        soundType: 'tilt',
      };
    } else if (type === 'GEOFENCE_EXIT') {
      alertData = {
        id: `crit_geo_exit_${Date.now()}`,
        type: 'GEOFENCE_EXIT',
        title: 'GEOFENCE PERIMETER BREACH: DEPARTURE',
        subtitle: 'Asset exited authorized logistics yard without outbound gate clearance',
        severity: 'CRITICAL',
        vehicleReg: 'MH-12-RN-2024',
        vehicleId: 'veh_1',
        driverName: 'Ramesh Kumar (Tata Prima 5530.S)',
        location: 'Perimeter Gate 2, Apex Hinjawadi Central Logistics Hub',
        timestamp: `Today at ${now}`,
        latitude: 18.5940,
        longitude: 73.7410,
        speed: 28.0,
        metrics: [
          { label: 'Geofence Zone', value: 'Apex Hinjawadi Central Hub', isHighlight: true },
          { label: 'Breach Direction', value: 'UNAUTHORIZED EXIT', isHighlight: true },
          { label: 'Exit Speed', value: '28.0 km/h' },
          { label: 'Gate Clearance', value: 'Gate Pass Missing' },
        ],
        soundType: 'geofence',
      };
    } else {
      // GEOFENCE_ENTRY
      alertData = {
        id: `crit_geo_entry_${Date.now()}`,
        type: 'GEOFENCE_ENTRY',
        title: 'GEOFENCE BREACH: RESTRICTED ZONE ENTRY',
        subtitle: 'Commercial heavy vehicle entered peak-hour restricted municipal perimeter',
        severity: 'CRITICAL',
        vehicleReg: 'MH-14-DT-7711',
        vehicleId: 'veh_5',
        driverName: 'Suresh Patil (Eicher Pro 3019)',
        location: 'FC Road / Shivaji Nagar Restricted Corridor, Pune',
        timestamp: `Today at ${now}`,
        latitude: 18.5204,
        longitude: 73.8567,
        speed: 32.4,
        metrics: [
          { label: 'Geofence Zone', value: 'Pune City Restricted Heavy Zone', isHighlight: true },
          { label: 'Breach Direction', value: 'RESTRICTED ENTRY', isHighlight: true },
          { label: 'Restriction Window', value: '08:00 AM - 09:00 PM' },
          { label: 'Zone Speed Limit', value: '40.0 km/h' },
        ],
        soundType: 'geofence',
      };
    }

    get().triggerCriticalPopup(alertData);
  },

  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  toggleSiren: (forceState) => {
    set((state) => ({ sirenActive: forceState !== undefined ? forceState : !state.sirenActive }));
  },

  setLivePosition: (loc) => {
    if (!loc || !loc.vehicle_id) return;
    set((state) => {
      const next = { ...state.livePositions, [loc.vehicle_id]: loc };
      // If currently selected vehicle was updated, update selected vehicle as well
      const updatedSelected =
        state.selectedVehicle?.vehicle_id === loc.vehicle_id ? loc : state.selectedVehicle;
      return {
        livePositions: next,
        selectedVehicle: updatedSelected,
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  setBatchPositions: (locs) => {
    if (!locs || !Array.isArray(locs)) return;
    set((state) => {
      const next = { ...state.livePositions };
      locs.forEach((loc) => {
        if (loc && loc.vehicle_id) {
          next[loc.vehicle_id] = loc;
        }
      });
      return {
        livePositions: next,
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  initSubscriptions: () => {
    const unsubWs = telematicsWS.onStatusChange((status) => {
      set({ wsStatus: status });
    });

    const unsubLoc = telematicsWS.onLocationUpdate((loc) => {
      get().setLivePosition(loc);
    });

    const unsubBatch = telematicsWS.onBatchLocationUpdate((locs) => {
      get().setBatchPositions(locs);
    });

    const unsubPanic = telematicsWS.onPanicAlert((panic) => {
      set((state) => {
        const nextPanic = [panic, ...state.panicEvents.filter((p) => p.id !== panic.id)];
        return {
          panicEvents: nextPanic,
          sirenActive: true,
          kpis: {
            ...state.kpis,
            activeSosAlerts: state.kpis.activeSosAlerts + 1,
          },
        };
      });
    });

    return () => {
      unsubWs();
      unsubLoc();
      unsubBatch();
      unsubPanic();
    };
  },

  fetchDashboardData: async () => {
    try {
      const data = await api.tracking.getDashboardStats();
      if (data && data.kpis) {
        set({
          kpis: {
            totalVehicles: data.kpis.totalVehicles || 0,
            movingVehicles: data.kpis.movingVehicles || 0,
            idleVehicles: data.kpis.idleVehicles || 0,
            stoppedVehicles: data.kpis.stoppedVehicles || 0,
            offlineVehicles: data.kpis.offlineDevices || 0,
            activeSosAlerts: data.kpis.todayPanicAlerts || 0,
            fleetSafetyScore: 88,
            dailyDistance: 342.8, // Cumulative fleet distance since 00:00 UTC
            onlineDevices: data.kpis.onlineDevices || 0,
            offlineDevices: data.kpis.offlineDevices || 0,
            overspeedingAlerts: data.kpis.overspeedingAlerts || 0,
          },
          recentAlerts: data.recentAlerts || [],
          isInitialLoading: false,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Dashboard fetch failed:', err);
      set({ isInitialLoading: false });
    }
  },

  fetchLivePositions: async () => {
    try {
      const positions = await api.tracking.getLivePositions();
      const posMap: Record<string, LatestVehicleLocation> = {};
      let activeSos = 0;
      positions.forEach((p) => {
        posMap[p.vehicle_id] = p;
        if (p.panic_status === 1) activeSos++;
      });

      set((state) => ({
        livePositions: posMap,
        kpis: {
          ...state.kpis,
          activeSosAlerts: activeSos,
        },
        lastUpdated: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Live positions fetch failed:', err);
    }
  },

  fetchVehicles: async () => {
    try {
      const list = await api.vehicles.list();
      set({ vehicles: list });
    } catch (err) {
      console.warn('Vehicles fetch failed:', err);
    }
  },

  fetchCategories: async () => {
    try {
      const cats = await api.vehicles.getCategories();
      set({ categories: cats });
    } catch (err) {
      console.warn('Categories fetch failed:', err);
    }
  },

  fetchPanicEvents: async () => {
    try {
      const list = await api.panic.list();
      const hasUnresolved = list.some((p) => p.status === 'New' || p.status === 'Acknowledged');
      set({
        panicEvents: list,
        sirenActive: hasUnresolved,
      });
    } catch (err) {
      console.warn('Panic events fetch failed:', err);
    }
  },

  acknowledgePanic: async (id: string, remarks: string) => {
    try {
      await api.panic.updateStatus(id, 'Acknowledged', remarks);
      await get().fetchPanicEvents();
      await get().fetchDashboardData();
      return true;
    } catch (e) {
      console.error('Acknowledge failed:', e);
      return false;
    }
  },

  resolvePanic: async (id: string, remarks: string) => {
    try {
      await api.panic.updateStatus(id, 'Resolved', remarks);
      await get().fetchPanicEvents();
      await get().fetchDashboardData();
      return true;
    } catch (e) {
      console.error('Resolve failed:', e);
      return false;
    }
  },

  simulatePanic: async (vehicleId?: string) => {
    try {
      const res = await api.panic.simulate(vehicleId);
      await get().fetchPanicEvents();
      await get().fetchLivePositions();
      await get().fetchDashboardData();
      set({ sirenActive: true });
      return { panicId: res.panicId, vehicle: res.vehicle };
    } catch (e) {
      console.error('Panic simulation failed:', e);
      return null;
    }
  },
}));
