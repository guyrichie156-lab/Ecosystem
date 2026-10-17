import { Stack, type ErrorBoundaryProps } from "expo-router";
import { ModuleErrorFallback, ModuleGate } from "@ecosystem/core";
import { financeModule } from "@ecosystem/finance";

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ModuleErrorFallback module={financeModule} {...props} />;
}

export default function FinanceLayout() {
  return (
    <ModuleGate module={financeModule}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "Финансы" }} />
        <Stack.Screen name="accounts" options={{ title: "Счета" }} />
        <Stack.Screen name="budgets" options={{ title: "Бюджеты" }} />
        <Stack.Screen
          name="add-transaction"
          options={{ title: "Новая транзакция", presentation: "modal" }}
        />
      </Stack>
    </ModuleGate>
  );
}
