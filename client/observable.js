var $ = window.jQuery

function Observable (eventsObj) {
  var _listeners = {}

  function listeners (event) {
    return event ? _listeners[event] || (_listeners[event] = $.Callbacks()) : _listeners
  }
  var on = function (event, fn) {
    listeners(event).add(fn)
  }
  var off = function (event, fn) {
    listeners(event).remove(fn)
  }
  var trigger = function (event, data) {
    listeners(event).fireWith(this, [data])
  }

  var events = Object.keys(eventsObj)
  events.forEach(function (event) {
    this[event] = function (val, active) {
      if (typeof val === 'function') {
        (active === false ? off : on)(eventsObj[event], val)
      } else {
        trigger(eventsObj[event], val)
      }
    }
  }, this)
}

/*
 * Make a Constructor become an observable and
 * exposes event names as constants
 */
module.exports = function (Constructor, events) {
  /*
   * Mixin Observable into Constructor prototype
   */
  var p = typeof Constructor === 'function' ? Constructor.prototype : Constructor
  $.extend(p, new Observable(events))

  return Constructor
}
