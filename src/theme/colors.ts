// Axona Design System - Color Palette
// Compliant with Axona Fleet Management PRD Version 2.4

export const colors = {
  // Brand Colors
  primaryNavy: '#102C50',
  secondaryNavy: '#173F68',
  navyDark: '#0B1E38',
  navyLight: '#1E4E82',
  navySurface: '#0D2340',

  // Background & Surfaces
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  surfaceBorder: '#E2E8F0',
  divider: '#E9EEF4',

  // Status Colors (PRD exact telematics definitions)
  statusMoving: '#16A36A',      // Speed > 0 km/h and Ignition ON
  statusIdle: '#E7A12A',        // Ignition ON and Speed = 0 km/h
  statusStopped: '#2563EB',     // Ignition OFF and Stationary
  statusEmergency: '#DC3545',   // Active SOS or Critical Alert (Pulsing Red)
  statusDisconnected: '#708090',// No ping within 15 minutes (Grey)

  // Severity Tiers
  criticalRed: '#DC3545',
  criticalLight: '#FEE2E2',
  warningAmber: '#E7A12A',
  warningLight: '#FEF3C7',
  infoBlue: '#0284C7',
  infoLight: '#E0F2FE',
  successGreen: '#16A36A',
  successLight: '#DCFCE7',

  // Typography
  textPrimary: '#172B45',
  textSecondary: '#708090',
  textMuted: '#94A3B8',
  textLight: '#F8FAFC',
  textWhite: '#FFFFFF',

  // Accents & Interactive
  accentBlue: '#0066CC',
  accentHover: '#0052A3',
  inputBackground: '#F1F5F9',
  inputBorder: '#CBD5E1',
  focusRing: '#3B82F6',
  badgeBackground: '#EEF2F6',
  shadowColor: '#000000',
};

export type Colors = typeof colors;
