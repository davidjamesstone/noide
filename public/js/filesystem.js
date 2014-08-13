$(function($) {
	
	// file system object model
  FileSystemItem = Backbone.Model.extend({
		defaults: {
			loaded: false,
			expanded: false,
			edited: false
		},
		initialize: function(){
			this.on('change:loaded', function(item, value) { 
				//alert('model loaded changed');
			}, this);
		},
		paths: function() {
			var coll = this.collection;
			var paths = [];
			
			function addPath(model) {
				if (!model) return;
				var parentId = model.get('parent_cid');
				if (parentId) {
					paths.push(model.get('name'));
					addPath(coll.get(parentId));
				} else {
					paths.push(model.get('path'));
				}
			}
			addPath(this);
			
			return paths.reverse();
		},
		loadChildren: function() {
			if (!this.get('isDirectory') || this.get('loaded')) return;
			var coll = this.collection;
			var self = this;
			
			$.getJSON('/fs/dir?path=' + JSON.stringify(this.paths()), function(data) {
				
				if (data) {
					_.each(data, function(item) {
						item.parent_cid = self.cid;
					});
					coll.add(data, { silent: true });
					self.set({ loaded: true }); // will trigger change
					//coll.trigger('change');
				}
				
			});			
			
		},
		loadFile: function() {
			if (this.get('isDirectory') || this.get('loaded')) return;
			var self = this;
			
      $.get('/fs/file?path=' + encodeURIComponent(JSON.stringify(this.paths())), function(data) {
				self.set({ 
					loaded: true,
					content: data
				});
			});
			
		},
		unloadFile: function() {
			this.set({ loaded: false, edited: false, content: '' });
			this.unset('content');
		},
		addDir: function(name) {
			if (!this.get('isDirectory')) return;
			var coll = this.collection;
			var self = this;
			var data = {
				path: this.paths().concat(name)
			};
      $.post('/fs/dir', data, function(data) {
				if (!data.err) {
					data.data.loaded = true; // set to true  - it's a new dir
					data.data.parent_cid = self.cid;
					coll.add(new FileSystemItem(data.data));
				} else {
					self.trigger('err', data);
				}
			});		
			
		},
		addFile: function(name) {
			if (!this.get('isDirectory')) return;
			var coll = this.collection;
			var self = this;
			var data = {
				path: this.paths().concat(name)
			};
      $.post('/fs/file', data, function(data) {
				if (!data.err) {
					data.data.parent_cid = self.cid;
					coll.add(new FileSystemItem(data.data));
				} else {
					self.trigger('err', data);
				}
			});
		},
		save: function() {
			var self = this;
			if (this.get('isDirectory')) return;
			$.post('/fs/file', {
				_method: 'put',
				path: this.paths(),
				content: this.get('content')
			}, function(data) {
				//Utils.msg(data);
				self.set({ edited: false });
			});
		},
		rename: function(name) {
			var self = this;
			var data = {
				_method: 'put',
				path: this.paths(),
				newName: name
			};
      $.post('/fs', data, function(data) {
				if (!data.err) {
					self.set({ 
						name: name
					});
				} else {
					self.trigger('err', data);
				}
			});
		},
		remove: function() {
			var self = this;
			var data = {
				_method: 'delete',
				path: this.paths()
			};
      $.post('/fs', data, function(data) {
				if (!data.err) {
					self.collection.remove(self);
				} else {
					self.trigger('err', data);
				}
			});
		}
	});
	
	// file system object collection
  FileSystemItemCollection = Backbone.Collection.extend({
		initialize: function() {
			
			// custom loaded event
			this.on('change:loaded', function(item, value) { 
				if (item.get('isDirectory')) {
					this.trigger('dirloaded', item);
				} else {
					this.trigger(value ? 'fileloaded': 'fileunloaded', item);
				}
			}, this);
			
			// custom rename event
			this.on('change:name', function(item, value) { 
				if (item.get('isDirectory')) {
					this.trigger('dirrenamed', item, value);
				} else {
					this.trigger('filerenamed', item, value);
				}
			}, this);

			// custom add event
			this.on('add', function(item) { 
				if (item.get('isDirectory')) {
					this.trigger('diradded', item);
				} else {
					this.trigger('fileadded', item);
				}
			}, this);

			// custom remove event
			this.on('remove', function(item) { 
				if (item.get('isDirectory')) {
					this.trigger('dirremoved', item);
				} else {
					this.trigger('fileremoved', item);
				}
			}, this);		
			
			// custom save event
			this.on('change:edited', function(item, value) { 
				if (!item.get('isDirectory')) {
					this.trigger(value ? 'filechanged' : 'filesaved', item);
				}
			}, this);		
			
		},
    model: FileSystemItem,
    saveAll: function() {
      this.where({ edited: true }).forEach(
        function(item) {
          item.save(item.get('content'));
        }
      )
    },
		toTree: function() {
			var list = this.groupBy('parent_cid');
			return this._buildTree(list[''], list); 			
		},
		_buildTree: function (branch, list) {
			//recursively builds tree from list with parent-child dependencies
			if (typeof branch == 'undefined') return null;
			var tree = [];

      var sorted = _.sortBy(branch, function(item) {
        return !item.get('isDirectory') + item.get('name');
      });			
			for(var i=0; i<sorted.length; i++)      
				tree.push({
					item: sorted[i],
					children: this._buildTree(list[ sorted[i].cid ], list)
				});
			return tree;
		}
  });

	
});