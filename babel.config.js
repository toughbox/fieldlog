/* module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
}; */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 필요 시 Reanimated, Router 등 사용 중일 때 활성화
      // 'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};