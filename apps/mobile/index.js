// On web, expo-sqlite needs SharedArrayBuffer, which only works on pages served with the
// COOP/COEP headers from metro.config.js. The dev server answers "/" before those headers
// are added, so reload the same app from "/index", which gets them.
if (
  process.env.EXPO_OS === "web" &&
  !window.crossOriginIsolated &&
  window.location.pathname === "/"
) {
  window.location.replace("/index" + window.location.search + window.location.hash);
} else if (process.env.EXPO_OS === "web") {
  // "/index" was only needed to get the headers; give the router back "/" without reloading.
  if (window.location.pathname === "/index") {
    window.history.replaceState(null, "", "/" + window.location.search + window.location.hash);
  }
  // expo-sqlite runs in a Web Worker and its sync API (used by drizzle)
  // times out while the worker is still loading, so warm it up before the app loads.
  require("expo-sqlite")
    .openDatabaseAsync(":memory:")
    .then((warmup) => warmup.closeAsync())
    .then(() => require("./app-entry"));
} else {
  require("./app-entry");
}
