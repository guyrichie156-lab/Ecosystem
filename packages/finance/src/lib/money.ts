/** Formats an integer amount in minor units (e.g. kopecks) as a display string, e.g. 150050 -> "1 500,50 ₽". */
export function formatMinorUnits(minorUnits: number, currency: string): string {
  const major = minorUnits / 100;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
  const symbol = currency === "RUB" ? "₽" : currency;
  return `${formatted} ${symbol}`;
}

/** Parses a user-typed amount string (e.g. "1500,50" or "1500.50") into integer minor units. */
export function parseMinorUnits(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}
