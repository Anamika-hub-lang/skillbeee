const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath?.replace(/\\/g, '/') ?? '';
  if (
    moduleName === './support/isBuffer' &&
    origin.includes('node_modules/util/util.js')
  ) {
    return {
      filePath: path.join(__dirname, 'node_modules/util/support/isBufferBrowser.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
