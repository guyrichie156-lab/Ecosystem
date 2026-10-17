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
      <Stack.Screen name="add" options={{ title: "Новый замер", presentation: "modal" }} />
      <Stack.Screen name="profile" options={{ title: "Рост и пол", presentation: "modal" }} />
    </Stack>
  );
}
