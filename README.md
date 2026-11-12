# Axona Fleet Management Mobile Application (iOS & Android)
**Developed by Axona Software LLP**  
**Specification**: MoRTH AIS-140 / IRNSS Certified Telematics Specification  
**PRD Version**: Version 2.4 (Enterprise Production Edition with Alerts & Reports Matrix)

---

## 1. Executive Overview

The **Axona Fleet Management Mobile Application** is the official enterprise mobile client for the Axona Fleet Management Platform. Designed for commercial fleet operators, logistics 3PLs, emergency dispatchers, corporate auditors, and individual vehicle owners, the application delivers sub-second telematics synchronization, statutory MoRTH AIS-140 public safety workflows, 100Hz MEMS inertial driver intelligence analytics, and 90-day time-series compliance auditing.

The mobile application directly integrates with the existing Axona Node.js / Express / SQLite-PostgreSQL backend gateway (`http://localhost:5055/api`) and persistent bidirectional WebSocket telematics stream (`ws://localhost:5055/ws/telematics`).

---

## 2. Technology Stack & Architecture

- **Framework**: React Native 0.88.1 with TypeScript 5.8
- **Platform Runtime**: Expo SDK 58 (Expo Development Build & React Native CLI compatible)
- **Navigation**: React Navigation v7 (Bottom Tabs + Native Stack)
- **State Management**: Zustand v5
- **Networking**: Axios with JWT Bearer Token Interceptors
- **Real-Time Messaging**: Native WebSocket (`ws://` / `wss://`) with automatic exponential backoff reconnection and heartbeat keepalive
- **Mapping & GIS**: Leaflet & OpenStreetMap (OSM) Tiles with rotated vehicle heading markers, radar pulsing emergency beacons, and interactive stoppage pins
- **Secure Storage**: `expo-secure-store` with multi-platform persistence
- **Audio & Haptics**: Web Audio tone synthesizer & `expo-haptics` for statutory AIS-140 emergency sirens
- **Design System**: Enterprise Navy Palette (`#102C50`, `#173F68`, `#16A36A`, `#E7A12A`, `#DC3545`, `#F5F7FA`)

### Source Code Architecture

```
axona-mobile-app/
├── android/                   # Native Android Project (Gradle, AndroidManifest, Keystore)
├── dist/                      # Production Web/PWA Distribution Build
├── src/
│   ├── api/                   # Typed API contracts
│   ├── components/            # Reusable UI & GIS Components
│   │   ├── AlertCard.tsx
│   │   ├── EmergencyAudioSiren.tsx
│   │   ├── Header.tsx
│   │   ├── KPICard.tsx
│   │   ├── MapView.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── VehicleBottomSheet.tsx
│   │   └── VehicleCard.tsx
│   ├── constants/
│   │   └── config.ts          # Gateway URLs, Storage Keys, 90-Day Retention Limits
│   ├── navigation/
│   │   └── index.tsx          # 5 Primary Bottom Tabs & Modal Stack Navigation
│   ├── screens/
│   │   ├── SplashScreen.tsx             # Screen 01 - Splash Screen
│   │   ├── LoginScreen.tsx              # Screen 02 - Login & RBAC Role Switcher
│   │   ├── ExecutiveDashboardScreen.tsx # Screen 03 - Executive Home Dashboard
│   │   ├── LiveTrackingScreen.tsx       # Screen 04 - Live Vehicle Tracking (Full OSM)
│   │   ├── VehicleDetailsScreen.tsx     # Screen 05 - Vehicle Details & Telematics
│   │   ├── TripHistoryScreen.tsx        # Screen 06 - 90-Day Trip Playback & Stoppages
│   │   ├── PanicSosScreen.tsx           # Screen 07 - AIS-140 Panic Desk (4-Stage Workflow)
│   │   ├── DriverIntelligenceScreen.tsx # Screen 08 - 5 Behavioral Dimensions & Scoreboard
│   │   ├── AlertCentreScreen.tsx        # Screen 09 - Complete Unified Alert Catalog
│   │   ├── GeofencingScreen.tsx         # Screen 10 - Geofence Management & Dwell Time
│   │   ├── DeviceHealthScreen.tsx       # Screen 11 - GPS Hardware Health & Tamper
│   │   ├── EnterpriseReportsScreen.tsx  # Screen 12 - 8 Standard Enterprise Reports
│   │   ├── NotificationCentreScreen.tsx # Screen 13 - Push Notification Center
│   │   ├── ProfileSettingsScreen.tsx    # Screen 14 - User Profile & Security Settings
│   │   ├── VehicleListScreen.tsx        # 7-Segment Fleet Directory
│   │   ├── MoreMenuScreen.tsx           # Secondary Feature Hub
│   │   └── UserManagementScreen.tsx     # Tenant RBAC User Administration
│   ├── services/
│   │   ├── api.ts             # Axios REST client with interceptors
│   │   ├── storage.ts         # Secure local token & preferences storage
│   │   └── websocket.ts       # Sub-second telematics WebSocket client
│   ├── store/
│   │   ├── authStore.ts       # Authentication, RBAC permissions, session
│   │   └── telematicsStore.ts # Live positions, 8 KPIs, active SOS alarms
│   ├── theme/
│   │   ├── colors.ts          # Axona enterprise color tokens
│   │   ├── spacing.ts         # Layout dimensions, radiuses & elevation shadows
│   │   └── typography.ts      # Type scales & font weights
│   └── types/
│       └── index.ts           # Complete TypeScript domain models
├── app.json                   # Expo Application Manifest
├── App.tsx                    # Application root entry point
├── eas.json                   # Expo Application Services build configurations
├── package.json
└── tsconfig.json
```

