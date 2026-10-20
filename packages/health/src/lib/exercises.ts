import type { Muscle } from "./muscles";

export type Equipment = "bodyweight" | "dumbbell" | "kettlebell" | "barbell" | "machine" | "other";

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: "Свой вес",
  dumbbell: "Гантели",
  kettlebell: "Гиря",
  barbell: "Штанга",
  machine: "Тренажёр или блок",
  other: "Другое",
};

export type Exercise = {
  id: string;
  name: string;
  /** Muscles the exercise mainly works; they count for recovery. */
  primary: Muscle[];
  /** Muscles that help. */
  secondary: Muscle[];
  equipment: Equipment;
  /** Plank is held for seconds; everything else is counted in repetitions. */
  unit?: "seconds";
  /** The exercise's id in free-exercise-db, where its muscles and equipment come from. */
  source: string;
};

/** Where an exercise's muscles and equipment can be checked. */
export function exerciseSourceUrl(exercise: Exercise): string {
  return `https://github.com/yuhonas/free-exercise-db/blob/main/exercises/${exercise.source}.json`;
}

/**
 * The exercise catalog. Muscles and equipment are facts taken from free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, public domain under the Unlicense, per its README);
 * its muscles are grouped as in muscles.ts ("lats" and "middle back" are both «Спина»).
 * Where the dataset gives no equipment, the exercise is done with body weight, as its name says.
 * Names are ours; the dataset's instructions and images are not used.
 */
