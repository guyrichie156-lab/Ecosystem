import { useLocalSearchParams } from "expo-router";
import { TemplateEditorScreen } from "@ecosystem/health";

/** `/health/template/new` creates a workout template; `/health/template/<id>` edits one. */
export default function TemplateRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TemplateEditorScreen templateId={id === "new" ? null : Number(id)} />;
}
