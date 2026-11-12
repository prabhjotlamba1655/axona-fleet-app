import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTelematicsStore } from '../store/telematicsStore';

export const EmergencyAudioSiren: React.FC = () => {
  const { sirenActive } = useTelematicsStore();
  const audioContextRef = useRef<any>(null);
  const oscillatorRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!sirenActive) {
      stopSiren();
      return;
    }

    startSiren();

    return () => {
      stopSiren();
    };
  }, [sirenActive]);

  const startSiren = () => {
    // Platform web audio tone synthesis
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        gain.gain.value = 0.08; // moderate gentle volume

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        oscillatorRef.current = osc;

        // Modulate frequency between 750 Hz and 950 Hz (classic ambulance/emergency siren)
        let high = false;
        intervalRef.current = setInterval(() => {
          high = !high;
          if (oscillatorRef.current) {
            oscillatorRef.current.frequency.setValueAtTime(
              high ? 950 : 750,
              ctx.currentTime
            );
          }
        }, 300);
      } catch (err) {
        // web audio may require prior user interaction
      }
    } else {
      // Native haptic pulses
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {
        // ignore
      }
    }
  };

  const stopSiren = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      oscillatorRef.current = null;
    }
  };

  return null;
};
