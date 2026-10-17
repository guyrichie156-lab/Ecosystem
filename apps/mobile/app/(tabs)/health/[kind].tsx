import { Stack, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { BODY_MEASUREMENT_KINDS, KIND_INFO, MeasurementDetailScreen, type BodyMeasurementKind } from "@ecosystem/health";

function isKind(value: string | undefined): value is BodyMeasurementKind {
  return BODY_MEASUREMENT_KINDS.includes(value as BodyMeasurementKind);
}

export default function MeasurementDetailRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  if (!isKind(kind)) return <Text style={{ padding: 20 }}>Неизвестная зона замера.</Text>;
  return (
    <>
      <Stack.Screen options={{ title: KIND_INFO[kind].label }} />
      <MeasurementDetailScreen kind={kind} />
    </>
  );
}