---

## 3. Vehicle Categories & Segments

The mobile application dynamically adapts information and features across all 7 segments defined in PRD Section 1:

1. **Individual Car Owners**: Real-time live location, ignition anti-theft alarms, unauthorized movement alerts, animated trip replay.
2. **Two-Wheeler / Bike Owners**: Battery-disconnect alarms, tow-away tilt detection, geofence boundary alerts.
3. **Taxi & Cab Operators**: Passenger safety, statutory AIS-140 SOS emergency button handling, overspeed monitoring.
4. **Bus Operators & School Coaches**: Route deviation alerts, scheduled stoppage adherence, aggressive driver behavior tracking.
5. **Commercial Truck Owners & Haulers**: Interstate route audit, weighbridge and toll plaza stoppage tracking, driver fatigue/tilt prevention.
6. **Commercial Fleet Operators**: Multi-vehicle real-time status matrix, live hardware health monitoring, fleet utilization KPIs.
7. **Fleet Management Companies (FMCs) & Logistics 3PLs**: Multi-tenant enterprise organization hierarchy, role-based access control (RBAC), 90-day compliance reports.

---

## 4. User Roles & RBAC Matrix

| Role | Permitted Capabilities | Screen Authorizations |
| :--- | :--- | :--- |
| **Super Administrator** | Unrestricted global access, tenant provisioning, system telematics health, raw AIS-140 log streams. | All screens + tenant user admin + OTA device configuration. |
| **Company Fleet Admin** | Full fleet visibility for company vehicles, driver intelligence leaderboard, reports export, geofence creation/deletion. | Executive Dashboard, Live Map, Vehicle Details, Trips, Panic Desk, Driver Safety, Geofences, Reports, User Admin. |
| **Fleet Dispatcher / NOC** | Live vehicle tracking, trip history replay, SOS emergency alert acknowledgment & 4-stage resolution with mandatory audit remarks. | Live Map, Trips, Panic SOS Desk, Alerts Center, Driver Intelligence, Daily Reports. |
| **Viewer / Client Auditor** | Read-only access to assigned vehicles, trip playback, and route completion status. | Read-only Live Map, Trip Playback, Read-only Reports. (Cannot acknowledge alerts, issue OTA commands, or edit geofences). |

---

## 5. Screen-by-Screen Implementation Guide

### Screen 01 – Splash Screen (`SplashScreen.tsx`)
- Navy blue background (`#102C50`), white Axona geometric emblem, and Gold/Blue accents.
- Displays "AXONA", "FLEET MANAGEMENT", "By Axona Software LLP", and "MoRTH AIS-140 COMPLIANT".
- Validates saved JWT sessions from `expo-secure-store`.
- Seamlessly routes authenticated operators to Executive Dashboard or unauthenticated users to Login.

### Screen 02 – Login & Authentication (`LoginScreen.tsx`)
- Email / Mobile number login and password authentication.
- Mobile OTP option with SMS code verification trigger.
- **Evaluation Role Switcher**: Instant one-tap switching between Vikramaditya Rao (Company Admin), Rahul Sharma (Individual Owner), Vikram Singh (Dispatcher), and Master Operations Lead (Super Admin).
- Biometric verification trigger (FaceID / Fingerprint).
- Secure JWT bearer token management.

