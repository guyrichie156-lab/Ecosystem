import type { AppModule } from "@ecosystem/core";
import { configureNotifications, ensureNotificationPermission } from "./lib/notifications";
import { seedDefaultCategoriesIfEmpty } from "./seed";

export const financeModule: AppModule = {
  id: "finance",
  title: "Финансы",
  icon: "💰",
  // Categories must exist before the transaction and budget screens load them.
  prepare: seedDefaultCategoriesIfEmpty,
  onReady: async () => {
    configureNotifications();
    await ensureNotificationPermission();
  },
};
