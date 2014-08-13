var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var appConfig = require('./noide.json');
var cwd = process.cwd();
var localConfigPath = path.join(cwd, 'noide.json');
var localConfig, config, workspaces;

if (fs.existsSync(localConfigPath)) {

  // local config take precedence over app config
  localConfig = require(localConfigPath);
  config = extend({}, appConfig);
  extend(config, localConfig);

  // but the app workspaces and local workspaces are merged together
  config.workspaces = appConfig.workspaces.concat(localConfig.workspaces);

} else {
  localConfig = {};
  config = appConfig;
}

exports.config = config;
exports.app = appConfig;
exports.local = localConfig;
