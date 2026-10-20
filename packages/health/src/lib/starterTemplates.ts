/**
 * Workouts the app starts with, so «Тренировка» isn't empty; the user can change or delete them.
 * 3 sets of 10: the ACSM position stand (2009) suggests loads of 8–12 repetitions for novices,
 * 2–3 sessions a week (by an excerpt of the stand, https://www.sportgeneeskunde.com/wp-content/uploads/ACSM-Position-Stand-Progression-Models-in-Resistance-Training-for-Healthy-Adults.pdf ).
 * The plank is held: its 30 is seconds.
 */
export const STARTER_TEMPLATES: { name: string; exercises: { exerciseId: string; sets: number; reps: number }[] }[] = [
  {
    name: "Грудь и трицепс",
    exercises: [
      { exerciseId: "barbell-bench-press-medium-grip", sets: 3, reps: 10 },
      { exerciseId: "incline-dumbbell-press", sets: 3, reps: 10 },
      { exerciseId: "dumbbell-flyes", sets: 3, reps: 10 },
      { exerciseId: "triceps-pushdown", sets: 3, reps: 10 },
      { exerciseId: "dips-triceps-version", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Спина и бицепс",
    exercises: [
      { exerciseId: "wide-grip-lat-pulldown", sets: 3, reps: 10 },
      { exerciseId: "one-arm-dumbbell-row", sets: 3, reps: 10 },
      { exerciseId: "seated-cable-rows", sets: 3, reps: 10 },
      { exerciseId: "barbell-curl", sets: 3, reps: 10 },
      { exerciseId: "hammer-curls", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Ноги и пресс",
    exercises: [
      { exerciseId: "barbell-full-squat", sets: 3, reps: 10 },
      { exerciseId: "leg-press", sets: 3, reps: 10 },
      { exerciseId: "romanian-deadlift", sets: 3, reps: 10 },
      { exerciseId: "standing-calf-raises", sets: 3, reps: 10 },
      { exerciseId: "hanging-leg-raise", sets: 3, reps: 10 },
    ],
  },
  {
    name: "Всё тело без оборудования",
    exercises: [
      { exerciseId: "pushups", sets: 3, reps: 10 },
      { exerciseId: "bodyweight-squat", sets: 3, reps: 10 },
      { exerciseId: "bodyweight-walking-lunge", sets: 3, reps: 10 },
      { exerciseId: "butt-lift-bridge", sets: 3, reps: 10 },
      { exerciseId: "crunches", sets: 3, reps: 10 },
      { exerciseId: "plank", sets: 3, reps: 30 },
    ],
  },
];
