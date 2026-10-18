import { db, categories } from "@ecosystem/db";

// The same icons as migration 0005, which adds them to categories created before it.
const DEFAULT_CATEGORIES: { name: string; kind: "income" | "expense"; icon: string }[] = [
  { name: "Продукты", kind: "expense", icon: "🛒" },
  { name: "Транспорт", kind: "expense", icon: "🚌" },
  { name: "Жильё", kind: "expense", icon: "🏠" },
  { name: "Развлечения", kind: "expense", icon: "🎉" },
  { name: "Здоровье", kind: "expense", icon: "💊" },
  { name: "Зарплата", kind: "income", icon: "💼" },
  { name: "Другое", kind: "expense", icon: "📦" },
];

/** Seeds a starter set of categories on first launch so the transaction form isn't empty. */
export async function seedDefaultCategoriesIfEmpty(): Promise<void> {
  const existing = await db.select().from(categories);
  if (existing.length > 0) return;
  await db.insert(categories).values(DEFAULT_CATEGORIES);
}
