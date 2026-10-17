# Ecosystem

pnpm monorepo: `apps/mobile` (Expo SDK 57 app), `packages/core` (module system, shared hooks), `packages/finance`, `packages/health`, `packages/db` (drizzle + expo-sqlite; schema changes need `npx drizzle-kit generate` in `packages/db`).
Before writing Expo code, follow `apps/mobile/AGENTS.md`.

## Project memory

`notes/` is the project memory (the user opens it as an Obsidian vault).
- At the start of a session, read `notes/README.md`, `notes/roadmap.md` and the notes relevant to the task.
- When a decision is made or something is learned, add it to `notes/decisions.md` (newest first, dated) or the topic note; keep `notes/roadmap.md` statuses current.
- Write notes in Russian, the user's language. Link sources for facts.

## Modules

Every feature is a separate module, so it can be changed on its own branch without touching the others.
There are no user-facing on/off switches (the user decided against them on 2026-10-17).
- A module is a package exporting an `AppModule` (`packages/core/src/types.ts`), listed in `apps/mobile/modules.ts`.
- Its routes live in `apps/mobile/app/(tabs)/<module id>/`. The module's `_layout.tsx` exports `ErrorBoundary` rendering `ModuleErrorFallback`, so a crash stays inside the module.
- Start-up work goes in `onReady`, never in the root layout.
- Modules don't import each other; shared code goes to `packages/core` or `packages/db`.

## Git

Each feature is developed on its own branch (`feature/<name>`) and merged after it is checked. Ask the user before pushing to a branch other than the one the session was given.

## Performance

The user prioritises speed. Tabs render on first visit (`lazy`, default `true`). Long lists use `FlatList`. Measure before optimising, and report measured numbers, not guesses.

## Running

- Web: `cd apps/mobile && pnpm web` → http://localhost:8081
- Android (dev, by cable): `cd apps/mobile && pnpm android`
- Android APK: `cd apps/mobile && pnpm android:release`
- Typecheck: `cd apps/mobile && npx tsc --noEmit -p .`

The Android widget (`react-native-android-widget`) is Android-only; guard its calls with `Platform.OS === "android"`.
