// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure 'gif' is included in asset extensions
const defaultAssetExts = config.resolver.assetExts;
// This line correctly adds 'mp3' to the list of asset extensions Metro should recognize.
config.resolver.assetExts = [...defaultAssetExts, 'gif',"mp3"];

// If you have sourceExts defined, make sure they are preserved:
// const defaultSourceExts = config.resolver.sourceExts;
// config.resolver.sourceExts = [...defaultSourceExts, /* any custom source extensions */];

module.exports = config;
