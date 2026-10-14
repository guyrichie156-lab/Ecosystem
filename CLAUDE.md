# Ecosystem

pnpm monorepo: `apps/mobile` (Expo SDK 57 app), `packages/finance`, `packages/db` (drizzle + expo-sqlite).
Before writing Expo code, follow `apps/mobile/AGENTS.md`.

## Project memory

`notes/` is the project memory (the user opens it as an Obsidian vault).
- At the start of a session, read `notes/README.md` and the notes relevant to the task.
- When a decision is made or something is learned, add it to `notes/decisions.md` (newest first, dated) or the topic note.
- Write notes in Russian, the user's language. Link sources for facts.

## Running

- Web: `cd apps/mobile && pnpm web` → http://localhost:8081
- Android: `cd apps/mobile && pnpm android`
- Typecheck: `cd apps/mobile && npx tsc --noEmit -p .`

The Android widget (`react-native-android-widget`) is Android-only; guard its calls with `Platform.OS === "android"`.
