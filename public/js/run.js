	// run view
  RunDialogView = Backbone.View.extend({
		events: {
			'change input[name="debug"]': 'changeDebug',
			'change input[name="showframes"]': 'changeFrames'
		},
    initialize: function() {
    },
		show: function(callback) {
			var self = this;
			this.$el.find('form').off('submit').one('submit', function(e) {
				e.preventDefault();
				var data = {};
				if (this.debug[1].checked) {
					data.debug = true;
					data.port = this.port.value;
					data.brk = this.brk.checked;
				}
				if (this.showframes.checked) {
					data.showframes = true;
					data.url1 = this.url1.value
					data.url2 = this.url2.value
				}
				callback(e, data);
				self.$el.modal('hide');
				return false;
			});
			this.$el.modal('show');
		},
		changeDebug: function(e) {
			var $fields = $('.debugging .well', e.delegateTarget).find('input');
			if ($(e.currentTarget).val() == '1') {
				$fields.removeAttr('disabled');
			} else {
				$fields.attr('disabled', 'disabled');
			}
		},
		changeFrames: function(e) {
			var $fields = $('.startoptions .well', e.delegateTarget).find('input');
			if (e.currentTarget.checked) {
				$fields.removeAttr('disabled');
			} else {
				$fields.attr('disabled', 'disabled');
			}
		}
  });