import type { AppModule } from "@ecosystem/core";
import { getHealthConnectStatus } from "./lib/healthConnect";
import { importFromHealthConnect } from "./lib/healthConnectSync";

export const healthModule: AppModule = {
  id: "health",
  title: "Здоровье",
  icon: "❤️",
  // In the background at every start: pull new weight and body fat if Health Connect is connected.
  // Elsewhere than Android the status is "unsupported" and nothing happens.
  onReady: async () => {
    if ((await getHealthConnectStatus()) === "connected") await importFromHealthConnect();
  },
};
