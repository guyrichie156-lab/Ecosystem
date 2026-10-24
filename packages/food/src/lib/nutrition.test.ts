import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_FOODS } from "./baseFoods";
import {
  activityFactor,
  formatTenths,
  mealAt,
  parseAmount,
  parseOffProduct,
  portion,
  restingKcal,
  sumNutrients,
} from "./nutrition";

test("a portion scales the per-100 g values and rounds to whole units", () => {
  // Cooked buckwheat per 100 g (USDA SR28 20010): 92 kcal, 3.4 g protein, 0.6 g fat, 19.9 g carbs.
  const per100g = { kcal: 92, protein: 34, fat: 6, carbs: 199 };
  assert.deepEqual(portion(per100g, 150), { kcal: 138, protein: 51, fat: 9, carbs: 299 });
  assert.deepEqual(portion(per100g, 0), { kcal: 0, protein: 0, fat: 0, carbs: 0 });
});

test("day totals add every entry", () => {
  const total = sumNutrients([
    { kcal: 138, protein: 51, fat: 9, carbs: 299 },
    { kcal: 155, protein: 126, fat: 106, carbs: 11 },
  ]);
  assert.deepEqual(total, { kcal: 293, protein: 177, fat: 115, carbs: 310 });
  assert.equal(formatTenths(total.protein), "17,7");
});

test("Mifflin–St Jeor: 10 × kg + 6.25 × cm − 5 × years, +5 for men, −161 for women", () => {
  // 10 × 80 + 6.25 × 180 − 5 × 30 = 800 + 1125 − 150 = 1775; + 5 = 1780, − 161 = 1614
  assert.equal(restingKcal({ weightKg: 80, heightCm: 180, age: 30, sex: "male" }), 1780);
  assert.equal(restingKcal({ weightKg: 80, heightCm: 180, age: 30, sex: "female" }), 1614);
  assert.equal(activityFactor("light"), 1.55);
});

test("amounts are typed with a comma and kept as integers", () => {
  assert.equal(parseAmount("150", 5000), 150);
  assert.equal(parseAmount("12,5", 100, 10), 125);
  assert.equal(parseAmount("", 100), null);
  assert.equal(parseAmount("abc", 100), undefined);
  assert.equal(parseAmount("101", 100), undefined);
});

test("the meal is guessed from the hour", () => {
  assert.equal(mealAt(new Date(2026, 9, 20, 8)), "breakfast");
  assert.equal(mealAt(new Date(2026, 9, 20, 13)), "lunch");
  assert.equal(mealAt(new Date(2026, 9, 20, 19)), "dinner");
  assert.equal(mealAt(new Date(2026, 9, 20, 23)), "snack");
});

test("an Open Food Facts answer is read per 100 g; kJ is turned into kcal", () => {
  const found = parseOffProduct({
    status: 1,
    product: {
      product_name: "Test bar",
      product_name_ru: "Батончик",
      brands: "Brand A, Brand B",
      nutriments: { "energy-kj_100g": 2092, proteins_100g: 7.25, fat_100g: 20, carbohydrates_100g: 60.04 },
    },
  });
  assert.deepEqual(found, {
    found: true,
    name: "Батончик",
    brand: "Brand A",
    per100g: { kcal: 500, protein: 73, fat: 200, carbs: 600 },
    complete: true,
  });
});

test("a product without some values, or with impossible ones, is found but incomplete; status 0 is not found", () => {
  const partial = parseOffProduct({ status: 1, product: { product_name: "Сок", nutriments: { "energy-kcal_100g": 45 } } });
  assert.equal(partial.found, true);
  assert.equal(partial.found && partial.complete, false);
  assert.equal(partial.found && partial.per100g.kcal, 45);
  const implausible = parseOffProduct({
    status: 1,
    product: { product_name: "Масло", nutriments: { "energy-kcal_100g": 3700, proteins_100g: 0, fat_100g: 99, carbohydrates_100g: 0 } },
  });
  assert.equal(implausible.found && implausible.complete, false, "over 900 kcal per 100 g is checked against the label");
  assert.deepEqual(parseOffProduct({ status: 0, status_verbose: "product not found" }), { found: false });
  assert.deepEqual(parseOffProduct(null), { found: false });
});

test("the built-in foods have unique keys and plausible energy for their macros", () => {
  assert.equal(new Set(BASE_FOODS.map((f) => f.key)).size, BASE_FOODS.length);
  for (const f of BASE_FOODS) {
    // Atwater's general factors (4/9/4 kcal per gram) only approximate the table's own energy
    // values, so this checks for typos, not precision.
    const estimate = (4 * f.protein + 9 * f.fat + 4 * f.carbs) / 10;
    assert.ok(Math.abs(estimate - f.kcal) <= Math.max(25, f.kcal * 0.2), `${f.name}: ${f.kcal} vs ${estimate}`);
  }
});
