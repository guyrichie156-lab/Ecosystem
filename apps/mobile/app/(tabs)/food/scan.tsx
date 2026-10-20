import { useLocalSearchParams } from "expo-router";
import { ScanScreen, dayMealQuery } from "@ecosystem/food";

export default function ScanRoute() {
  const { day, meal } = useLocalSearchParams<{ day?: string; meal?: string }>();
  return <ScanScreen query={dayMealQuery(day ?? "", meal)} />;
}
