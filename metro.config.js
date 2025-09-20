const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver.resolverMainFields = [
    'react-native',
    'browser',
    'module',
    'main'
  ];

  config.resolver.sourceExts = [
    ...config.resolver.sourceExts,
    'cjs',
    'mjs',
    'tsx',
    'ts',
    'jsx',
    'js',
    'json'
  ];

  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  };

  config.resolver.assetExts = [
    ...config.resolver.assetExts,
    'svg'
  ];

  return config;
})();
