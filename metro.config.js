const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const threeModule = path.join(path.dirname(require.resolve('three')), 'three.module.js');

// R3F's native CommonJS bundle requires "three". Three's CommonJS entry calls
// Node's process.emitWarning at import time, which Hermes does not implement.
// Resolve every bare Three import to the same ESM module instead; this also
// preserves shared constructors between the renderer and the game scene.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeModule };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
