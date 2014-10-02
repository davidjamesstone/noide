var config = require('../../config').config;

/**
 * GET home page.
 */
exports.header = function(req, res) {
  var workspaceId = req.params.workspaceId;
  res.render('header', {
    workspaceId: workspaceId,
    workspaces: config.workspaces
  });
};
exports.ide = function(req, res) {
  var workspaceId = req.params.workspaceId || 0;
  res.render('ide', {
    workspaceId: workspaceId,
    workspaces: config.workspaces
  });
};
exports.workspace = function(req, res) {
  res.render('workspace', {
    workspace: config.workspaces[req.params.id]
  });
};
exports.editor = function(req, res) {
  res.render('editor');
};
exports.tab = function(req, res) {
  res.render('tab');
};
