import { Text } from "react-native";
import { Tabs } from "expo-router";
import { appModules } from "../../modules";

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      {appModules.map((module) => (
        <Tabs.Screen
          key={module.id}
          name={module.id}
          options={{
            title: module.title,
            tabBarIcon: ({ focused }) => <TabIcon icon={module.icon} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
