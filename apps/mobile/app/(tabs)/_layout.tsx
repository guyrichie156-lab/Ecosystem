import { Text } from "react-native";
import { Tabs } from "expo-router";
import { useEnabledModuleIds } from "@ecosystem/core";
import { appModules } from "../../modules";

const moduleIds = appModules.map((module) => module.id);

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

export default function TabsLayout() {
  const enabledIds = useEnabledModuleIds(moduleIds);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      {appModules.map((module) => (
        <Tabs.Screen
          key={module.id}
          name={module.id}
          options={{
            title: module.title,
            href: enabledIds.includes(module.id) ? undefined : null,
            tabBarIcon: ({ focused }) => <TabIcon icon={module.icon} focused={focused} />,
          }}
        />
      ))}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Настройки",
          headerShown: true,
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
