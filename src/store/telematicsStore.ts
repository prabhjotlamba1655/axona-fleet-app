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
