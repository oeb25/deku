/*

Each container can use it's ID to set a callback that will be fired on the next
frame using requestAnimationFrame. This module lets us use an ID so we can make
sure there is only ever one frame per container

*/

var raf = require('component-raf')
var frames = {}

exports.set = function (id, fn) {
  exports.clear(id)
  frames[id] = raf(fn)
  return id
}

exports.clear = function (id) {
  var frameId = frames[id]
  if (frameId) {
    raf.cancel(frameId)
    delete frames[id]
  }
}
