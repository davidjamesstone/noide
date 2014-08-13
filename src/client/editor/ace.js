var config = require('./config').editor;
var beautifyConfig = require('./config').beautify;
var beautify_js = require('js-beautify');
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

ace.require("ace/ext/emmet");
ace.require("ace/ext/language_tools");

module.exports = function(el) {

  var editor = ace.edit(el);

  editor.setOptions({
    enableEmmet: true,
    enableSnippets: true,
    enableBasicAutocompletion: true
  });

  if (typeof config.theme === 'string') {
    editor.setTheme('ace/theme/' + config.theme);
  }
  if (typeof config.showPrintMargin === 'boolean') {
    editor.setShowPrintMargin(config.showPrintMargin);
  }
  if (typeof config.showInvisibles === 'boolean') {
    editor.setShowInvisibles(config.showInvisibles);
  }
  if (typeof config.highlightActiveLine === 'boolean') {
    editor.setHighlightActiveLine(config.highlightActiveLine);
  }
  if (typeof config.showGutter === 'boolean') {
    editor.renderer.setShowGutter(config.showGutter);
  }
  if (typeof config.fontSize === 'number') {
    editor.setFontSize(config.fontSize);
  }

  editor.commands.addCommands([{
    name: 'beautify',
    bindKey: {
      win: 'Ctrl-B',
      mac: 'Command-B'
    },
    exec: function(editor, line) {
      var cfg, fn;
      var fso = editor.getSession().fso;

      switch (fso.ext) {
        case '.css':
          {
            fn = beautify_css;
            cfg = beautifyConfig ? beautifyConfig.css : null;
          }
          break;
        case '.html':
          {
            fn = beautify_html;
            cfg = beautifyConfig ? beautifyConfig.html : null;
          }
          break;
        case '.js':
        case '.json':
          {
            fn = beautify_js;
            cfg = beautifyConfig ? beautifyConfig.js : null;
          }
          break;
      }

      if (fn) {
        editor.setValue(fn(editor.getValue(), cfg));
      }
    },
    readOnly: false // this command should not apply in readOnly mode
  }]);

  return editor;
};
