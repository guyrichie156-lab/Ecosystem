import type { AppModule } from "@ecosystem/core";
import { seedBaseFoods } from "./lib/foods";

export const foodModule: AppModule = {
  id: "food",
  title: "Еда",
  icon: "🍽️",
  // The built-in foods must be there before «Добавить» searches them; adds only the missing ones.
  prepare: seedBaseFoods,
};
