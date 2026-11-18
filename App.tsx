import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { EmergencyAudioSiren } from './src/components/EmergencyAudioSiren';
import { CriticalAlertModal } from './src/components/CriticalAlertModal';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
      <EmergencyAudioSiren />
      <CriticalAlertModal />
    </SafeAreaProvider>
  );
}
