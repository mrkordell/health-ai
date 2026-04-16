import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '../lib/api';

const STORAGE_KEY = 'vita.lastSyncedTimezone';

/**
 * On mount (and when the browser's reported timezone changes), send the
 * user's IANA timezone to the API so server-side date math uses the right
 * zone. Skips the call if we've already synced the same value in this
 * browser to avoid a request on every page load.
 */
export function useSyncTimezone() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    if (localStorage.getItem(STORAGE_KEY) === tz) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        await apiRequest('/api/user/timezone', {
          method: 'PATCH',
          token,
          body: JSON.stringify({ timezone: tz }),
        });
        localStorage.setItem(STORAGE_KEY, tz);
      } catch (err) {
        console.warn('[useSyncTimezone] failed to sync timezone', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);
}
