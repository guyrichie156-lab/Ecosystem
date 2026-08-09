import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ title: "Финансы" }} />
    </Tabs>
  );
}
