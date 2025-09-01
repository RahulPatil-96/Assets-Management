/**
 * Notification Sound Service
 * Handles playing notification sounds and vibrations
 */

class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  private isAudioEnabled = true;
  private isVibrationEnabled = true;

  /**
   * Initialize the audio context
   */
  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      // Handle browser-specific AudioContext implementations
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      } else {
        throw new Error('AudioContext is not supported in this browser');
      }
    }
    return this.audioContext;
  }

  /**
   * Play a simple notification sound
   */
  playNotificationSound(): void {
    if (!this.isAudioEnabled) return;

    try {
      const context = this.initAudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    } catch (_error) {
      // console.warn('Failed to play notification sound:', error);
    }
  }

  /**
   * Trigger device vibration if supported
   */
  triggerVibration(): void {
    if (!this.isVibrationEnabled || !('vibrate' in navigator)) return;

    try {
      // Short vibration pattern: vibrate for 200ms, pause for 100ms, vibrate for 200ms
      navigator.vibrate([200, 100, 200]);
    } catch (_error) {
      // console.warn('Failed to trigger vibration:', error);
    }
  }

  /**
   * Play both sound and vibration for notification
   */
  playNotification(): void {
    this.playNotificationSound();
    this.triggerVibration();
  }

  /**
   * Enable or disable audio notifications
   */
  setAudioEnabled(enabled: boolean): void {
    this.isAudioEnabled = enabled;
  }

  /**
   * Enable or disable vibration notifications
   */
  setVibrationEnabled(enabled: boolean): void {
    this.isVibrationEnabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  getAudioEnabled(): boolean {
    return this.isAudioEnabled;
  }

  /**
   * Check if vibration is enabled
   */
  getVibrationEnabled(): boolean {
    return this.isVibrationEnabled;
  }
}

// Export a singleton instance
export const notificationSoundService = new NotificationSoundService();
