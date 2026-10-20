import { and, asc, desc, eq, gte, inArray, lt, max } from "drizzle-orm";
import { db, foodEntries, foods } from "@ecosystem/db";
import { BASE_FOODS } from "./baseFoods";
import { portion, type Meal, type Nutrients } from "./nutrition";

export type Food = typeof foods.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect & { name: string };

/** Adds the built-in foods that are missing (all of them on the first start); quick when none are. */
export async function seedBaseFoods(): Promise<void> {
  const present = new Set(
    (await db.select({ key: foods.baseKey }).from(foods).where(eq(foods.source, "base"))).map((r) => r.key)
  );
  const missing = BASE_FOODS.filter((f) => !present.has(f.key));
  if (missing.length === 0) return;
  await db.insert(foods).values(
    missing.map(({ key, name, kcal, protein, fat, carbs }) => ({ baseKey: key, name, kcal, protein, fat, carbs, source: "base" as const }))
  );
}

/** Foods whose name or brand contains every typed word; case and «ё» don't matter. */
export async function searchFoods(query: string, limit = 50): Promise<Food[]> {
  const words = query.toLowerCase().replace(/ё/g, "е").split(/\s+/).filter(Boolean);
  // SQLite's lower() only folds ASCII, so the comparison is done here, on a small table.
  const all = await db.select().from(foods).orderBy(asc(foods.name));
  const normalize = (s: string | null) => (s ?? "").toLowerCase().replace(/ё/g, "е");
  return all.filter((f) => words.every((w) => normalize(f.name).includes(w) || normalize(f.brand).includes(w))).slice(0, limit);
}

/** Foods eaten most recently, each once. */
export async function getRecentFoods(limit = 10): Promise<Food[]> {
  const recent = await db
    .select({ foodId: foodEntries.foodId, last: max(foodEntries.eatenAt) })
    .from(foodEntries)
    .groupBy(foodEntries.foodId)
    .orderBy(desc(max(foodEntries.eatenAt)))
    .limit(limit);
  if (recent.length === 0) return [];
  const rows = await db.select().from(foods).where(inArray(foods.id, recent.map((r) => r.foodId)));
  const byId = new Map(rows.map((f) => [f.id, f]));
  return recent.map((r) => byId.get(r.foodId)).filter((f): f is Food => !!f);
}

export async function getFood(id: number): Promise<Food | null> {
  const [row] = await db.select().from(foods).where(eq(foods.id, id));
  return row ?? null;
}

export async function findFoodByBarcode(barcode: string): Promise<Food | null> {
  const [row] = await db.select().from(foods).where(eq(foods.barcode, barcode));
  return row ?? null;
}

/** Saves a food typed in by the user or found by its barcode; returns its id. */
export async function saveFood(input: {
  name: string;
  brand?: string | null;
  barcode?: string | null;
  source: "off" | "custom";
  per100g: Nutrients;
}): Promise<number> {
  const [row] = await db
    .insert(foods)
    .values({ name: input.name, brand: input.brand ?? null, barcode: input.barcode ?? null, source: input.source, ...input.per100g })
    .returning({ id: foods.id });
  return row.id;
}

/** Saves what was eaten: the portion's kcal and macros are computed now and kept. */
export async function addEntry(input: { food: Food; grams: number; meal: Meal; eatenAt: number }): Promise<void> {
  await db.insert(foodEntries).values({
    foodId: input.food.id,
    grams: input.grams,
    meal: input.meal,
    eatenAt: input.eatenAt,
    ...portion(input.food, input.grams),
  });
}

export async function updateEntry(id: number, input: { food: Food; grams: number; meal: Meal }): Promise<void> {
  await db
    .update(foodEntries)
    .set({ grams: input.grams, meal: input.meal, ...portion(input.food, input.grams) })
    .where(eq(foodEntries.id, id));
}

export async function deleteEntry(id: number): Promise<void> {
  await db.delete(foodEntries).where(eq(foodEntries.id, id));
}

export async function getEntry(id: number): Promise<(FoodEntry & { food: Food }) | null> {
  const [row] = await db
    .select({ entry: foodEntries, food: foods })
    .from(foodEntries)
    .innerJoin(foods, eq(foods.id, foodEntries.foodId))
    .where(eq(foodEntries.id, id));
  return row ? { ...row.entry, name: row.food.name, food: row.food } : null;
}

/** Entries eaten from `start` (inclusive) to `end` (exclusive), oldest first. */
export async function getEntriesBetween(start: number, end: number): Promise<FoodEntry[]> {
  const rows = await db
    .select({ entry: foodEntries, name: foods.name })
    .from(foodEntries)
    .innerJoin(foods, eq(foods.id, foodEntries.foodId))
    .where(and(gte(foodEntries.eatenAt, start), lt(foodEntries.eatenAt, end)))
    .orderBy(asc(foodEntries.eatenAt), asc(foodEntries.id));
  return rows.map((r) => ({ ...r.entry, name: r.name }));
}
