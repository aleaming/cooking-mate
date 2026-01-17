/**
 * Timer utilities for triggering native device timers
 * and parsing cooking times from recipe text
 */

export interface TimerConfig {
  seconds: number;
  label: string;
}

/**
 * Parse cooking/baking time from instruction text
 * Returns null if no time is found
 */
export function parseTimeFromText(text: string): TimerConfig | null {
  // Patterns for common cooking times
  // Match "X minutes", "X-Y minutes" (takes lower bound), "X hours"
  const minuteMatch = text.match(/(\d+)\s*(?:to\s*\d+\s*)?(?:-\d+\s*)?minutes?/i);
  const hourMatch = text.match(/(\d+)\s*(?:to\s*\d+\s*)?(?:-\d+\s*)?hours?/i);
  const secondMatch = text.match(/(\d+)\s*(?:to\s*\d+\s*)?(?:-\d+\s*)?seconds?/i);

  let seconds = 0;
  let label = '';

  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    seconds += hours * 3600;
    label = `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  if (minuteMatch) {
    const mins = parseInt(minuteMatch[1], 10);
    seconds += mins * 60;
    if (label) {
      label += ` ${mins} min`;
    } else {
      label = `${mins} minute${mins > 1 ? 's' : ''}`;
    }
  }

  if (secondMatch && !minuteMatch && !hourMatch) {
    // Only use seconds if no minutes or hours found
    const secs = parseInt(secondMatch[1], 10);
    seconds += secs;
    label = `${secs} second${secs > 1 ? 's' : ''}`;
  }

  if (seconds === 0) {
    return null;
  }

  return { seconds, label };
}

/**
 * Check if the device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if the device is Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Trigger the native timer app on mobile devices
 * Returns true if a native timer was triggered, false otherwise
 */
export function triggerNativeTimer(config: TimerConfig): boolean {
  if (typeof window === 'undefined') return false;

  if (isAndroid()) {
    // Android intent URL scheme
    // This will open the default clock/timer app with the duration preset
    const intentUrl =
      `intent://set_timer?` +
      `length=${config.seconds}&` +
      `message=${encodeURIComponent(config.label)}` +
      `#Intent;` +
      `action=android.intent.action.SET_TIMER;` +
      `S.browser_fallback_url=${encodeURIComponent(window.location.href)};` +
      `end;`;

    window.location.href = intentUrl;
    return true;
  }

  if (isIOS()) {
    // iOS Clock app timer URL scheme
    // Note: iOS native Clock app doesn't support setting duration via URL
    // This will open the Timer tab of the Clock app
    window.location.href = 'clock-timer://';
    return true;
  }

  return false; // Desktop or unsupported device
}

/**
 * Format seconds into a human-readable duration string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    if (mins > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${hours}h`;
  }

  if (mins > 0) {
    if (secs > 0 && mins < 10) {
      return `${mins}m ${secs}s`;
    }
    return `${mins}m`;
  }

  return `${secs}s`;
}

/**
 * Format seconds into MM:SS or HH:MM:SS format for countdown display
 */
export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(mins)}:${pad(secs)}`;
  }

  return `${pad(mins)}:${pad(secs)}`;
}
