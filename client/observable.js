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
  var emit = function (event, data) {
    listeners(event).fireWith(this, [data])
  }

  // Add event attach/detatch handler functions
  var events = Object.keys(eventsObj)
  events.forEach(function (event) {
    this['on' + event] = function (fn) {
      on.call(this, eventsObj[event], fn)
    }
    this['off' + event] = function (fn) {
      off.call(this, eventsObj[event], fn)
    }
    this['emit' + event] = function (data) {
      data.type = eventsObj[event]
      emit.call(this, eventsObj[event], data)
    }
  }, this)

  // this.on = on
  // this.off = off
  // this.emit = emit
  this.events = eventsObj
}

/*
 * Make a Constructor become an observable and
 * exposes event names as constants
 */
// module.exports = function (Constructor, events) {
//   /*
//    * Mixin Observable into Constructor prototype
//    */
//   var p = typeof Constructor === 'function' ? Constructor.prototype : Constructor
//   $.extend(p, new Observable(events))
//
//   return Constructor
// }
module.exports = function (ctorOrObj, events) {
  if (!ctorOrObj) {
    return new Observable(events)
  }
  /*
   * Mixin Observable into Constructor prototype
   */
  var p = typeof ctorOrObj === 'function' ? ctorOrObj.prototype : ctorOrObj
  $.extend(p, new Observable(events))

  return ctorOrObj
}
