import { useLocalSearchParams } from "expo-router";
import { AddFoodScreen, isMeal } from "@ecosystem/food";

export default function AddFoodRoute() {
  const { day, meal } = useLocalSearchParams<{ day?: string; meal?: string }>();
  return <AddFoodScreen day={day ?? ""} meal={isMeal(meal) ? meal : undefined} />;
}
