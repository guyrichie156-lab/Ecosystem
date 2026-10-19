/** Date formats used on more than one finance screen. */

/** "октябрь 2026 г." */
export const monthYearFormat = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

/** "окт." */
export const monthShortFormat = new Intl.DateTimeFormat("ru-RU", { month: "short" });
