(function($) {
  jQuery.fn.alert = function(config) {
    return this.each(function() {
      $(this).html('<div class="alert alert-' + config.type + '"><button class="close" data-dismiss="alert" type="button">&times;</button><strong>' + config.title + '</strong>&nbsp;' + config.message + '</div>').delayFade();
    });
  }
})(jQuery);

(function ($) {
  jQuery.fn.delayFade = function () {
    return this.each(function () {
      var $this = $(this);
      window.clearTimeout(Utils.alertId);
      Utils.alertId = window.setTimeout(function () {
        $this.children().fadeTo(500, 0).slideUp(500, function () {
          $(this).remove();
        });
      }, 3000);
    });
  }
})(jQuery);

(function($) {
  jQuery.fn.modalConfirm = function(header, body, yes, no) {
    return this.each(function() {
			var $this = $(this);
			$this.find('.modal-header h3').text(header);
			$this.find('.modal-body p').text(body);
			var $yes = $this.find('.modal-footer .confirm-yes').off('click').one('click', yes);
			var $no = $this.find('.modal-footer .confirm-no').off('click');
			if (no) {
				$no.one('click', no);
			}
			$this.modal('show').one('shown', function() {$yes.focus()});
    });
  }
})(jQuery);

(function($) {
  jQuery.fn.modalPrompt = function(header, label, placeholder, value, callback) {
    return this.each(function() {
			var $this = $(this);
			$this.find('.modal-header h3').text(header);
			$this.find('.modal-body label').text(label);
			var $input = $this.find('.modal-body input').attr('placeholder', placeholder).val(value || '')
			//setTimeout(function() {$input.focus().select()}, 1000);
			$this.find('form').off('submit').one('submit', function(e) {
				e.preventDefault();
				$this.modal('hide');
				var val = $input.val().trim();
				if (val) callback(e, val);
				return false;
			});
			$this.modal('show').one('shown', function() {$input.focus().select()});
    });
  }
})(jQuery);

var Utils = {

  alertId: 0,

  alert: function(config) {
    $('#alert').alert(config);
  },

  msg: function(data) {
		Utils[data.err ? 'error' : 'success'](data.name, data.msg);
  },
	
  success: function(title, message) {
    Utils.alert({
      type: 'success',
      title: title,
      message: message
    });
  },

  error: function(title, message) {
    Utils.alert({
      type: 'error',
      title: title || 'Error',
      message: message
    });
  },

  warning: function(title, message) {
    Utils.alert({
      type: 'warning',
      title: title,
      message: message
    });
  },

  info: function(title, message) {
    Utils.alert({
      type: 'info',
      title: title,
      message: message
    });
  }

}