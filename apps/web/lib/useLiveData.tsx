'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from 'react';
import { apiFetch } from './api';

export type ChangeTokens = {
  reviews: string;
  products: string;
  alerts: string;
  signals: string;
  version: string;
};

export type TokenKey = keyof ChangeTokens | 'all';

interface ListenerEntry {
  tokenKeys: TokenKey[];
  callback: (isBackground: boolean) => void | Promise<void>;
  lastSeenTokens: Partial<ChangeTokens>;
}

interface LiveDataContextType {
  status: 'live' | 'reconnecting' | 'paused';
  tokens: ChangeTokens | null;
  lastUpdated: Date;
  triggerManualRescan: () => Promise<void>;
  registerListener: (
    id: string,
    tokenKeys: TokenKey[],
    callback: (isBackground: boolean) => void | Promise<void>
  ) => void;
  unregisterListener: (id: string) => void;
}

const LiveDataContext = createContext<LiveDataContextType | null>(null);

export function useLiveDataContext() {
  return useContext(LiveDataContext);
}

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'live' | 'reconnecting' | 'paused'>('live');
  const [tokens, setTokens] = useState<ChangeTokens | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const listenersRef = useRef<Map<string, ListenerEntry>>(new Map());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const tokensRef = useRef<ChangeTokens | null>(null);

  // Keep tokensRef in sync with state
  tokensRef.current = tokens;

  const notifyListeners = useCallback((newTokens: ChangeTokens, forceAll: boolean = false) => {
    listenersRef.current.forEach((entry) => {
      let shouldNotify = forceAll;

      if (!shouldNotify) {
        if (entry.tokenKeys.includes('all')) {
          shouldNotify = entry.lastSeenTokens.version !== newTokens.version;
        } else {
          for (const key of entry.tokenKeys) {
            if (key === 'version' || key === 'all') {
              if (entry.lastSeenTokens.version !== newTokens.version) {
                shouldNotify = true;
                break;
              }
            } else {
              const tokenKey = key as keyof ChangeTokens;
              if (entry.lastSeenTokens[tokenKey] !== newTokens[tokenKey]) {
                shouldNotify = true;
                break;
              }
            }
          }
        }
      }

      if (shouldNotify) {
        entry.lastSeenTokens = { ...newTokens };
        try {
          entry.callback(true);
        } catch (err) {
          console.error('[LiveSync] Error in listener callback:', err);
        }
      }
    });
  }, []);

  const pollChanges = useCallback(
    async (forceNotify: boolean = false) => {
      if (isFetchingRef.current || isPausedRef.current) return;
      isFetchingRef.current = true;

      try {
        const res = await apiFetch('/api/v1/system/changes');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: ChangeTokens = await res.json();

        // Successful fetch: reset backoff and mark status as live
        consecutiveErrorsRef.current = 0;
        setStatus('live');
        setLastUpdated(new Date());

        const prevTokens = tokensRef.current;
        tokensRef.current = data;
        setTokens(data);

        // Check if anything changed or if force requested
        const hasChanged = !prevTokens || prevTokens.version !== data.version;
        if (hasChanged || forceNotify) {
          notifyListeners(data, forceNotify);
        }

        // Schedule next regular poll (4.5s)
        if (!isPausedRef.current) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => pollChanges(false), 4500);
        }
      } catch (err) {
        consecutiveErrorsRef.current += 1;
        console.warn(`[LiveSync] /system/changes poll error (${consecutiveErrorsRef.current}x):`, err);

        if (consecutiveErrorsRef.current >= 2) {
          setStatus('reconnecting');
        }

        // Exponential backoff: 4.5s -> 8s -> 14.5s -> 26s -> max 30s
        const backoffMs = Math.min(
          30000,
          Math.round(4500 * Math.pow(1.8, Math.min(consecutiveErrorsRef.current - 1, 4)))
        );

        if (!isPausedRef.current) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => pollChanges(false), backoffMs);
        }
      } finally {
        isFetchingRef.current = false;
      }
    },
    [notifyListeners]
  );

  const triggerManualRescan = useCallback(async () => {
    consecutiveErrorsRef.current = 0;
    setStatus('live');
    if (timerRef.current) clearTimeout(timerRef.current);
    await pollChanges(true);
  }, [pollChanges]);

  const registerListener = useCallback(
    (
      id: string,
      tokenKeys: TokenKey[],
      callback: (isBackground: boolean) => void | Promise<void>
    ) => {
      listenersRef.current.set(id, {
        tokenKeys,
        callback,
        lastSeenTokens: tokensRef.current ? { ...tokensRef.current } : {},
      });
    },
    []
  );

  const unregisterListener = useCallback((id: string) => {
    listenersRef.current.delete(id);
  }, []);

  // Main lifecycle: Start single polling loop & hook into Page Visibility API
  useEffect(() => {
    // Initial fetch to seed tokens immediately
    pollChanges(false);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
        setStatus('paused');
        if (timerRef.current) clearTimeout(timerRef.current);
      } else {
        isPausedRef.current = false;
        setStatus('live');
        // Instantly poll once when tab becomes visible again
        pollChanges(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pollChanges]);

  return (
    <LiveDataContext.Provider
      value={{
        status,
        tokens,
        lastUpdated,
        triggerManualRescan,
        registerListener,
        unregisterListener,
      }}
    >
      {children}
    </LiveDataContext.Provider>
  );
}

/**
 * Shared hook to automatically update component data when relevant database changes occur.
 * @param fetcher Async function to fetch data. Receives isBackground=true when triggered by live polling.
 * @param tokenKeys Specific token(s) to monitor ('reviews' | 'products' | 'alerts' | 'signals' | 'version' | 'all')
 * @param deps Additional dependency array triggering a fresh non-background fetch on change
 */
export function useLiveData(
  fetcher: (isBackground: boolean) => Promise<void> | void,
  tokenKeys: TokenKey | TokenKey[],
  deps: any[] = []
) {
  const context = useLiveDataContext();
  const listenerId = useId();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Run initial fetch on mount and whenever deps change
  useEffect(() => {
    fetcherRef.current(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Register listener for live database updates
  useEffect(() => {
    if (!context) return;
    const normalizedKeys = Array.isArray(tokenKeys) ? tokenKeys : [tokenKeys];

    context.registerListener(listenerId, normalizedKeys, (isBackground) => {
      fetcherRef.current(isBackground);
    });

    return () => {
      context.unregisterListener(listenerId);
    };
  }, [context, listenerId, JSON.stringify(tokenKeys)]);
}
