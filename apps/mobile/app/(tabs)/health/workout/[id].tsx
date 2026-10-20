import { useLocalSearchParams } from "expo-router";
import { WorkoutSessionScreen } from "@ecosystem/health";

export default function WorkoutRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkoutSessionScreen workoutId={Number(id)} />;
}
