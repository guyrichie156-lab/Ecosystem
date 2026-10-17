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
  /**
   * Prepares data the module's screens need (e.g. default rows). Runs after database migrations
   * and the app waits for it before showing any screen, so keep it fast.
   */
  prepare?: () => Promise<void>;
  /** Runs once per app start in the background, after `prepare` (e.g. asking for permissions). */
  onReady?: () => void | Promise<void>;
};
