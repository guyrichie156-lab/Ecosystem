import { useLocalSearchParams } from "expo-router";
import { CustomFoodScreen, dayMealQuery } from "@ecosystem/food";

const num = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) : undefined);

/** Optional prefill from a barcode scan: barcode, name, brand and per-100 g values. */
export default function CustomFoodRoute() {
  const p = useLocalSearchParams<{
    day?: string;
    meal?: string;
    barcode?: string;
    name?: string;
    brand?: string;
    kcal?: string;
    protein?: string;
    fat?: string;
    carbs?: string;
  }>();
  return (
    <CustomFoodScreen
      query={dayMealQuery(p.day ?? "", p.meal)}
      prefill={{
        barcode: p.barcode,
        name: p.name,
        brand: p.brand,
        kcal: num(p.kcal),
        protein: num(p.protein),
        fat: num(p.fat),
        carbs: num(p.carbs),
      }}
    />
  );
}