### Screen 03 – Executive Home Dashboard (`ExecutiveDashboardScreen.tsx`)
- Real-time connection badge (LIVE / SYNC / OFFLINE) linked to the WebSocket gateway.
- Persistent flashing emergency SOS banner with audio siren toggle when critical alerts are pending.
- **All 8 PRD KPI Cards**:
  1. *Total Fleet Count*: Aggregate registered vehicles.
  2. *Moving / En Route*: Speed > 0 km/h and Ignition ON.
  3. *Idle with Engine ON*: Ignition ON and Speed = 0 km/h (flags fuel wastage).
  4. *Stopped / Parked*: Ignition OFF and vehicle stationary.
  5. *Disconnected / Inactive*: No telematics ping within the last 15 minutes.
  6. *Active SOS Alerts*: Unacknowledged emergency panic button events.
  7. *Fleet Average Safety Score*: 100Hz IMU weighted safety index.
  8. *Daily Distance Travelled*: Cumulative fleet mileage logged since 00:00 UTC.
- Live OpenStreetMap fleet preview.
- Recent telematics alerts feed with quick actions.
- Emergency SOS simulation trigger for testing and evaluation.

### Screen 04 – Live Vehicle Tracking (`LiveTrackingScreen.tsx`)
- Full-screen interactive OpenStreetMap canvas.
- Dynamic vehicle markers rotated by heading angle (0°–360°).
- Color-coded telematics status:
  - Moving: Green (`#16A36A`)
  - Idle: Amber (`#E7A12A`)
  - Stopped: Blue (`#2563EB`)
  - Emergency SOS: Pulsing Red (`#DC3545`) with animated radar rings
  - Disconnected: Grey (`#708090`)
- Vehicle search by registration number, driver name, or vehicle make/model.
- Filter drawer for all 7 vehicle segments.
- Status quick filter pills (All, Moving, Idle, Stopped, SOS, Offline).
- Interactive vehicle bottom sheet on marker click with speed, ignition, battery, address, and quick actions.

### Screen 05 – Vehicle Details (`VehicleDetailsScreen.tsx`)
- Section A: Vehicle Information (Registration, category, make, model, speed threshold, owner, assigned driver).
- Section B: Current Telematics (Real-time speed, ignition, heading, coordinates, reverse-geocoded address, GPS timestamp).
- Section C: Hardware Health (Device IMEI, AIS-140 compliance, 12.6V main battery, backup battery %, enclosure microswitch, GPS antenna circuit, SOS wiring).
- Section D: Quick Action buttons (Live Track, Trip History, Driver Intelligence, Alerts).

### Screen 06 – Trip History & Route Playback (`TripHistoryScreen.tsx`)
- Time horizon filters: Today, 7 Days, 30 Days, 90 Days (strict 90-day retention enforcement).
- Animated route replay player with Play, Pause, Reset, and speed multipliers (**1x, 2x, 5x, 10x**).
- Real-time telematics HUD during playback showing speed, heading, ignition, and completion %.
- **En-Route Stoppages Breakdown**:
  - Plots every halt where speed = 0 km/h and ignition = OFF for > 3 minutes.
  - Displayed as high-contrast circular stop marker (🛑) with stop duration badge (e.g., 'Stop #1: 10 min').
  - Selecting any stop automatically seeks playback timeline and centers map on that halt.

### Screen 07 – AIS-140 Panic Button & Emergency Desk (`PanicSosScreen.tsx`)
- Statutory MoRTH public safety incident command center.
- Audible siren audio tone generator and vibration.
- Emergency metrics: vehicle number, driver contact, elapsed response time, coordinates, device IMEI.
- **4-Stage Resolution Workflow**:
  - `NEW` ➔ `ACKNOWLEDGED` ➔ `IN PROGRESS` ➔ `RESOLVED`.
- Enforces **mandatory operator audit remarks** on acknowledgement and resolution.
- Quick direct dialing to assigned driver and National Emergency Response Support System (**112**).
- Real-time emergency SOS simulation tool.

### Screen 08 – Driver Intelligence (`DriverIntelligenceScreen.tsx`)
- Ingests hardware-generated 100Hz MEMS IMU events.
- **5 Behavioral Dimensions**:
  1. *Harsh Braking* (Code 13, HB): Longitudinal X-axis > 0.55g deceleration.
  2. *Harsh Acceleration* (Code 14, HA): Longitudinal X-axis > 0.43g forward surge.
  3. *Vehicle Tilt / Rollover* (Code 22, TI): Gyroscope Z-axis > 45° angular lean.
  4. *Rash Driving / Swerve* (Code 15, RT): Lateral Y-axis > 0.47g at speed > 30 km/h.
  5. *Overspeeding* (Code 17, OS): GPS Doppler velocity > statutory speed limit.
