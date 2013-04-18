$(function($) {
	
	// file system item explorer
  ExplorerView = Backbone.View.extend({
    events: {
      'change li.dir input': 'clickDir',
      'click li.file': 'clickFile'
    },
    initialize: function() {
			
			var self = this;
			
			this.$fileMenu = $('.explorer-file-menu', this.$el);
			this.$dirMenu = $('.explorer-dir-menu', this.$el);
			this.$treeview = $('.explorer-treeview', this.$el);

			function showMenu(e, $menu, $item) {
				e.preventDefault();
				e.stopPropagation();
				var x = e.pageX - (self.$el.offset().left || 0);
				var y = e.pageY - (self.$el.offset().top || 0);
				var cid = $item.data('cid');
				var fsi = self.model.get(cid);
				$menu
					.css({top: y + 'px', left: x + 'px'})
					[fsi.get('ext') === '.js' ? 'addClass' : 'removeClass']('runable')
					[fsi.get('name') === 'package.json' ? 'addClass' : 'removeClass']('installable')
					.show()
					.data('cid', $item.data('cid'))
					.siblings('.dropdown').hide();
				
				return false;
			}
			
			// ui events
			this.$el.on('contextmenu', '.dir', function(e) {
				return showMenu(e, self.$dirMenu, $(this));
			});
			this.$el.on('contextmenu', '.file', function(e) {
				return showMenu(e, self.$fileMenu, $(this));
			});
			this.$el.find('.dropdown').on('mouseleave', function(e) { 
				$(this).hide(); 
			});
			
			$('.dropdown').on('click', 'a', function(e) { 
				var $this = $(this);
				var action = $this.data('action');
				var cid = $(e.delegateTarget).hide().data('cid');
				var item = self.model.get(cid);
				self.trigger('action', e, item, action);
				return false;
			});
			
			// model events
			this.model.on('change', function(item) {
				this.render();
			}, this);
			
			this.model.on('remove', function(item) {
				this.render();
			}, this);
			
			this.model.on('add', function(item) {
				this.render();
			}, this);
			
      this.render();
    },
    render: function() {
			console.log('render explorer');
      this.$treeview.html(new DirView({
        model: this.model
      }).render().el);
    },
		clickDir: function(e) {
			e.stopPropagation();
      var $li = $(e.currentTarget).parent();
			var model = this.model.get($li.data('cid'));
			console.log('dirclick');
			this.trigger('dirclick', e, model);
		},
		clickFile: function(e) {
			e.stopPropagation();
      var $li = $(e.currentTarget);
			var model = this.model.get($li.data('cid'));
			this.trigger('fileclick', e, model);
			return false;
		}
  });

	// private directory view (tree branch)
  var DirView = Backbone.View.extend({
    tagName: 'ul',
    template: _.template($('#dir-template').html()),
    initialize: function() {},
    render: function() {
      var self = this;
      var tree = this.model.toTree();			
      this.$el.html(this.template({
        data: tree,
				templateFn: this.template
      }));
      return this;
    }
  });
	
});