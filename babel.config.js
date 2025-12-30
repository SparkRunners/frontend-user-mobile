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

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins,
  };
};
