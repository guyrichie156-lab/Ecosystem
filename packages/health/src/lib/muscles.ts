import type { Slug } from "react-native-body-highlighter";

/**
 * Muscle groups as the app names them. Each maps to the parts of the body figure
 * (react-native-body-highlighter) and to the side of the figure where it is seen.
 */
export const MUSCLES = {
  chest: { label: "Грудь", slugs: ["chest"], side: "front" },
  shoulders: { label: "Плечи", slugs: ["deltoids"], side: "front" },
  biceps: { label: "Бицепс", slugs: ["biceps"], side: "front" },
  forearms: { label: "Предплечья", slugs: ["forearm"], side: "front" },
  abs: { label: "Пресс", slugs: ["abs", "obliques"], side: "front" },
  quads: { label: "Квадрицепс", slugs: ["quadriceps"], side: "front" },
  back: { label: "Спина", slugs: ["upper-back"], side: "back" },
  traps: { label: "Трапеции", slugs: ["trapezius"], side: "back" },
  lowerBack: { label: "Поясница", slugs: ["lower-back"], side: "back" },
  triceps: { label: "Трицепс", slugs: ["triceps"], side: "back" },
  glutes: { label: "Ягодицы", slugs: ["gluteal"], side: "back" },
  hamstrings: { label: "Задняя поверхность бедра", slugs: ["hamstring"], side: "back" },
  calves: { label: "Икры", slugs: ["calves"], side: "back" },
} as const satisfies Record<string, { label: string; slugs: readonly Slug[]; side: "front" | "back" }>;

export type Muscle = keyof typeof MUSCLES;

export const MUSCLE_IDS = Object.keys(MUSCLES) as Muscle[];