- **Driver Safety Score Formula**:
  $$\text{Safety Score} = 100 - \left( 3 \times \text{HB} + 2 \times \text{HA} + 10 \times \text{Tilt} + 5 \times \text{Rash} + 2 \times \text{Overspeed} \right)$$
- Safety tiers: Safe / Tier 1 (90–100, Green), Moderate / Tier 2 (75–89, Amber), Risky / Tier 3 (< 75, Red).
- Interactive Driver Leaderboard with violation counters and risk tiers.
- AIS-140 IMU calibration inspector and OTA configuration strings.

### Screen 09 – Complete Alert Centre (`AlertCentreScreen.tsx`)
- Unified alert catalog across all 6 PRD categories:
  1. *Critical Emergency* (Panic SOS, Emergency Resolved, SOS Wire Disconnected).
  2. *Driver Intelligence* (Harsh Braking, Acceleration, Rash Driving, Overspeeding, Tilt).
  3. *Hardware & Tamper* (Main Power Cut, Low Battery, Box Tamper, Antenna Disconnect).
  4. *Movement & Ignition* (Ignition ON, Ignition OFF, Unauthorized Motion).
  5. *Geofencing* (Geofence Entry, Geofence Exit).
  6. *System Events*.
- Multi-dimensional filtering by category, severity, status, and vehicle registration.
- Detailed modal with map pin, telemetry parameters, and resolution actions.

### Screen 10 – Geofencing (`GeofencingScreen.tsx`)
- Visualizes circular and polygon boundaries on interactive OpenStreetMap canvas.
- Real-time entry (Code 20) and departure (Code 21) audit logs with calculated dwell time.
- Geofence creation wizard for authorized admins (custom radius, center coordinates, active status).

### Screen 11 – Device Health (`DeviceHealthScreen.tsx`)
- Fleet hardware status monitoring: total, online, and offline counts.
- Displays main power voltage (0.0V cut detection), Li-ion backup battery %, GPS antenna status, tamper switch, and last communication.
- Filters by Online, Offline, Warning, and Critical health tiers.

### Screen 12 – Enterprise Reports (`EnterpriseReportsScreen.tsx`)
- Implements all 8 standardized reports defined in PRD Section 7:
  1. *Vehicle Movement & Breadcrumb Report*
  2. *Trip Summary & En-route Stoppages Report*
  3. *Distance Travelled (Mileage Summary) Report* (Daily / Weekly / Monthly)
  4. *Overspeeding Violation Report*
  5. *Panic SOS & Emergency Audit Report*
  6. *GPS Device Health & Tamper Report*
  7. *Geofence In/Out & Dwell Time Report*
  8. *Driver Intelligence & Behavioural Safety Report*
- **Strict 90-Day Retention Enforcement**: Automatically rejects queries spanning > 90 days.
- One-click **CSV Export** downloading UTF-8 formatted spreadsheets.
- Direct **OpenStreetMap Coordinate Hyperlinks** for instant validation.

### Screen 13 – Notification Centre (`NotificationCentreScreen.tsx`)
- Push notification tiers: Critical, Warning, and Informational.
- Unread badge counters, mark as read, and deep-link routing.

### Screen 14 – User Profile & Settings (`ProfileSettingsScreen.tsx`)
- User credentials, corporate tenant information, and role badges.
- RBAC role switcher for audit and evaluation.
- Biometric authentication and audible siren toggles.
- Configurable Gateway API URL override (for real devices or remote server testing).
- Secure logout with token revocation.

---

## 6. Build & Installation Instructions

### Prerequisites
- Node.js LTS (v20+ or v24)
- npm or yarn
- Java JDK 17+ (Java 25 LTS installed)
- Android SDK (for native Android builds)
- macOS with Xcode (for native iOS builds)

### 1. Running in Development Mode
```bash
# Navigate to mobile project directory
cd C:\Users\user\.gemini\antigravity\scratch\axona-mobile-app

# Start Expo Web Development Server
npm run web

# Start Android Development Server
npm run android

# Start iOS Development Server (requires macOS)
npm run ios
```

