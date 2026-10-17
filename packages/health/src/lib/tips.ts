import type { LatestMeasurement } from "./measurements";
import type { HealthProfile } from "./profile";

/**
 * Rule-based tips from the user's own measurements. Every fact a tip states comes from the
 * source it links to; see notes/health-module.md for how each source was checked.
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
  /** The tip asks the user to fill in their profile. */
  action?: "profile";
};

export const TIP_SOURCES = {
  niceWaistToHeight: {
    label: "NICE, стандарт качества QS212 (2025)",
    url: "https://www.nice.org.uk/guidance/qs212/chapter/Quality-statement-1-Recording-BMI-and-waist-to-height-ratio-in-adults",
  },
  wcrfWaist: {
    label: "World Cancer Research Fund UK: как измерить талию",
    url: "https://www.wcrf.org/uk/here-help/health-tools/how-measure-your-waist",
  },
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
} satisfies Record<string, TipSource>;

export type TipInput = {
  latest: LatestMeasurement[];
  /** Weight measurements, oldest first. */
  weightSeries: { value: number; measuredAt: number }[];
  profile: HealthProfile;
};

const DAY = 24 * 60 * 60 * 1000;
const decimal = (n: number, digits = 1) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function waistToHeightTip(waistMm: number, heightMm: number, weightGrams: number | undefined): Tip | null {
  // NICE uses the ratio only for adults with BMI below 35.
  if (weightGrams !== undefined) {
    const heightM = heightMm / 1000;
    const bmi = weightGrams / 1000 / (heightM * heightM);
    if (bmi >= 35) return null;
  }
  const ratio = waistMm / heightMm;
  const shown = decimal(ratio, 2);
  const source = TIP_SOURCES.niceWaistToHeight;
  if (ratio >= 0.6) {
    return {
      id: "whtr",
      attention: true,
      title: `Талия к росту: ${shown}`,
      text: "По шкале NICE 0,6 и выше — дальнейшее повышение рисков для здоровья. Здоровый диапазон — 0,4–0,49.",
      source,
    };
  }
  if (ratio >= 0.5) {
    return {
      id: "whtr",
      attention: true,
      title: `Талия к росту: ${shown}`,
      text: "По шкале NICE 0,5–0,59 — повышенный риск. Здоровый диапазон — 0,4–0,49, то есть талия меньше половины роста.",
      source,
    };
  }
  if (ratio >= 0.4) {
    return {
      id: "whtr",
      attention: false,
      title: `Талия к росту: ${shown}`,
      text: "Это здоровый диапазон по шкале NICE: 0,4–0,49.",
      source,
    };
  }
  return null;
}

function waistBySexTip(waistMm: number, sex: "male" | "female"): Tip | null {
  const limitCm = sex === "male" ? 94 : 80;
  if (waistMm < limitCm * 10) return null;
  return {
    id: "waist-sex",
    attention: true,
    title: `Талия ${decimal(waistMm / 10)} см`,
    text: `World Cancer Research Fund считает здоровой талию меньше ${limitCm} см для ${
      sex === "male" ? "мужчин" : "женщин"
    } (для азиатских популяций ориентиры могут быть другими). Укажите рост — тогда приложение посчитает и отношение талии к росту по шкале NICE.`,
    source: TIP_SOURCES.wcrfWaist,
  };
}

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

const grew = (m: LatestMeasurement | undefined) => !!m && m.previous !== null && m.value > m.previous;

export function getHealthTips({ latest, weightSeries, profile }: TipInput): Tip[] {
  const byKind = new Map(latest.map((m) => [m.kind, m]));
  const waist = byKind.get("waist");
  const tips: Tip[] = [];

  if (waist && profile.heightMm) {
    const tip = waistToHeightTip(waist.value, profile.heightMm, byKind.get("weight")?.value);
    if (tip) tips.push(tip);
  } else if (waist && profile.sex) {
    const tip = waistBySexTip(waist.value, profile.sex);
    if (tip) tips.push(tip);
  }

  const rate = weightRateTip(weightSeries);
  if (rate) tips.push(rate);

  if (grew(waist)) {
    tips.push({
      id: "spot-reduction",
      attention: false,
      title: "Живот не уходит от одних упражнений на пресс",
      text: "В исследовании с 24 участниками 6 недель упражнений на пресс без изменения питания не уменьшили ни жир на животе, ни его обхват — выросла только выносливость мышц пресса.",
      source: TIP_SOURCES.abdominalExerciseStudy,
    });
  }

  // While waist is new to the user (fewer than 3 measurements), remind how to measure.
  const waistCount = waist?.count ?? 0;
  if (waistCount > 0 && waistCount < 3) {
    tips.push({
      id: "how-to-measure",
      attention: false,
      title: "Как мерить талию",
      text: "Лента — посередине между нижним ребром и верхом тазовой кости, ровно и плотно, но не впиваясь. Замер — после обычного выдоха, не втягивая живот.",
      source: TIP_SOURCES.wcrfWaist,
    });
  }

  if (waist && !profile.heightMm) {
    tips.push({
      id: "profile",
      attention: false,
      title: "Укажите рост",
      text: "С ростом приложение посчитает отношение талии к росту — показатель, которым пользуется NICE.",
      action: "profile",
    });
  }

  tips.push({
    id: "activity",
    attention: false,
    title: "Сколько двигаться",
    text: "ВОЗ рекомендует взрослым 150–300 минут умеренной или 75–150 минут интенсивной аэробной активности в неделю, а ещё силовые упражнения на все основные группы мышц — 2 дня в неделю или больше.",
    source: TIP_SOURCES.whoActivity,
  });

  // Attention first; otherwise keep the order above.
  return [...tips.filter((t) => t.attention), ...tips.filter((t) => !t.attention)];
}
