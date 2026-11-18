/**
 * AXONA TELEMATICS ALERT AUDIO SYNTHESIZER
 * Uses natively scheduled Web Audio parameters without JavaScript timer loops.
 * Plays crisp, non-blocking notification chimes for:
 *  - SOS: Urgent alternating siren (1.0s)
 *  - Towing: Triple-pulse motion alarm (0.8s)
 *  - Tilt: Fast rollover chirp sweep (0.7s)
 *  - Geofence: Dual-tone chime (0.8s)
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

class SoundService {
  private audioCtx: any = null;
  private activeOscillators: any[] = [];
  public isMuted: boolean = false;

  private getContext() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.audioCtx) {
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playAlertSound(type: 'siren' | 'towing' | 'tilt' | 'geofence' | 'tamper' | 'critical' | string) {
    this.stop();
    if (this.isMuted) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
    }

    const ctx = this.getContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;

    try {
      if (type === 'siren' || type === 'SOS') {
        // Scheduled Two-Tone Siren: 800Hz <-> 960Hz (1.0s total)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(800, t0);
        osc.frequency.setValueAtTime(960, t0 + 0.25);
        osc.frequency.setValueAtTime(800, t0 + 0.50);
        osc.frequency.setValueAtTime(960, t0 + 0.75);

        gain.gain.setValueAtTime(0.08, t0);
        gain.gain.setValueAtTime(0.08, t0 + 0.85);
        gain.gain.linearRampToValueAtTime(0.001, t0 + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 1.0);
        this.activeOscillators.push(osc);
      } else if (type === 'towing') {
        // 3 Fast Warning Pulses scheduled at t0, t0+0.25, t0+0.50 (0.75s total)
        for (let i = 0; i < 3; i++) {
          const pt = t0 + i * 0.24;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(680, pt);

          gain.gain.setValueAtTime(0.07, pt);
          gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(pt);
          osc.stop(pt + 0.13);
          this.activeOscillators.push(osc);
        }
      } else if (type === 'tilt') {
        // High Alarm Sweeps: 1250 Hz -> 750 Hz scheduled at t0 and t0+0.35 (0.7s total)
        for (let i = 0; i < 2; i++) {
          const pt = t0 + i * 0.35;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1250, pt);
          osc.frequency.exponentialRampToValueAtTime(750, pt + 0.22);

          gain.gain.setValueAtTime(0.10, pt);
          gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(pt);
          osc.stop(pt + 0.23);
          this.activeOscillators.push(osc);
        }
      } else if (type === 'geofence' || type === 'GEOFENCE_EXIT' || type === 'GEOFENCE_ENTRY') {
        // Resonant Dual-Tone Chime: 554 Hz (C#5) -> 830 Hz (G#5) (0.6s total)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(554.37, t0);
        gain1.gain.setValueAtTime(0.10, t0);
        gain1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(t0);
        osc1.stop(t0 + 0.26);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(830.61, t0 + 0.15);
        gain2.gain.setValueAtTime(0.10, t0 + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t0 + 0.15);
        osc2.stop(t0 + 0.56);

        this.activeOscillators.push(osc1, osc2);
      } else if (type === 'tamper' || type === 'TAMPER') {
        // Fast Hardware Staccato Warning Beeps (0.6s total)
        for (let i = 0; i < 4; i++) {
          const pt = t0 + i * 0.14;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(920, pt);

          gain.gain.setValueAtTime(0.08, pt);
          gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(pt);
          osc.stop(pt + 0.09);
          this.activeOscillators.push(osc);
        }
      } else {
        // General Critical Alert Synthesized Chime (0.7s)
        for (let i = 0; i < 2; i++) {
          const pt = t0 + i * 0.35;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, pt);
          osc.frequency.setValueAtTime(1050, pt + 0.15);

          gain.gain.setValueAtTime(0.09, pt);
          gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(pt);
          osc.stop(pt + 0.33);
          this.activeOscillators.push(osc);
        }
      }
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  }

  public stop() {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }
}

export const soundService = new SoundService();
