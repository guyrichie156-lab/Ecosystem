// On web, expo-sqlite runs in a Web Worker and its sync API (used by drizzle)
// times out while the worker is still loading, so warm it up before the app loads.
if (process.env.EXPO_OS === "web") {
  require("expo-sqlite")
    .openDatabaseAsync(":memory:")
    .then((warmup) => warmup.closeAsync())
    .then(() => require("./app-entry"));
} else {
  require("./app-entry");
}
