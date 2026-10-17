/**
 * Round tick values (1, 2 or 5 times a power of ten) covering [min, max].
 * `minStep` is the data's precision: a finer step would repeat labels (82,1 / 82,1).
 */
export function niceTicks(min: number, max: number, minStep = 0, count = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const rough = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const n = rough / power;
  const step = Math.max((n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power, minStep);
  // Integer indexes, not repeated `v += step`: float sums like 82 / 0.1 = 819.99… would add a tick.
  const first = Math.floor(min / step + 1e-9);
  const last = Math.ceil(max / step - 1e-9);
  const ticks: number[] = [];
  for (let i = first; i <= last; i++) ticks.push(Math.round(i * step * 1000) / 1000);
  return ticks;
}
