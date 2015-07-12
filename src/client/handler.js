/*

We store event handlers for virtual elements in this internal object here.

*/

var keypath = require('object-path')
var handlers = {}

exports.get = function (path) {
  keypath.get(handlers, path)
}

exports.set = function (path, fn) {
  keypath.set(handlers, path, fn)
}

exports.remove = function (path) {
  keypath.del(handlers, path)
}

exports.removeAll = function (path) {
  keypath.del(handlers, path)
}
