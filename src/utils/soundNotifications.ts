/**
 * Emergency Alarm Sound Synthesizer & Browser Notifications Manager
 * 
 * Provides:
 * 1. Powerful, authentic Fire/Emergency Alarm audio synthesis via Web Audio API (no external MP3 asset dependency).
 * 2. System-level Web Notifications that appear outside the app on Android / Windows / macOS / iOS (PWA/Safari).
 * 3. Vibration feedback on supported mobile devices.
 * 4. User preference controls (enable/disable sound, test alarm).
 */

class AudioNotificationService {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private alarmInterval: any = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Load sound preference if saved
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('oriket_sound_enabled');
      this.soundEnabled = saved !== null ? saved === 'true' : true;
    }
  }

  /**
   * Initializes or resumes the AudioContext after user gesture
   */
  public initAudio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Checks and requests browser notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return Notification.permission;
    }
  }

  /**
   * Checks if notification permission is granted
   */
  public hasNotificationPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  /**
   * Toggle sound enabled
   */
  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oriket_sound_enabled', String(enabled));
    }
    if (!enabled) {
      this.stopAlarm();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Plays a sharp, realistic European/Saudi Fire & Safety Emergency Siren
   * Two alternating tones (e.g. 960Hz and 770Hz) with rapid pulsation
   */
  public playEmergencyAlarm(durationSeconds: number = 4) {
    if (!this.soundEnabled) return;
    const ctx = this.initAudio();
    if (!ctx) return;

    this.stopAlarm();
    this.isAlarmPlaying = true;

    // Vibrate device if supported: emergency SOS pattern [200, 100, 200, 100, 500]
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 600, 200, 400]);
      } catch {
        // Ignore vibration errors
      }
    }

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, now);

      // Pitch modulation: siren sweeping between 650Hz and 1100Hz
      const cycles = durationSeconds * 2.5;
      for (let i = 0; i < cycles; i++) {
        const t = now + i * 0.4;
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.linearRampToValueAtTime(1100, t + 0.2);
        osc.frequency.linearRampToValueAtTime(650, t + 0.4);
      }

      // Add high frequency harmonic for intense emergency pierce
      const harmonicOsc = ctx.createOscillator();
      const harmonicGain = ctx.createGain();
      harmonicOsc.type = 'square';
      harmonicGain.gain.setValueAtTime(0.12, now);
      for (let i = 0; i < cycles; i++) {
        const t = now + i * 0.4;
        harmonicOsc.frequency.setValueAtTime(1300, t);
        harmonicOsc.frequency.linearRampToValueAtTime(2200, t + 0.2);
        harmonicOsc.frequency.linearRampToValueAtTime(1300, t + 0.4);
      }

      // Rapid beeps fade-out envelope
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.setValueAtTime(0.35, now + durationSeconds - 0.2);
      gain.gain.linearRampToValueAtTime(0.01, now + durationSeconds);

      harmonicGain.gain.setValueAtTime(0.12, now);
      harmonicGain.gain.setValueAtTime(0.12, now + durationSeconds - 0.2);
      harmonicGain.gain.linearRampToValueAtTime(0.01, now + durationSeconds);

      osc.connect(gain);
      gain.connect(ctx.destination);

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(ctx.destination);

      osc.start(now);
      harmonicOsc.start(now);

      osc.stop(now + durationSeconds);
      harmonicOsc.stop(now + durationSeconds);

      this.activeOscillators.push(osc, harmonicOsc);
      this.activeGains.push(gain, harmonicGain);

      setTimeout(() => {
        this.isAlarmPlaying = false;
        this.activeOscillators = [];
        this.activeGains = [];
      }, durationSeconds * 1000);
    } catch (e) {
      console.warn('Audio alarm playback error:', e);
      this.isAlarmPlaying = false;
    }
  }

  /**
   * Plays a gentle notification chime (ding-dong) for standard updates
   */
  public playChime() {
    if (!this.soundEnabled) return;
    const ctx = this.initAudio();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Ignore
    }
  }

  /**
   * Stops any currently sounding alarm
   */
  public stopAlarm() {
    this.isAlarmPlaying = false;
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeGains.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
    this.activeGains = [];
  }

  /**
   * Sends a system notification that displays outside the application (desktop / lockscreen / mobile notification bar)
   * Plays emergency sound and vibrates device.
   */
  public sendEmergencyNotification(options: {
    title: string;
    body: string;
    tag?: string;
    urgent?: boolean;
    data?: any;
    onClickUrl?: string;
  }) {
    const { title, body, tag, urgent = true, onClickUrl } = options;

    // 1. Play sound locally
    if (urgent) {
      this.playEmergencyAlarm(3.5);
    } else {
      this.playChime();
    }

    // 2. Dispatch system notification (outside app)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifOptions: NotificationOptions = {
          body,
          tag: tag || `oriket_${Date.now()}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: urgent, // Keeps notification visible until user interacts with it
          silent: false, // Let device sound trigger
          dir: 'rtl',
          lang: 'ar',
        };
        // Add vibrate if supported in runtime
        (notifOptions as any).vibrate = urgent ? [300, 150, 300, 150, 600] : [200, 100];

        const notif = new Notification(title, notifOptions);

        notif.onclick = () => {
          window.focus();
          notif.close();
          if (onClickUrl) {
            window.location.href = onClickUrl;
          }
        };
      } catch (err) {
        console.warn('System notification error, trying ServiceWorker registration:', err);
        // Fallback for Android Chrome where serviceWorker.showNotification is required
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              tag: tag || `oriket_${Date.now()}`,
              icon: '/favicon.ico',
              vibrate: urgent ? [300, 150, 300, 150, 600] : [200, 100],
              dir: 'rtl',
              lang: 'ar',
            } as any);
          });
        }
      }
    }
  }
}

// Global Singleton
export const soundNotifier = new AudioNotificationService();
