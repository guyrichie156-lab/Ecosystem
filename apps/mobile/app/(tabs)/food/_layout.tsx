import { Stack, type ErrorBoundaryProps } from "expo-router";
import { ModuleErrorFallback } from "@ecosystem/core";
import { foodModule } from "@ecosystem/food";

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ModuleErrorFallback module={foodModule} {...props} />;
}

export default function FoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Еда" }} />
      <Stack.Screen name="add" options={{ title: "Добавить еду" }} />
      <Stack.Screen name="portion/[id]" options={{ title: "Порция" }} />
      <Stack.Screen name="entry/[id]" options={{ title: "Запись" }} />
      <Stack.Screen name="scan" options={{ title: "Штрих-код" }} />
      <Stack.Screen name="custom" options={{ title: "Свой продукт" }} />
      <Stack.Screen name="norm" options={{ title: "Норма калорий" }} />
    </Stack>
  );
}