export const EXERCISES: Exercise[] = [
  { id: "pushups", name: "Отжимания", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "bodyweight", source: "Pushups" },
  { id: "incline-push-up", name: "Отжимания с упором на возвышение", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "bodyweight", source: "Incline_Push-Up" },
  { id: "decline-push-up", name: "Отжимания с ногами на возвышении", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "bodyweight", source: "Decline_Push-Up" },
  { id: "dumbbell-bench-press", name: "Жим гантелей лёжа", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "dumbbell", source: "Dumbbell_Bench_Press" },
  { id: "barbell-bench-press-medium-grip", name: "Жим штанги лёжа", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "barbell", source: "Barbell_Bench_Press_-_Medium_Grip" },
  { id: "incline-dumbbell-press", name: "Жим гантелей на наклонной скамье", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "dumbbell", source: "Incline_Dumbbell_Press" },
  { id: "dumbbell-flyes", name: "Разведение гантелей лёжа", primary: ["chest"], secondary: [], equipment: "dumbbell", source: "Dumbbell_Flyes" },
  { id: "cable-crossover", name: "Сведение рук в кроссовере", primary: ["chest"], secondary: ["shoulders"], equipment: "machine", source: "Cable_Crossover" },
  { id: "butterfly", name: "Сведение рук в тренажёре («бабочка»)", primary: ["chest"], secondary: [], equipment: "machine", source: "Butterfly" },
  { id: "leverage-chest-press", name: "Жим от груди в тренажёре", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "machine", source: "Leverage_Chest_Press" },
  { id: "dips-chest-version", name: "Отжимания на брусьях с наклоном вперёд", primary: ["chest"], secondary: ["shoulders", "triceps"], equipment: "other", source: "Dips_-_Chest_Version" },
  { id: "pullups", name: "Подтягивания", primary: ["back"], secondary: ["biceps"], equipment: "bodyweight", source: "Pullups" },
  { id: "chin-up", name: "Подтягивания обратным хватом", primary: ["back"], secondary: ["biceps", "forearms"], equipment: "bodyweight", source: "Chin-Up" },
  { id: "wide-grip-lat-pulldown", name: "Тяга верхнего блока широким хватом", primary: ["back"], secondary: ["biceps", "shoulders"], equipment: "machine", source: "Wide-Grip_Lat_Pulldown" },
  { id: "seated-cable-rows", name: "Тяга нижнего блока сидя", primary: ["back"], secondary: ["biceps", "shoulders"], equipment: "machine", source: "Seated_Cable_Rows" },
  { id: "bent-over-barbell-row", name: "Тяга штанги в наклоне", primary: ["back"], secondary: ["biceps", "shoulders"], equipment: "barbell", source: "Bent_Over_Barbell_Row" },
  { id: "one-arm-dumbbell-row", name: "Тяга гантели одной рукой в наклоне", primary: ["back"], secondary: ["biceps", "shoulders"], equipment: "dumbbell", source: "One-Arm_Dumbbell_Row" },
  { id: "inverted-row", name: "Австралийские подтягивания", primary: ["back"], secondary: [], equipment: "bodyweight", source: "Inverted_Row" },
  { id: "barbell-deadlift", name: "Становая тяга", primary: ["lowerBack"], secondary: ["calves", "forearms", "glutes", "hamstrings", "back", "quads", "traps"], equipment: "barbell", source: "Barbell_Deadlift" },
  { id: "hyperextensions-back-extensions", name: "Гиперэкстензия", primary: ["lowerBack"], secondary: ["glutes", "hamstrings"], equipment: "other", source: "Hyperextensions_Back_Extensions" },
  { id: "standing-military-press", name: "Жим штанги стоя", primary: ["shoulders"], secondary: ["triceps"], equipment: "barbell", source: "Standing_Military_Press" },
  { id: "dumbbell-shoulder-press", name: "Жим гантелей над головой", primary: ["shoulders"], secondary: ["triceps"], equipment: "dumbbell", source: "Dumbbell_Shoulder_Press" },
  { id: "arnold-dumbbell-press", name: "Жим Арнольда", primary: ["shoulders"], secondary: ["triceps"], equipment: "dumbbell", source: "Arnold_Dumbbell_Press" },
  { id: "side-lateral-raise", name: "Махи гантелями в стороны", primary: ["shoulders"], secondary: [], equipment: "dumbbell", source: "Side_Lateral_Raise" },
  { id: "front-dumbbell-raise", name: "Подъём гантелей перед собой", primary: ["shoulders"], secondary: [], equipment: "dumbbell", source: "Front_Dumbbell_Raise" },
  { id: "reverse-flyes", name: "Разведение гантелей в наклоне", primary: ["shoulders"], secondary: [], equipment: "dumbbell", source: "Reverse_Flyes" },
  { id: "face-pull", name: "Тяга каната к лицу", primary: ["shoulders"], secondary: ["back"], equipment: "machine", source: "Face_Pull" },
  { id: "dumbbell-shrug", name: "Шраги с гантелями", primary: ["traps"], secondary: [], equipment: "dumbbell", source: "Dumbbell_Shrug" },
  { id: "barbell-curl", name: "Подъём штанги на бицепс", primary: ["biceps"], secondary: ["forearms"], equipment: "barbell", source: "Barbell_Curl" },
  { id: "dumbbell-bicep-curl", name: "Подъём гантелей на бицепс", primary: ["biceps"], secondary: ["forearms"], equipment: "dumbbell", source: "Dumbbell_Bicep_Curl" },
  { id: "hammer-curls", name: "Молотки", primary: ["biceps"], secondary: [], equipment: "dumbbell", source: "Hammer_Curls" },
  { id: "preacher-curl", name: "Сгибания на скамье Скотта", primary: ["biceps"], secondary: [], equipment: "barbell", source: "Preacher_Curl" },
  { id: "triceps-pushdown", name: "Разгибания рук на блоке", primary: ["triceps"], secondary: [], equipment: "machine", source: "Triceps_Pushdown" },
  { id: "dips-triceps-version", name: "Отжимания на брусьях", primary: ["triceps"], secondary: ["chest", "shoulders"], equipment: "bodyweight", source: "Dips_-_Triceps_Version" },
  { id: "close-grip-barbell-bench-press", name: "Жим штанги узким хватом", primary: ["triceps"], secondary: ["chest", "shoulders"], equipment: "barbell", source: "Close-Grip_Barbell_Bench_Press" },
  { id: "lying-triceps-press", name: "Французский жим лёжа", primary: ["triceps"], secondary: [], equipment: "barbell", source: "Lying_Triceps_Press" },
  { id: "standing-dumbbell-triceps-extension", name: "Разгибание гантели из-за головы", primary: ["triceps"], secondary: [], equipment: "dumbbell", source: "Standing_Dumbbell_Triceps_Extension" },
  { id: "bench-dips", name: "Обратные отжимания от скамьи", primary: ["triceps"], secondary: ["chest", "shoulders"], equipment: "bodyweight", source: "Bench_Dips" },
  { id: "push-ups-close-triceps-position", name: "Отжимания узким упором", primary: ["triceps"], secondary: ["chest", "shoulders"], equipment: "bodyweight", source: "Push-Ups_-_Close_Triceps_Position" },
  { id: "barbell-full-squat", name: "Приседания со штангой", primary: ["quads"], secondary: ["calves", "glutes", "hamstrings", "lowerBack"], equipment: "barbell", source: "Barbell_Full_Squat" },
  { id: "bodyweight-squat", name: "Приседания", primary: ["quads"], secondary: ["glutes", "hamstrings"], equipment: "bodyweight", source: "Bodyweight_Squat" },
  { id: "goblet-squat", name: "Гоблет-присед с гирей", primary: ["quads"], secondary: ["calves", "glutes", "hamstrings", "shoulders"], equipment: "kettlebell", source: "Goblet_Squat" },
  { id: "leg-press", name: "Жим ногами", primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "machine", source: "Leg_Press" },
  { id: "dumbbell-lunges", name: "Выпады с гантелями", primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "dumbbell", source: "Dumbbell_Lunges" },
  { id: "bodyweight-walking-lunge", name: "Выпады в ходьбе", primary: ["quads"], secondary: ["calves", "glutes", "hamstrings"], equipment: "bodyweight", source: "Bodyweight_Walking_Lunge" },
  { id: "split-squat-with-dumbbells", name: "Сплит-присед с гантелями", primary: ["quads"], secondary: ["glutes", "hamstrings"], equipment: "dumbbell", source: "Split_Squat_with_Dumbbells" },
  { id: "leg-extensions", name: "Разгибание ног в тренажёре", primary: ["quads"], secondary: [], equipment: "machine", source: "Leg_Extensions" },
  { id: "romanian-deadlift", name: "Румынская тяга", primary: ["hamstrings"], secondary: ["calves", "glutes", "lowerBack"], equipment: "barbell", source: "Romanian_Deadlift" },
  { id: "lying-leg-curls", name: "Сгибание ног лёжа в тренажёре", primary: ["hamstrings"], secondary: [], equipment: "machine", source: "Lying_Leg_Curls" },
  { id: "standing-calf-raises", name: "Подъём на носки стоя", primary: ["calves"], secondary: [], equipment: "machine", source: "Standing_Calf_Raises" },
  { id: "seated-calf-raise", name: "Подъём на носки сидя", primary: ["calves"], secondary: [], equipment: "machine", source: "Seated_Calf_Raise" },
  { id: "butt-lift-bridge", name: "Ягодичный мост", primary: ["glutes"], secondary: ["hamstrings"], equipment: "bodyweight", source: "Butt_Lift_Bridge" },
  { id: "barbell-hip-thrust", name: "Ягодичный мост со штангой", primary: ["glutes"], secondary: ["calves", "hamstrings"], equipment: "barbell", source: "Barbell_Hip_Thrust" },
  { id: "crunches", name: "Скручивания", primary: ["abs"], secondary: [], equipment: "bodyweight", source: "Crunches" },
  { id: "air-bike", name: "Велосипед", primary: ["abs"], secondary: [], equipment: "bodyweight", source: "Air_Bike" },
  { id: "plank", name: "Планка", primary: ["abs"], secondary: [], equipment: "bodyweight", unit: "seconds", source: "Plank" },
  { id: "hanging-leg-raise", name: "Подъём ног в висе", primary: ["abs"], secondary: [], equipment: "bodyweight", source: "Hanging_Leg_Raise" },
  { id: "russian-twist", name: "Русский твист", primary: ["abs"], secondary: ["lowerBack"], equipment: "bodyweight", source: "Russian_Twist" },
  { id: "cable-crunch", name: "Скручивания на блоке", primary: ["abs"], secondary: [], equipment: "machine", source: "Cable_Crunch" },
  { id: "ab-roller", name: "Ролик для пресса", primary: ["abs"], secondary: ["shoulders"], equipment: "other", source: "Ab_Roller" },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

/** Undefined for an id that is no longer in the catalog. */
export function getExercise(id: string): Exercise | undefined {
  return byId.get(id);
}

/** Lower case, «ё» as «е»: what search compares. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").trim();
}

export type ExerciseFilter = { query?: string; muscle?: Muscle | null; equipment?: Equipment | null };

/** Exercises matching the search text (any word order), main muscle and equipment. */
export function filterExercises({ query = "", muscle = null, equipment = null }: ExerciseFilter): Exercise[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return EXERCISES.filter((e) => {
    if (muscle && !e.primary.includes(muscle)) return false;
    if (equipment && e.equipment !== equipment) return false;
    const name = normalize(e.name);
    return words.every((w) => name.includes(w));
  });
}

/** Other exercises for the same main muscle, e.g. to swap one in a workout. */
export function alternativesTo(exercise: Exercise): Exercise[] {
  return EXERCISES.filter((e) => e.id !== exercise.id && e.primary.some((m) => exercise.primary.includes(m)));
}
