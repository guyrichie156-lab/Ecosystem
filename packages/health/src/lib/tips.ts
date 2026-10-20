
/**
 * Tips for training and weight: the general ones always, the weight-loss pace once there are
 * weigh-ins. Every fact a tip states comes from the source it links to; see notes/health-module.md
 * for how each source was checked.
 * Pure function (no database, no UI) so the rules can be unit-tested.
 */

export type TipSource = { label: string; url: string };

export type Tip = {
  id: string;
  title: string;
  text: string;
  /** Shown first, with an "Обратите внимание" marker. */
  attention: boolean;
  source?: TipSource;
};

export const TIP_SOURCES = {
  nhsWeightLoss: {
    label: "NHS: Overweight and obesity",
    url: "https://www.nhs.uk/conditions/overweight-and-obesity/",
  },
  abdominalExerciseStudy: {
    label: "Vispute и др., J Strength Cond Res, 2011",
    url: "https://pubmed.ncbi.nlm.nih.gov/21804427/",
  },
  whoActivity: {
    label: "ВОЗ: рекомендации по физической активности (2020)",
    url: "https://iris.who.int/server/api/core/bitstreams/f3885485-e7eb-4504-8026-edd9bb53a6ee/content",
  },
  acsmRest: {
    label: "ACSM, Garber и др., 2011 — по пересказу Medical News Today",
    url: "https://www.medicalnewstoday.com/releases/229871",
  },
} satisfies Record<string, TipSource>;

export type TipInput = {
  /** Weight measurements, oldest first. */
  weightSeries: { value: number; measuredAt: number }[];
};

const DAY = 24 * 60 * 60 * 1000;
const decimal = (n: number, digits = 1) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Weekly weight change over the last 4 weeks, if two weigh-ins at least a week apart exist. */
export function weeklyWeightChangeKg(series: TipInput["weightSeries"]): number | null {
  const last = series[series.length - 1];
  if (!last) return null;
  const start = series.find((p) => p.measuredAt >= last.measuredAt - 28 * DAY && last.measuredAt - p.measuredAt >= 7 * DAY);
  if (!start) return null;
  const weeks = (last.measuredAt - start.measuredAt) / (7 * DAY);
  return (last.value - start.value) / 1000 / weeks;
}

function weightRateTip(series: TipInput["weightSeries"]): Tip | null {
  const perWeek = weeklyWeightChangeKg(series);
  if (perWeek === null || perWeek > -0.5) return null;
  const shown = decimal(Math.abs(perWeek));
  const source = TIP_SOURCES.nhsWeightLoss;
  if (perWeek < -1) {
    return {
      id: "weight-rate",
      attention: true,
      title: `Вес снижается на ${shown} кг в неделю`,
      text: "Это быстрее, чем советует NHS: снижать вес постепенно, на 0,5–1 кг в неделю.",
      source,
    };
  }
  return {
    id: "weight-rate",
    attention: false,
    title: `Вес снижается на ${shown} кг в неделю`,
    text: "Это в пределах темпа, который советует NHS: 0,5–1 кг в неделю.",
    source,
  };
}

const GENERAL_TIPS: Tip[] = [
  {
    id: "strength",
    attention: false,
    title: "Силовые — 2 дня в неделю или больше",
    text: "ВОЗ советует взрослым силовые упражнения умеренной или большей интенсивности на все основные группы мышц 2 дня в неделю или больше.",
    source: TIP_SOURCES.whoActivity,
  },
  {
    id: "activity",
    attention: false,
    title: "Сколько двигаться",
    text: "ВОЗ рекомендует взрослым 150–300 минут умеренной или 75–150 минут интенсивной аэробной активности в неделю.",
    source: TIP_SOURCES.whoActivity,
  },
  {
    id: "rest",
    attention: false,
    title: "Отдых между тренировками одной мышцы",
    text: "ACSM советует отдыхать не меньше 48 часов между силовыми тренировками одной группы мышц. По этому правилу считается вкладка «Отдых мышц»; часть исследователей считает, что полные 48 часов нужны не всегда.",
    source: TIP_SOURCES.acsmRest,
  },
  {
    id: "spot-reduction",
    attention: false,
    title: "Живот не уходит от одних упражнений на пресс",
    text: "В исследовании с 24 участниками 6 недель упражнений на пресс без изменения питания не уменьшили ни жир на животе, ни его обхват — выросла только выносливость мышц пресса.",
    source: TIP_SOURCES.abdominalExerciseStudy,
  },
];

export function getHealthTips({ weightSeries }: TipInput): Tip[] {
  const rate = weightRateTip(weightSeries);
  const tips = rate ? [rate, ...GENERAL_TIPS] : GENERAL_TIPS;
  // Attention first; otherwise keep the order above.
  return [...tips.filter((t) => t.attention), ...tips.filter((t) => !t.attention)];
}
