$(function($) {
	
	// child process object model
  ChildProcess = Backbone.Model.extend({
		defaults: {
			alive: false,
			buffer: ''
		},
		initialize: function(data){
			var self = this;
			//self.idAttribute = 'pid';
			
			//self.set({ cmd: data.command });
			
			var socket = this.socket = data.socket;
			var exitCallback = data.exitCallback;
			
			socket
				.on(this.cid+'_stdoutdata', function(data) {
					console.log('_stdoutdata recieved');
					var buffer = self.get('buffer');
					self.set({ buffer: buffer + data });
				})
				.on(this.cid+'_stderrdata', function(data) {
					console.log('_stderrdata recieved');
					var buffer = self.get('buffer');
					self.set({ buffer: buffer + data });
				})
//				.on(this.cid+'_stderrclose', function(data) {
//					console.log('_stderrclose recieved');
//					var buffer = self.get('buffer');
//					self.set({ buffer: buffer + '_stderrclose' });
//				})
//				.on(this.cid+'_childclose', function(data) {
//					console.log('_childclose recieved');
//					var buffer = self.get('buffer');
//					self.set({ buffer: buffer + '_childclose' });
//				})
				.on(this.cid+'_childexit', function(data) {
					console.log('_childexit recieved');
					self.set({ alive: false });
					if (exitCallback) exitCallback(data);
				});			
			
			if (!data.alive) {
				socket.emit('spawn', { command: data.cmd, paths: data.paths, cid: this.cid }, function(data) {
					console.log('cb '+data);
					self.set({ pid: data, alive: true });
				});
			} else {
				socket.emit('bind', { command: data.cmd, pid: data.pid, paths: data.paths, cid: this.cid }, function(data) {
					console.log('cb '+data);
					self.set({ pid: data, alive: true });
				});
			}
			
		},
		kill: function() {
			var self = this;
			if (self.get('alive')) {
				self.socket.emit('kill', { pid: self.get('pid') }, function(data) {
					self.collection.remove(self);
				});
			} else {
					self.collection.remove(self);
			}
		}
	});
	
	// child process object collection
  ChildProcessCollection = Backbone.Collection.extend({
    model: ChildProcess,
		initialize: function() {
		}
  });


	// child process view
	ChildProcessView = Backbone.View.extend({
    events: {
      'click .accordion-toggle .proc-close': 'clickClose'
    },
    template: _.template($('#proc-template').html()),
    headerTemplate: _.template($('#proc-header-template').html()),
		initialize: function() {
			this.model.on('change:pid', this.changeHeader, this);
			this.model.on('change:alive', this.changeHeader, this);
			this.model.on('change:buffer', this.changeBody, this);
			this.model.on('remove', this.removed, this);
		},
    render: function() {
      this.$el.addClass('accordion-group').html(this.template({
        data: this.model,
				headerTemplateFn: this.headerTemplate
      }));
      return this;
    },
		changeHeader: function(item) {
			console.log('changePid');
			this.$el.find('.accordion-heading').replaceWith(
				this.headerTemplate({
					data: item
				})
			);
		},
		changeBody: function(item) {
			var $text = this.$el.find('.console').val(item.get('buffer'));
			var $processes = $('#processes');
			$text.css('height', '0');
			$text.css('height', $text.get(0).scrollHeight + 'px');
			$processes.scrollTop($('#processes').get(0).scrollHeight - $processes.height());
		},
		removed: function(item) {
			this.remove();
		},
		clickClose: function(e) {
			e.stopPropagation();
			this.model.kill();
			return false;
		}
	});
	
	// child process views
	ChildProcessViews = Backbone.View.extend({
		initialize: function() {
			this._$acc = $('#proc-accordion', this._$el);
			this.model.on('add', this.childAdded, this);
			this.model.on('remove', this.childRemoved, this);
			this.model.forEach(function(el, index) {
				this.childAdded(el);
			}, this);
		},
    render: function() {
			console.log('render child processes');
    },
		childAdded: function(item) {
      this._$acc.prepend(new ChildProcessView({
        model: item
      }).render().el);
		}
	});
	
});