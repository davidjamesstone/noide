// todo - find a directive to do this / change to directive
;(function() {

var w = window, d = document;

function split(handler, leftEl, rightEl) {

  var splitter;

  splitter = {
    lastX: 0,
    leftEl: null,
    rightEl: null,

    init: function(handler, leftEl, rightEl) {
      var self = this;

      this.leftEl = leftEl;
      this.rightEl = rightEl;

      handler.addEventListener('mousedown', function(evt) {
        evt.preventDefault();	/* prevent text selection */

        self.lastX = evt.clientX;

        w.addEventListener('mousemove', self.drag);
        w.addEventListener('mouseup', self.endDrag);
      });
    },

    drag: function(evt) {
      var wL, wR, wDiff = evt.clientX - splitter.lastX;

      wL = d.defaultView.getComputedStyle(splitter.leftEl, '').getPropertyValue('width');
      wR = d.defaultView.getComputedStyle(splitter.rightEl, '').getPropertyValue('width');
      wL = parseInt(wL, 10) + wDiff;
      wR = parseInt(wR, 10) - wDiff;
      splitter.leftEl.style.width = wL + 'px';
      splitter.rightEl.style.width = wR + 'px';

      splitter.lastX = evt.clientX;
    },

    endDrag: function() {
      w.removeEventListener('mousemove', splitter.drag);
      w.removeEventListener('mouseup', splitter.endDrag);
    }
  };

  splitter.init(handler, leftEl, rightEl);
}

split(d.getElementsByClassName('splitter')[0], d.getElementsByTagName('nav')[0], d.getElementsByTagName('article')[0]);
split(d.getElementsByClassName('splitter')[1], d.getElementsByTagName('article')[0], d.getElementsByTagName('aside')[0]);

})();
