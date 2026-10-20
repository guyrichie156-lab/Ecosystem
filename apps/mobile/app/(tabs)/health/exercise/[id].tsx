import { useLocalSearchParams } from "expo-router";
import { ExerciseDetailScreen } from "@ecosystem/health";

export default function ExerciseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExerciseDetailScreen exerciseId={id} />;
}
