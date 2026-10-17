import { useLocalSearchParams } from "expo-router";
import { EditTransactionScreen } from "@ecosystem/finance";

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTransactionScreen transactionId={Number(id)} />;
}
