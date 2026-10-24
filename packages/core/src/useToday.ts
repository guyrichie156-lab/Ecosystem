import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

const pad = (n: number) => String(n).padStart(2, "0");
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * Today's date at local midnight. Tabs stay mounted and Android keeps the app in memory overnight,
 * so this is checked again at midnight, when the screen comes into focus and when the app comes back
 * to the foreground; a screen showing «today» then moves on to the new day.
 */
export function useToday(): Date {
  const [key, setKey] = useState(todayKey);
  const check = useCallback(() => setKey(todayKey()), []);

  useFocusEffect(check);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, [check]);
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(check, midnight.getTime() - now.getTime() + 1000);
    return () => clearTimeout(timer);
  }, [key, check]);

  return useMemo(() => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [key]);
}
