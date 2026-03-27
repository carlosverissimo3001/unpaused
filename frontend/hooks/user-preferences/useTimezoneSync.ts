'use client';

import { useEffect } from 'react';
import { useUserPreferences } from './useUserPreferences';
import { useUpdateUserPreferences } from './useUpdateUserPreferences';

interface UseTimezoneSyncOptions {
  enabled?: boolean;
}

/**
 * Detects the browser's IANA timezone and syncs it to user preferences
 * if it differs from the stored value. Runs once after preferences load.
 */
export function useTimezoneSync({
  enabled = true,
}: UseTimezoneSyncOptions = {}) {
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();

  useEffect(() => {
    if (!enabled || !preferences) return;

    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimezone || preferences.timezone === browserTimezone) return;

    updatePreferences({ timezone: browserTimezone });
  }, [enabled, preferences, updatePreferences]);
}
