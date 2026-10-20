import { useLocalSearchParams } from "expo-router";
import { EntryScreen } from "@ecosystem/food";

export default function EntryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EntryScreen entryId={Number(id)} />;
}
