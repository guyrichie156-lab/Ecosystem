const { withProjectBuildGradle } = require("expo/config-plugins");

// expo-notifications and other native modules pull in mismatched androidx.work
// versions (work-runtime vs work-runtime-ktx), causing a duplicate-class build
// failure. Force a single consistent version project-wide.
const FORCE_BLOCK = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'androidx.work:work-runtime:2.8.1'
            force 'androidx.work:work-runtime-ktx:2.8.1'
        }
    }
}
`;

module.exports = function withAndroidWorkManagerFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("androidx.work:work-runtime")) {
      config.modResults.contents += FORCE_BLOCK;
    }
    return config;
  });
};
