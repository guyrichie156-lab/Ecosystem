import React, { useState } from "react";
import Body, { type Slug } from "react-native-body-highlighter";
import { getProfile } from "@ecosystem/db";
import { useTheme } from "@ecosystem/core";
import { MUSCLES, type Muscle } from "../lib/muscles";

// Every part of the figure. The library's own parts carry a dark colour that wins over `defaultFill`,
// so each part gets its colour explicitly: the theme's neutral grey, or the highlight.
const ALL_SLUGS: Slug[] = [
  "abs", "adductors", "ankles", "biceps", "calves", "chest", "deltoids", "feet", "forearm", "gluteal", "hamstring",
  "hands", "hair", "head", "knees", "lower-back", "neck", "obliques", "quadriceps", "tibialis", "trapezius", "triceps",
  "upper-back",
];

/** Level 2 is drawn brighter (main muscles, or ones still resting), level 1 paler (helping muscles). */
export type MuscleHighlight = { muscle: Muscle; level: 1 | 2 };

/** The body figure (react-native-body-highlighter, MIT) with muscles coloured. 200 × 400 at scale 1. */
export function BodyMap({
  highlights,
  side,
  scale = 1,
}: {
  highlights: MuscleHighlight[];
  side: "front" | "back";
  scale?: number;
}) {
  const t = useTheme();
  // The profile is read once: the figure follows the sex set in «Профиль».
  const [gender] = useState<"male" | "female">(() => (getProfile().sex === "female" ? "female" : "male"));
  const accent = t.chart.slots[1];
  // 80 is 50 % alpha: helping muscles in a paler shade of the same colour.
  const levelColour = { 1: `${accent}80`, 2: accent };
  const coloured = new Map<Slug, string>();
  for (const { muscle, level } of highlights) {
    for (const slug of MUSCLES[muscle].slugs) coloured.set(slug, levelColour[level]);
  }
  const data = ALL_SLUGS.map((slug) => ({ slug, color: coloured.get(slug) ?? t.chart.other }));
  return (
    <Body
      data={data}
      side={side}
      scale={scale}
      gender={gender}
      defaultFill={t.chart.other}
      border="none"
    />
  );
}

/** Main muscles bright, helping ones pale; a muscle that is both counts as main. */
export function exerciseHighlights(primary: Muscle[], secondary: Muscle[]): MuscleHighlight[] {
  return [
    ...primary.map((muscle) => ({ muscle, level: 2 as const })),
    ...secondary.filter((m) => !primary.includes(m)).map((muscle) => ({ muscle, level: 1 as const })),
  ];
}
