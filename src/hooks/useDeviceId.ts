'use client';

import { useState, useEffect } from 'react';
import { getOrCreateDeviceId } from '@/lib/utils/deviceId';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Hook to manage device identification for anonymous users
 * Creates a persistent device ID stored in localStorage
 * Optionally registers the device in Supabase
 */
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);
    setIsLoading(false);

    // Register device in Supabase (if configured)
    if (id && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      registerDevice(id);
    }
  }, []);

  return { deviceId, isLoading };
}

/**
 * Registers or updates the device in Supabase
 */
async function registerDevice(deviceId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Upsert device record (insert or update last_seen)
    await supabase
      .from('devices')
      .upsert(
        { id: deviceId, last_seen_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  } catch (error) {
    // Silently fail - device registration is not critical
    console.warn('Failed to register device:', error);
  }
}
