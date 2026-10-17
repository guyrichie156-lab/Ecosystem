import type { AppModule } from "@ecosystem/core";
import { ensureNotificationPermission } from "./lib/notifications";
import { seedDefaultCategoriesIfEmpty } from "./seed";

export const financeModule: AppModule = {
  id: "finance",
  title: "Финансы",
  icon: "💰",
  description: "Счета, транзакции, бюджеты",
  onReady: async () => {
    await seedDefaultCategoriesIfEmpty();
    await ensureNotificationPermission();
  },
};
