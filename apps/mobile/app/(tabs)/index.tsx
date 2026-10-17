import { Redirect } from "expo-router";
import { appModules } from "../../modules";

export default function TabsIndex() {
  return <Redirect href={`/${appModules[0].id}`} />;
}
