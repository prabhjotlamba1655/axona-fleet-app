import { Platform } from 'react-native';

// Axona Enterprise Telematics Configuration
// Server is running at port 5055
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `http://${window.location.hostname}:5055/api`;
    }
    return 'http://localhost:5055/api';
  }
  if (Platform.OS === 'android') {
    // 10.0.2.2 maps to host machine localhost in standard Android emulator
    return 'http://10.0.2.2:5055/api';
  }
  // iOS simulator uses localhost
  return 'http://localhost:5055/api';
};

const getWsUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return `ws://${window.location.hostname}:5055/ws/telematics`;
    }
    return 'ws://localhost:5055/ws/telematics';
  }
  if (Platform.OS === 'android') {
    return 'ws://10.0.2.2:5055/ws/telematics';
  }
  return 'ws://localhost:5055/ws/telematics';
};

export const APP_CONFIG = {
  APP_NAME: 'Axona Fleet Management',
  VENDOR: 'Axona Software LLP',
  PRD_VERSION: 'Version 2.4 (Enterprise Edition)',
  APP_VERSION: '2.4.0',
  DEFAULT_API_BASE_URL: getBaseUrl(),
  DEFAULT_WS_URL: getWsUrl(),
  STORAGE_KEYS: {
    AUTH_TOKEN: 'axona_auth_token',
    USER_DATA: 'axona_user_data',
    API_URL_OVERRIDE: 'axona_api_url_override',
    BIOMETRICS_ENABLED: 'axona_biometrics_enabled',
    AUDIO_ALERTS_ENABLED: 'axona_audio_alerts_enabled',
  },
  MAX_REPORT_DAYS: 90,
  GPS_POLL_FALLBACK_INTERVAL_MS: 5000,
  HEARTBEAT_INTERVAL_MS: 15000,
};
