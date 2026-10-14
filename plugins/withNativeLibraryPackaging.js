const { withGradleProperties } = require('expo/config-plugins');

// Extract native libraries at install time so SoLoader uses the application's
// selected ABI, including Android devices with a native translation bridge.
module.exports = function withNativeLibraryPackaging(config) {
  return withGradleProperties(config, (next) => {
    next.modResults = next.modResults.filter(
      (entry) => entry.type !== 'property' || entry.key !== 'expo.useLegacyPackaging'
    );
    next.modResults.push({
      type: 'property',
      key: 'expo.useLegacyPackaging',
      value: 'true',
    });
    return next;
  });
};
