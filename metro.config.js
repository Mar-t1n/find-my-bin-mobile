// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-fast-tflite loads models via `require(...)`, which needs Metro
// to treat `.tflite` files as bundled assets rather than trying to parse them
// as source code.
config.resolver.assetExts.push('tflite');

module.exports = config;
