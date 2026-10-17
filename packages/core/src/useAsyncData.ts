import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

/** Runs `fetcher` on mount/deps-change and exposes a manual `refresh()` to re-run it after a mutation. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher().then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, refresh };
}

/**
 * Calls `refresh` every time the screen comes back into focus, e.g. after closing a form,
 * so lists are never stale. Skips the first focus, because `useAsyncData` already loads on mount.
 */
export function useRefreshOnFocus(refresh: () => void) {
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );
}
