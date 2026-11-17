const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase Auth's React Native entry needs Metro's legacy package-field
// resolution. Resolving Firebase through package.json `exports` can omit the
// Auth component registration and crash with "Component auth has not been
// registered yet" on Android.
config.resolver.unstable_enablePackageExports = false;

// Firebase includes CommonJS modules that Metro must be able to resolve when
// package exports are disabled.
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

module.exports = config;
