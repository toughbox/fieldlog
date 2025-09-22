const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // 기본 설정 유지
  config.resolver.sourceExts = [
    ...config.resolver.sourceExts,
    'cjs',
    'mjs',
    'json'
  ];

  // SVG 지원
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
