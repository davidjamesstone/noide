$(function($) {
	var EditSession = ace.require('ace/edit_session').EditSession; 
	var Document = ace.require('ace/document').Document; 
	var UndoManager = ace.require('ace/undomanager').UndoManager;
				
	EditorView = Backbone.View.extend({
		events: {
			'click ul.editor-tabs .close': 'clickCloseFile',
			'click ul.editor-tabs li': 'clickTab',
			'click ul.editor-toolbar a': 'clickToolbar'
		},
		initialize: function() {
			this._$editorTabs = $('ul.editor-tabs', this.el);
			this._$editorToolbar = $('ul.editor-toolbar', this.el);
			this._$editor = $('.editor', this.el);
			
			// fs events
			this.model.on('fileloaded', this.fileLoaded, this);
			this.model.on('fileunloaded', this.fileUnloaded, this);
			this.model.on('filerenamed', this.fileRenamed, this);
			this.model.on('fileremoved', this.fileRemoved, this);
			this.model.on('filechanged', this.fileChanged, this);
			this.model.on('filesaved', this.fileSaved, this);


			// tooltips
			$('li a', this._$editorToolbar).tooltip({ placement: 'bottom' });
			
			// map of files to sessions and tabs
			this._tabs = {};
			
			this._editorConfig = this.attributes ? this.attributes.editorConfig : null;
			this._beautifyConfig = this.attributes ? this.attributes.beautifyConfig : null;
		},
		fileLoaded: function(item) {
			var $tab = $('<li class="file" data-cid="' + item.cid + '">').append('<a href="#">' + item.get('name') + '</a><i class="close">&times;</i>');
			this._$editorTabs.append($tab);
			var modes = {
				'.js': 'ace/mode/javascript',
				'.css': 'ace/mode/css',
				'.html': 'ace/mode/html',
				'.ejs': 'ace/mode/html',
				'.json': 'ace/mode/json',
  			'.md': 'ace/mode/markdown',
				'.coffee': 'ace/mode/coffee',
				'.jade': 'ace/mode/jade',
				'.php': 'ace/mode/php',
  			'.py': 'ace/mode/python',
  			'.scss': 'ace/mode/sass',
  			'.txt': 'ace/mode/text',
    		'.typescript': 'ace/mode/typescript',
  			'.xml': 'ace/mode/xml'
			};
			var session = new EditSession(new Document(item.get('content')), modes[item.get('ext').toLowerCase()] || 'ace/mode/asciidoc');
			session.setUndoManager(new UndoManager());
			
			session.on('change', function(e) {
				item.set({ edited: true });
				item.set({ content: e.target.getValue() }, { silent: true });
			});
			
  		var editorConfig = this._editorConfig;
			if (editorConfig) {
				if (editorConfig.useWorker === false) session.setUseWorker(false);
    			if (editorConfig.tabSize) session.setTabSize(editorConfig.tabSize || 2);
				if (editorConfig.useSoftTabs != undefined) session.setUseSoftTabs(editorConfig.useSoftTabs);
			}
			this._tabs[item.cid] = {
				$tab: $tab,
				session: session
			}
			this.activateFile(item);
		},
		fileUnloaded: function(item) {
			this._removeTab(item);
		},
		fileRenamed: function(item) {
			var tab = this._tabs[item.cid];
			if (tab) {
				tab.$tab.children('a').text(item.get('name'));
			}
		},
		fileChanged: function(item) {
			this._fileEditedStateChange(item, true);
		},
		fileSaved: function(item) {
			this._fileEditedStateChange(item, false);
		},
		fileRemoved: function(item) {
			var tab = this._tabs[item.cid];
			if (tab) {
				this._removeTab(item);
			}
		},
		clickTab: function(e) {
			var cid = $(e.currentTarget).data('cid');
			this.activateFile(this.model.get(cid));
			return false;
		},
		clickCloseFile: function(e) {
			e.stopPropagation();
			var cid = $(e.currentTarget).parent().data('cid');
			var item = this.model.get(cid);
			this.trigger('tabcloseclick', e, item, this._tabs[item.cid].session.getValue());
			return false;
		},
		clickToolbar: function(e) {
      var self = this;
			if (this._editorIsInitialized()) {
				var cmds = this.editor.commands.commands;
				var actions = {
					'save': function(file, editor) {
						file.save();
					},
  				'saveall': function(file, editor) {
            self.model.saveAll();
					},
					'validation': function(file, editor) {
						var session = editor.getSession();
						return session.setUseWorker(!session.getUseWorker());
					},
					'beautify': function(file, editor) {
						switch (file.get('ext')) {
							case '.css': {
								fn = css_beautify;
								config = this._beautifyConfig ? this._beautifyConfig.css : null;
							} break;
							case '.html': {
								fn = style_html;
								config = this._beautifyConfig ? this._beautifyConfig.html : null;
							} break;
							default: {
								fn = js_beautify;
								config = this._beautifyConfig ? this._beautifyConfig.js : null;
							} break;
						}						
						editor.setValue(fn(editor.getValue(), config));				
					},
					'find': function(file, editor) {
						cmds.find.exec(editor);
					},
					'findreplace': function(file, editor) {
						cmds.replace.exec(editor);
					},
					'undo': function(file, editor) {
						cmds.undo.exec(editor);
					},
					'redo': function(file, editor) {
						cmds.redo.exec(editor);
					},
					'foldall': function(file, editor) {
						cmds.foldall.exec(editor);
					},
					'unfoldall': function(file, editor) {
						cmds.unfoldall.exec(editor);
					}
				};
				var action = $(e.currentTarget).data('action');
				(actions[action] || function() {
					alert('Action not found');
				}).call(this, this._currentFile, this.editor);
			}
			return false;
		},
		activateFile: function(item) {
			if (!this._editorIsInitialized()) {
				this._initializeEditor();
			}
			var tab = this._tabs[item.cid];
			this._currentFile = item;
			this.editor.setSession(tab.session);
			tab.$tab.addClass('active').siblings().removeClass('active');
			this.$el.children().show();
		},
		resizeEditor: function(item) {
			if (this._editorIsInitialized()) {
				this.editor.resize();
			}
		},
		_initializeEditor: function() {
			// initialize editor
			console.log('initialize editor');
			this.editor = ace.edit(this._$editor.get(0));
			
			// noide defaults
			//this.editor.setTheme('ace/theme/merbivore');
			this.editor.setShowPrintMargin(false);
			
			var editorConfig = this._editorConfig;
			if (editorConfig) {
				if (editorConfig.theme) this.editor.setTheme(editorConfig.theme);
				if (editorConfig.highlightActiveLine != undefined) this.editor.setHighlightActiveLine(editorConfig.highlightActiveLine);
				if (editorConfig.showPrintMargin != undefined) this.editor.setShowPrintMargin(editorConfig.showPrintMargin);
				if (editorConfig.showGutter != undefined) this.editor.renderer.setShowGutter(editorConfig.showGutter);
				if (editorConfig.fontSize) this.editor.setFontSize(editorConfig.fontSize);
			}
			var self = this;
			this.editor.commands.addCommands([{
					name: 'save',
					bindKey: {
						win: 'Ctrl-S',
						mac: 'Command-S'
					},
					exec: function(editor, line) {
						return self._currentFile.save();
					},
					readOnly: true
				}, {
					name: 'saveall',
					bindKey: {
						win: 'Ctrl-Shift-S',
						mac: 'Command-Shift-S'
					},
					exec: function(editor, line) {
						return self.model.saveAll();
					},
					readOnly: true
				}
			]);
		},
		_editorIsInitialized: function() {
			return this.editor != undefined;
		},
		_removeTab: function(item) {
			this._tabs[item.cid].$tab.remove();
			delete this._tabs[item.cid];
			var switchTo = this.model.find(function(item) {
				return item.get('loaded') && !item.get('isDirectory');
			});
			if (switchTo) {
				this.activateFile(switchTo);
			} else {
				this._currentFile = null;
				this.editor.setSession(new EditSession(new Document(''), 'ace/mode/javascript')); // better way?
				//this.editor.getSession().doc.setValue(null); // can't do this - raises unwanted change event
				this.$el.children().hide();
			}
		},
  	_fileEditedStateChange: function(item, value) {
			var tab = this._tabs[item.cid];
			if (tab) {
				tab.$tab[value ? 'addClass' : 'removeClass']('edited');
			}
		},
	});
});