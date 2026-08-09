import { db, categories } from "@ecosystem/db";

const DEFAULT_CATEGORIES: { name: string; kind: "income" | "expense" }[] = [
  { name: "Продукты", kind: "expense" },
  { name: "Транспорт", kind: "expense" },
  { name: "Жильё", kind: "expense" },
  { name: "Развлечения", kind: "expense" },
  { name: "Здоровье", kind: "expense" },
  { name: "Зарплата", kind: "income" },
  { name: "Другое", kind: "expense" },
];

/** Seeds a starter set of categories on first launch so the transaction form isn't empty. */
export async function seedDefaultCategoriesIfEmpty(): Promise<void> {
  const existing = await db.select().from(categories);
  if (existing.length > 0) return;
  await db.insert(categories).values(DEFAULT_CATEGORIES);
}
