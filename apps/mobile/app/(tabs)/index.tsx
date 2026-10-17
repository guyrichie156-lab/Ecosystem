import { Redirect } from "expo-router";
import { isModuleEnabled } from "@ecosystem/core";
import { appModules } from "../../modules";

export default function TabsIndex() {
  const first = appModules.find((module) => isModuleEnabled(module.id));
  return <Redirect href={first ? `/${first.id}` : "/settings"} />;
}
