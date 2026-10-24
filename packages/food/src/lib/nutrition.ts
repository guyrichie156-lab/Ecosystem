/**
 * Pure food arithmetic (no database, no UI), so it can be unit-tested.
 * Units everywhere: kcal as whole numbers; protein, fat and carbohydrates in tenths of a gram.
 */

export type Nutrients = { kcal: number; protein: number; fat: number; carbs: number };

export const NO_NUTRIENTS: Nutrients = { kcal: 0, protein: 0, fat: 0, carbs: 0 };

/** A portion of a food given per 100 g. */
export function portion(per100g: Nutrients, grams: number): Nutrients {
  const k = grams / 100;
  return {
    kcal: Math.round(per100g.kcal * k),
    protein: Math.round(per100g.protein * k),
    fat: Math.round(per100g.fat * k),
    carbs: Math.round(per100g.carbs * k),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(
    (sum, n) => ({
      kcal: sum.kcal + n.kcal,
      protein: sum.protein + n.protein,
      fat: sum.fat + n.fat,
      carbs: sum.carbs + n.carbs,
    }),
    NO_NUTRIENTS
  );
}

const oneDecimal = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** Tenths of a gram -> "12,5". */
export function formatTenths(tenths: number): string {
  return oneDecimal.format(tenths / 10);
}

/** "1 250" with the Russian thousands separator. */
export function formatKcal(kcal: number): string {
  return whole.format(kcal);
}

/**
 * A number typed by the user ("12,5"), as an integer in `scale` units per unit (10 for tenths);
 * null if empty, undefined if not a number or outside 0–max.
 */
export function parseAmount(text: string, max: number, scale = 1): number | null | undefined {
  const normalized = text.replace(",", ".").trim();
  if (normalized === "") return null;
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined;
  const value = parseFloat(normalized);
  if (value > max) return undefined;
  return Math.round(value * scale);
}

export type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export const MEALS: { id: Meal; label: string }[] = [
  { id: "breakfast", label: "Завтрак" },
  { id: "lunch", label: "Обед" },
  { id: "dinner", label: "Ужин" },
  { id: "snack", label: "Перекус" },
];

/** A first guess for the meal by the time of day; the user can change it. */
export function mealAt(date: Date): Meal {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 22) return "dinner";
  return "snack";
}

export type Sex = "male" | "female";

/**
 * Resting energy expenditure by the Mifflin–St Jeor equation (Am J Clin Nutr 1990;51:241–247):
 * 10 × weight (kg) + 6.25 × height (cm) − 5 × age (years) + 5 for men, − 161 for women.
 */
export function restingKcal({ weightKg, heightCm, age, sex }: { weightKg: number; heightCm: number; age: number; sex: Sex }): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

export type ActivityLevel = "light" | "moderate" | "vigorous";

/**
 * Lifestyle bands of the physical activity level (total energy ÷ basal energy) from the FAO/WHO/UNU
 * report «Human energy requirements» (2004), as given by secondary sources (Wikipedia, a 2001 draft
 * summary); the report itself could not be opened from the cloud. The factor is the middle of a band.
 */
export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; band: string; factor: number }[] = [
  { id: "light", label: "Сидячий или лёгкий образ жизни", band: "1,40–1,69", factor: 1.55 },
  { id: "moderate", label: "Активный или умеренно активный", band: "1,70–1,99", factor: 1.85 },
  { id: "vigorous", label: "Очень активный", band: "2,00–2,40", factor: 2.2 },
];

export function activityFactor(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((l) => l.id === level)!.factor;
}

export type OffLookup =
  | { found: false }
  | {
      found: true;
      name: string;
      brand: string | null;
      /** Per 100 g; a value Open Food Facts doesn't have is missing. */
      per100g: Partial<Nutrients>;
      complete: boolean;
    };

/** The most per 100 g the label form accepts (CustomFoodScreen): 900 kcal, 100 g of each nutrient. */
const PER_100G_MAX: Nutrients = { kcal: 900, protein: 1000, fat: 1000, carbs: 1000 };

/** kJ -> kcal: 1 kcal = 4.184 kJ (the thermochemical calorie). */
const KJ_PER_KCAL = 4.184;

const nonNegative = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;

/**
 * Reads a product from an Open Food Facts API v2 answer (`GET /api/v2/product/{code}`): `status` 1 means
 * found; per-100 g values are `energy-kcal_100g` (or kJ in `energy-kj_100g`), `proteins_100g`, `fat_100g`
 * and `carbohydrates_100g` (available carbohydrates, without fibre), per the API docs.
 */
export function parseOffProduct(answer: unknown): OffLookup {
  const body = answer as { status?: unknown; product?: Record<string, unknown> } | null;
  if (!body || body.status !== 1 || !body.product) return { found: false };
  const product = body.product;
  const n = (product.nutriments ?? {}) as Record<string, unknown>;
  const kj = nonNegative(n["energy-kj_100g"]) ?? nonNegative(n["energy_100g"]);
  const kcal = nonNegative(n["energy-kcal_100g"]) ?? (kj !== undefined ? kj / KJ_PER_KCAL : undefined);
  const tenths = (key: string) => {
    const value = nonNegative(n[key]);
    return value === undefined ? undefined : Math.round(value * 10);
  };
  const per100g: Partial<Nutrients> = {
    kcal: kcal === undefined ? undefined : Math.round(kcal),
    protein: tenths("proteins_100g"),
    fat: tenths("fat_100g"),
    carbs: tenths("carbohydrates_100g"),
  };
  const name = [product.product_name_ru, product.product_name].find((v): v is string => typeof v === "string" && v.trim() !== "");
  const brand = typeof product.brands === "string" && product.brands.trim() ? product.brands.split(",")[0].trim() : null;
  // A value past the label form's limits is likely a mistake in the database (kJ typed as kcal, say):
  // such a product is not complete, so it opens in the form to be checked against the label.
  const complete =
    (Object.keys(PER_100G_MAX) as (keyof Nutrients)[]).every((key) => {
      const value = per100g[key];
      return value !== undefined && value <= PER_100G_MAX[key];
    }) && !!name;
  return { found: true, name: name?.trim() ?? "", brand, per100g, complete };
}
