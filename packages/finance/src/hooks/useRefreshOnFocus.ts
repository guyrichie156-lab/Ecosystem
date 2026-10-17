import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Calls `refresh` every time the screen comes back into focus, e.g. after closing the
 * transaction form, so balances and lists are never stale. Skips the first focus,
 * because `useAsyncData` already loads on mount.
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
