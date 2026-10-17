/** The only currency the app works in: Belarusian rubles (ISO 4217 code BYN). */
export const APP_CURRENCY = "BYN";

/** Formats an integer amount in minor units (e.g. kopecks) as a display string, e.g. 150050 -> "1 500,50 BYN". */
export function formatMinorUnits(minorUnits: number, currency: string = APP_CURRENCY): string {
  const major = minorUnits / 100;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${formatted} ${symbol}`;
}

/**
 * Parses a user-typed amount (e.g. "1500,50", "1 500.50") into integer minor units, or null if it isn't a number.
 * Spaces between digit groups are allowed. Negative values ("-500", "−500") only with `allowNegative`,
 * e.g. for the starting balance of a credit card.
 */
export function parseMinorUnits(input: string, { allowNegative = false } = {}): number | null {
  const normalized = input
    .replace(/[\s  ]/g, "")
    .replace("−", "-")
    .replace(",", ".");
  const pattern = allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/;
  if (!pattern.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}
