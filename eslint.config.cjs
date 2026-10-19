// Expo's ESLint setup (https://docs.expo.dev/guides/using-eslint/), for the app and all packages.
// Run with `pnpm lint` in the repository root.
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["**/node_modules/**", "apps/mobile/android/**", "apps/mobile/ios/**", "apps/mobile/dist/**", "apps/mobile/.expo/**", "notes/**"],
  },
]);
