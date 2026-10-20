import { useLocalSearchParams } from "expo-router";
import { PortionScreen, isMeal } from "@ecosystem/food";

export default function PortionRoute() {
  const { id, day, meal } = useLocalSearchParams<{ id: string; day?: string; meal?: string }>();
  return <PortionScreen foodId={Number(id)} day={day ?? ""} meal={isMeal(meal) ? meal : undefined} />;
}
