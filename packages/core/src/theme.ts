import { useMemo } from "react";
import { useColorScheme } from "react-native";

/**
 * Colours of the app in its light and dark versions; the phone's setting picks one.
 * Text tokens have at least 4.5:1 contrast with `background` and `card`, borders at least 3:1
 * (WCAG 1.4.3 / 1.4.11). Chart colours are the dataviz reference palette, light and dark steps,
 * each checked with its validator against that mode's background.
 */
export type Theme = {
  dark: boolean;
  background: string;
  /** Cards and grouped blocks on the background. */
  card: string;
  /** Chips, secondary buttons, the segmented control track. */
  fill: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  separator: string;
  /** Input borders. */
  border: string;
  /** Links and the focused input border. */
  link: string;
  /** Main buttons. */
  primary: string;
  onPrimary: string;
  /** The add button and the selected-tab marker. */
  accent: string;
  onAccent: string;
  danger: string;
  dangerBg: string;
  income: string;
  chart: {
    /** Categorical slots 1–5, in their fixed order. */
    slots: string[];
    /** The folded tail of a donut. */
    other: string;
    grid: string;
    baseline: string;
    /** Single-series bars: the selected one and the rest. */
    selected: string;
    rest: string;
  };
};

export const lightTheme: Theme = {
  dark: false,
  background: "#ffffff",
  card: "#f5f5f7",
  fill: "#f0f0f2",
  text: "#1c1c1e",
  textSecondary: "#3a3a3c",
  textMuted: "#6e6e73", // 5.07:1 on background, 4.66:1 on card
  separator: "#e5e5ea",
  border: "#8e8e93", // 3.26:1 on background
  link: "#1f62b3", // 6.08:1
  primary: "#1c1c1e",
  onPrimary: "#ffffff",
  accent: "#f5c542",
  onAccent: "#1c1c1e", // 10.49:1 on accent
  danger: "#c62828", // 5.62:1
  dangerBg: "#fdecea",
  income: "#2e7d32", // 5.13:1
  chart: {
    // Validated on #ffffff: worst adjacent CVD ΔE 9.1, normal vision 19.6; slots 3–5 are below
    // 3:1, so every chart also lists its values as text.
    slots: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"],
    other: "#aeaeb2",
    grid: "#e5e5ea",
    baseline: "#c7c7cc",
    selected: "#2a78d6",
    rest: "#86b6ef", // blue ramp step 250, the lightest the palette allows for discrete marks
  },
};

export const darkTheme: Theme = {
  dark: true,
  background: "#1a1a19", // the dataviz reference dark surface
  card: "#262624",
  fill: "#2e2e2c",
  text: "#f2f2f0",
  textSecondary: "#d4d3cf",
  textMuted: "#a3a29d", // 6.81:1 on background, 5.93:1 on card
  separator: "#333331",
  border: "#8e8e93", // 5.34:1 on background
  link: "#6ea8f0", // 7.07:1
  primary: "#f2f2f0",
  onPrimary: "#1a1a19",
  accent: "#f5c542",
  onAccent: "#1a1a19", // 10.74:1 on accent
  danger: "#ff7a7a", // 6.90:1
  dangerBg: "#3a2020",
  income: "#5cc46a", // 7.93:1
  chart: {
    // Validated on #1a1a19: worst adjacent CVD ΔE 8.4, normal vision 19.3, all five at least 3:1.
    slots: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"],
    other: "#6b6a66", // 3.22:1
    grid: "#2c2c2a",
    baseline: "#383835",
    selected: "#3987e5",
    rest: "#184f95", // blue ramp step 600, the darkest the palette allows on dark (2.15:1)
  },
};

/** The current theme: dark when the phone is set to dark. */
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}

/**
 * Styles that depend on the theme. Pass a module-level factory so the styles are only rebuilt
 * when the theme changes: `const styles = useThemedStyles(makeStyles)`.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