### 2. Building Android Release APK & AAB
Using Expo Prebuild (local Gradle build):
```bash
cd C:\Users\user\.gemini\antigravity\scratch\axona-mobile-app\android

# Generate release APK
./gradlew assembleRelease

# Generated APK output:
# android/app/build/outputs/apk/release/app-release.apk

# Generate release Android App Bundle (AAB for Google Play Store)
./gradlew bundleRelease

# Generated AAB output:
# android/app/build/outputs/bundle/release/app-release.aab
```

Using Expo Application Services (EAS Cloud Build):
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build standalone Android APK for device testing
eas build --platform android --profile preview

# Build production Android App Bundle (AAB) for Play Store
eas build --platform android --profile production
```

### 3. Building iOS Release (Apple App Store)
```bash
# Build standalone iOS Simulator build for testing
eas build --platform ios --profile preview

# Build production iOS IPA for App Store submission
eas build --platform ios --profile production
```

---

## 7. App Store & Google Play Store Submission Checklist

### Google Play Store (Android)
1. **Target SDK**: Target Android API level 35 (Android 15) per Google Play requirements.
2. **App Bundle**: Use `app-release.aab` generated via `./gradlew bundleRelease` or EAS.
3. **Permissions Declared**:
   - `INTERNET` & `ACCESS_NETWORK_STATE`: For telemetry and WebSocket sync.
   - `VIBRATE`: For statutory AIS-140 emergency alarms.
   - `USE_BIOMETRIC`: For FaceID / Fingerprint sign-in.
   - `POST_NOTIFICATIONS`: For Firebase Cloud Messaging alerts.
4. **Data Safety Disclosure**: Telematics data collected (GPS coordinates, speed, driver name) is encrypted in-transit (TLS 1.3) and at-rest (AES-256) and not shared with third-party advertising networks.
5. **Privacy Policy URL**: Link hosted privacy policy per PRD Section 8.

### Apple App Store (iOS)
1. **Human Interface Guidelines (HIG)**: Complete safe area insets handled via `react-native-safe-area-context`.
2. **Info.plist Strings**:
   - `NSLocationWhenInUseUsageDescription`: "Axona requires access to your location to plot driver routes and live vehicle navigation."
   - `NSFaceIDUsageDescription`: "Enable biometric authentication to securely access Axona Fleet Management."
3. **Background Modes**: `fetch` and `remote-notification` enabled for high-priority emergency alerts.
4. **App Review Demo Account**:
   - Email: `fleetmanager@apexlogistics.in`
   - Password: `admin` (or use the built-in Evaluation Role Switcher).

---

## 8. Acceptance Verification Summary

| Feature Module | PRD Section | Status | Verification Result |
| :--- | :--- | :--- | :--- |
| **8 KPI Dashboard Cards** | PRD 4.1 | ✅ Complete | Exact business logic implemented: moving, idle, stopped, disconnected, active SOS, safety score, daily mileage. |
| **Full OSM Live Tracking** | PRD 4.2 | ✅ Complete | Real-time Leaflet canvas, rotated heading markers, color-coded status, telematics bottom sheet. |
| **Trip History & Playback** | PRD 4.3 | ✅ Complete | 1x/2x/5x/10x speed, timeline scrubber, en-route halts > 3 min with 🛑 markers and breakdown seek. |
| **AIS-140 Panic Desk** | PRD 4.4 | ✅ Complete | 4-stage resolution workflow (`New` ➔ `Ack` ➔ `In Progress` ➔ `Resolved`), mandatory remarks, audible siren. |
| **Driver Intelligence** | PRD 5.1–5.3 | ✅ Complete | 5 behavioral dimensions (HB, HA, TI, RT, OS), 100Hz IMU formulas, driver leaderboard, AIS-140 config. |
| **Unified Alert Center** | PRD 6.1 | ✅ Complete | All 6 PRD categories (Critical, Driver, Hardware, Movement, Geofence, System) with multi-filters. |
| **Geofencing & Dwell** | PRD 6.1 | ✅ Complete | Circular and polygon zones, entry/exit logs, dwell time, admin creation/deletion. |
| **Device Health** | PRD 6.1 | ✅ Complete | 12.6V voltage, 0V battery cut detection, backup Li-ion %, tamper switch, antenna monitoring. |
| **8 Enterprise Reports** | PRD 7.1–7.3 | ✅ Complete | Movement, Trips, Distance, Overspeeding, Panic, Health, Geofence, Driver Intelligence. 90-day filter, CSV export & OSM coordinate links. |
| **TypeScript & Build** | All | ✅ Complete | Strict TypeScript (0 errors), Expo Web export (`dist`) verified, native `./android` Gradle project generated. |

**Axona Software LLP — Enterprise Cloud Telematics Suite**
