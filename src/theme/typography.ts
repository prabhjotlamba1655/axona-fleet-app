// Axona Design System - Typography
import { TextStyle } from 'react-native';

export const typography = {
  // Headings
  h1: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
  },

  // Body Text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
  },

  // Captions & Subtitles
  caption: {
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 10,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },

  // Metrics / KPI numbers
  metricLarge: {
    fontSize: 26,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  metricMedium: {
    fontSize: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 26,
  },
};
