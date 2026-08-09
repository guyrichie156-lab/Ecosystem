import { Stack } from "expo-router";

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Финансы" }} />
      <Stack.Screen name="accounts" options={{ title: "Счета" }} />
      <Stack.Screen name="budgets" options={{ title: "Бюджеты" }} />
      <Stack.Screen
        name="add-transaction"
        options={{ title: "Новая транзакция", presentation: "modal" }}
      />
    </Stack>
  );
}
