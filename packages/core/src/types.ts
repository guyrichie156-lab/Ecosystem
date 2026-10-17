/**
 * A feature module of the app (finance, health, ...).
 *
 * Each module lives in its own package and owns one tab: its routes live in
 * `apps/mobile/app/(tabs)/<id>/`, so `id` must match that folder name.
 */
export type AppModule = {
  id: string;
  title: string;
  /** Emoji shown as the tab icon. */
  icon: string;
  /** Runs once per app start, after database migrations. */
  onReady?: () => void | Promise<void>;
};
