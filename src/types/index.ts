// Axona Fleet Management - Core TypeScript Domain Models
// Strictly compliant with Axona Fleet Management PRD Version 2.4

export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'dispatcher'
  | 'viewer'
  | 'individual_owner'
  | 'sub_user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  role_name?: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_type?: 'super' | 'company' | 'individual';
  assigned_vehicles?: string[];
  avatar_url?: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: string;
  created_at?: string;
}

export interface VehicleCategory {
  id: string | number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
}

export type MovementStatus = 'moving' | 'idle' | 'stopped' | 'offline' | 'emergency';

export interface LatestVehicleLocation {
  vehicle_id: string;
  registration_number: string;
  make: string;
  model: string;
  speed_limit?: number;
  category_name?: string;
  category_code?: string;
  device_id?: string;
  imei?: string;
  device_status?: 'online' | 'offline';
  main_power_connected?: number | boolean;
  backup_battery_pct?: number;
  is_ais140_compliant?: number | boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  heading: number;
  ignition: number; // 1 = ON, 0 = OFF
  movement_status: MovementStatus;
  main_power?: number;
  panic_status: number; // 1 = Active SOS, 0 = Normal
  address?: string;
  gps_time: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  registration_number: string;
  category_id: string | number;
  category_name?: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  engine_number?: string;
  chassis_number?: string;
  speed_limit: number;
  device_id?: string;
  device_imei?: string;
  owner_name?: string;
  owner_phone?: string;
  emergency_contact_phone?: string;
  is_active: number;
  immobilisation_status?: 'normal' | 'immobilised';
  created_at?: string;
  latest_location?: LatestVehicleLocation;
}

// 8 Dashboard KPI cards defined in PRD v2.4
export interface DashboardKPIs {
  totalVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  stoppedVehicles: number;
  offlineVehicles: number;
  activeSosAlerts: number;
  fleetSafetyScore: number;
  dailyDistance: number;
  onlineDevices?: number;
  offlineDevices?: number;
  todayPanicAlerts?: number;
  overspeedingAlerts?: number;
  todayCriticalCount?: number;
  todayWarningCount?: number;
  todayInfoCount?: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  recentAlerts: RecentAlertItem[];
}

export interface RecentAlertItem {
  id: string;
  type: string;
  title: string;
  event_time: string;
  registration_number: string;
  status: string;
  address?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO';
  vehicle_id?: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  registration_number: string;
  make?: string;
  model?: string;
  category_name?: string;
  start_time: string;
  end_time?: string;
  start_address?: string;
  end_address?: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  distance_km: number;
  duration_minutes: number;
  stoppage_minutes: number;
  stops_count: number;
  max_speed?: number;
  avg_speed?: number;
}

export interface TripWaypoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: number;
  address?: string;
  is_stop: number;
  stop_duration_min?: number;
  gps_time?: string;
}

export type PanicStatus = 'New' | 'Acknowledged' | 'In Progress' | 'Resolved' | 'Closed';

export interface PanicEvent {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  registration_number: string;
  category_name?: string;
  owner_name?: string;
  owner_phone?: string;
  emergency_contact_phone?: string;
  device_id?: string;
  device_imei?: string;
  latitude: number;
  longitude: number;
  speed: number;
  address?: string;
  event_time: string;
  status: PanicStatus;
  remarks?: string;
  acknowledged_by?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  emergency_contact_notified?: number;
}

export type DriverDimension =
  | 'HARSH_BRAKING'
  | 'HARSH_ACCEL'
  | 'VEHICLE_TILT'
  | 'RASH_DRIVING'
  | 'OVERSPEEDING';

export interface DriverIntelligenceEvent {
  id: string;
  vehicle_id: string;
  device_id?: string;
  device_imei?: string;
  registration_number: string;
  vehicle_model?: string;
  category_name?: string;
  event_type: DriverDimension;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  g_force_value?: number;
  threshold_value?: number;
  tilt_angle?: number;
  speed_recorded?: number;
  allowed_speed?: number;
  duration_seconds?: number;
  event_time: string;
  latitude: number;
  longitude: number;
  address?: string;
  osmLink?: string;
}

export interface DriverLeaderboardItem {
  rank: number;
  vehicleId: string;
  registrationNumber: string;
  vehicleName: string;
  category: string;
  driverName: string;
  totalViolations: number;
  harshBraking: number;
  harshAccel: number;
  vehicleTilt: number;
  rashDriving: number;
  overspeeding: number;
  safetyScore: number;
  riskTier: 'Safe' | 'Moderate Risk' | 'High Risk';
  lastIncident: string;
}

export interface DeviceIMUConfig {
  device_id: string;
  harsh_brake_threshold: number;
  harsh_accel_threshold: number;
  tilt_angle_threshold: number;
  rash_turning_speed: number;
  harsh_turning_g: number;
  motion_threshold: number;
  speed_limit: number;
}

export interface Geofence {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  zone_type: 'circular' | 'polygon';
  latitude: number;
  longitude: number;
  radius_meters?: number;
  coordinates_json?: string;
  is_active: number;
  assigned_vehicles?: string[];
  assigned_vehicles_count?: number;
  created_at?: string;
}

export interface GeofenceEvent {
  id: string;
  geofence_id: string;
  geofence_name: string;
  zone_type?: string;
  vehicle_id: string;
  registration_number: string;
  driver_name?: string;
  event_type: 'ENTRY' | 'EXIT';
  event_time: string;
  dwell_duration_min?: number;
}

export interface DeviceHealthItem {
  id: string;
  imei: string;
  vehicle_id?: string;
  registration_number?: string;
  status: 'online' | 'offline';
  main_power_connected: number | boolean;
  main_battery_voltage: number;
  backup_battery_pct: number;
  tamper_switch_closed: number | boolean;
  gps_antenna_connected: number | boolean;
  sos_wire_connected: number | boolean;
  is_ais140_compliant: number | boolean;
  last_communication?: string;
  health_status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
}

export type ReportType =
  | 'movement'
  | 'trips'
  | 'distance'
  | 'overspeeding'
  | 'panic'
  | 'device-health'
  | 'geofence'
  | 'driver-intelligence';

export interface ReportQueryFilter {
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  preset?: 'today' | '7days' | '30days' | '90days';
  exportFormat?: 'json' | 'csv';
  eventType?: string;
  speedThreshold?: number;
}
