var raf = require('component-raf')
var curry = require('ramda/src/curry')

/**
 * Internal state.
 */

var frames = {}

/**
 * Tell the container it's dirty and needs to re-render.
 */

exports.scheduleFrame = curry(function (fn, id) {
  frames[id] = raf(fn)
  return id
})

/**
 * Clear the current scheduled frame
 */

exports.clearFrame = curry(function (id) {
  var frameId = frames[id]
  if (frameId) {
    raf.cancel(frameId)
    delete frames[id]
  }
})
