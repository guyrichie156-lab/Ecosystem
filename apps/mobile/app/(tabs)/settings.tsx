import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { setModuleEnabled, useModuleEnabled, type AppModule } from "@ecosystem/core";
import { appModules } from "../../modules";

function ModuleRow({ module }: { module: AppModule }) {
  const enabled = useModuleEnabled(module.id);
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{module.icon}</Text>
      <View style={styles.rowText}>
        <Text style={styles.title}>{module.title}</Text>
        <Text style={styles.description}>{module.description}</Text>
      </View>
      <Switch value={enabled} onValueChange={(value) => setModuleEnabled(module.id, value)} />
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Модули</Text>
      {appModules.map((module) => (
        <ModuleRow key={module.id} module={module} />
      ))}
      <Text style={styles.hint}>
        Выключенный модуль пропадает из меню и не запускается. Данные модуля сохраняются.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, color: "#1c1c1e" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d1d6",
  },
  icon: { fontSize: 24, marginRight: 12 },
  rowText: { flex: 1 },
  title: { fontSize: 16, color: "#1c1c1e" },
  description: { fontSize: 13, color: "#8e8e93", marginTop: 2 },
  hint: { fontSize: 13, color: "#8e8e93", marginTop: 16 },
});
