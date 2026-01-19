module.exports = function (api) {
  const isTest = api.env('test');

  const plugins = [];
  if (!isTest) {
    plugins.push([
      'dotenv-import',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ]);
  }
  
  // react-native-reanimated/plugin 必须是最后一个插件
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins,
  };
};
