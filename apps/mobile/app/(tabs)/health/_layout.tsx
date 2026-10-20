import { Stack, type ErrorBoundaryProps } from "expo-router";
import { ModuleErrorFallback } from "@ecosystem/core";
import { healthModule } from "@ecosystem/health";

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ModuleErrorFallback module={healthModule} {...props} />;
}

export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Здоровье" }} />
      <Stack.Screen name="profile" options={{ title: "Профиль" }} />
      <Stack.Screen name="add" options={{ title: "Взвешивание", presentation: "modal" }} />
      <Stack.Screen name="workout/[id]" options={{ title: "Тренировка" }} />
      <Stack.Screen name="template/[id]" options={{ title: "Комплекс", presentation: "modal" }} />
      <Stack.Screen name="exercise/[id]" options={{ title: "Упражнение" }} />
    </Stack>
  );
}
