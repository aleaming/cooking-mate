import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'meddiet-device-id';

/**
 * Gets the existing device ID from localStorage or creates a new one
 * Returns empty string on server-side
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Clears the device ID from localStorage
 * Useful for testing or resetting user data
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(DEVICE_ID_KEY);
}
