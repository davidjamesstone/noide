(function($) {
  jQuery.fn.removeStyle = function(config) {
    return this.each(function() {
      $(this).removeAttr('style');
    });
  }
})(jQuery);

(function($) {
  jQuery.fn.splitter = function(config) {
    return this.each(function() {
      var $this = $(this);
      var data = $(this).data('splitter').split(',');
      var $a = $(data[0]);
      var $b = $(data[1]);
      var axis = $this.hasClass('split-y') ? 'y' : 'x';
      $this.on('mousedown', function(e) {
        e.preventDefault();
        document.body.onmouseup = function(e) {
          e.preventDefault();
          //console.log('mu');				
          document.body.onmouseup = null;
          document.body.onmousemove = null;
          $a.removeClass('splitter-resizing');
          $b.removeClass('splitter-resizing');
          noideView.editorView.resizeEditor();
          return false;
        };
        $a.addClass('splitter-resizing');
        $b.addClass('splitter-resizing');
        data.pageX = e.pageX;
        data.pageY = e.pageY;
        //console.log('md');				
        document.body.onmousemove = function(e) {
          e.preventDefault();
					$this.data('split-restore', null);
          //console.log('mm');		
          var diff = {
            x: data.pageX - e.pageX,
            y: data.pageY - e.pageY
          };
          data.pageX = e.pageX;
          data.pageY = e.pageY;
          if (axis === 'x' && diff.x) {
            var ch = (diff.x < 0 ? '+' : '-') + '=' + Math.abs(diff.x);
            //console.log(el, name, ch);
            $a.css('width', ch);
            $b.css('left', ch);
          } else if (axis === 'y' && diff.y) {
            var ch = (diff.y > 0 ? '+' : '-') + '=' + Math.abs(diff.y);
            //console.log(el, name, ch);
            $a.css('height', ch);
            $b.css('bottom', ch);
          }
          return false;
        };
        return false;
      });
      $('.splitter .toggle', $a).on('mousedown', function(e) {
				e.stopPropagation();
        var $toggle = $(this);
        var restore = $this.data('split-restore');
        if (axis == 'x') {
          if (restore) {
            $a.css('width', restore);
            $b.css('left', restore);
            $this.data('split-restore', null);
          } else {
            $this.data('split-restore', $a.css('width'));
            $a.css('width', $toggle.css('width'));
            $b.css('left', $toggle.css('width'));
          }
        } else {
          if (restore) {
            $a.css('height', restore);
            $b.css('bottom', restore);
            $this.data('split-restore', null);
          } else {
            $this.data('split-restore', $a.css('height'));
            $a.css('height', $toggle.css('height'));
            $b.css('bottom', $toggle.css('height'));
          }          
        }
        noideView.editorView.resizeEditor();
				return false;
      })
    });
  }
})(jQuery);
$(function() {
  $('*[data-splitter]').splitter();
});