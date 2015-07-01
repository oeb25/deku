/**
 * This module manages the event handlers of the virtual nodes as they
 * are rendered. We store the events on a singleton.
 */

var keypath = require('object-path')
var handlers = {}

function getHandler (entityId, path, eventType) {
  keypath.get(handlers, [entityId, path, eventType])
}

function addHandler (entityId, path, eventType, fn) {
  keypath.set(handlers, [entityId, path, eventType], fn)
}

function removeHandler (entityId, path, eventType) {
  var args = [entityId]
  if (path) args.push(path)
  if (eventType) args.push(eventType)
  keypath.del(handlers, args)
}

function removeAllHandlers(entityId) {
  keypath.del(handlers, [entityId])
}

exports.getHandler = getHandler
exports.addHandler = addHandler
exports.removeHandler = removeHandler
exports.removeAllHandlers = removeAllHandlers
