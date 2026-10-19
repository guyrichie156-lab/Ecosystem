import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Loads data with `fetcher` on mount and whenever `deps` change.
 * - `loading`: true while data for new `deps` is on its way (first load, another month).
 * - `refresh()`: reloads quietly, e.g. when a screen comes back after a form, with no spinner.
 * - `refreshing` and `pullToRefresh()`: for a RefreshControl, the spinner the user asked for.
 * A failed load is thrown during the next render, so the module's ErrorBoundary shows it with
 * «Перезапустить модуль»: error boundaries don't catch errors in async code on their own
 * (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const quiet = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (quiet.current) quiet.current = false;
    else setLoading(true);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refresh = useCallback(() => {
    quiet.current = true;
    setTick((t) => t + 1);
  }, []);
  const pullToRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
  }, [refresh]);

  if (error) throw error;
  return { data, loading, refreshing, refresh, pullToRefresh };
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
