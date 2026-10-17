import type { AppModule } from "@ecosystem/core";
import { financeModule } from "@ecosystem/finance";

/**
 * Every feature module of the app, in tab order.
 * To add a module: create its package, export an `AppModule` from it, add it here,
 * and put its routes in `app/(tabs)/<module id>/` with a `_layout.tsx` wrapped in `ModuleGate`.
 */
export const appModules: AppModule[] = [financeModule];
